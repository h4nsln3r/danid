import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import { Cinzel, Source_Serif_4 } from "next/font/google";
import { AppHeader } from "@/components/layout/AppHeader";
import { CharacterLibraryProvider } from "@/components/providers/CharacterLibraryProvider";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { listCharacters } from "@/domain/characters";
import { copyFor } from "@/domain/copy";
import { currentLocale } from "@/server/locale";
import "./globals.css";

const display = Cinzel({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-cinzel",
  display: "swap",
});

const body = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Companion",
    template: "%s · Companion",
  },
  description: "A local companion for fifth edition D&D.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} h-full`}
    >
      <body className="min-h-full">
        <Suspense fallback={<ShellFallback />}>
          <LocalizedShell>{children}</LocalizedShell>
        </Suspense>
      </body>
    </html>
  );
}

function ShellFallback() {
  return (
    <>
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <div id="content">
        <p className="loading-line">Opening…</p>
      </div>
    </>
  );
}

async function LocalizedShell({ children }: { children: ReactNode }) {
  const locale = await currentLocale();
  const t = copyFor(locale);
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang=${JSON.stringify(locale)}`,
        }}
      />
      <a className="skip-link" href="#content">
        {t.skip}
      </a>
      <LocaleProvider locale={locale}>
        <CharacterLibraryProvider initialCharacters={listCharacters()}>
          <AppHeader />
          <div id="content">{children}</div>
          <footer className="site-footer">
            <p>{t.footer}</p>
          </footer>
        </CharacterLibraryProvider>
      </LocaleProvider>
    </>
  );
}
