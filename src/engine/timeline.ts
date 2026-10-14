import type { AnimationDocument, BaseObject, Easing, SceneObject, SceneState } from './types';

export const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3] as const;
export const FPS = 30 as const;

export function ease(t: number, easing: Easing = 'linear'): number {
  const x = Math.max(0, Math.min(1, t));
  switch (easing) {
    case 'easeIn': return x * x;
    case 'easeOut': return 1 - (1 - x) * (1 - x);
    case 'easeInOut': return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    default: return x;
  }
}

function hexToRgb(color: string): [number, number, number] | null {
  const match = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(color);
  if (!match) return null;
  let value = match[1]; if (value.length === 3) value = value.split('').map((c) => c + c).join('');
  return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)];
}
function mixColor(a: string, b: string, t: number): string {
  const ar = hexToRgb(a), br = hexToRgb(b);
  if (!ar || !br) return t < 1 ? a : b;
  return `#${ar.map((v, i) => Math.round(v + (br[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

export function evaluateObject(object: SceneObject, seconds: number): SceneState {
  const state: Record<string, unknown> = { ...object, opacity: object.opacity ?? 1, rotation: object.rotation ?? 0, scale: object.scale ?? 1 };
  if (object.start !== undefined && seconds < object.start) state.opacity = 0;
  if (object.end !== undefined && seconds >= object.end) state.opacity = 0;
  for (const animation of object.animations ?? []) {
    const t = Math.max(0, Math.min(1, (seconds - animation.start) / animation.duration));
    const progress = ease(t, animation.easing);
    const value = typeof animation.from === 'number' && typeof animation.to === 'number'
      ? animation.from + (animation.to - animation.from) * progress
      : mixColor(String(animation.from), String(animation.to), progress);
    state[animation.property] = value;
  }
  return state as unknown as SceneState;
}

export function getExportFrameCount(document: AnimationDocument, speed: number): number {
  return Math.max(1, Math.ceil((document.duration / speed) * FPS));
}
export function getExportDuration(document: AnimationDocument, speed: number): number {
  return getExportFrameCount(document, speed) / FPS;
}
export function getSceneTimeForFrame(frame: number, speed: number, document: AnimationDocument): number {
  return Math.min(document.duration, (frame / FPS) * speed);
}
export function getSceneAt(document: AnimationDocument, seconds: number): SceneState[] {
  const t = Math.max(0, Math.min(document.duration, seconds));
  return document.objects.map((obj) => evaluateObject(obj, t));
}
export function isVisible(obj: BaseObject, seconds: number): boolean {
  return (obj.opacity ?? 1) > 0 && (obj.start === undefined || seconds >= obj.start) && (obj.end === undefined || seconds < obj.end);
}
