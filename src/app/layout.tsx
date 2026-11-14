import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Cinzel, Source_Serif_4 } from "next/font/google";
import { AppHeader } from "@/components/layout/AppHeader";
import { CharacterLibraryProvider } from "@/components/providers/CharacterLibraryProvider";
import { listCharacters } from "@/domain/characters";
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
      className={`${display.variable} ${body.variable} h-full`}
    >
      <body className="min-h-full">
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <CharacterLibraryProvider initialCharacters={listCharacters()}>
          <AppHeader />
          <div id="content">{children}</div>
          <footer className="site-footer">
            <p>
              Characters you create are saved on this computer. Equipment you
              change is restored when the page reloads. A picture of a character
              sheet is sent to Google Gemini only when you ask the app to read it.
            </p>
          </footer>
        </CharacterLibraryProvider>
      </body>
    </html>
  );
}
