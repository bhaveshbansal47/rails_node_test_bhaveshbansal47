import { Controller, Get, Post, Body, Query, Delete, Param } from '@nestjs/common';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
    constructor(private readonly uploadsService: UploadsService) { }

    @Get('presigned-url')
    async getPresignedUrl(
        @Query('filename') filename: string,
        @Query('contentType') contentType: string,
    ) {
        return this.uploadsService.getPresignedUrl(filename, contentType);
    }

    @Get()
    async findAll(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
        @Query('status') status?: string,
    ) {
        return this.uploadsService.findAll({
            page: Number(page),
            limit: Number(limit),
            status: status ? (status.split(',') as any[]) : undefined,
        });
    }

    @Post()
    async createUpload(@Body('s3_key') s3Key: string) {
        return this.uploadsService.createUpload(s3Key);
    }

    @Get('pending')
    async getPendingUpload() {
        return this.uploadsService.getPendingUpload();
    }

    @Get('batch')
    async getUploadsByIds(@Query('ids') ids: string) {
        if (!ids) {
            return [];
        }
        const idList = ids.split(',');
        return this.uploadsService.getUploadsByIds(idList);
    }

    @Delete(':id')
    async deleteUpload(@Param('id') id: string) {
        return this.uploadsService.deleteUpload(id);
    }

    @Get(':id')
    async getUploadById(@Param('id') id: string) {
        return this.uploadsService.getUploadById(id);
    }

    @Post(':id/cancel')
    async cancelUpload(@Param('id') id: string) {
        return this.uploadsService.cancelUpload(id);
    }
}
