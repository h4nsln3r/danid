"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Characters" },
  { href: "/company", label: "All Characters" },
  { href: "/characters/new", label: "New Character" },
  { href: "/campaigns", label: "Campaigns" },
];

export function AppHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <span className="brand-mark" aria-hidden="true">
          ☾
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
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 759px)");
    const apply = () => setCompact(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open || !compact) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, compact]);

  return (
    <>
      <button
        type="button"
        className="menu-toggle"
        aria-expanded={open}
        aria-controls="primary-menu"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="menu-bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
      </button>
      <div className={open ? "menu-layer is-open" : "menu-layer"}>
        <button
          type="button"
          className="menu-scrim"
          aria-hidden={!(compact && open)}
          aria-label="Close menu"
          tabIndex={compact && open ? 0 : -1}
          onClick={() => setOpen(false)}
        />
        <nav
          id="primary-menu"
          aria-label="Primary"
          className="menu-panel"
          inert={compact && !open ? true : undefined}
        >
          <p className="menu-kicker">Companion</p>
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
      </div>
    </>
  );
}
