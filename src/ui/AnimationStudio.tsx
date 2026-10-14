import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AnimationDocument } from '../engine/types';
import { DEFAULT_DOCUMENT } from '../engine/types';
import { eclipseDemo, tapewormDemo } from '../engine/examples';
import { prepareSvgAssets, renderFrame, type ImageAssets } from '../engine/render';
import { validateAnimation } from '../engine/validate';
import { getExportDuration, getExportFrameCount, SPEEDS } from '../engine/timeline';
import { checkMp4Support, exportMp4, makeSafeFileName } from '../export/mp4';

const demos = [
  { id: 'eclipse', label: 'Éclipse solaire · 20 s', doc: eclipseDemo },
  { id: 'tapeworm', label: 'Cycle du ténia · 30 s', doc: tapewormDemo }
];
const RESOLUTIONS = { '1080p': [1920, 1080], '720p': [1280, 720] } as const;
const fmt = (time: number) => {
  const t = Math.max(0, time); const minutes = Math.floor(t / 60); const seconds = Math.floor(t % 60); const centiseconds = Math.floor((t % 1) * 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${centiseconds}`;
};
const defaultAssets: ImageAssets = {};

export default function AnimationStudio() {
  const [animation, setAnimation] = useState<AnimationDocument>(DEFAULT_DOCUMENT);
  const [sourceName, setSourceName] = useState('Nouvelle animation');
  const [playhead, setPlayhead] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [resolution, setResolution] = useState<keyof typeof RESOLUTIONS>('1080p');
  const [outputName, setOutputName] = useState('animation_science');
  const [isPlaying, setIsPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Prêt à importer une animation.');
  const [error, setError] = useState('');
  const [support, setSupport] = useState<{ supported: boolean; message: string } | null>(null);
  const [assets, setAssets] = useState<ImageAssets>(defaultAssets);
  const [assetNames, setAssetNames] = useState<string[]>([]);
  const [svgRevision, setSvgRevision] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cancelRef = useRef(false);
  const urlsRef = useRef<string[]>([]);
  const duration = animation.duration;
  const [outWidth, outHeight] = RESOLUTIONS[resolution];
  const totalOutput = getExportDuration(animation, speed);
  const totalFrames = getExportFrameCount(animation, speed);
  const currentFileName = useMemo(() => makeSafeFileName(outputName || sourceName), [outputName, sourceName]);

  const setDocument = useCallback((doc: AnimationDocument, name: string) => {
    setAnimation(doc); setSourceName(name); setOutputName(name.replace(/\.json$/i, '').replace(/\s+/g, '_'));
    setPlayhead(0); setIsPlaying(false); setProgress(0); setError('');
    setStatus(`Animation chargée : ${doc.name}`);
  }, []);

  useEffect(() => {
    let alive = true;
    setSupport(null);
    checkMp4Support(outWidth, outHeight).then((result) => { if (alive) setSupport(result); });
    return () => { alive = false; };
  }, [outWidth, outHeight]);

  useEffect(() => {
    let cancelled = false; let dispose = () => {};
    prepareSvgAssets(animation.objects, assets).then((cleanup) => {
      if (cancelled) cleanup(); else { dispose = cleanup; setSvgRevision((v) => v + 1); }
    }).catch((e) => setError(e instanceof Error ? `SVG invalide : ${e.message}` : 'Impossible de charger le SVG.'));
    return () => { cancelled = true; dispose(); };
  }, [animation.objects, assets]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || busy) return;
    renderFrame(canvas, animation, playhead, outWidth, outHeight, assets);
  }, [animation, assets, playhead, outWidth, outHeight, busy, svgRevision]);

  useEffect(() => {
    if (!isPlaying || busy) return;
    let raf = 0; let lastUi = 0; const started = performance.now() - (playhead / speed) * 1000;
    const tick = (now: number) => {
      const t = Math.min(duration, ((now - started) / 1000) * speed);
      const canvas = canvasRef.current;
      if (canvas) renderFrame(canvas, animation, t, outWidth, outHeight, assets);
      if (now - lastUi > 80 || t >= duration) { setPlayhead(t); lastUi = now; }
      if (t >= duration) { setIsPlaying(false); setStatus('Lecture terminée.'); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, busy, duration, speed, animation, outWidth, outHeight, assets, playhead]);

  useEffect(() => () => { urlsRef.current.forEach(URL.revokeObjectURL); }, []);

  const loadJson = async (file?: File) => {
    if (!file) return;
    setError(''); setIsPlaying(false);
    try {
      if (file.size === 0) throw new Error('Le fichier JSON est vide.');
      if (file.size > 20 * 1024 * 1024) throw new Error('Le fichier JSON dépasse la limite de 20 Mo.');
      const raw: unknown = JSON.parse(await file.text());
      const validation = validateAnimation(raw);
      if (!validation.ok || !validation.value) throw new Error(validation.errors.join('\n'));
      for (const url of urlsRef.current) URL.revokeObjectURL(url);
      urlsRef.current = [];
      setAssets({}); setAssetNames([]);
      setDocument(validation.value, file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Le fichier n’a pas pu être lu.');
      setStatus('Import refusé.');
    }
  };

  const loadAssets = async (files: FileList | null) => {
    if (!files?.length) return;
    const next: ImageAssets = { ...assets };
    const names: string[] = [...assetNames];
    for (const file of [...files]) {
      if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'].includes(file.type)) continue;
      const key = file.name;
      const url = URL.createObjectURL(file); urlsRef.current.push(url);
      const image = new Image(); image.src = url;
      await image.decode(); next[key] = image;
      if (!names.includes(key)) names.push(key);
    }
    setAssets(next); setAssetNames(names); setStatus(`${names.length} ressource(s) locale(s) prête(s).`);
  };

  const chooseDemo = (id: string) => {
    const demo = demos.find((d) => d.id === id);
    if (demo) setDocument(structuredClone(demo.doc), demo.doc.name);
  };

  const doExport = async () => {
    if (busy) return;
    let writable: FileSystemWritableFileStream | undefined;
    const savePicker = (window as unknown as { showSaveFilePicker?: (options: { suggestedName: string; types: { description: string; accept: Record<string, string[]> }[] }) => Promise<{ createWritable: () => Promise<FileSystemWritableFileStream> }> }).showSaveFilePicker;
    if (savePicker) {
      try {
        const handle = await savePicker({
          suggestedName: currentFileName,
          types: [{ description: 'Vidéo MP4', accept: { 'video/mp4': ['.mp4'] } }],
        });
        writable = await handle.createWritable();
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') { setStatus('Enregistrement annulé.'); return; }
        setError(e instanceof Error ? e.message : 'Impossible de préparer le fichier MP4.'); setStatus('Échec de l’export.'); return;
      }
    }
    setError(''); setIsPlaying(false); setBusy(true); setProgress(0); cancelRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) { setBusy(false); setError('La zone de rendu n’est pas prête.'); return; }
    let disposeSvg = () => {};
    try {
      disposeSvg = await prepareSvgAssets(animation.objects, assets);
      const result = await exportMp4({
        document: animation, speed, width: outWidth, height: outHeight, fileName: currentFileName, assets,
        onProgress: (p) => setProgress(p), onStatus: setStatus,
        isCancelled: () => cancelRef.current,
        writable,
      });
      setProgress(1); setStatus(result.savedDirectly ? `Enregistré : ${result.fileName}` : `Téléchargement lancé : ${result.fileName}${result.bytes ? ` (${(result.bytes / 1024 / 1024).toFixed(1)} Mo)` : ''}`);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') setStatus('Export annulé.');
      else { const message = e instanceof Error ? e.message : 'Erreur inconnue pendant le rendu.'; setError(message); setStatus('Échec de l’export.'); }
    } finally {
      disposeSvg();
      setBusy(false); setPlayhead(0);
    }
  };

  const currentTime = (event: import('react').ChangeEvent<HTMLInputElement>) => {
    setIsPlaying(false); setPlayhead(Number(event.target.value));
  };

  return <main className="app-shell">
    <header className="topbar">
      <a className="brand" href="#top" aria-label="Science et Découverte Animation Studio">
        <span className="brand-mark" aria-hidden="true">S</span>
        <span><strong>Science & Découverte</strong><small>ANIMATION STUDIO <b>V0.1.0</b></small></span>
      </a>
      <div className="top-actions">
        <label className="button secondary import-button">Importer JSON<input aria-label="Importer un fichier JSON" type="file" accept="application/json,.json" onChange={(e) => loadJson(e.target.files?.[0])} /></label>
        <a className="help-link" href="./docs/format-json.md" target="_blank" rel="noreferrer">Format JSON ↗</a>
      </div>
    </header>

    <section className="workspace" id="top">
      <div className="main-column">
        <div className="stage-heading">
          <div><span className="eyebrow">ESPACE DE TRAVAIL</span><h1>{animation.name}</h1></div>
          <select aria-label="Choisir une démonstration" className="demo-select" value="" onChange={(e) => chooseDemo(e.target.value)}>
            <option value="" disabled>Charger une démo…</option>{demos.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </div>
        <div className="preview-frame" aria-label="Prévisualisation animation">
          <canvas ref={canvasRef} width={outWidth} height={outHeight} aria-label={`Aperçu ${animation.name}`} />
          {animation.objects.length === 0 && <div className="empty-preview"><span className="empty-icon">◉</span><strong>Votre scène apparaîtra ici</strong><span>Importez un JSON ou ouvrez une démonstration.</span></div>}
        </div>
        <div className="player-panel">
          <div className="player-controls">
            <button className="icon-button" title="Revenir au début" aria-label="Revenir au début" disabled={busy} onClick={() => { setIsPlaying(false); setPlayhead(0); }}>↺</button>
            <button className="play-button" aria-label={isPlaying ? 'Mettre en pause' : 'Lire'} disabled={busy || animation.objects.length === 0} onClick={() => { if (playhead >= duration) setPlayhead(0); setIsPlaying(!isPlaying); }}>{isPlaying ? 'Ⅱ' : '▶'}</button>
            <span className="time-readout">{fmt(currentTimeSeconds(playhead, speed))} <i>/</i> {fmt(totalOutput)}</span>
          </div>
          <input className="timeline" aria-label="Position de lecture" type="range" min={0} max={duration} step={1 / 30} value={Math.min(duration, playhead)} onChange={currentTime} disabled={busy || duration === 0} />
          <div className="timeline-labels"><span>0:00</span><span>{fmt(duration)} · scène</span></div>
        </div>
        <section className="assets-panel">
          <div><strong>Ressources locales</strong><span>Les images restent dans ce navigateur et ne sont pas envoyées.</span></div>
          <label className="button subtle">Ajouter des images<input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" multiple onChange={(e) => loadAssets(e.target.files)} /></label>
          {assetNames.length > 0 && <div className="asset-list">{assetNames.map((name) => <span className="asset-chip" key={name}>▧ {name}</span>)}</div>}
        </section>
      </div>

      <aside className="settings-panel">
        <div className="panel-title"><span className="eyebrow">PARAMÈTRES</span><span className="local-pill"><i /> LOCAL</span></div>
        <label className="field"><span>Nom de l’animation</span><input value={animation.name} readOnly title="Le nom se modifie dans le fichier JSON" /></label>
        <label className="field"><span>Résolution vidéo</span><select value={resolution} onChange={(e) => setResolution(e.target.value as keyof typeof RESOLUTIONS)}><option value="1080p">Full HD · 1920 × 1080</option><option value="720p">HD · 1280 × 720</option></select></label>
        <label className="field"><span>Vitesse de lecture</span><select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>{SPEEDS.map((v) => <option key={v} value={v}>{v}×</option>)}</select></label>
        <div className="duration-card"><span>Durée après vitesse</span><strong>{fmt(totalOutput)}</strong><small>{totalFrames.toLocaleString('fr-FR')} images · 30 FPS</small></div>
        <label className="field"><span>Nom du fichier de sortie</span><div className="filename-input"><input value={outputName} onChange={(e) => setOutputName(e.target.value)} aria-label="Nom du fichier MP4" /><em>.mp4</em></div></label>
        <div className="codec-card">
          <span className={`codec-indicator ${support?.supported ? 'ok' : support ? 'bad' : ''}`} />
          <div><strong>MP4 · H.264 · 30 FPS</strong><small>{support?.message ?? 'Vérification de la prise en charge…'}</small></div>
        </div>
        {error && <div role="alert" className="error-box"><strong>Impossible de continuer</strong><span>{error}</span></div>}
        <button className="export-button" disabled={busy || !support?.supported || animation.objects.length === 0} onClick={doExport}>
          {busy ? <><span className="spinner" /> Export en cours…</> : <>Exporter en MP4 <span>↓</span></>}
        </button>
        {busy && <button className="cancel-button" onClick={() => { cancelRef.current = true; setStatus('Annulation en cours…'); }}>Annuler l’export</button>}
        <div className="progress-area" aria-live="polite">
          <div className="progress-caption"><span>{status}</span><strong>{busy ? `${Math.round(progress * 100)} %` : progress === 1 ? 'Terminé' : ''}</strong></div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} /></div>
        </div>
        <p className="privacy-note"><span>▣</span> Le rendu se fait sur votre appareil. Aucun fichier n’est transmis à un serveur.</p>
        <div className="limitations"><strong>V0.1.0</strong><span>Fond uni · sans audio · 30 FPS · le navigateur doit prendre en charge H.264.</span></div>
      </aside>
    </section>
    <footer className="footer"><span>Science & Découverte — Animation Studio</span><span>Rendu local · aperçu déterministe</span><a href="./README.md" target="_blank" rel="noreferrer">Documentation</a></footer>
  </main>;
}

function currentTimeSeconds(sceneSeconds: number, speed: number): number { return sceneSeconds / speed; }
