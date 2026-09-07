export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q')?.trim() || '';
  if (q.length < 2 || q.length > 100)
    return Response.json(
      { error: 'Entre un nom de jeu de 2 à 100 caractères.' },
      { status: 400 },
    );
  try {
    const r = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q)}&l=french&cc=FR`,
      { signal: AbortSignal.timeout(10000) },
    );
    if (!r.ok) throw new Error();
    const data = (await r.json()) as {
      items?: { id: number; name: string; tiny_image: string }[];
    };
    return Response.json(
      {
        items: (data.items || [])
          .slice(0, 12)
          .map((g) => ({ id: g.id, name: g.name, thumbnail: g.tiny_image })),
      },
      { headers: { 'Cache-Control': 'private, max-age=300' } },
    );
  } catch {
    return Response.json(
      {
        error:
          'La recherche Steam est indisponible. Tu peux importer une jaquette.',
      },
      { status: 502 },
    );
  }
}
