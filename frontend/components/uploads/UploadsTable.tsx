import React, { useState, useEffect, useRef } from "react";
import { Upload } from "../../types";
import UploadDetailsModal from "./UploadDetailsModal";
import { cancelUpload, getUploadsByIds } from "../../api/uploads";

interface UploadsTableProps {
    uploads: Upload[];
    loading: boolean;
    onUploadCancelled: () => void; // Callback to refresh list
    isPolling?: boolean;
}

const styles = {
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
        zIndex: 10,
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
    td: {
        padding: "1rem",
        borderBottom: "1px solid var(--border)",
        verticalAlign: "middle" as const,
    },
    progressBarContainer: {
        width: "100px",
        height: "8px",
        backgroundColor: "var(--accent)",
        borderRadius: "4px",
        overflow: "hidden",
        marginTop: "0.25rem",
    },
    progressBar: (percentage: number) => ({
        width: `${percentage}%`,
        height: "100%",
        backgroundColor: percentage === 100 ? "var(--success)" : "var(--primary)",
        transition: "width 0.3s ease",
    }),
    viewButton: {
        padding: "0.5rem 1rem",
        backgroundColor: "var(--primary)",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "0.875rem",
        fontWeight: "500",
    },
    loader: {
        padding: "2rem",
        textAlign: "center" as const,
        opacity: 0.6,
    },
    empty: {
        padding: "3rem",
        textAlign: "center" as const,
        opacity: 0.5,
    },
};

export default function UploadsTable({ uploads, loading, onUploadCancelled, isPolling = false }: UploadsTableProps) {
    const [selectedUpload, setSelectedUpload] = useState<Upload | null>(null);
    const [polledData, setPolledData] = useState<Record<string, Upload>>({});
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setPolledData({});
    }, [uploads]);

    useEffect(() => {
        if (!isPolling || loading || uploads.length === 0) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        const poll = async () => {
            const ids = uploads.map(u => u.id);
            try {
                const refreshedUploads = await getUploadsByIds(ids);
                const newData: Record<string, Upload> = {};
                refreshedUploads.forEach(u => {
                    newData[u.id] = u;
                });
                setPolledData(prev => ({ ...prev, ...newData }));
            } catch (error) {
                console.error("Polling error:", error);
            }
        };

        intervalRef.current = setInterval(poll, 5000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isPolling, loading, uploads]);

    const getDisplayUpload = (upload: Upload) => {
        return polledData[upload.id] || upload;
    };

    const getFilename = (key: string) => {
        const parts = key.split("/");
        let filename = parts[parts.length - 1];
        if (!filename.endsWith('.csv')) {
            filename += '.csv';
        }
        return filename;
    };

    const getProgress = (upload: Upload) => {
        if (upload.total_rows === 0) return 0;
        const pct = (upload.processed_rows / upload.total_rows) * 100;
        return Math.min(100, Math.max(0, pct));
    };

    const handleCancel = async (id: string) => {
        try {
            await cancelUpload(id);
            setSelectedUpload(null);
            onUploadCancelled(); // Refresh list
        } catch (error) {
            console.error("Failed to cancel upload", error);
            alert("Failed to cancel upload");
        }
    };

    return (
        <div style={styles.tableContainer}>
            <table style={styles.table}>
                <thead style={styles.thead}>
                    <tr>
                        <th style={styles.th}>Filename</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Total Rows</th>
                        <th style={styles.th}>Processed</th>
                        <th style={styles.th}>Progress</th>
                        <th style={styles.th}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {loading && (
                        <tr>
                            <td colSpan={6}>
                                <div style={styles.loader}>Loading uploads...</div>
                            </td>
                        </tr>
                    )}
                    {!loading && uploads.length === 0 && (
                        <tr>
                            <td colSpan={6}>
                                <div style={styles.empty}>No uploads found in this category.</div>
                            </td>
                        </tr>
                    )}
                    {!loading && uploads.map((originalUpload) => {
                        const upload = getDisplayUpload(originalUpload);
                        const progress = getProgress(upload);
                        const filename = getFilename(upload.s3_key);

                        return (
                            <tr key={upload.id}>
                                <td style={styles.td}>{filename}</td>
                                <td style={styles.td}>
                                    <span style={{
                                        padding: "0.25rem 0.5rem",
                                        borderRadius: "99px",
                                        fontSize: "0.75rem",
                                        fontWeight: "600",
                                        backgroundColor: upload.status === "FAILED" ? "#fee2e2" : upload.status === "COMPLETED" ? "#dcfce7" : "#e0f2fe",
                                        color: upload.status === "FAILED" ? "#ef4444" : upload.status === "COMPLETED" ? "#16a34a" : "#0284c7",
                                    }}>
                                        {upload.status}
                                    </span>
                                </td>
                                <td style={styles.td}>{upload.total_rows.toLocaleString()}</td>
                                <td style={styles.td}>{upload.processed_rows.toLocaleString()}</td>
                                <td style={styles.td}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <span style={{ fontSize: "0.85rem", width: "3rem" }}>{Math.round(progress)}%</span>
                                        <div style={styles.progressBarContainer}>
                                            <div style={styles.progressBar(progress)} />
                                        </div>
                                    </div>
                                    {upload.status === "FAILED" && upload.failed_reason && (
                                        <div style={{ fontSize: "0.75rem", color: "var(--danger)", marginTop: "0.25rem", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={upload.failed_reason}>
                                            {upload.failed_reason}
                                        </div>
                                    )}
                                </td>
                                <td style={styles.td}>
                                    <button
                                        style={styles.viewButton}
                                        onClick={() => setSelectedUpload(upload)}
                                    >
                                        View
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {selectedUpload && (
                <UploadDetailsModal
                    upload={getDisplayUpload(selectedUpload)}
                    onClose={() => setSelectedUpload(null)}
                    onCancel={handleCancel}
                />
            )}
        </div>
    );
}
