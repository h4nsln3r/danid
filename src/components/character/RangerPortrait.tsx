import { useId } from "react";

export function RangerPortrait({ framed = true }: { framed?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const titleId = `${uid}-title`;
  const descId = `${uid}-desc`;
  const clipId = `${uid}-clip`;
  const skyId = `${uid}-sky`;
  const goldId = `${uid}-gold`;

  return (
    <svg
      viewBox={framed ? "0 0 400 520" : "145 155 110 125"}
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
      className="portrait-svg"
    >
      <title id={titleId}>Portrait of Mira Thorn</title>
      <desc id={descId}>
        A wood elf ranger in a green cloak, with a longbow beside her and a
        moonlit forest behind an arched gold frame.
      </desc>
      <defs>
        <clipPath id={clipId}>
          <path d="M58 496 V176 C58 86 342 86 342 176 V496 Z" />
        </clipPath>
        <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1d3d4a" />
          <stop offset="46%" stopColor="#2a5240" />
          <stop offset="100%" stopColor="#10160f" />
        </linearGradient>
        <linearGradient id={goldId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f6e4b8" />
          <stop offset="45%" stopColor="#b8893e" />
          <stop offset="100%" stopColor="#f3dfb2" />
        </linearGradient>
      </defs>

      {framed ? (
        <path
          d="M40 508 V168 C40 58 360 58 360 168 V508 Z"
          fill={`url(#${goldId})`}
        />
      ) : null}
      <g clipPath={`url(#${clipId})`}>
        <rect x="50" y="70" width="300" height="440" fill={`url(#${skyId})`} />
        <circle cx="286" cy="128" r="28" fill="#f3e6c4" />
        <circle cx="274" cy="120" r="24" fill="#1a3144" opacity="0.35" />
        <circle cx="96" cy="118" r="1.6" fill="#f4e7cb" />
        <circle cx="140" cy="96" r="1.3" fill="#f4e7cb" />
        <circle cx="210" cy="108" r="1.4" fill="#f4e7cb" />
        <path d="M70 390 L118 250 L166 390 Z" fill="#13261c" />
        <path d="M150 410 L214 230 L278 410 Z" fill="#101e16" />
        <path d="M246 386 L304 268 L356 386 Z" fill="#163024" />
        <ellipse cx="200" cy="470" rx="150" ry="36" fill="#1a140f" />

        <path
          d="M78 300 C78 250 108 236 118 300 C108 420 96 450 88 470"
          fill="none"
          stroke="#c9a36a"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M92 292 L104 308"
          stroke="#e6c98a"
          strokeWidth="2"
        />

        <path
          d="M118 292 C132 250 268 250 282 292 L304 470 L96 470 Z"
          fill="#1c4638"
        />
        <path
          d="M150 292 C164 214 236 214 250 292 C228 268 172 268 150 292 Z"
          fill="#14362c"
        />
        <path
          d="M168 214 C176 168 224 168 232 214 C214 196 186 196 168 214 Z"
          fill="#243024"
        />
        <ellipse cx="200" cy="228" rx="34" ry="40" fill="#c4845a" />
        <path d="M166 220 C158 232 160 252 172 246 C166 234 168 224 166 220 Z" fill="#b4744c" />
        <path d="M234 220 C246 232 244 254 228 246 C236 234 234 224 234 220 Z" fill="#d59a6c" />
        <path d="M170 214 C186 196 220 196 232 216 C214 204 186 204 170 214 Z" fill="#3c4a2c" />
        <ellipse cx="186" cy="228" rx="5" ry="3.2" fill="#f0d48a" />
        <ellipse cx="214" cy="228" rx="5" ry="3.2" fill="#f0d48a" />
        <circle cx="186" cy="228" r="1.5" fill="#1a120c" />
        <circle cx="214" cy="228" r="1.5" fill="#1a120c" />
        <path d="M196 236 L200 248 L194 248 Z" fill="#a86b45" />
        <path d="M190 258 Q200 264 210 258" fill="none" stroke="#8a4e34" strokeWidth="1.4" />
        <path d="M164 300 L236 300 L226 390 L174 390 Z" fill="#6a432c" />
        <path d="M188 300 L212 300 L206 348 L194 348 Z" fill="#8d5a38" />
        <circle cx="200" cy="286" r="6" fill="#e6c98a" />
        <path d="M250 330 L286 318 L292 360 L248 372 Z" fill="#5c3a28" />
      </g>
    </svg>
  );
}
