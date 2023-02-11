/**
 * A deterministic tile for a menu item.
 *
 * The original card put the same watermarked stock photograph on every item,
 * which made a seven-item menu look like one item repeated. There are no real
 * product photographs to use, so instead each item gets a monogram on a colour
 * derived from its own name: stable across reloads, distinct between items and
 * nothing to license.
 */

const HUES = [20, 50, 95, 145, 190, 230, 275, 325];

/** A small, stable hash so the same name always gets the same colour. */
export function hueFor(name = '') {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) % 100000;
  }
  return HUES[hash % HUES.length];
}

/** The letters shown on the tile: initials for two words or more, else one letter. */
export function monogramFor(name = '') {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export default function ItemThumbnail({ name }) {
  const hue = hueFor(name);
  return (
    <div
      className="item-card__media"
      aria-hidden="true"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 42% 82%), hsl(${hue} 38% 66%))`,
      }}
    >
      <span className="item-card__monogram" style={{ color: `hsl(${hue} 45% 26%)` }}>
        {monogramFor(name)}
      </span>
    </div>
  );
}
