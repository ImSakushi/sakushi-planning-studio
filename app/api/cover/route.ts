export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!/^\d{1,10}$/.test(id))
    return new Response('Identifiant invalide', { status: 400 });
  const base = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${id}/`;
  // Fixed Steam hosts and paths only: this endpoint is never an arbitrary URL proxy.
  const urls = [base + 'library_600x900_2x.jpg', base + 'library_600x900.jpg'];
  try {
    for (const url of urls) {
      const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (r.ok && r.headers.get('content-type')?.startsWith('image/'))
        return new Response(r.body, {
          headers: {
            'Content-Type': r.headers.get('content-type')!,
            'Cache-Control': 'public, max-age=86400',
            'X-Content-Type-Options': 'nosniff',
          },
        });
    }
    // New Steam assets may live below a hashed directory, found from store metadata.
    const info = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${id}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (info.ok) {
      const j = (await info.json()) as Record<
        string,
        { data?: { header_image?: string } }
      >;
      const h = j[id]?.data?.header_image;
      if (h) {
        const u = new URL(h);
        if (
          [
            'shared.akamai.steamstatic.com',
            'cdn.akamai.steamstatic.com',
            'cdn.cloudflare.steamstatic.com',
          ].includes(u.hostname) &&
          u.protocol === 'https:'
        ) {
          const r = await fetch(u, { signal: AbortSignal.timeout(8000) });
          if (r.ok && r.headers.get('content-type')?.startsWith('image/'))
            return new Response(r.body, {
              headers: {
                'Content-Type': r.headers.get('content-type')!,
                'Cache-Control': 'public, max-age=86400',
                'X-Content-Type-Options': 'nosniff',
              },
            });
        }
      }
    }
  } catch {}
  return Response.json(
    { error: 'Jaquette indisponible. Importe une image.' },
    { status: 404 },
  );
}
