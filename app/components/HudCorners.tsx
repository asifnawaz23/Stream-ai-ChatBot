/** Sci-fi HUD corner brackets for neon panels. */
export function HudCorners() {
  return (
    <>
      <span className="absolute -left-px -top-px h-3 w-3 rounded-tl-lg border-l-2 border-t-2 border-cyan-400/80" />
      <span className="absolute -right-px -top-px h-3 w-3 rounded-tr-lg border-r-2 border-t-2 border-cyan-400/80" />
      <span className="absolute -bottom-px -left-px h-3 w-3 rounded-bl-lg border-b-2 border-l-2 border-fuchsia-400/80" />
      <span className="absolute -bottom-px -right-px h-3 w-3 rounded-br-lg border-b-2 border-r-2 border-fuchsia-400/80" />
    </>
  );
}
