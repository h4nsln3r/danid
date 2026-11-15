"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { setLocale } from "@/app/actions/locale";
import { useCopy, useLocale } from "@/components/providers/LocaleProvider";

export function AppHeader() {
  const t = useCopy();
  const locale = useLocale();
  const links = [
    { href: "/", label: t.nav.characters },
    { href: "/company", label: t.nav.company },
    { href: "/characters/new", label: t.nav.newCharacter },
    { href: "/campaigns", label: t.nav.campaigns },
  ];
  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <span className="brand-mark" aria-hidden="true">
          ☾
        </span>
        <span>
          <span className="brand-name">Companion</span>
          <span className="brand-sub">{t.brand}</span>
        </span>
      </Link>
      <form className="lang-switch" action={setLocale}>
        <span className="sr-only">{t.language}</span>
        <button
          type="submit"
          name="locale"
          value="sv"
          className={locale === "sv" ? "btn btn-primary" : "btn"}
          aria-pressed={locale === "sv"}
        >
          {t.swedish}
        </button>
        <button
          type="submit"
          name="locale"
          value="en"
          className={locale === "en" ? "btn btn-primary" : "btn"}
          aria-pressed={locale === "en"}
        >
          {t.english}
        </button>
      </form>
      <Suspense fallback={<span className="nav-fallback">{t.nav.menu}</span>}>
        <AppNav links={links} />
      </Suspense>
    </header>
  );
}

function AppNav({ links }: { links: Array<{ href: string; label: string }> }) {
  const t = useCopy();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  const [compact, setCompact] = useState(false);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const query = window.matchMedia("(max-width: 759px)");
    const apply = () => setCompact(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

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
        <span className="sr-only">{open ? t.nav.closeMenu : t.nav.openMenu}</span>
      </button>
      <div className={open ? "menu-layer is-open" : "menu-layer"}>
        <button
          type="button"
          className="menu-scrim"
          aria-hidden={!(compact && open)}
          aria-label={t.nav.closeMenu}
          tabIndex={compact && open ? 0 : -1}
          onClick={() => setOpen(false)}
        />
        <nav
          id="primary-menu"
          aria-label={t.nav.primary}
          className="menu-panel"
          inert={compact && !open ? true : undefined}
        >
          <p className="menu-kicker">Companion</p>
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
          </ul>
        </nav>
      </div>
    </>
  );
}
