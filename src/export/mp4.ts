import {
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
  Quality,
  StreamTarget,
  canEncodeVideo,
} from 'mediabunny';
import type { AnimationDocument } from '../engine/types';
import { getExportFrameCount, getSceneTimeForFrame } from '../engine/timeline';
import { renderFrame, type ImageAssets } from '../engine/render';

export interface ExportOptions {
  document: AnimationDocument;
  speed: number;
  width: 1920 | 1280;
  height: 1080 | 720;
  fileName: string;
  assets: ImageAssets;
  onProgress: (progress: number, frame: number, total: number) => void;
  onStatus: (status: string) => void;
  isCancelled: () => boolean;
  writable?: FileSystemWritableFileStream;
}

export interface ExportResult { fileName: string; bytes?: number; savedDirectly: boolean; }

export function makeSafeFileName(name: string): string {
  const base = name.trim().replace(/\.mp4$/i, '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').replace(/\s+/g, '_').replace(/^\.+|\.+$/g, '').slice(0, 120);
  return `${base || 'animation'}.mp4`;
}

export async function checkMp4Support(width: number, height: number): Promise<{ supported: boolean; message: string }> {
  if (typeof VideoEncoder === 'undefined') return { supported: false, message: 'Ce navigateur ne fournit pas WebCodecs. Essayez la dernière version de Chrome ou Edge sur ordinateur.' };
  try {
    const supported = await canEncodeVideo('avc', { width, height, frameRate: 30, quality: new Quality('medium') });
    return supported
      ? { supported: true, message: 'MP4 / H.264 est disponible sur cet appareil.' }
      : { supported: false, message: `L’encodage H.264 n’est pas disponible en ${width}×${height} sur cet appareil.` };
  } catch (error) {
    return { supported: false, message: error instanceof Error ? error.message : 'Impossible de vérifier l’encodage MP4.' };
  }
}

export async function exportMp4(options: ExportOptions): Promise<ExportResult> {
  const { document, speed, width, height, assets, onProgress, onStatus, isCancelled } = options;
  const fileName = makeSafeFileName(options.fileName || document.name);
  const support = await checkMp4Support(width, height);
  if (!support.supported) throw new Error(support.message);

  let writable: FileSystemWritableFileStream | null = options.writable ?? null;
  let output: Output | null = null;
  let videoSource: CanvasSource | null = null;
  let direct = false;
  direct = Boolean(writable);
  const target = writable
    ? new StreamTarget(writable, { chunked: true, chunkSize: 4 * 1024 * 1024 })
    : new BufferTarget();
  const canvas = window.document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Impossible de créer la surface de rendu vidéo.');
  const frameCount = getExportFrameCount(document, speed);
  try {
    videoSource = new CanvasSource(canvas, { codec: 'avc', quality: new Quality('high') });
    output = new Output({ format: new Mp4OutputFormat(), target });
    output.addVideoTrack(videoSource, { frameRate: 30 });
    output.setMetadataTags({ title: document.name, artist: 'Science & Découverte — Animation Studio' });
    await output.start();
    onStatus('Rendu des images et encodage H.264…');
    const frameDuration = 1 / 30;
    for (let frame = 0; frame < frameCount; frame++) {
      if (isCancelled()) {
        await output.cancel();
        throw new DOMException('Export annulé.', 'AbortError');
      }
      const time = getSceneTimeForFrame(frame, speed, document);
      renderFrame(canvas, document, time, width, height, assets);
      await videoSource.add(frame * frameDuration, frameDuration, { keyFrame: frame === 0 });
      onProgress((frame + 1) / frameCount, frame + 1, frameCount);
      // Yield regularly so playback controls, progress, and cancel remain responsive.
      if (frame % 3 === 0) await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
    if (isCancelled()) {
      await output.cancel();
      throw new DOMException('Export annulé.', 'AbortError');
    }
    onStatus('Finalisation du fichier MP4…');
    await output.finalize();
    if (direct) return { fileName, savedDirectly: true };
    const buffer = (target as BufferTarget).buffer;
    if (!buffer) throw new Error('Le conteneur MP4 n’a pas produit de fichier.');
    const blob = new Blob([buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    try {
      const anchor = window.document.createElement('a'); anchor.href = url; anchor.download = fileName; anchor.click();
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    }
    return { fileName, bytes: blob.size, savedDirectly: false };
  } catch (error) {
    if (output && output.state !== 'canceled' && output.state !== 'finalized') {
      try { await output.cancel(); } catch { /* Preserve the original error. */ }
    }
    throw error;
  } finally {
    try { videoSource?.close(); } catch { /* encoder may already be closed */ }
    canvas.width = 1; canvas.height = 1;
    if (direct && output?.state !== 'finalized') {
      try { await writable?.abort(); } catch { /* file may already be closed */ }
    }
  }
}
