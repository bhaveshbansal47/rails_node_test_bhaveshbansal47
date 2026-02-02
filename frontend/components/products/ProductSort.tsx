import { ArrowUpDown } from "lucide-react";

interface ProductSortProps {
    sortBy: "name" | "price" | "expiration";
    onSort: (field: "name" | "price" | "expiration") => void;
}

const styles = {
    container: {
        display: "flex",
        gap: "0.5rem",
    },
    buttonBase: {
        padding: "0.5rem 1rem",
        borderRadius: "6px",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        cursor: "pointer",
        fontWeight: "600",
        transition: "all 0.2s",
    },
    buttonActive: {
        border: "1px solid var(--primary)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        color: "var(--primary)",
    },
    buttonInactive: {
        border: "1px solid var(--border)",
        backgroundColor: "transparent",
        color: "var(--foreground)",
    },
};

export default function ProductSort({ sortBy, onSort }: ProductSortProps) {
    const renderButton = (field: "name" | "price" | "expiration", label: string) => {
        const isActive = sortBy === field;
        const buttonStyle = {
            ...styles.buttonBase,
            ...(isActive ? styles.buttonActive : styles.buttonInactive),
        };
        return (
            <button
                onClick={() => onSort(field)}
                style={buttonStyle}
            >
                {label} <ArrowUpDown size={14} />
            </button>
        );
    };

    return (
        <div style={styles.container}>
            {renderButton("name", "Name")}
            {renderButton("price", "Price")}
            {renderButton("expiration", "Expiration")}
        </div>
    );
}
