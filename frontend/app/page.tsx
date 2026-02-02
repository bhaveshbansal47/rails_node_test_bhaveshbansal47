"use client";

import { useState } from "react";
import Sidebar from "../components/Sidebar";
import ProductsView from "../components/products/ProductsView";
import UploadsView from "../components/uploads/UploadsView";

const styles = {
  layout: {
    display: "flex",
    width: "100vw",
    height: "100vh",
  },
  main: {
    flex: 1,
    overflow: "auto",
    padding: "2rem",
  },
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("uploads");

  return (
    <div style={styles.layout}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main style={styles.main}>
        {activeTab === "products" ? <ProductsView /> : <UploadsView />}
      </main>
    </div>
  );
}
