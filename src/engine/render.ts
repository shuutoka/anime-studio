import type { AnimationDocument, SceneObject } from './types';
import { evaluateObject } from './timeline';

export type ImageAssets = Record<string, HTMLImageElement>;

export function renderFrame(canvas: HTMLCanvasElement, document: AnimationDocument, seconds: number, width = canvas.width, height = canvas.height, assets: ImageAssets = {}): void {
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Le navigateur ne peut pas créer un contexte Canvas 2D.');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = document.background;
  ctx.fillRect(0, 0, width, height);
  const sx = width / document.width, sy = height / document.height;
  ctx.save(); ctx.scale(sx, sy);
  document.objects.forEach((obj) => drawObject(ctx, obj, seconds, assets));
  ctx.restore();
}

function drawObject(ctx: CanvasRenderingContext2D, object: SceneObject, seconds: number, assets: ImageAssets): void {
  const s = evaluateObject(object, seconds);
  if ((s.opacity ?? 1) <= 0 || (object.start !== undefined && seconds < object.start) || (object.end !== undefined && seconds >= object.end)) return;
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate((s.rotation ?? 0) * Math.PI / 180);
  ctx.scale(s.scale ?? 1, s.scale ?? 1);
  ctx.globalAlpha *= Math.max(0, Math.min(1, s.opacity ?? 1));
  const w = s.width ?? 0, h = s.height ?? 0;
  const fill = s.fill ?? '#000000', stroke = s.stroke ?? 'transparent';
  const strokeWidth = s.strokeWidth ?? 0;
  ctx.fillStyle = fill; ctx.strokeStyle = stroke; ctx.lineWidth = strokeWidth;
  switch (s.type) {
    case 'group':
      (s.children ?? []).forEach((child) => drawObject(ctx, child, seconds, assets));
      break;
    case 'rectangle':
      ctx.beginPath(); ctx.rect(0, 0, w, h); if (s.fill) ctx.fill(); if (strokeWidth) ctx.stroke(); break;
    case 'circle': {
      const r = Math.min(w || h, h || w) / 2; ctx.beginPath(); ctx.arc(w ? w / 2 : 0, h ? h / 2 : 0, r, 0, Math.PI * 2); if (s.fill) ctx.fill(); if (strokeWidth) ctx.stroke(); break;
    }
    case 'ellipse':
      ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); if (s.fill) ctx.fill(); if (strokeWidth) ctx.stroke(); break;
    case 'line':
    case 'arrow': {
      const x2 = w, y2 = h; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(x2, y2); ctx.strokeStyle = s.stroke ?? fill; ctx.lineWidth = strokeWidth || 4; ctx.lineCap = 'round'; ctx.stroke();
      if (s.type === 'arrow') { const angle = Math.atan2(y2, x2), size = Math.max(10, (strokeWidth || 4) * 3); ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - size * Math.cos(angle - Math.PI / 6), y2 - size * Math.sin(angle - Math.PI / 6)); ctx.lineTo(x2 - size * Math.cos(angle + Math.PI / 6), y2 - size * Math.sin(angle + Math.PI / 6)); ctx.closePath(); ctx.fillStyle = s.stroke ?? fill; ctx.fill(); }
      break;
    }
    case 'text': {
      const fontSize = s.fontSize ?? 48;
      ctx.font = `${s.fontWeight ?? 'normal'} ${fontSize}px ${s.fontFamily ?? 'Arial, sans-serif'}`;
      ctx.textAlign = s.textAlign ?? 'left'; ctx.textBaseline = 'top';
      const lines = (s.text ?? '').split('\n');
      lines.forEach((line, i) => ctx.fillText(line, 0, i * (s.lineHeight ?? fontSize * 1.2), w || undefined));
      break;
    }
    case 'image': {
      const img = s.asset ? assets[s.asset] : undefined;
      if (img?.complete && img.naturalWidth) ctx.drawImage(img, 0, 0, w, h);
      break;
    }
    case 'svg': {
      const img = s.svg ? assets[`__svg:${s.id}`] : undefined;
      if (img?.complete && img.naturalWidth) ctx.drawImage(img, 0, 0, w, h);
      break;
    }
  }
  ctx.restore();
}

export async function prepareSvgAssets(objects: SceneObject[], assets: ImageAssets): Promise<() => void> {
  const urls: string[] = [];
  const waits: Promise<void>[] = [];
  const visit = (items: SceneObject[]) => items.forEach((obj) => {
    if (obj.type === 'svg' && obj.svg) {
      const image = new Image(); const blob = new Blob([obj.svg], { type: 'image/svg+xml' }); const url = URL.createObjectURL(blob); urls.push(url); assets[`__svg:${obj.id}`] = image;
      image.src = url;
      waits.push(image.decode().then(() => undefined));
    }
    if (obj.type === 'group' && obj.children) visit(obj.children);
  });
  visit(objects);
  await Promise.all(waits);
  return () => { urls.forEach(URL.revokeObjectURL); objects.forEach((obj) => delete assets[`__svg:${obj.id}`]); };
}
