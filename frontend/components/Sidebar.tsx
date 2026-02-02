
import { Package, Upload } from "lucide-react";

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const styles = {
    aside: {
        width: "250px",
        height: "100%",
        backgroundColor: "var(--accent)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column" as const,
        padding: "1rem",
    },
    title: {
        marginBottom: "2rem",
        fontWeight: "bold",
        fontSize: "1.2rem",
        paddingLeft: "0.5rem",
    },
    nav: {
        display: "flex",
        flexDirection: "column" as const,
        gap: "0.5rem",
    },
    link: {
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.75rem",
        borderRadius: "6px",
        transition: "background-color 0.2s",
        cursor: "pointer",
        border: "none",
        width: "100%",
        textAlign: "left" as const,
        fontSize: "1rem",
    },
    linkActive: {
        backgroundColor: "var(--primary)",
        color: "white",
    },
    linkInactive: {
        backgroundColor: "transparent",
        color: "var(--foreground)",
    },
};

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
    const getLinkStyle = (tab: string) => ({
        ...styles.link,
        ...(activeTab === tab ? styles.linkActive : styles.linkInactive),
    });

    return (
        <aside style={styles.aside}>
            <div style={styles.title}>
                Admin Panel
            </div>
            <nav style={styles.nav}>
                <button
                    onClick={() => onTabChange("uploads")}
                    style={getLinkStyle("uploads")}
                    type="button"
                >
                    <Upload size={20} />
                    Uploads
                </button>
                <button
                    onClick={() => onTabChange("products")}
                    style={getLinkStyle("products")}
                    type="button"
                >
                    <Package size={20} />
                    Products
                </button>
                
            </nav>
        </aside>
    );
}
