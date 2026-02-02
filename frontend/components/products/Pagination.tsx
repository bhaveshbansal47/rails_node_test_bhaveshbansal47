import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    page: number;
    totalPages: number;
    loading: boolean;
    setPage: (page: number | ((p: number) => number)) => void;
}

const styles = {
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "1rem",
        padding: "1rem 0",
    },
    buttonBase: {
        padding: "0.5rem 1rem",
        borderRadius: "6px",
        border: "1px solid var(--border)",
        backgroundColor: "var(--background)",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        fontWeight: "600",
        color: "var(--foreground)",
    },
    pageInfo: {
        fontWeight: "600",
        fontVariantNumeric: "tabular-nums" as const,
    },
};

export default function Pagination({ page, totalPages, loading, setPage }: PaginationProps) {
    const isPrevDisabled = page === 1 || loading;
    const isNextDisabled = page === (totalPages || 1) || loading;

    return (
        <div style={styles.container}>
            <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={isPrevDisabled}
                style={{
                    ...styles.buttonBase,
                    cursor: isPrevDisabled ? "not-allowed" : "pointer",
                    opacity: isPrevDisabled ? 0.5 : 1,
                }}
            >
                <ChevronLeft size={16} /> Previous
            </button>

            <span style={styles.pageInfo}>
                Page {page} of {totalPages || 1}
            </span>

            <button
                onClick={() => setPage(p => Math.min(totalPages || 1, p + 1))}
                disabled={isNextDisabled}
                style={{
                    ...styles.buttonBase,
                    cursor: isNextDisabled ? "not-allowed" : "pointer",
                    opacity: isNextDisabled ? 0.5 : 1,
                }}
            >
                Next <ChevronRight size={16} />
            </button>
        </div>
    );
}
