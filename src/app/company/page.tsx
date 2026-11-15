import { Suspense } from "react";
import type { Metadata } from "next";
import { LoadingLine } from "@/components/layout/LoadingLine";
import { CompanyRoster } from "@/components/company/CompanyRoster";

export const metadata: Metadata = {
  title: "All Characters",
  description: "Every character saved on this computer.",
};

export default function CompanyPage() {
  return (
    <main className="page">
      <Suspense fallback={<LoadingLine label="company" />}>
        <CompanyRoster />
      </Suspense>
    </main>
  );
}
