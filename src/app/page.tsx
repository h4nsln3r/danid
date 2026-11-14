import { Suspense } from "react";
import { CompanyHome } from "@/components/company/CompanyHome";

export default function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <main className="page">
      <Suspense fallback={<p className="loading-line">Opening your characters…</p>}>
        <HomeContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function HomeContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return <CompanyHome nameError={params.error === "name"} />;
}
