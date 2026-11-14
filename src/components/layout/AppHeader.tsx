"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Characters" },
  { href: "/characters/new", label: "New Character" },
  { href: "/campaigns", label: "Campaigns" },
];

export function AppHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <span className="brand-mark" aria-hidden="true">
          ◆
        </span>
        <span>
          <span className="brand-name">Companion</span>
          <span className="brand-sub">Fifth Edition</span>
        </span>
      </Link>
      <Suspense fallback={<span className="nav-fallback">Menu</span>}>
        <AppNav />
      </Suspense>
    </header>
  );
}

function AppNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary">
      <ul className="nav-list">
        {LINKS.map((link) => (
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
      </ul>
    </nav>
  );
}
