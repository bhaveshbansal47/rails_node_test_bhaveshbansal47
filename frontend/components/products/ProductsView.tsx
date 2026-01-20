import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { FilterState } from "../../types";
import { getProducts, ApiResponse, ProductQueryParams } from "../../api";
import ProductHeader from "./ProductHeader";
import ProductFilters from "./ProductFilters";
import ProductSort from "./ProductSort";
import ProductTable from "./ProductTable";
import Pagination from "./Pagination";

const styles = {
    container: {
        maxWidth: "1200px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column" as const,
        height: "100%",
        gap: "1.5rem",
    },
    statsContainer: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 0.5rem",
    },
    statsText: {
        fontSize: "0.9rem",
        opacity: 0.8,
    },
    errorBox: {
        padding: "1rem",
        borderRadius: "8px",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        color: "var(--danger)",
        border: "1px solid var(--danger)",
    },
};

export default function ProductsView() {
    const [data, setData] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [currency, setCurrency] = useState("USD");
    const [filters, setFilters] = useState<FilterState>({
        searchName: "",
        dateRange: [null, null],
        minPrice: "",
        maxPrice: ""
    });

    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState<"name" | "price" | "expiration">("name");
    const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
    const limit = 20;

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const { searchName, dateRange, minPrice, maxPrice } = filters;
            const [startDate, endDate] = dateRange;

            const params: ProductQueryParams = {
                page,
                limit,
                currency,
                sort_by: sortBy,
                sort_order: sortOrder,
            };

            if (searchName) params.name = searchName;
            if (startDate) params.min_expiration = format(startDate, "yyyy-MM-dd");
            if (endDate) params.max_expiration = format(endDate, "yyyy-MM-dd");
            if (minPrice) params.min_price = minPrice;
            if (maxPrice) params.max_price = maxPrice;

            const data = await getProducts(params);
            setData(data);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch products");
        } finally {
            setLoading(false);
        }
    }, [page, limit, currency, sortBy, sortOrder, filters]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleSort = (field: "name" | "price" | "expiration") => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
        } else {
            setSortBy(field);
            setSortOrder("ASC");
        }
    };

    const handleSetFilters = useCallback((newFilters: FilterState) => {
        setFilters(newFilters);
        setPage(1);
    }, []);

    return (
        <div style={styles.container}>

            <ProductHeader currency={currency} setCurrency={setCurrency} />

            <ProductFilters filters={filters} setFilters={handleSetFilters} currency={currency} />

            <div style={styles.statsContainer}>
                <div style={styles.statsText}>
                    Showing {data?.items.length || 0} of {data?.total || 0} products
                </div>
                <ProductSort sortBy={sortBy} onSort={handleSort} />
            </div>

            {error && (
                <div style={styles.errorBox}>
                    {error}
                </div>
            )}

            <ProductTable products={data?.items || []} loading={loading} currency={currency} />

            <Pagination
                page={page}
                totalPages={data?.totalPages || 1}
                loading={loading}
                setPage={setPage}
            />

        </div>
    );
}
