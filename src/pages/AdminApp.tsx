import React, { useState } from "react";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import AdminProducts from "./AdminProducts";
import ProductForm from "./ProductForm";
import AdminCategories from "./AdminCategories";
import AdminInquiries from "./AdminInquiries";
import AdminSiteImages from "./AdminSiteImages";
import AdminLegitimacy from "./AdminLegitimacy";
import AdminVouches from "./AdminVouches";
import { getToken } from "../services/auth";
import type { Product } from "../types/product";

type AdminView =
  | "dashboard"
  | "products"
  | "productForm"
  | "categories"
  | "inquiries"
  | "siteImages"
  | "legitimacy"
  | "vouches";

export default function AdminApp() {
  const [loggedIn, setLoggedIn] = useState<boolean>(!!getToken());
  const [view, setView] = useState<AdminView>("dashboard");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  if (!loggedIn) {
    return <AdminLogin onLoginSuccess={() => setLoggedIn(true)} />;
  }

  if (view === "products") {
    return (
      <AdminProducts
        onBack={() => setView("dashboard")}
        onAddNew={() => {
          setEditingProduct(null);
          setView("productForm");
        }}
        onEdit={(product) => {
          setEditingProduct(product);
          setView("productForm");
        }}
      />
    );
  }

  if (view === "productForm") {
    return (
      <ProductForm
        product={editingProduct}
        onSaved={() => setView("products")}
        onCancel={() => setView("products")}
      />
    );
  }

  if (view === "categories") {
    return <AdminCategories onBack={() => setView("dashboard")} />;
  }

  if (view === "inquiries") {
    return <AdminInquiries onBack={() => setView("dashboard")} />;
  }

  if (view === "siteImages") {
    return <AdminSiteImages onBack={() => setView("dashboard")} />;
  }

  if (view === "legitimacy") {
    return <AdminLegitimacy onBack={() => setView("dashboard")} />;
  }

  if (view === "vouches") {
    return <AdminVouches onBack={() => setView("dashboard")} />;
  }

  return (
    <AdminDashboard
      onLogout={() => {
        setLoggedIn(false);
        setView("dashboard");
      }}
      onNavigateProducts={() => setView("products")}
      onNavigateCategories={() => setView("categories")}
      onNavigateInquiries={() => setView("inquiries")}
      onNavigateSiteImages={() => setView("siteImages")}
      onNavigateLegitimacy={() => setView("legitimacy")}
      onNavigateVouches={() => setView("vouches")}
    />
  );
}