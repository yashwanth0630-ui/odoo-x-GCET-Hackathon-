import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import WarehouseSettingsClient from "./WarehouseSettingsClient";

export const metadata = {
  title: "Warehouse Configuration | StockSense IMS",
  description: "Configure regional warehouses, distribution hubs, and sub-locations (Racks, Bays, Docks)",
};

export default async function WarehouseSettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login?redirect=/settings/warehouses");
  }

  return <WarehouseSettingsClient user={user} />;
}
