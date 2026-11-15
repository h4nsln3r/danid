"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCopy } from "@/components/providers/LocaleProvider";

export function CharacterNav({
  characterId,
  name,
  hasSheet = false,
  owned = false,
}: {
  characterId: string;
  name: string;
  hasSheet?: boolean;
  owned?: boolean;
}) {
  const pathname = usePathname();
  const t = useCopy();
  const overview = `/characters/${characterId}`;
  const pack = `${overview}/inventory`;
  const links = [
    { href: overview, label: t.characterNav.character },
    { href: pack, label: t.characterNav.equipment },
    ...(owned ? [{ href: `${overview}/papers`, label: t.characterNav.papers }] : []),
  ];

  return (
    <div className="character-nav">
      <p className="character-nav-name">{name}</p>
      <nav aria-label={`${name} ${t.characterNav.sections}`}>
        <ul className="nav-list">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="nav-link"
                aria-current={pathname === link.href ? "page" : undefined}
              >
                {link.label}
              </Link>
            </li>
          ))}
          {hasSheet ? (
            <li>
              <a className="nav-link" href={`/characters/${characterId}/sheet`} target="_blank" rel="noreferrer">
                {t.characterNav.sheet}
              </a>
            </li>
          ) : null}
        </ul>
      </nav>
    </div>
  );
}
