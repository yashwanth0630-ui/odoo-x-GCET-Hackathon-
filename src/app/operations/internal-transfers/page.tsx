import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import InternalTransfersClient from "./InternalTransfersClient";

export const metadata = {
  title: "Internal Transfers | StockSense IMS",
  description: "Manage inter-warehouse stock transfers with ledger tracking",
};

export default async function InternalTransfersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login?redirect=/operations/internal-transfers");
  }

  return <InternalTransfersClient user={user} />;
}
