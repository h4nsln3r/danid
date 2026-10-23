/** Average hit points from the 2014 Player's Handbook, with a minimum of 1 per level. */
export function averageHitPoints(
  level: number,
  hitDie: number,
  constitutionModifier: number,
): number {
  if (!Number.isInteger(level) || level < 1 || level > 20) {
    throw new Error(`Level ${level} is outside 1–20.`);
  }
  if (!Number.isInteger(hitDie) || hitDie < 4 || hitDie > 12) {
    throw new Error(`Hit die ${hitDie} is not supported.`);
  }

  const gain = (die: number) => Math.max(1, die + constitutionModifier);
  const averageDie = Math.floor(hitDie / 2) + 1;
  let total = gain(hitDie);
  for (let index = 1; index < level; index += 1) {
    total += gain(averageDie);
  }
  return total;
}
