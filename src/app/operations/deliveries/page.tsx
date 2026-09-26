import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DeliveriesClient from "./DeliveriesClient";

export const metadata = {
  title: "Delivery Orders (Outgoing Goods) | StockSense IMS",
  description: "Pick, pack, and validate customer shipments to update the Stock Ledger",
};

export default async function DeliveriesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login?redirect=/operations/deliveries");
  }

  return <DeliveriesClient user={user} />;
}
