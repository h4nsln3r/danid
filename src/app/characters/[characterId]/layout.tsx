import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import { LoadingLine } from "@/components/layout/LoadingLine";
import { CharacterNav } from "@/components/layout/CharacterNav";
import { LibraryNotice } from "@/components/providers/CharacterLibraryProvider";
import { getCharacter, listCharacters } from "@/domain/characters";
import { copyFor } from "@/domain/copy";
import { currentLocale } from "@/server/locale";
import { ownedCharacter, visibleSheetFile, loadVisibleCharacter } from "@/server/visible-character";

export async function generateStaticParams() {
  return listCharacters().map((character) => ({
    characterId: character.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ characterId: string }>;
}): Promise<Metadata> {
  const { characterId } = await params;
  const sample = getCharacter(characterId);
  if (sample) {
    return {
      title: sample.name,
      description: `${sample.name}, level ${sample.level} ${sample.ancestry} ${sample.className}.`,
    };
  }
  const character = await loadVisibleCharacter(characterId);
  const t = copyFor(await currentLocale());
  if (!character) {
    return { title: t.errors.unknown };
  }
  return {
    title: character.name,
    description: `${character.name}, level ${character.level} ${character.ancestry} ${character.className}.`,
  };
}

export default function CharacterLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ characterId: string }>;
}) {
  return (
    <div className="page">
      <Suspense fallback={<LoadingLine label="sheet" />}>
        <CharacterSectionNav params={params} />
      </Suspense>
      <LibraryNotice />
      {children}
    </div>
  );
}

async function CharacterSectionNav({
  params,
}: {
  params: Promise<{ characterId: string }>;
}) {
  const { characterId } = await params;
  const character = await loadVisibleCharacter(characterId);
  if (!character) {
    return null;
  }
  const sheet = await visibleSheetFile(characterId);
  const owned = Boolean(await ownedCharacter(characterId));
  return (
    <CharacterNav
      characterId={character.id}
      name={character.name}
      hasSheet={Boolean(sheet)}
      owned={owned}
    />
  );
}
