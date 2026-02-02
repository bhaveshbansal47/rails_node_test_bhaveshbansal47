import 'dotenv/config';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import type { Job, Queue } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Upload, UploadStatus } from './upload.entity';
import { OnModuleInit } from '@nestjs/common';

import { Product } from '../products/product.entity';
import { ProductPrice } from '../products/product-price.entity';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import csv from 'csv-parser';
import axios from 'axios';
import { pipeline } from 'stream/promises';
import { createS3Client } from '../common/s3-client.factory';
import { BATCH_SIZE, PRICE_BATCH_SIZE } from '../common/constants';

@Processor('uploads')
export class UploadsProcessor implements OnModuleInit {
    private s3Client: S3Client;
    private bucketName: string;

    constructor(
        @InjectRepository(Upload)
        private uploadsRepository: Repository<Upload>,
        @InjectRepository(Product)
        private productsRepository: Repository<Product>,
        @InjectRepository(ProductPrice)
        private productPricesRepository: Repository<ProductPrice>,
        private dataSource: DataSource,
        private configService: ConfigService,
        @InjectQueue('uploads') private uploadsQueue: Queue,
    ) {
        this.s3Client = createS3Client(this.configService);
        this.bucketName = this.configService.get<string>('AWS_BUCKET_NAME') || '';
    }

    async onModuleInit() {
        const stuckUploads = await this.uploadsRepository.find({
            where: { status: UploadStatus.PROCESSING },
        });

        for (const upload of stuckUploads) {
            console.log(`Resuming stuck upload: ${upload.id}`);
            await this.uploadsQueue.add({ uploadId: upload.id }, { jobId: upload.id, removeOnComplete: true, removeOnFail: true });
        }
    }

    @Process({ concurrency: Number(process.env.MAX_CONCURRENCY) || 1 })
    async handleUpload(job: Job<{ uploadId: string }>) {
        const { uploadId } = job.data;
        const upload = await this.uploadsRepository.findOne({ where: { id: uploadId } });

        if (!upload) {
            return;
        }

        const tempFilePath = path.join(os.tmpdir(), `upload-${uploadId}.csv`);

        try {
            upload.status = UploadStatus.PROCESSING;
            await this.uploadsRepository.save(upload);

            const totalRows = await this.downloadAndCount(upload.s3_key, tempFilePath);

            await this.validateHeader(tempFilePath);

            upload.total_rows = totalRows;
            await this.uploadsRepository.save(upload);

            const alreadyProcessedCount = await this.productsRepository.count({
                where: { uploadId: uploadId }
            });

            if (alreadyProcessedCount > 0) {
                console.log(`Resuming upload ${uploadId} from row ${alreadyProcessedCount}`);
            }

            const completed = await this.processCsv(tempFilePath, upload, alreadyProcessedCount);

            if (completed) {
                const finalCheck = await this.uploadsRepository.findOne({ where: { id: uploadId } });
                if (finalCheck && finalCheck.status !== UploadStatus.FAILED) {
                    await this.uploadsRepository.update({ id: upload.id }, { status: UploadStatus.COMPLETED });
                }
            }

        } catch (error) {
            console.error('Error processing upload:', error);

            await this.cleanupUpload(uploadId);

            upload.status = UploadStatus.FAILED;
            upload.failed_reason = error.message.substring(0, 255);
            await this.uploadsRepository.save(upload);
        } finally {
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
        }
    }

    private async validateHeader(filePath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const stream = fs.createReadStream(filePath, { start: 0, end: 100 });
            let buffer = '';

            stream.on('data', (chunk) => {
                buffer += chunk.toString();
                const firstLineEnd = buffer.indexOf('\n');
                if (firstLineEnd !== -1) {
                    stream.destroy();
                    const firstLine = buffer.substring(0, firstLineEnd).trim();
                    const cleanLine = firstLine.replace(/^\uFEFF/, '');

                    if (cleanLine === 'name;price;expiration') {
                        resolve();
                    } else {
                        reject(new Error(`Invalid header: expected 'name;price;expiration', got '${cleanLine}'`));
                    }
                }
            });

            stream.on('error', (err) => reject(err));
            stream.on('end', () => {
                if (buffer.trim() === 'name;price;expiration') {
                    resolve();
                } else {
                    const cleanBuffer = buffer.trim().replace(/^\uFEFF/, '');
                    if (cleanBuffer === 'name;price;expiration') {
                        resolve();
                    } else {
                        reject(new Error(`Invalid header or empty file`));
                    }
                }
            });
        });
    }

    private async downloadAndCount(key: string, outputPath: string): Promise<number> {
        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });
        const response = await this.s3Client.send(command);
        const stream = response.Body as Readable;

        let lineCount = 0;

        async function* countTransform(source: Readable) {
            for await (const chunk of source) {
                for (let i = 0; i < chunk.length; ++i) {
                    if (chunk[i] === 10) lineCount++;
                }
                yield chunk;
            }
        }

        await pipeline(
            stream,
            countTransform,
            fs.createWriteStream(outputPath)
        );

        return Math.max(0, lineCount - 1);
    }

    private async processCsv(filePath: string, upload: Upload, offset: number = 0): Promise<boolean> {
        let processedCount = offset;
        let productsBatch: any[] = [];
        let currentRowIndex = 0;

        const exchangeRates = await this.getAllExchangeRates();

        const stream = fs.createReadStream(filePath).pipe(csv({ separator: ';' }));

        for await (const row of stream) {
            currentRowIndex++;

            if (currentRowIndex <= offset) {
                continue;
            }

            try {
                this.validateRow(row);

                const { name, price, expiration } = row;
                const priceAmount = parseFloat(price.substring(1));

                const product = {
                    name,
                    expiration: new Date(expiration),
                    uploadId: upload.id,
                    _originalAmount: priceAmount,
                };

                productsBatch.push(product);

                if (productsBatch.length >= BATCH_SIZE) {
                    const currentUpload = await this.uploadsRepository.findOne({ where: { id: upload.id } });
                    if (currentUpload && currentUpload.status === UploadStatus.FAILED && currentUpload.failed_reason === 'Cancelled by user') {
                        console.log(`Upload ${upload.id} was cancelled. Stopping processing.`);
                        await this.cleanupUpload(upload.id);
                        return false;
                    }

                    await this.saveBatch(productsBatch, exchangeRates);
                    processedCount += productsBatch.length;
                    productsBatch = [];

                    await this.uploadsRepository.update({ id: upload.id }, { processed_rows: processedCount });
                }
            } catch (err) {
                stream.destroy();
                throw err;
            }
        }

        if (productsBatch.length > 0) {
            const currentUpload = await this.uploadsRepository.findOne({ where: { id: upload.id } });
            if (currentUpload && currentUpload.status === UploadStatus.FAILED && currentUpload.failed_reason === 'Cancelled by user') {
                console.log(`Upload ${upload.id} was cancelled. Stopping processing.`);
                await this.cleanupUpload(upload.id);
                return false;
            }

            await this.saveBatch(productsBatch, exchangeRates);
            processedCount += productsBatch.length;
            await this.uploadsRepository.update({ id: upload.id }, { processed_rows: processedCount });
        }

        return true;
    }

    private validateRow(row: any) {
        const { name, price, expiration } = row;

        if (!name || !price || !expiration) {
            throw new Error('Corrupted data: Missing mandatory fields (name, price, or expiration)');
        }

        if (!price.startsWith('$')) {
            const firstChar = price.charAt(0);
            if (/^[0-9]/.test(firstChar)) {
                throw new Error('Corrupted data: Missing currency symbol');
            }
            throw new Error(`Currency not supported: '${firstChar}'`);
        }
    }

    private async saveBatch(products: any[], rates: Record<string, number>) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const insertResult = await queryRunner.manager
                .createQueryBuilder()
                .insert()
                .into(Product)
                .values(products.map(p => ({
                    name: p.name,
                    expiration: p.expiration,
                    uploadId: p.uploadId
                })))
                .execute();

            const insertedIds = insertResult.identifiers;

            const allPrices: any[] = [];
            const currencies = Object.keys(rates);

            for (let i = 0; i < products.length; i++) {
                const productRequest = products[i];
                const productId = insertedIds[i].id;
                const baseAmount = productRequest._originalAmount;

                allPrices.push({
                    currency: 'USD',
                    amount: baseAmount,
                    productId: productId
                });

                for (const currency of currencies) {
                    if (currency === 'usd') continue;

                    const rate = rates[currency];
                    const convertedAmount = Number((baseAmount * rate).toFixed(2));

                    allPrices.push({
                        currency: currency.toUpperCase(),
                        amount: convertedAmount,
                        productId: productId
                    });
                }
            }

            for (let i = 0; i < allPrices.length; i += PRICE_BATCH_SIZE) {
                const chunk = allPrices.slice(i, i + PRICE_BATCH_SIZE);
                await queryRunner.manager
                    .createQueryBuilder()
                    .insert()
                    .into(ProductPrice)
                    .values(chunk)
                    .execute();
            }

            await queryRunner.commitTransaction();
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    private async cleanupUpload(uploadId: string) {
        try {
            console.log(`Starting cleanup for upload ${uploadId}...`);
            const deleteResult = await this.productsRepository.delete({ uploadId });
            console.log(`Deleted ${deleteResult.affected} products for upload ${uploadId}`);

            await this.uploadsRepository.update({ id: uploadId }, { processed_rows: 0 });
            console.log(`Reset processed_rows for upload ${uploadId}`);
        } catch (err) {
            console.error(`Failed to cleanup upload ${uploadId}`, err);
        }
    }

    private async getAllExchangeRates(): Promise<Record<string, number>> {
        try {
            const response = await axios.get(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json`);
            return response.data.usd;
        } catch (error) {
            console.error('Failed to fetch exchange rates', error);
            throw new Error('Failed to fetch current exchange rates');
        }
    }
}
