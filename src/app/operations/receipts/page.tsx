import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ReceiptsClient from "./ReceiptsClient";

export const metadata = {
  title: "Receipts (Incoming Goods) | StockSense IMS",
  description: "Manage incoming supplier shipments and validate stock increases",
};

export default async function ReceiptsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login?redirect=/operations/receipts");
  }

  return <ReceiptsClient user={user} />;
}
