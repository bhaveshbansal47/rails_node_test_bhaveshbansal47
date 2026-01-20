import { Product } from "../../types";
import { getCurrencySymbol } from "../../utils/currency";

interface ProductTableProps {
    products: Product[];
    loading: boolean;
    currency: string;
}

const styles = {
    loadingMessage: {
        padding: "4rem",
        textAlign: "center" as const,
        opacity: 0.5,
    },
    emptyState: {
        textAlign: "center" as const,
        padding: "4rem",
        opacity: 0.6,
        border: "2px dashed var(--border)",
        borderRadius: "12px",
        margin: "1rem",
    },
    tableContainer: {
        flex: 1,
        overflowY: "auto" as const,
        backgroundColor: "var(--background)",
        borderRadius: "12px",
        border: "1px solid var(--border)",
        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
    },
    table: {
        width: "100%",
        borderCollapse: "separate" as const,
        borderSpacing: "0",
    },
    thead: {
        position: "sticky" as const,
        top: 0,
        backgroundColor: "var(--background)",
    },
    th: {
        textAlign: "left" as const,
        padding: "1rem",
        borderBottom: "2px solid var(--border)",
        color: "var(--foreground)",
        fontSize: "0.85rem",
        textTransform: "uppercase" as const,
        letterSpacing: "0.05em",
    },
    tr: {
        transition: "background-color 0.1s",
    },
    td: {
        padding: "1rem",
        borderBottom: "1px solid var(--border)",
    },
    productName: {
        fontWeight: "600",
        color: "var(--foreground)",
    },
    productId: {
        fontSize: "0.75rem",
        fontFamily: "monospace",
    },
    price: {
        fontWeight: "700",
        color: "var(--primary)",
        fontSize: "1.1rem",
    },
};

export default function ProductTable({ products, loading, currency }: ProductTableProps) {
    return (
        <div style={styles.tableContainer}>
            <table style={styles.table}>
                <thead style={styles.thead}>
                    <tr>
                        <th style={styles.th}>Product Name</th>
                        <th style={styles.th}>Expiration Date</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>Price ({currency})</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={3} style={{ padding: "0" }}>
                                <div style={styles.loadingMessage}>Loading inventory...</div>
                            </td>
                        </tr>
                    ) : !loading && products.length === 0 ? (
                        <tr>
                            <td colSpan={3} style={{ padding: "0" }}>
                                <div style={{ ...styles.emptyState, margin: "2rem" }}>
                                    No products found matching these filters.
                                </div>
                            </td>
                        </tr>
                    ) : (
                        products.map((product) => (
                            <tr key={product.id} style={styles.tr}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--accent)"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                                <td style={styles.td}>
                                    <div style={styles.productName}>{product.name}</div>
                                    <div style={styles.productId}>ID: {product.id}</div>
                                </td>
                                <td style={styles.td}>
                                    <span style={{ fontWeight: "500", color: product.expiration ? "var(--foreground)" : "var(--danger)" }}>
                                        {product.expiration ? new Date(product.expiration).toLocaleDateString() : "N/A"}
                                    </span>
                                </td>
                                <td style={{ ...styles.td, textAlign: "right" }}>
                                    <span style={styles.price}>
                                        {product.price ? `${getCurrencySymbol(currency)} ${Number(product.price).toFixed(2)}` : "-"}
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
