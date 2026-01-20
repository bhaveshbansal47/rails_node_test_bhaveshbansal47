import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload, UploadStatus } from './upload.entity';
import { v4 as uuidv4 } from 'uuid';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { createS3Client } from '../common/s3-client.factory';

export interface FindAllUploadsOptions {
    page?: number;
    limit?: number;
    status?: UploadStatus[];
}

@Injectable()
export class UploadsService {
    private s3Client: S3Client;
    private bucketName: string;

    constructor(
        @InjectRepository(Upload)
        private uploadsRepository: Repository<Upload>,
        private configService: ConfigService,
        @InjectQueue('uploads') private uploadsQueue: Queue,
    ) {
        this.s3Client = createS3Client(this.configService);
        this.bucketName = this.configService.get<string>('AWS_BUCKET_NAME') || '';
    }

    async getPresignedUrl(filename: string, contentType: string) {
        if (!filename || !contentType) {
            throw new BadRequestException('Filename and contentType are required');
        }
        const fileId = uuidv4();
        const key = `uploads/${fileId}/${filename}`;

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            ContentType: contentType,
        });

        const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3000 });

        return {
            fileId,
            presignedUrl,
            key,
        };
    }

    async createUpload(s3Key: string): Promise<Upload> {
        if (!s3Key) {
            throw new BadRequestException('s3Key is required');
        }
        const upload = this.uploadsRepository.create({
            s3_key: s3Key,
            status: UploadStatus.PENDING,
        });

        const savedUpload = await this.uploadsRepository.save(upload);
        await this.uploadsQueue.add({ uploadId: savedUpload.id }, { jobId: savedUpload.id });
        return savedUpload;
    }

    async getPendingUpload(): Promise<Upload | null> {
        return this.uploadsRepository.findOne({
            where: { status: UploadStatus.PENDING },
            order: { created_at: 'ASC' },
        });
    }

    async deleteUpload(id: string): Promise<void> {
        const upload = await this.uploadsRepository.findOne({ where: { id } });

        if (!upload) {
            throw new NotFoundException(`Upload with ID ${id} not found`);
        }

        if (upload.status !== UploadStatus.PENDING) {
            throw new ConflictException('Only pending uploads can be deleted');
        }

        await this.uploadsRepository.remove(upload);
    }

    async getUploadById(id: string): Promise<Upload> {
        const upload = await this.uploadsRepository.findOne({ where: { id } });
        if (!upload) {
            throw new NotFoundException(`Upload with ID ${id} not found`);
        }
        return upload;
    }

    async getUploadsByIds(ids: string[]): Promise<Upload[]> {
        if (!ids || ids.length === 0) {
            return [];
        }
        return this.uploadsRepository.findByIds(ids);
    }

    async cancelUpload(id: string): Promise<void> {
        const upload = await this.getUploadById(id);

        if (upload.status === UploadStatus.COMPLETED || upload.status === UploadStatus.FAILED) {
            throw new ConflictException('Cannot cancel a completed or failed upload');
        }

        upload.status = UploadStatus.FAILED;
        upload.failed_reason = 'Cancelled by user';
        await this.uploadsRepository.save(upload);
    }

    async findAll(options: FindAllUploadsOptions) {
        const {
            page = 1,
            limit = 20,
            status,
        } = options;

        const query = this.uploadsRepository.createQueryBuilder('upload');

        if (status && status.length > 0) {
            query.andWhere('upload.status IN (:...status)', { status });
        }

        query.orderBy('upload.created_at', 'DESC');

        query.skip((page - 1) * limit);
        query.take(limit);

        const [items, total] = await query.getManyAndCount();

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}

