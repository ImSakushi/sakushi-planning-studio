import bitmapFont from './bitmap-font.json';

export type Live = {
  day: string;
  time: string;
  title: string;
  cover: string;
  zoom: number;
  x: number;
  y: number;
  color: string;
};
export type Planning = {
  subtitle: string;
  text: string;
  character: string;
  expression: string;
  lives: [Live, Live] | [Live, Live, Live];
};
export const thirdLive: Live = {
  day: 'Dimanche',
  time: '20:30',
  title: 'Undertale Yellow',
  cover: '/template/cover-third.png',
  zoom: 1,
  x: 50,
  y: 50,
  color: '#ffff00',
};
export const initial: Planning = {
  subtitle: "Alors effectivement, j'avais un peu oublié…",
  text: 'Il arrive un peu tard ton planning, non ?',
  character: 'deltarune-susie',
  expression: 'hidden-eyes',
  lives: [
    {
      day: 'Mardi',
      time: '20:30',
      title: 'Portal 2',
      cover: '/template/cover-left.png',
      zoom: 1,
      x: 50,
      y: 50,
      color: '#ffff00',
    },
    {
      day: 'Vendredi',
      time: '20:30',
      title: 'Outer Wilds - Echoes of the Eye',
      cover: '/template/cover-right.png',
      zoom: 1,
      x: 50,
      y: 50,
      color: '#ffff00',
    },
  ],
};
export const dialogueKey = (p: Planning) =>
  JSON.stringify([p.text, p.character, p.expression]);
export function coverRect(
  iw: number,
  ih: number,
  w: number,
  h: number,
  zoom: number,
  x: number,
  y: number,
) {
  const scale = Math.max(w / iw, h / ih) * zoom;
  return {
    w: iw * scale,
    h: ih * scale,
    x: (-(iw * scale - w) * x) / 100,
    y: (-(ih * scale - h) * y) / 100,
  };
}
// Pre-rasterized regular glyphs: no browser font hinting, threshold, or faux bold.
const fontMetrics = bitmapFont as Record<string, Record<string, number[]>>;
export type BitmapFonts = Record<number, CanvasImageSource>;
const glyphsFor = (size: number) => fontMetrics[String(size)];
const cleanText = (text: string) =>
  text.normalize('NFC').replace(/[\r\n\t]/g, ' ');
export function bitmapTextWidth(text: string, size: number) {
  const glyphs = glyphsFor(size);
  return [...cleanText(text)].reduce(
    (width, char) => width + (glyphs[char] || glyphs['?'])[6],
    0,
  );
}
export function fittedFontSize(text: string, size: number, maxWidth: number) {
  while (size > 12 && bitmapTextWidth(text, size) > maxWidth) size--;
  return size;
}
export function subtitleLayout(subtitle: string) {
  const lines = subtitle.normalize('NFC').replace(/\r\n?/g, '\n').split('\n');
  const preferredSize = lines.length >= 3 ? 24 : 27;
  const size = Math.min(
    ...lines.map((line) => fittedFontSize(line, preferredSize, 1160)),
  );
  const firstBaseline =
    lines.length === 1 ? 250 : lines.length === 2 ? 236 : 233;
  const lineHeight = lines.length >= 3 ? 28 : 32;
  return { lines, size, firstBaseline, lineHeight };
}
export function planningFontSizes(p: Planning) {
  return [0, subtitleLayout(p.subtitle).size];
}
export function drawPixelText(
  layer: CanvasRenderingContext2D,
  text: string,
  size: number,
  centerX: number,
  baselineY: number,
  maxWidth: number,
  color: string,
  fonts: BitmapFonts,
  pixelScale = 1,
) {
  layer.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
  if (size !== 0) size = fittedFontSize(text, size, maxWidth);
  const glyphs = glyphsFor(size);
  const atlas = fonts[size];
  if (!atlas) throw new Error('La police pixel n’est pas encore chargée.');
  const left =
    Math.round(
      (centerX - (bitmapTextWidth(text, size) * pixelScale) / 2) / pixelScale,
    ) * pixelScale;
  const baseline = Math.round(baselineY / pixelScale) * pixelScale;
  let pen = 0;
  layer.save();
  layer.imageSmoothingEnabled = false;
  for (const char of cleanText(text)) {
    const [sx, sy, w, h, dx, dy, advance] = glyphs[char] || glyphs['?'];
    if (w && h)
      layer.drawImage(
        atlas,
        sx,
        sy,
        w,
        h,
        left + Math.round(pen + dx) * pixelScale,
        baseline + dy * pixelScale,
        w * pixelScale,
        h * pixelScale,
      );
    pen += advance;
  }
  layer.globalCompositeOperation = 'source-in';
  layer.fillStyle = color;
  layer.fillRect(0, 0, layer.canvas.width, layer.canvas.height);
  layer.restore();
}

export function drawPlanning(
  ctx: CanvasRenderingContext2D,
  p: Planning,
  bg: CanvasImageSource,
  covers: HTMLImageElement[],
  dialogue: CanvasImageSource,
  textLayer: CanvasRenderingContext2D,
  fonts: BitmapFonts,
) {
  ctx.clearRect(0, 0, 1280, 720);
  ctx.drawImage(bg, 0, 0, 1280, 720);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(dialogue, 351, 45, 578, 152);
  const response = subtitleLayout(p.subtitle);
  if (response.lines.length > 3)
    throw new Error(
      'La réponse peut contenir jusqu’à 3 lignes. Retire un saut de ligne pour exporter.',
    );
  response.lines.forEach((line, index) => {
    drawPixelText(
      textLayer,
      line,
      response.size,
      651.5,
      response.firstBaseline + index * response.lineHeight,
      1160,
      '#ffffff',
      fonts,
    );
    ctx.drawImage(textLayer.canvas, 0, 0);
  });
  p.lives.forEach((l, i) => {
    // Frame positions measured from the two supplied PSDs, at native size.
    const x = (p.lives.length === 3 ? [140, 528, 913] : [321, 721])[i];
    const centerX = (
      p.lives.length === 3 ? [269.8, 658.8, 1043.8] : [445.8, 859.8]
    )[i];
    drawPixelText(
      textLayer,
      `${l.day} - ${l.time.replace(':', 'h')}`,
      0,
      centerX,
      340.5,
      380,
      l.color,
      fonts,
      2,
    );
    ctx.drawImage(textLayer.canvas, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, 357, 260, 344);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 5, 362, 250, 334);
    ctx.clip();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const im = covers[i];
    const r = coverRect(
      im.naturalWidth || im.width,
      im.naturalHeight || im.height,
      250,
      334,
      l.zoom,
      l.x,
      l.y,
    );
    ctx.drawImage(im, x + 5 + r.x, 362 + r.y, r.w, r.h);
    ctx.restore();
  });
}
export function validPlanning(v: unknown): v is Planning {
  if (!v || typeof v !== 'object') return false;
  const p = v as Planning;
  return (
    typeof p.subtitle === 'string' &&
    p.subtitle.length <= 100 &&
    typeof p.text === 'string' &&
    p.text.length <= 160 &&
    typeof p.character === 'string' &&
    typeof p.expression === 'string' &&
    Array.isArray(p.lives) &&
    (p.lives.length === 2 || p.lives.length === 3) &&
    p.lives.every(
      (l) =>
        l &&
        typeof l.title === 'string' &&
        l.title.length <= 200 &&
        [
          'Lundi',
          'Mardi',
          'Mercredi',
          'Jeudi',
          'Vendredi',
          'Samedi',
          'Dimanche',
        ].includes(l.day) &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(l.time) &&
        typeof l.cover === 'string' &&
        (l.cover.startsWith('/template/') ||
          /^https:\/\/shared\.akamai\.steamstatic\.com\/store_item_assets\/steam\/apps\/\d+\/(library_600x900(?:_2x)?|header)\.jpg$/.test(
            l.cover,
          ) ||
          /^\/api\/cover\?id=\d+$/.test(l.cover) ||
          /^data:image\/(png|jpeg|webp);base64,/.test(l.cover)) &&
        /^#[\da-f]{6}$/i.test(l.color) &&
        [l.zoom, l.x, l.y].every(Number.isFinite) &&
        l.zoom >= 1 &&
        l.zoom <= 3 &&
        l.x >= 0 &&
        l.x <= 100 &&
        l.y >= 0 &&
        l.y <= 100,
    )
  );
}
