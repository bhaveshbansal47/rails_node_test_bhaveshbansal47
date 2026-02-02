import React from "react";

interface UploadsTabsProps {
    activeTab: "process" | "failed" | "completed";
    onTabChange: (tab: "process" | "failed" | "completed") => void;
}

const styles = {
    tabs: {
        display: "flex",
        gap: "1rem",
        borderBottom: "1px solid var(--border)",
    },
    tab: (isActive: boolean) => ({
        padding: "0.75rem 1rem",
        cursor: "pointer",
        fontWeight: "500",
        color: isActive ? "var(--primary)" : "var(--foreground)",
        borderBottom: isActive ? "2px solid var(--primary)" : "2px solid transparent",
        opacity: isActive ? 1 : 0.6,
        transition: "all 0.2s",
    }),
};

export default function UploadsTabs({ activeTab, onTabChange }: UploadsTabsProps) {
    return (
        <div style={styles.tabs}>
            <div
                style={styles.tab(activeTab === "process")}
                onClick={() => onTabChange("process")}
            >
                In Process
            </div>
            <div
                style={styles.tab(activeTab === "failed")}
                onClick={() => onTabChange("failed")}
            >
                Failed
            </div>
            <div
                style={styles.tab(activeTab === "completed")}
                onClick={() => onTabChange("completed")}
            >
                Completed
            </div>
        </div>
    );
}
