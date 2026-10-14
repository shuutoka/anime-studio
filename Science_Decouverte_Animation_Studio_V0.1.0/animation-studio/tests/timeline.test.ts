import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { eclipseDemo, tapewormDemo } from '../src/engine/examples';
import { getExportDuration, getExportFrameCount, getSceneAt, getSceneTimeForFrame } from '../src/engine/timeline';
import { validateAnimation } from '../src/engine/validate';
import { makeSafeFileName } from '../src/export/mp4';

describe('chronologie déterministe', () => {
  it('calcule la position d’un objet à un temps absolu, sans dépendre de la lecture', () => {
    const moonAt0 = getSceneAt(eclipseDemo, 0).find((o) => o.id === 'moon')!;
    const moonAt8 = getSceneAt(eclipseDemo, 8).find((o) => o.id === 'moon')!;
    expect(moonAt0.x).toBe(540);
    expect(moonAt8.x).toBeGreaterThan(540);
    expect(moonAt8.x).toBe(getSceneAt(eclipseDemo, 8).find((o) => o.id === 'moon')!.x);
  });

  it('change la durée exportée tout en gardant 30 images par seconde', () => {
    const half = getExportFrameCount(eclipseDemo, 0.5);
    const normal = getExportFrameCount(eclipseDemo, 1);
    const double = getExportFrameCount(eclipseDemo, 2);
    expect(half).toBe(1200);
    expect(normal).toBe(600);
    expect(double).toBe(300);
    expect(getExportDuration(eclipseDemo, 0.5)).toBe(40);
    expect(getExportDuration(eclipseDemo, 2)).toBe(10);
    expect(getSceneTimeForFrame(300, 0.5, eclipseDemo)).toBe(5);
    expect(getSceneTimeForFrame(300, 2, eclipseDemo)).toBe(20);
  });
});

describe('validation JSON', () => {
  it('accepte les exemples conformes au format V1', () => {
    expect(validateAnimation(eclipseDemo).ok).toBe(true);
    expect(validateAnimation(tapewormDemo).ok).toBe(true);
    for (const name of ['eclipse_solaire.json', 'cycle_tenia_chat.json']) {
      const json: unknown = JSON.parse(readFileSync(resolve(process.cwd(), 'public/demos', name), 'utf8'));
      expect(validateAnimation(json).errors, name).toEqual([]);
    }
  });
  it('refuse une durée incorrecte, des objets dupliqués et une version inconnue', () => {
    const bad = { ...eclipseDemo, formatVersion: 7, duration: -3, objects: [{ id: 'same', type: 'circle', x: 0, y: 0 }, { id: 'same', type: 'circle', x: 0, y: 0 }] };
    const result = validateAnimation(bad);
    expect(result.ok).toBe(false);
    expect(result.errors.some((x) => x.includes('duration'))).toBe(true);
    expect(result.errors.some((x) => x.includes('déjà utilisé'))).toBe(true);
    expect(result.errors.some((x) => x.includes('formatVersion'))).toBe(true);
  });
  it('signale les propriétés d’animation incohérentes', () => {
    const result = validateAnimation({ ...eclipseDemo, objects: [{ id: 'x', type: 'circle', x: 0, y: 0, animations: [{ property: 'width', from: 'gauche', to: 2, start: -1, duration: 0 }] }] });
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toMatch(/from et .to|start|duration/);
  });
});

describe('nom de fichier', () => {
  it('nettoie les caractères interdits et garantit une extension MP4', () => {
    expect(makeSafeFileName('cycle ténia: test.mp4')).toBe('cycle_ténia__test.mp4');
    expect(makeSafeFileName('')).toBe('animation.mp4');
  });
});
