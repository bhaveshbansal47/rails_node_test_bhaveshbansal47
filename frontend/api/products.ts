import apiClient from "./client";
import { Product, ApiResponse } from "../types";

export interface ProductQueryParams {
  page: number;
  limit: number;
  currency: string;
  sort_by: "name" | "price" | "expiration";
  sort_order: "ASC" | "DESC";
  name?: string;
  min_expiration?: string;
  max_expiration?: string;
  min_price?: string;
  max_price?: string;
}

export const getProducts = async (
  params: ProductQueryParams
): Promise<ApiResponse> => {
  const response = await apiClient.get<ApiResponse>("/products", { params });
  return response.data;
};
