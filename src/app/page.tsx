import { Suspense } from "react";
import { CompanyHome } from "@/components/company/CompanyHome";

export default function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ fel?: string }>;
}) {
  return (
    <main className="page">
      <Suspense fallback={<p className="loading-line">Öppnar sällskapet…</p>}>
        <HomeContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function HomeContent({
  searchParams,
}: {
  searchParams: Promise<{ fel?: string }>;
}) {
  const params = await searchParams;
  return <CompanyHome nameError={params.fel === "namn"} />;
}
