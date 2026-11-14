import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CharacterOverview } from "@/components/character/CharacterOverview";
import { SheetSkeleton } from "@/components/character/SheetSkeleton";
import { getCharacter } from "@/domain/characters";
import { loadCharacterView, visiblePortraitGallery, visibleSceneFile } from "@/server/visible-character";

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
  const view = await loadCharacterView(characterId);
  if (!view) {
    notFound();
  }
  const portraits = await visiblePortraitGallery(characterId);
  const portraitUrls = portraits.files.map(
    (fileName) => `/characters/${view.character.id}/picture/${fileName}`,
  );
  const portraitUrl = portraits.active
    ? `/characters/${view.character.id}/picture/${portraits.active}`
    : undefined;
  const scene = await visibleSceneFile(characterId);
  return (
    <CharacterOverview
      source={view.character}
      portraitUrl={portraitUrl}
      portraitUrls={portraitUrls}
      sceneUrl={scene ? `/characters/${view.character.id}/picture/${scene}` : undefined}
      canEdit={view.canEdit}
      playedBy={view.playedBy}
      rememberPlay={view.canEdit && !getCharacter(characterId)}
    />
  );
}
