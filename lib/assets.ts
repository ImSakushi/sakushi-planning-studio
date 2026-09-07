export const assetUrl = (path: string) =>
  path.startsWith('/') ? `${import.meta.env.BASE_URL}${path.slice(1)}` : path;
const steamBase = (id: number) =>
  `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${id}/`;
export const steamThumbnail = (id: number) => `${steamBase(id)}header.jpg`;
export function displayImageUrl(src: string) {
  const legacy = /^\/api\/cover\?id=(\d+)$/.exec(src);
  return legacy
    ? `${steamBase(Number(legacy[1]))}library_600x900_2x.jpg`
    : assetUrl(src);
}
function rawImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    if (/^https?:/.test(src)) im.crossOrigin = 'anonymous';
    im.onload = () => resolve(im);
    im.onerror = () =>
      reject(
        new Error(
          'Cette image ne peut pas être chargée. Essaie une autre jaquette.',
        ),
      );
    im.src = src;
  });
}
export async function findSteamCover(id: number) {
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Jeu invalide.');
  for (const name of [
    'library_600x900_2x.jpg',
    'library_600x900.jpg',
    'header.jpg',
  ]) {
    const src = steamBase(id) + name;
    try {
      return { src, image: await rawImage(src) };
    } catch {
      /* Some games only provide a horizontal cover. */
    }
  }
  throw new Error(
    'Aucune jaquette disponible pour ce jeu. Tu peux importer une image.',
  );
}
export async function loadImage(src: string) {
  const legacy = /^\/api\/cover\?id=(\d+)$/.exec(src);
  return legacy
    ? (await findSteamCover(Number(legacy[1]))).image
    : rawImage(assetUrl(src));
}
const imageCache = new Map<string, Promise<HTMLImageElement>>();
export function cachedImage(src: string) {
  if (!imageCache.has(src)) {
    const p = loadImage(src).catch((e) => {
      imageCache.delete(src);
      throw e;
    });
    imageCache.set(src, p);
    if (imageCache.size > 24)
      imageCache.delete(imageCache.keys().next().value!);
  }
  return imageCache.get(src)!;
}
