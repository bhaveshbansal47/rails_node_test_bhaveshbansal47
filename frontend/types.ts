export interface ProductPrice {
    amount: string;
    currency: string;
}

export interface Product {
    id: number;
    name: string;
    expiration: string | null;
    price: string | number | null;
}

export interface ApiResponse {
    items: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface FilterState {
    searchName: string;
    dateRange: [Date | null, Date | null];
    minPrice: string;
    maxPrice: string;
}

export interface Upload {
    id: string;
    status: string;
    total_rows: number;
    processed_rows: number;
    failed_reason: string;
    s3_key: string;
    created_at: string;
}
