import apiClient from "./client";
import { Upload, ApiResponse } from "../types";

export interface UploadsQueryParams {
    page?: number;
    limit?: number;
    status?: string;
}

export interface UploadsApiResponse extends Omit<ApiResponse, 'items'> {
    items: Upload[];
}

export const getUploads = async (params: UploadsQueryParams): Promise<UploadsApiResponse> => {
    const response = await apiClient.get<UploadsApiResponse>("/uploads", { params });
    return response.data;
};

export const getUploadsByIds = async (ids: string[]): Promise<Upload[]> => {
    if (ids.length === 0) return [];
    const response = await apiClient.get<Upload[]>('/uploads/batch', {
        params: { ids: ids.join(',') }
    });
    return response.data;
};

export const cancelUpload = async (id: string): Promise<void> => {
    await apiClient.post(`/uploads/${id}/cancel`);
};

export const getPresignedUrl = async (filename: string, contentType: string): Promise<{ fileId: string; presignedUrl: string; key: string }> => {
    const response = await apiClient.get('/uploads/presigned-url', {
        params: { filename, contentType },
    });
    return response.data;
};

export const uploadToS3 = async (presignedUrl: string, file: File, onProgress?: (progress: number) => void): Promise<void> => {
    await apiClient.put(presignedUrl, file, {
        headers: {
            'Content-Type': file.type,
        },
        baseURL: '', // Bypass axios baseURL for direct S3 upload
        onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(percentCompleted);
            }
        },
    });
};

export const createUpload = async (s3Key: string): Promise<Upload> => {
    const response = await apiClient.post<Upload>('/uploads', { s3_key: s3Key });
    return response.data;
};
