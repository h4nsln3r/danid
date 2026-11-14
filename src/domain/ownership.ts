export function canChangeCharacter(input: {
  sample: boolean;
  ownerId: string | null;
  playerId: string | null;
}): boolean {
  if (input.sample) {
    return true;
  }
  return input.ownerId !== null && input.playerId === input.ownerId;
}
