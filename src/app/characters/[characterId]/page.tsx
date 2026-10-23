import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CharacterOverview } from "@/components/character/CharacterOverview";
import { SheetSkeleton } from "@/components/character/SheetSkeleton";
import { loadVisibleCharacter } from "@/server/visible-character";

export default function CharacterPage({
  params,
}: {
  params: Promise<{ characterId: string }>;
}) {
  return (
    <Suspense fallback={<SheetSkeleton />}>
      <CharacterPageContent params={params} />
    </Suspense>
  );
}

async function CharacterPageContent({
  params,
}: {
  params: Promise<{ characterId: string }>;
}) {
  const { characterId } = await params;
  const character = await loadVisibleCharacter(characterId);
  if (!character) {
    notFound();
  }
  return <CharacterOverview source={character} />;
}
