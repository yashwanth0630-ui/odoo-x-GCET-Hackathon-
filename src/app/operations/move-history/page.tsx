import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import MoveHistoryClient from "./MoveHistoryClient";

export const metadata = {
  title: "Centralized Stock Ledger (Move History) | StockSense IMS",
  description: "Complete historical audit trail of all warehouse stock movements and ledger postings",
};

export default async function MoveHistoryPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login?redirect=/operations/move-history");
  }

  return <MoveHistoryClient user={user} />;
}
