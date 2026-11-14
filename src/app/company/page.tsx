import { Suspense } from "react";
import type { Metadata } from "next";
import { CompanyRoster } from "@/components/company/CompanyRoster";

export const metadata: Metadata = {
  title: "All Characters",
  description: "Every character saved on this computer.",
};

export default function CompanyPage() {
  return (
    <main className="page">
      <Suspense fallback={<p className="loading-line">Opening the company…</p>}>
        <CompanyRoster />
      </Suspense>
    </main>
  );
}
