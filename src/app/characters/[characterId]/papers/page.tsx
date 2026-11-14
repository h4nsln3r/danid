import { PapersView } from "@/components/character/PapersView";
import { portraitGallery, sheetPageMap } from "@/server/library-store";
import { ownedCharacter } from "@/server/visible-character";

export default async function PapersPage({
  params,
}: {
  params: Promise<{ characterId: string }>;
}) {
  const { characterId } = await params;
  const entry = await ownedCharacter(characterId);
  if (!entry) {
    return (
      <section className="panel">
        <h1>Papers stay with the player</h1>
        <p>Only the player who created this character can open the photographed pages.</p>
      </section>
    );
  }
  const gallery = portraitGallery(entry);
  return (
    <PapersView
      characterId={entry.character.id}
      pages={sheetPageMap(entry)}
      portraits={gallery.files}
      activePortrait={gallery.active}
    />
  );
}
