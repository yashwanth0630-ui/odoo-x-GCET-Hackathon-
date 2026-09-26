import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ProductsClient from "./ProductsClient";

export const metadata = {
  title: "Products & Stock Catalog | StockSense IMS",
  description: "StockSense Modular Product & Multi-Location Stock Management",
};

export default async function ProductsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login?redirect=/products");
  }

  return <ProductsClient initialUser={user} />;
}
