import { copyFor } from "@/domain/copy";
import { currentLocale } from "@/server/locale";
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
  const t = copyFor(await currentLocale());
  if (!entry) {
    return (
      <section className="panel">
        <h1>{t.papers.lockedTitle}</h1>
        <p>{t.papers.lockedText}</p>
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
