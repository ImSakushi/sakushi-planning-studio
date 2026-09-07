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
  lives: [Live, Live];
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
export function drawPlanning(
  ctx: CanvasRenderingContext2D,
  p: Planning,
  bg: CanvasImageSource,
  covers: HTMLImageElement[],
  dialogue: CanvasImageSource,
) {
  ctx.clearRect(0, 0, 1280, 720);
  ctx.drawImage(bg, 0, 0, 1280, 720);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(dialogue, 351, 45, 578, 152);
  ctx.fillStyle = '#ffffff';
  ctx.font = '27px DeterminationMono';
  ctx.textAlign = 'center';
  ctx.fillText(p.subtitle, 651.5, 250, 1160);
  p.lives.forEach((l, i) => {
    const x = i ? 721 : 321;
    ctx.fillStyle = l.color;
    ctx.font = '32px DeterminationMono';
    ctx.fillText(
      `${l.day} - ${l.time.replace(':', 'h')}`,
      i ? 859.8 : 445.8,
      340.5,
      380,
    );
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
    p.lives.length === 2 &&
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
