import React from "react";
import { Upload } from "../../types";

interface UploadDetailsModalProps {
    upload: Upload;
    onClose: () => void;
    onCancel: (id: string) => Promise<void>;
}

const styles = {
    overlay: {
        position: "fixed" as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
    },
    modal: {
        backgroundColor: "var(--background)",
        padding: "2rem",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        width: "500px",
        maxWidth: "90%",
        display: "flex",
        flexDirection: "column" as const,
        gap: "1.5rem",
        border: "1px solid var(--border)",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "1.25rem",
        fontWeight: "bold",
    },
    row: {
        display: "flex",
        justifyContent: "space-between",
        padding: "0.5rem 0",
        borderBottom: "1px solid var(--border)",
    },
    label: {
        color: "var(--foreground)",
        opacity: 0.7,
        fontWeight: "500",
    },
    value: {
        fontWeight: "600",
    },
    footer: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "1rem",
        marginTop: "1rem",
    },
    button: {
        padding: "0.5rem 1rem",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "500",
        border: "none",
        fontSize: "0.9rem",
    },
    closeButton: {
        backgroundColor: "var(--accent)",
        color: "var(--foreground)",
    },
    cancelButton: {
        backgroundColor: "var(--danger)",
        color: "#fff",
    },
};

export default function UploadDetailsModal({ upload, onClose, onCancel }: UploadDetailsModalProps) {
    const isCancellable = upload.status === "PENDING" || upload.status === "PROCESSING";

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <span>Upload Details</span>
                    <button
                        onClick={onClose}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem", padding: "0" }}
                    >
                        &times;
                    </button>
                </div>

                <div>
                    <div style={styles.row}>
                        <span style={styles.label}>ID</span>
                        <span style={{ ...styles.value, fontSize: "0.8rem", fontFamily: "monospace" }}>{upload.id}</span>
                    </div>
                    <div style={styles.row}>
                        <span style={styles.label}>Status</span>
                        <span style={styles.value}>{upload.status}</span>
                    </div>
                    <div style={styles.row}>
                        <span style={styles.label}>Total Rows</span>
                        <span style={styles.value}>{upload.total_rows.toLocaleString()}</span>
                    </div>
                    <div style={styles.row}>
                        <span style={styles.label}>Processed Rows</span>
                        <span style={styles.value}>{upload.processed_rows.toLocaleString()}</span>
                    </div>
                    <div style={styles.row}>
                        <span style={styles.label}>Progress</span>
                        <span style={styles.value}>
                            {upload.total_rows > 0 ? Math.round((upload.processed_rows / upload.total_rows) * 100) : 0}%
                        </span>
                    </div>
                    {upload.failed_reason && (
                        <div style={{ ...styles.row, flexDirection: "column", gap: "0.5rem", alignItems: "flex-start" }}>
                            <span style={styles.label}>Failed Reason</span>
                            <span style={{ ...styles.value, color: "var(--danger)", wordBreak: "break-all" }}>{upload.failed_reason}</span>
                        </div>
                    )}
                </div>

                <div style={styles.footer}>
                    {isCancellable && (
                        <button
                            style={{ ...styles.button, ...styles.cancelButton }}
                            onClick={() => {
                                if (confirm("Are you sure you want to cancel this upload?")) {
                                    onCancel(upload.id);
                                }
                            }}
                        >
                            Cancel Upload
                        </button>
                    )}
                    <button
                        style={{ ...styles.button, ...styles.closeButton }}
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
