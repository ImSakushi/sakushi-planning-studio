import { assetUrl, steamThumbnail } from './assets';
type Game = [number, string];
type IndexedGame = { id: number; name: string; key: string };
const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
let catalogue: Promise<IndexedGame[]> | undefined;
async function loadCatalogue() {
  catalogue ??= fetch(assetUrl('/data/games.json'))
    .then(async (r) => {
      if (!r.ok)
        throw new Error('Le catalogue des jeux ne peut pas être chargé.');
      const games = (await r.json()) as Game[];
      return games.map(([id, name]) => ({ id, name, key: normalize(name) }));
    })
    .catch((e) => {
      catalogue = undefined;
      throw e;
    });
  return catalogue;
}
export async function searchGames(query: string, signal?: AbortSignal) {
  const q = normalize(query);
  if (q.length < 2) return [];
  const games = await loadCatalogue();
  if (signal?.aborted) throw new DOMException('Annulé', 'AbortError');
  const tokens = q.split(' ');
  const results: { game: IndexedGame; score: number }[] = [];
  for (const game of games) {
    if (!tokens.every((t) => game.key.includes(t))) continue;
    const score =
      (game.key === q
        ? 0
        : game.key.startsWith(q)
          ? 100
          : game.key.includes(q)
            ? 200
            : 300) + Math.min(game.key.length - q.length, 90);
    const pos = results.findIndex((r) => score < r.score);
    if (pos >= 0) results.splice(pos, 0, { game, score });
    else if (results.length < 12) results.push({ game, score });
    if (results.length > 12) results.pop();
  }
  return results.map(({ game }) => ({
    id: game.id,
    name: game.name,
    thumbnail: steamThumbnail(game.id),
  }));
}
