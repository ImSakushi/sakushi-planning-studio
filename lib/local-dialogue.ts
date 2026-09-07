import characters from './characters.json';
import bitmapFont from './bitmap-font.json';
import { cachedImage } from './assets';
const glyphs = bitmapFont['0'] as Record<string, number[]>;
export type DialogueLine = { text: string; asterisk: boolean };
export function wrapDialogue(text: string): DialogueLine[] {
  if (!text.trim() || text.length > 160)
    throw new Error('Écris un dialogue de 160 caractères maximum.');
  const lines: DialogueLine[] = [];
  for (const paragraph of text
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .split('\n')) {
    let line = '';
    let first = true;
    for (const word of paragraph
      .replace(/^\*\s?/, '')
      .trim()
      .split(/\s+/)) {
      if ([...word].length > 24)
        throw new Error('Un mot dépasse les 24 caractères de la boîte.');
      if (line && [...line].length + 1 + [...word].length > 24) {
        lines.push({ text: line, asterisk: first });
        first = false;
        line = word;
      } else line += (line ? ' ' : '') + word;
    }
    lines.push({ text: line, asterisk: first });
  }
  if (lines.length > 3)
    throw new Error(
      'Le dialogue dépasse les 3 lignes de la boîte. Raccourcis légèrement ton texte.',
    );
  return lines;
}
export function drawDialogue(
  ctx: CanvasRenderingContext2D,
  text: string,
  sprite: CanvasImageSource,
  atlas: CanvasImageSource,
) {
  const lines = wrapDialogue(text);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 578, 152);
  ctx.fillStyle = '#000000';
  ctx.fillRect(6, 6, 566, 140);
  // Same 67×70 portrait preview and pixel positions as the original generator.
  ctx.drawImage(sprite, 6, 6, 134, 140);
  function draw(line: string, x: number, baseline: number) {
    for (const char of line) {
      const [sx, sy, w, h, dx, dy, advance] = glyphs[char] || glyphs['?'];
      if (w && h)
        ctx.drawImage(
          atlas,
          sx,
          sy,
          w,
          h,
          x + dx * 2,
          baseline + dy * 2,
          w * 2,
          h * 2,
        );
      x += advance * 2;
    }
  }
  lines.forEach((line, i) => {
    const baseline = 46 + i * 36;
    if (line.asterisk) draw('*', 144, baseline);
    draw(line.text, 174, baseline);
  });
}
export async function renderDialogue(p: {
  text: string;
  character: string;
  expression: string;
}) {
  const character = characters.find((c) => c.id === p.character);
  if (!character?.expressions.some((e) => e.id === p.expression))
    throw new Error('Choisis un personnage et une expression valides.');
  wrapDialogue(p.text);
  const [sprite, atlas] = await Promise.all([
    cachedImage(`/sprites/${p.character}__${p.expression}.png`),
    cachedImage('/fonts/bitmap/0.png'),
  ]);
  const canvas = document.createElement('canvas');
  canvas.width = 578;
  canvas.height = 152;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Le dialogue ne peut pas être dessiné.');
  drawDialogue(ctx, p.text, sprite, atlas);
  return canvas.toDataURL('image/png');
}
