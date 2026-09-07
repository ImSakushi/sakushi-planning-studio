'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Download,
  CalendarDays,
  MessageSquare,
  ImagePlus,
  Search,
  Check,
  ChevronDown,
  ArrowUpRight,
  Upload,
  Heart,
  RotateCcw,
  Share2,
} from 'lucide-react';
import characters from '../lib/characters.json';
import {
  initial,
  drawPlanning,
  dialogueKey,
  validPlanning,
  type Planning,
  type Live,
} from '../lib/planning';
const days = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
];
const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error('Une image ne peut pas être chargée.'));
    im.src = src;
  });
const imageCache = new Map<string, Promise<HTMLImageElement>>();
function cachedImage(src: string) {
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
function download(blob: Blob, name: string) {
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export default function Home() {
  const [p, setP] = useState<Planning>(initial);
  const [tab, setTab] = useState<'lives' | 'dialogue'>('lives');
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState('');
  const [notice, setNotice] = useState('');
  const [renderError, setRenderError] = useState('');
  const [rendered, setRendered] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [retry, setRetry] = useState(0);
  const [dialogue, setDialogue] = useState({
    key: dialogueKey(initial),
    src: '/template/dialogue-original.png',
  });
  const [exporting, setExporting] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const key = dialogueKey(p);
  const currentDialogue = dialogue.key === key;
  const canExport = rendered && currentDialogue && !generating && !renderError;
  useEffect(() => {
    try {
      const value = localStorage.getItem('sakushi-planning-v1');
      if (value) {
        const parsed = JSON.parse(value);
        if (validPlanning(parsed)) setP(parsed);
      }
    } catch {
      setSaved('Sauvegarde locale indisponible');
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    setRendered(false);
    const t = setTimeout(() => {
      try {
        localStorage.setItem('sakushi-planning-v1', JSON.stringify(p));
        setSaved('Enregistré sur cet appareil');
      } catch {
        setSaved('Sauvegarde pleine : télécharge ton projet');
      }
    }, 400);
    return () => clearTimeout(t);
  }, [p, ready]);
  useEffect(() => {
    if (!ready) return;
    if (key === dialogue.key) {
      setGenerating(false);
      setGenError('');
      return;
    }
    if (key === dialogueKey(initial)) {
      setDialogue({ key, src: '/template/dialogue-original.png' });
      setGenError('');
      setGenerating(false);
      return;
    }
    const c = new AbortController();
    setGenerating(true);
    setGenError('');
    const t = setTimeout(async () => {
      try {
        const r = await fetch('/api/dialogue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: p.text,
            character: p.character,
            expression: p.expression,
          }),
          signal: c.signal,
        });
        const j = (await r.json()) as { error?: string; image: string };
        if (!r.ok)
          throw new Error(j.error || 'Le générateur est indisponible.');
        setDialogue({ key, src: j.image });
      } catch (e) {
        if (!c.signal.aborted)
          setGenError(e instanceof Error ? e.message : 'Erreur du générateur.');
      } finally {
        if (!c.signal.aborted) setGenerating(false);
      }
    }, 650);
    return () => {
      clearTimeout(t);
      c.abort();
    };
  }, [key, retry, ready, dialogue.key, p.text, p.character, p.expression]);
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setRendered(false);
    setRenderError('');
    Promise.all([
      document.fonts.load('32px DeterminationMono'),
      cachedImage('/template/background.png'),
      cachedImage(p.lives[0].cover),
      cachedImage(p.lives[1].cover),
      cachedImage(dialogue.src),
    ])
      .then(([, bg, a, b, d]) => {
        if (cancelled || !canvas.current) return;
        const ctx = canvas.current.getContext('2d');
        if (!ctx)
          throw new Error('Le navigateur ne peut pas créer cette image.');
        drawPlanning(ctx, p, bg, [a, b], d);
        setRendered(true);
      })
      .catch((e) => {
        if (!cancelled) setRenderError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [p, dialogue, ready]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 6000);
    return () => clearTimeout(t);
  }, [notice]);
  function changeLive(v: Partial<Live>) {
    setRendered(false);
    setP((q) => ({
      ...q,
      lives: q.lives.map((l, i) => (i === active ? { ...l, ...v } : l)) as [
        Live,
        Live,
      ],
    }));
  }
  async function exportPng(share = false) {
    if (!canvas.current || !canExport) return;
    setExporting(true);
    try {
      const blob = await new Promise<Blob>((res, rej) =>
        canvas.current!.toBlob(
          (b) => (b ? res(b) : rej(new Error('Export impossible.'))),
          'image/png',
        ),
      );
      const file = new File([blob], 'planning-sakushi.png', {
        type: 'image/png',
      });
      if (share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Mon planning' });
      } else download(blob, 'planning-sakushi.png');
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError'))
        setNotice('Impossible d’exporter l’image. Réessaie.');
    } finally {
      setExporting(false);
    }
  }
  async function importProject(file?: File) {
    if (!file) return;
    try {
      if (file.size > 8e6) throw new Error();
      const data = JSON.parse(await file.text());
      if (!validPlanning(data)) throw new Error();
      setP(data);
      setNotice('Projet ouvert.');
    } catch {
      setNotice('Ce fichier n’est pas un projet de planning valide.');
    }
  }
  const live = p.lives[active];
  const char = characters.find((c) => c.id === p.character) || characters[0];
  return (
    <main>
      <header className="topbar">
        <a className="brand" href="/" aria-label="Planning Studio">
          <span className="brand-icon">
            <CalendarDays size={23} />
          </span>
          <span>
            planning<span className="brand-light"> studio</span>
            <small>SAKUSHI</small>
          </span>
        </a>
        <div className="top-actions">
          <span className="save-status">
            <Check size={14} />
            {saved || 'Ton espace de création'}
          </span>
          <button
            className="export"
            onClick={() => exportPng()}
            disabled={!canExport || exporting}
          >
            <Download size={17} />
            <span>{exporting ? 'Export…' : 'Exporter le PNG'}</span>
          </button>
        </div>
      </header>
      <div className="workspace-heading">
        <div>
          <div className="eyebrow">
            <span className="green-dot" /> PRÊT POUR LE PROCHAIN LIVE
          </div>
          <h1>
            Ton planning, à ta façon<span>.</span>
          </h1>
        </div>
        <span className="format-pill">
          2 lives <span>·</span> 1280 × 720
        </span>
      </div>
      <div className="workspace">
        <aside className="editor">
          <div
            className="tabs"
            role="tablist"
            aria-label="Éléments du planning"
          >
            <button
              role="tab"
              aria-selected={tab === 'lives'}
              className={tab === 'lives' ? 'selected' : ''}
              onClick={() => setTab('lives')}
            >
              <CalendarDays size={16} />
              Les lives
            </button>
            <button
              role="tab"
              aria-selected={tab === 'dialogue'}
              className={tab === 'dialogue' ? 'selected' : ''}
              onClick={() => setTab('dialogue')}
            >
              <MessageSquare size={16} />
              Le dialogue
            </button>
          </div>
          {tab === 'lives' ? (
            <div className="panel">
              <div className="section-label">TES DEUX RENDEZ-VOUS</div>
              <div className="live-picker">
                {p.lives.map((l, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={i === active ? 'active' : ''}
                  >
                    <span className="live-number">0{i + 1}</span>
                    <span>
                      <strong>{l.day}</strong>
                      <small>{l.time.replace(':', 'h')}</small>
                    </span>
                    <span className="selection-dot" />
                  </button>
                ))}
              </div>
              <div className="divider" />
              <div className="section-title">
                <h2>Live 0{active + 1}</h2>
                <span className="tiny-label">À L’AFFICHE</span>
              </div>
              <div className="fields-row">
                <label>
                  Jour
                  <select
                    value={live.day}
                    onChange={(e) => changeLive({ day: e.target.value })}
                  >
                    {days.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Heure
                  <input
                    type="time"
                    value={live.time}
                    onChange={(e) => {
                      if (e.target.value) changeLive({ time: e.target.value });
                    }}
                  />
                </label>
              </div>
              <GameSearch
                key={active}
                value={live.title}
                onSelect={(v) => changeLive(v)}
                onNotice={setNotice}
              />
              <div className="cover-editor">
                <img
                  src={live.cover}
                  alt={`Jaquette de ${live.title}`}
                  style={{ objectPosition: `${live.x}% ${live.y}%` }}
                />
                <div>
                  <strong>{live.title}</strong>
                  <small>Recadrage au format du planning</small>
                  <label className="upload-button">
                    <ImagePlus size={15} />
                    Importer une image
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          if (file.size > 15e6) throw new Error();
                          const url = URL.createObjectURL(file);
                          try {
                            const im = await loadImage(url);
                            const c = document.createElement('canvas');
                            const scale = Math.min(
                              1,
                              1200 / Math.max(im.width, im.height),
                            );
                            c.width = Math.round(im.width * scale);
                            c.height = Math.round(im.height * scale);
                            c.getContext('2d')!.drawImage(
                              im,
                              0,
                              0,
                              c.width,
                              c.height,
                            );
                            changeLive({
                              cover: c.toDataURL('image/jpeg', 0.92),
                              zoom: 1,
                              x: 50,
                              y: 50,
                            });
                          } finally {
                            URL.revokeObjectURL(url);
                          }
                        } catch {
                          setNotice(
                            'Choisis une image PNG, JPG ou WebP de moins de 15 Mo.',
                          );
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              </div>
              <details className="crop">
                <summary>
                  Ajuster le cadrage <ChevronDown size={15} />
                </summary>
                <label>
                  Zoom <span>{live.zoom.toFixed(1)}×</span>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step=".05"
                    value={live.zoom}
                    onChange={(e) =>
                      changeLive({ zoom: Number(e.target.value) })
                    }
                  />
                </label>
                <label>
                  Position horizontale
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={live.x}
                    onChange={(e) => changeLive({ x: Number(e.target.value) })}
                  />
                </label>
                <label>
                  Position verticale
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={live.y}
                    onChange={(e) => changeLive({ y: Number(e.target.value) })}
                  />
                </label>
                <button
                  className="text-button"
                  onClick={() => changeLive({ zoom: 1, x: 50, y: 50 })}
                >
                  <RotateCcw size={13} />
                  Recentrer
                </button>
              </details>
              <label className="color-field">
                Couleur de l’horaire
                <input
                  type="color"
                  value={live.color}
                  onChange={(e) => changeLive({ color: e.target.value })}
                />
              </label>
            </div>
          ) : (
            <div className="panel">
              <div className="section-label">UNE PETITE CONVERSATION</div>
              <label>
                Personnage
                <select
                  value={p.character}
                  onChange={(e) => {
                    const c = characters.find((c) => c.id === e.target.value)!;
                    setP({
                      ...p,
                      character: c.id,
                      expression: c.expressions[0].id,
                    });
                  }}
                >
                  {['undertale', 'deltarune'].map((u) => (
                    <optgroup
                      key={u}
                      label={u === 'undertale' ? 'Undertale' : 'Deltarune'}
                    >
                      {characters
                        .filter((c) => c.universe === u)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <label>
                Expression
                <select
                  value={p.expression}
                  onChange={(e) => setP({ ...p, expression: e.target.value })}
                >
                  {char.expressions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Dans la boîte
                <textarea
                  rows={4}
                  maxLength={160}
                  value={p.text}
                  onChange={(e) => setP({ ...p, text: e.target.value })}
                />
              </label>
              <p className="help">
                L’astérisque est ajouté automatiquement. Le texte revient
                automatiquement à la ligne. La boîte contient 3 lignes.
              </p>
              <label>
                Ta réponse, sous le dialogue
                <textarea
                  rows={3}
                  maxLength={100}
                  value={p.subtitle}
                  onChange={(e) => setP({ ...p, subtitle: e.target.value })}
                />
              </label>
              <div className="engine-note">
                <Heart size={15} />
                <span>
                  Personnages et rendu du{' '}
                  <a
                    href="https://github.com/ImSakushi/undertale-text-box-generator"
                    target="_blank"
                    rel="noreferrer"
                  >
                    générateur Undertale <ArrowUpRight size={11} />
                  </a>
                </span>
              </div>
            </div>
          )}
          <div className="project-actions">
            <button
              onClick={() =>
                download(
                  new Blob([JSON.stringify(p, null, 2)], {
                    type: 'application/json',
                  }),
                  'mon-planning.json',
                )
              }
            >
              <Download size={14} />
              Sauver le projet
            </button>
            <button onClick={() => importRef.current?.click()}>
              <Upload size={14} />
              Ouvrir
            </button>
            <input
              ref={importRef}
              hidden
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                importProject(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </div>
        </aside>
        <section className="preview-panel" aria-label="Aperçu du planning">
          <div className="preview-heading">
            <span>
              <span className="green-dot" /> APERÇU DU PLANNING
            </span>
            <span className="preview-size">16:9</span>
          </div>
          <div className="canvas-surround">
            <div className="canvas-frame">
              <canvas
                ref={canvas}
                width={1280}
                height={720}
                role="img"
                aria-label={`Planning : ${p.lives.map((l) => `${l.day} à ${l.time}, ${l.title}`).join(' ; ')}. Dialogue : ${p.text}. ${p.subtitle}`}
              />
              {!ready && <div className="loading">Chargement du planning…</div>}
            </div>
          </div>
          <div className="preview-caption">
            <span>
              <Check size={15} />
              Format et fond du PSD original
            </span>
            <span>PNG · 1280 × 720</span>
          </div>
          {(generating || !currentDialogue) && !genError && (
            <p className="status" role="status">
              Mise à jour du dialogue…
            </p>
          )}
          {genError && (
            <div className="error" role="alert">
              {genError}{' '}
              <button onClick={() => setRetry((n) => n + 1)}>Réessayer</button>
            </div>
          )}
          {renderError && (
            <p className="error" role="alert">
              {renderError} Sélectionne une autre jaquette.
            </p>
          )}
          <div className="preview-bottom">
            <div>
              <span className="pixel-star">✦</span>
              <div>
                <strong>La semaine est à toi.</strong>
                <p>Deux jeux, un dialogue, et rendez-vous en live.</p>
              </div>
            </div>
            <button
              className="share-button"
              disabled={!canExport || exporting}
              onClick={() => exportPng(true)}
            >
              <Share2 size={16} />
              Partager l’image
            </button>
          </div>
          <p className="device-note">
            Le brouillon reste sur cet appareil. « Sauver le projet » permet de
            le reprendre ailleurs.
          </p>
        </section>
      </div>
      <footer>
        <span>FAIT POUR TES RENDEZ-VOUS EN LIVE</span>
        <span className="footer-heart">
          ♥ <span>Reste déterminé.</span>
        </span>
      </footer>
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </main>
  );
}
function GameSearch({
  value,
  onSelect,
  onNotice,
}: {
  value: string;
  onSelect: (v: Partial<Live>) => void;
  onNotice: (v: string) => void;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<
    { id: number; name: string; thumbnail: string }[]
  >([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const seq = useRef(0);
  useEffect(() => {
    const c = new AbortController();
    if (q.trim().length < 2) {
      setResults([]);
      setBusy(false);
      return;
    }
    setBusy(true);
    setError('');
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/games?q=${encodeURIComponent(q.trim())}`, {
          signal: c.signal,
        });
        const j = (await r.json()) as {
          error?: string;
          items: { id: number; name: string; thumbnail: string }[];
        };
        if (!r.ok) throw new Error(j.error || 'Recherche indisponible.');
        setResults(j.items);
      } catch (e) {
        if (!c.signal.aborted)
          setError(e instanceof Error ? e.message : 'Recherche indisponible.');
      } finally {
        if (!c.signal.aborted) setBusy(false);
      }
    }, 350);
    return () => {
      clearTimeout(t);
      c.abort();
    };
  }, [q]);
  useEffect(
    () => () => {
      seq.current++;
    },
    [],
  );
  async function select(g: { id: number; name: string }) {
    const n = ++seq.current;
    setChoosing(true);
    try {
      const cover = `/api/cover?id=${g.id}`;
      await cachedImage(cover);
      if (n !== seq.current) return;
      onSelect({ title: g.name, cover, zoom: 1, x: 50, y: 50 });
      setQ('');
      setOpen(false);
    } catch {
      if (n === seq.current)
        onNotice(
          'Aucune jaquette disponible pour ce jeu. Tu peux importer une image.',
        );
    } finally {
      if (n === seq.current) setChoosing(false);
    }
  }
  return (
    <div className="game-search">
      <label htmlFor="game">Chercher un jeu</label>
      <div className="search-input">
        <Search size={17} />
        <input
          id="game"
          placeholder={value || 'Nom du jeu…'}
          value={q}
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
          }}
        />
      </div>
      <p className="help">Jaquettes Steam, recadrées automatiquement.</p>
      {open && q.trim().length >= 2 && (
        <div className="search-results" aria-label="Résultats de recherche">
          {busy ? (
            <p>Recherche en cours…</p>
          ) : error ? (
            <p role="alert">{error}</p>
          ) : results.length ? (
            results.map((g) => (
              <button key={g.id} disabled={choosing} onClick={() => select(g)}>
                <img src={g.thumbnail} alt="" />
                <span>{g.name}</span>
                <ImagePlus size={16} />
              </button>
            ))
          ) : (
            <p>Aucun jeu trouvé. Essaie un autre nom ou importe ta jaquette.</p>
          )}
          {choosing && <p>Chargement de la jaquette…</p>}
          <button className="close-results" onClick={() => setOpen(false)}>
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}
