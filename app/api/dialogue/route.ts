import characters from '../../../lib/characters.json';
// Parameter encoding and generator endpoint adapted from ImSakushi/undertale-text-box-generator.
export async function POST(request: Request) {
  try {
    if (Number(request.headers.get('content-length') || 0) > 4096)
      return Response.json({ error: 'Dialogue trop long.' }, { status: 413 });
    const raw = await request.text();
    if (raw.length > 4096)
      return Response.json({ error: 'Dialogue trop long.' }, { status: 413 });
    const p = JSON.parse(raw);
    const c = characters.find((c) => c.id === p.character);
    if (
      !c ||
      !c.expressions.some((e) => e.id === p.expression) ||
      typeof p.text !== 'string' ||
      !p.text.trim() ||
      p.text.length > 160
    )
      return Response.json(
        { error: 'Choisis un personnage et écris un dialogue.' },
        { status: 400 },
      );
    // The upstream engine wraps at 22 monospaced characters with a portrait.
    const paragraphs = p.text.replace(/^\*\s?/gm, '').split('\n');
    let lineCount = 0;
    for (const paragraph of paragraphs) {
      let length = 0;
      lineCount++;
      for (const word of paragraph.trim().split(/\s+/)) {
        if (word.length > 22)
          return Response.json(
            {
              error:
                'Un mot est trop long pour la boîte (22 caractères maximum).',
            },
            { status: 400 },
          );
        if (length && length + 1 + word.length > 22) {
          lineCount++;
          length = word.length;
        } else length += (length ? 1 : 0) + word.length;
      }
    }
    if (lineCount > 3)
      return Response.json(
        {
          error:
            'Le dialogue dépasse les 3 lignes de la boîte. Raccourcis légèrement ton texte.',
        },
        { status: 400 },
      );

    const params = {
      style: 'regular',
      box: 'undertale',
      universe_group: c.universe,
      universe: c.universe,
      character: c.id,
      sprite: p.expression,
      asterisk: true,
      font: 'determination',
      text_transform: 'none',
      format: 'png',
      margin: false,
      size: 2,
      color: {
        sprite: 'ffffff',
        box: 'ffffff',
        asterisk: ['ffffff', 'ffffff', 'ffffff'],
        text: 'ffffff',
      },
      text: p.text.replace(/^\*\s?/gm, ''),
    };
    const form = new FormData();
    for (const [k, v] of Object.entries(params))
      form.append(k, JSON.stringify(v));
    const response = await fetch(
      'https://www.demirramon.com/ajax/undertale/textbox/generate',
      {
        method: 'POST',
        headers: {
          'x-requested-with': 'XMLHttpRequest',
          'x-post-encoded-as': 'JSON',
          'user-agent': 'Sakushi Planning Studio',
        },
        body: form,
        signal: AbortSignal.timeout(20000),
      },
    );
    const j = (await response.json()) as {
      data?: { image?: string; format?: string };
    };
    if (!response.ok || !j.data?.image || j.data.format !== 'png')
      throw new Error();
    return Response.json(
      { image: `data:image/png;base64,${j.data.image}` },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json(
      {
        error:
          'Le générateur Undertale ne répond pas. Ton planning est conservé ; réessaie dans un instant.',
      },
      { status: 502 },
    );
  }
}
