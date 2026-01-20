import React, { useState, useRef } from "react";
import { getPresignedUrl, uploadToS3, createUpload } from "../../api/uploads";

interface UploadModalProps {
    onClose: () => void;
    onUploadSuccess: () => void;
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
    dropZone: (isDragging: boolean) => ({
        border: `2px dashed ${isDragging ? "var(--primary)" : "var(--border)"}`,
        borderRadius: "8px",
        padding: "3rem",
        textAlign: "center" as const,
        cursor: "pointer",
        backgroundColor: isDragging ? "var(--accent)" : "transparent",
        transition: "all 0.2s",
    }),
    dropZoneText: {
        color: "var(--foreground)",
        marginBottom: "0.5rem",
        fontWeight: "500",
    },
    dropZoneSubText: {
        fontSize: "0.85rem",
        opacity: 0.6,
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
    cancelButton: {
        backgroundColor: "var(--accent)",
        color: "var(--foreground)",
    },
    uploadButton: (disabled: boolean) => ({
        backgroundColor: disabled ? "var(--border)" : "var(--primary)",
        color: "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
    }),
    error: {
        color: "var(--danger)",
        fontSize: "0.9rem",
        marginTop: "0.5rem",
    },
    progressBarContainer: {
        width: "100%",
        height: "8px",
        backgroundColor: "var(--accent)",
        borderRadius: "4px",
        overflow: "hidden",
        marginTop: "1rem",
    },
    progressBar: (progress: number) => ({
        width: `${progress}%`,
        height: "100%",
        backgroundColor: "var(--primary)",
        transition: "width 0.2s",
    }),
};

export default function UploadModal({ onClose, onUploadSuccess }: UploadModalProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File) => {
        if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
            return "Only .csv files are allowed.";
        }
        if (file.size > 100 * 1024 * 1024) {
            return "File size must be less than 100MB.";
        }
        return null;
    };

    const handleFileSelect = (selectedFile: File) => {
        setError(null);
        const validationError = validateFile(selectedFile);
        if (validationError) {
            setError(validationError);
            return;
        }
        setFile(selectedFile);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    const startUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);
        try {
            const { presignedUrl, key } = await getPresignedUrl(file.name, file.type);

            await uploadToS3(presignedUrl, file, (percent) => setProgress(percent));

            await createUpload(key);

            onUploadSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to upload file.");
            setUploading(false);
        }
    };

    return (
        <div style={styles.overlay} onClick={() => !uploading && onClose()}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <span>Upload CSV</span>
                    {!uploading && (
                        <button
                            onClick={onClose}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem", padding: "0" }}
                        >
                            &times;
                        </button>
                    )}
                </div>

                {!uploading ? (
                    <>
                        <div
                            style={styles.dropZone(isDragging)}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={handleBrowseClick}
                        >
                            <div style={styles.dropZoneText}>
                                {file ? file.name : "Drag & Drop CSV file here or click to browse"}
                            </div>
                            <div style={styles.dropZoneSubText}>Max size: 100MB</div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                                style={{ display: "none" }}
                                accept=".csv"
                            />
                        </div>
                        {error && <div style={styles.error}>{error}</div>}
                    </>
                ) : (
                    <div>
                        <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>Uploading... {progress}%</div>
                        <div style={styles.progressBarContainer}>
                            <div style={styles.progressBar(progress)} />
                        </div>
                    </div>
                )}

                <div style={styles.footer}>
                    {!uploading && (
                        <button
                            style={{ ...styles.button, ...styles.cancelButton }}
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        style={{ ...styles.button, ...styles.uploadButton(!file || uploading) }}
                        onClick={startUpload}
                        disabled={!file || uploading}
                    >
                        {uploading ? "Uploading..." : "Upload"}
                    </button>
                </div>
            </div>
        </div>
    );
}
