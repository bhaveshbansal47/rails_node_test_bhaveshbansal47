import { Package } from "lucide-react";

interface ProductHeaderProps {
    currency: string;
    setCurrency: (currency: string) => void;
}

const styles = {
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    title: {
        fontSize: "2rem",
        fontWeight: "700",
        letterSpacing: "-0.025em",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
    },
    icon: {
        color: "var(--primary)",
    },
    subtitle: {
        color: "var(--foreground)",
        opacity: 0.6,
    },
    currencyContainer: {
        display: "flex",
        gap: "1rem",
        alignItems: "center",
    },
    label: {
        fontSize: "0.875rem",
        fontWeight: "600",
    },
    select: {
        padding: "0.5rem 1rem",
        borderRadius: "6px",
        border: "1px solid var(--border)",
        backgroundColor: "var(--background)",
        color: "var(--foreground)",
        fontWeight: "600",
        cursor: "pointer",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    },
};

import { useState, useEffect } from "react";
import { getCurrencies } from "../../api";

export default function ProductHeader({ currency, setCurrency }: ProductHeaderProps) {
    const [currencies, setCurrencies] = useState<Record<string, string>>({});

    useEffect(() => {
        getCurrencies()
            .then((data) => setCurrencies(data))
            .catch(() => {});
    }, []);

    return (
        <header style={styles.header}>
            <div>
                <h1 style={styles.title}>
                    <Package size={32} strokeWidth={2.5} style={styles.icon} />
                    Products
                </h1>
            </div>
            <div style={styles.currencyContainer}>
                <label style={styles.label}>Currency:</label>
                <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    style={styles.select}
                >
                    {Object.keys(currencies).map((currencyCode) => (
                        <option key={currencyCode} value={currencyCode.toUpperCase()}>
                            {currencyCode.toUpperCase()}
                        </option>
                    ))}
                </select>
            </div>
        </header>
    );
}
