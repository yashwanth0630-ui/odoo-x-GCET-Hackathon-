import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Dashboard | StockSense IMS",
  description: "StockSense Real-Time Modular Inventory Management Dashboard",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login?redirect=/dashboard");
  }

  return <DashboardClient initialUser={user} />;
}
