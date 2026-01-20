import { useEffect, useState } from "react";
import { getUploads } from "../../api/uploads";
import { Upload } from "../../types";
import UploadsTabs from "./UploadsTabs";
import UploadsTable from "./UploadsTable";
import UploadModal from "./UploadModal";

const styles = {
    container: {
        height: "100%",
        display: "flex",
        flexDirection: "column" as const,
        gap: "1.5rem",
        padding: "1rem",
    },
    header: {
        display: "flex",
        flexDirection: "column" as const,
        gap: "1rem",
    },
    titleRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    title: {
        fontSize: "1.5rem",
        fontWeight: "bold",
    },
    createButton: {
        backgroundColor: "var(--primary)",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        width: "32px",
        height: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.5rem",
        cursor: "pointer",
        fontWeight: "bold",
        lineHeight: "1",
    },
};

export default function UploadsView() {
    const [activeTab, setActiveTab] = useState<"process" | "failed" | "completed">("process");
    const [uploads, setUploads] = useState<Upload[]>([]);
    const [loading, setLoading] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    useEffect(() => {
        fetchUploads();
    }, [activeTab]);

    const fetchUploads = async () => {
        setLoading(true);
        try {
            let statusQuery = "";
            if (activeTab === "process") statusQuery = "PENDING,PROCESSING";
            if (activeTab === "failed") statusQuery = "FAILED";
            if (activeTab === "completed") statusQuery = "COMPLETED";

            const response = await getUploads({ status: statusQuery, limit: 100 });
            setUploads(response.items);
        } catch (error) {
            console.error("Failed to fetch uploads", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.titleRow}>
                    <div style={styles.title}>Uploads</div>
                    <button
                        style={styles.createButton}
                        onClick={() => setIsUploadModalOpen(true)}
                        title="New Upload"
                    >
                        +
                    </button>
                </div>
                <UploadsTabs activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
            <UploadsTable
                uploads={uploads}
                loading={loading}
                onUploadCancelled={fetchUploads}
                isPolling={activeTab === "process"}
            />
            {isUploadModalOpen && (
                <UploadModal
                    onClose={() => setIsUploadModalOpen(false)}
                    onUploadSuccess={() => {
                        if (activeTab !== "process") {
                            setActiveTab("process");
                        } else {
                            fetchUploads();
                        }
                    }}
                />
            )}
        </div>
    );
}
