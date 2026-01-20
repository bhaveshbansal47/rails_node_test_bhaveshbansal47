import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { Search, Calendar } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";
import { FilterState } from "../../types";
import { useEffect, useState, useRef, CSSProperties } from "react";
import { getCurrencySymbol } from "../../utils/currency";

interface ProductFiltersProps {
    filters: FilterState;
    setFilters: (filters: FilterState) => void;
    currency: string;
}

const styles: Record<string, CSSProperties> = {
    container: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1rem",
        padding: "1.5rem",
        backgroundColor: "var(--background)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    },
    inputContainer: {
        display: "flex",
        alignItems: "center",
        position: "relative" as const,
    },
    icon: {
        position: "absolute" as const,
        left: "12px",
        opacity: 0.5,
        color: "var(--foreground)",
    },
    searchInput: {
        width: "100%",
        padding: "0.75rem 0.75rem 0.75rem 2.5rem",
        borderRadius: "8px",
        border: "1px solid var(--border)",
        backgroundColor: "var(--accent)",
        color: "var(--foreground)",
        outline: "none",
        transition: "border-color 0.2s",
    },
    datePickerContainer: {
        position: "relative" as const,
        zIndex: 10,
    },
    dateInputWrapper: {
        display: "flex",
        alignItems: "center",
        width: "100%",
        position: "relative" as const,
    },
    dateIcon: {
        position: "absolute" as const,
        left: "12px",
        zIndex: 1,
        opacity: 0.5,
        color: "var(--foreground)",
    },
    dateInput: {
        width: "100%",
        padding: "0.75rem 0.75rem 0.75rem 2.5rem",
        borderRadius: "8px",
        border: "1px solid var(--border)",
        backgroundColor: "var(--accent)",
        color: "var(--foreground)",
        cursor: "pointer",
        outline: "none",
    },
    priceContainer: {
        display: "flex",
        gap: "0.5rem",
        alignItems: "center",
    },
    priceInputWrapper: {
        position: "relative" as const,
        flex: 1,
    },
    priceIcon: {
        position: "absolute" as const,
        left: "8px",
        top: "50%",
        transform: "translateY(-55%)",
        opacity: 0.5,
        color: "var(--foreground)",
    },
    priceInput: {
        width: "100%",
        padding: "0.75rem 0.75rem 0.75rem 1.75rem",
        borderRadius: "8px",
        border: "1px solid var(--border)",
        backgroundColor: "var(--accent)",
        color: "var(--foreground)",
        outline: "none",
        textAlign: "center",
    },
    separator: {
        opacity: 0.5,
    },
};

export default function ProductFilters({ filters, setFilters, currency }: ProductFiltersProps) {
    const [localFilters, setLocalFilters] = useState<FilterState>(filters);
    const isFirstRun = useRef(true);

    useEffect(() => {
        const filtersChanged =
            filters.searchName !== localFilters.searchName ||
            filters.minPrice !== localFilters.minPrice ||
            filters.maxPrice !== localFilters.maxPrice ||
            filters.dateRange[0] !== localFilters.dateRange[0] ||
            filters.dateRange[1] !== localFilters.dateRange[1];

        if (filtersChanged) {
            setLocalFilters(filters);
        }
    }, [filters]);

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }

        const handler = setTimeout(() => {
            setFilters(localFilters);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [localFilters, setFilters]);

    const updateFilter = (key: keyof FilterState, value: any) => {
        setLocalFilters(prev => ({ ...prev, [key]: value }));
    };

    const { searchName, dateRange, minPrice, maxPrice } = localFilters;
    const [startDate, endDate] = dateRange;

    return (
        <div style={styles.container}>
            <div style={styles.inputContainer}>
                <Search size={18} style={styles.icon} />
                <input
                    type="text"
                    placeholder="Search items..."
                    value={searchName}
                    onChange={(e) => updateFilter("searchName", e.target.value)}
                    style={styles.searchInput}
                />
            </div>

            <div style={styles.datePickerContainer}>
                <DatePicker
                    selectsRange={true}
                    startDate={startDate}
                    endDate={endDate}
                    onChange={(update) => {
                        updateFilter("dateRange", update);
                    }}
                    isClearable={true}
                    placeholderText="Filter by expiration..."
                    customInput={
                        <div style={styles.dateInputWrapper}>
                            <Calendar size={18} style={styles.dateIcon} />
                            <input
                                style={styles.dateInput}
                                value={startDate ? `${format(startDate, "MM/dd/yyyy")} - ${endDate ? format(endDate, "MM/dd/yyyy") : "..."}` : ""}
                                readOnly
                                placeholder="Filter by expiration..."
                            />
                        </div>
                    }
                />
            </div>

            <div style={styles.priceContainer}>
                <div style={styles.priceInputWrapper}>
                    <span style={{ ...styles.priceIcon, fontSize: "0.9rem", fontWeight: "600" }}>{getCurrencySymbol(currency)}</span>
                    <input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => updateFilter("minPrice", e.target.value)}
                        style={styles.priceInput}
                    />
                </div>
                <span style={styles.separator}>-</span>
                <div style={styles.priceInputWrapper}>
                    <span style={{ ...styles.priceIcon, fontSize: "0.9rem", fontWeight: "600" }}>{getCurrencySymbol(currency)}</span>
                    <input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => updateFilter("maxPrice", e.target.value)}
                        style={styles.priceInput}
                    />
                </div>
            </div>
        </div>
    );
}
