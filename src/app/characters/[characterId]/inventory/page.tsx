import { Suspense } from "react";
import { notFound } from "next/navigation";
import { InventoryView } from "@/components/character/InventoryView";
import { SheetSkeleton } from "@/components/character/SheetSkeleton";
import { loadVisibleCharacter } from "@/server/visible-character";

export default function InventoryPage({
  params,
}: {
  params: Promise<{ characterId: string }>;
}) {
  return (
    <Suspense fallback={<SheetSkeleton />}>
      <InventoryPageContent params={params} />
    </Suspense>
  );
}

async function InventoryPageContent({
  params,
}: {
  params: Promise<{ characterId: string }>;
}) {
  const { characterId } = await params;
  const character = await loadVisibleCharacter(characterId);
  if (!character) {
    notFound();
  }
  return <InventoryView source={character} />;
}
