import type { AnimationDocument, BaseObject, SceneObject, ValidationResult } from './types';

const OBJECT_TYPES = new Set(['text', 'rectangle', 'circle', 'ellipse', 'line', 'arrow', 'group', 'image', 'svg']);
const PROPERTIES = new Set(['x', 'y', 'width', 'height', 'rotation', 'scale', 'opacity', 'fill', 'stroke']);
const EASINGS = new Set(['linear', 'easeIn', 'easeOut', 'easeInOut']);
const SAFE_SVG_TAGS = new Set(['svg', 'g', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'path', 'text', 'tspan']);
const SAFE_SVG_ATTRS = new Set(['viewBox', 'width', 'height', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'd', 'points', 'fill', 'stroke', 'stroke-width', 'opacity', 'transform', 'font-size', 'font-family', 'font-weight', 'text-anchor', 'xmlns']);

function isNum(v: unknown): v is number { return typeof v === 'number' && Number.isFinite(v); }
function isColor(v: unknown): v is string { return typeof v === 'string' && (v.length <= 80 && (/^#[\da-f]{3,8}$/i.test(v) || /^rgba?\([\d\s.,%]+\)$/i.test(v) || /^hsla?\([\d\s.,%deg+-]+\)$/i.test(v) || /^[a-z]{1,20}$/i.test(v))); }

export function sanitizeSvg(markup: string): string {
  if (markup.length > 200_000) throw new Error('Le SVG dépasse 200 Ko.');
  if (typeof DOMParser === 'undefined') throw new Error('Validation SVG indisponible dans cet environnement.');
  const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml');
  if (parsed.querySelector('parsererror')) throw new Error('Le SVG contient une erreur XML.');
  const root = parsed.documentElement;
  if (root.localName !== 'svg') throw new Error('La racine du document SVG doit être <svg>.');
  const walk = (el: Element) => {
    if (!SAFE_SVG_TAGS.has(el.localName)) throw new Error(`Élément SVG non autorisé : <${el.localName}>.`);
    for (const attr of [...el.attributes]) {
      if (!SAFE_SVG_ATTRS.has(attr.name) || /^on/i.test(attr.name) || /url\s*\(|javascript:|https?:|data:/i.test(attr.value) && !(attr.name === 'xmlns' && attr.value === 'http://www.w3.org/2000/svg')) {
        throw new Error(`Attribut SVG non autorisé : ${attr.name}.`);
      }
    }
    for (const child of [...el.children]) walk(child);
  };
  walk(root);
  return new XMLSerializer().serializeToString(root);
}

export function validateAnimation(input: unknown): ValidationResult {
  const errors: string[] = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, errors: ['Le JSON doit être un objet.'] };
  const doc = input as Partial<AnimationDocument>;
  if (doc.formatVersion !== 1) errors.push('formatVersion doit valoir 1.');
  if (typeof doc.name !== 'string' || !doc.name.trim()) errors.push('name doit être un texte non vide.');
  if (!isNum(doc.duration) || doc.duration <= 0 || doc.duration > 3600) errors.push('duration doit être compris entre 0 et 3600 secondes.');
  if (!isNum(doc.width) || doc.width < 1 || doc.width > 7680) errors.push('width doit être compris entre 1 et 7680.');
  if (!isNum(doc.height) || doc.height < 1 || doc.height > 4320) errors.push('height doit être compris entre 1 et 4320.');
  if (doc.fps !== 30) errors.push('La V0.1.0 prend en charge uniquement 30 FPS.');
  if (!isColor(doc.background)) errors.push('background doit être une couleur CSS simple valide.');
  if (!Array.isArray(doc.objects)) errors.push('objects doit être un tableau.');
  else if (doc.objects.length > 500) errors.push('Une scène ne peut pas dépasser 500 objets.');

  const ids = new Set<string>();
  const checkObjects = (objects: unknown[], path = 'objects', depth = 0) => {
    if (depth > 12) { errors.push(`${path} dépasse la profondeur maximale de groupes.`); return; }
    objects.forEach((raw, index) => {
      const at = `${path}[${index}]`;
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) { errors.push(`${at} doit être un objet.`); return; }
      const obj = raw as Partial<BaseObject>;
      if (typeof obj.id !== 'string' || !obj.id.trim()) errors.push(`${at}.id est obligatoire.`);
      else if (ids.has(obj.id)) errors.push(`${at}.id « ${obj.id} » est déjà utilisé.`); else ids.add(obj.id);
      if (!OBJECT_TYPES.has(String(obj.type))) errors.push(`${at}.type est inconnu.`);
      for (const k of ['x', 'y'] as const) if (!isNum(obj[k])) errors.push(`${at}.${k} doit être un nombre fini.`);
      for (const k of ['width', 'height', 'rotation', 'scale', 'opacity', 'strokeWidth', 'start', 'end', 'fontSize'] as const) {
        const v = obj[k]; if (v !== undefined && !isNum(v)) errors.push(`${at}.${k} doit être un nombre fini.`);
      }
      if (obj.opacity !== undefined && (obj.opacity < 0 || obj.opacity > 1)) errors.push(`${at}.opacity doit être entre 0 et 1.`);
      if (obj.start !== undefined && obj.start < 0) errors.push(`${at}.start ne peut pas être négatif.`);
      if (obj.end !== undefined && obj.start !== undefined && obj.end < obj.start) errors.push(`${at}.end doit être supérieur à start.`);
      if (obj.fill !== undefined && !isColor(obj.fill)) errors.push(`${at}.fill doit être une couleur CSS simple valide.`);
      if (obj.stroke !== undefined && !isColor(obj.stroke)) errors.push(`${at}.stroke doit être une couleur CSS simple valide.`);
      if (obj.type === 'text' && (typeof obj.text !== 'string' || obj.text.length > 4000)) errors.push(`${at}.text doit être un texte de 4000 caractères maximum.`);
      if (obj.type === 'image' && (typeof obj.asset !== 'string' || !obj.asset.trim())) errors.push(`${at}.asset doit désigner une image importée (ex. asset:photo.png).`);
      if (obj.type === 'svg') {
        if (typeof obj.svg !== 'string' || obj.svg.length === 0) errors.push(`${at}.svg doit contenir un SVG simple.`);
        else if (typeof DOMParser !== 'undefined') { try { sanitizeSvg(obj.svg); } catch (e) { errors.push(`${at}.svg : ${e instanceof Error ? e.message : 'SVG invalide.'}`); } }
      }
      if (Array.isArray(obj.animations)) obj.animations.forEach((a, ai) => {
        const ap = `${at}.animations[${ai}]`;
        if (!a || typeof a !== 'object') { errors.push(`${ap} doit être un objet.`); return; }
        if (!PROPERTIES.has(String(a.property))) errors.push(`${ap}.property est inconnue.`);
        for (const field of ['start', 'duration'] as const) if (!isNum(a[field]) || a[field] < (field === 'start' ? 0 : Number.MIN_VALUE)) errors.push(`${ap}.${field} doit être un nombre positif valide.`);
        if (!['number', 'string'].includes(typeof a.from) || !['number', 'string'].includes(typeof a.to)) errors.push(`${ap}.from et .to doivent être des nombres ou des couleurs.`);
        if (a.easing !== undefined && !EASINGS.has(a.easing)) errors.push(`${ap}.easing doit être linear, easeIn, easeOut ou easeInOut.`);
        if (['fill', 'stroke'].includes(String(a.property)) && (!isColor(a.from) || !isColor(a.to))) errors.push(`${ap} attend des couleurs CSS simples.`);
        if (!['fill', 'stroke'].includes(String(a.property)) && (!isNum(a.from) || !isNum(a.to))) errors.push(`${ap} attend des valeurs numériques.`);
      });
      if (obj.type === 'group') {
        if (!Array.isArray(obj.children)) errors.push(`${at}.children doit être un tableau.`);
        else checkObjects(obj.children as SceneObject[], `${at}.children`, depth + 1);
      }
    });
  };
  if (Array.isArray(doc.objects)) checkObjects(doc.objects as SceneObject[]);
  if (errors.length) return { ok: false, errors };
  return { ok: true, errors, value: doc as AnimationDocument };
}
