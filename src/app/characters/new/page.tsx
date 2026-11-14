import { Suspense } from "react";
import { redirect } from "next/navigation";
import { CreateCharacterForm } from "@/components/character/CreateCharacterForm";
import { currentPlayer } from "@/server/players";

export default function NewCharacterPage() {
  return (
    <main className="page">
      <Suspense fallback={<p className="loading-line">Opening the form…</p>}>
        <NewCharacterGate />
      </Suspense>
    </main>
  );
}

async function NewCharacterGate() {
  const player = await currentPlayer();
  if (!player) {
    redirect("/");
  }
  return <CreateCharacterForm playerName={player.name} />;
}
