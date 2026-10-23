import type { Character } from "@/domain/schema";

export function FeatureList({ character }: { character: Character }) {
  return (
    <section className="panel" aria-labelledby="features-heading">
      <h2 id="features-heading">Features</h2>
      <ul className="feature-list">
        {character.features.map((feature) => (
          <li key={feature.id}>
            <h3>
              {feature.name}
              <span className="feature-source">{feature.source}</span>
            </h3>
            <p>{feature.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
