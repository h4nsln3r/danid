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
  description: "Ett lokalt sällskap för D&D, femte utgåvan.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="sv"
      className={`${display.variable} ${body.variable} h-full`}
    >
      <body className="min-h-full">
        <a className="skip-link" href="#content">
          Hoppa till innehållet
        </a>
        <CharacterLibraryProvider initialCharacters={listCharacters()}>
          <AppHeader />
          <div id="content">{children}</div>
          <footer className="site-footer">
            <p>
              Karaktärer du skapar sparas på den här datorn. Utrustning du byter
              i foliet återställs när sidan laddas om. Bilden av ett pappersblad
              skickas till Google Gemini bara när du ber appen läsa det.
            </p>
          </footer>
        </CharacterLibraryProvider>
      </body>
    </html>
  );
}
