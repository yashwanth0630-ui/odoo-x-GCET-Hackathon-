import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AdjustmentsClient from "./AdjustmentsClient";

export const metadata = {
  title: "Inventory Adjustments & Cycle Counts | StockSense IMS",
  description: "Reconcile physical stock counts with digital records and log discrepancy adjustments",
};

export default async function AdjustmentsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login?redirect=/operations/adjustments");
  }

  return <AdjustmentsClient user={user} />;
}
