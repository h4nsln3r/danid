"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function CharacterNav({
  characterId,
  name,
  hasSheet = false,
}: {
  characterId: string;
  name: string;
  hasSheet?: boolean;
}) {
  const pathname = usePathname();
  const overview = `/characters/${characterId}`;
  const pack = `${overview}/inventory`;
  const links = [
    { href: overview, label: "Character" },
    { href: pack, label: "Equipment" },
  ];

  return (
    <div className="character-nav">
      <p className="character-nav-name">{name}</p>
      <nav aria-label={`${name} sections`}>
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
                Character Sheet
              </a>
            </li>
          ) : null}
        </ul>
      </nav>
    </div>
  );
}
