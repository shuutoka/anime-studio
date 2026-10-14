import type { AnimationDocument } from './types';

export const eclipseDemo: AnimationDocument = {
  formatVersion: 1, name: 'Éclipse solaire — alignement et ombre', duration: 20, width: 1920, height: 1080, fps: 30, background: '#FFFFFF',
  objects: [
    { id: 'title', type: 'text', x: 130, y: 90, width: 1660, text: 'Une éclipse solaire', fontSize: 62, fontWeight: 'bold', fill: '#173B36' },
    { id: 'subtitle', type: 'text', x: 132, y: 170, width: 1620, text: 'Schéma simplifié — les tailles et distances ne sont pas à l’échelle', fontSize: 28, fill: '#58666C' },
    { id: 'sun', type: 'circle', x: 190, y: 410, width: 230, height: 230, fill: '#F7B731', stroke: '#D88710', strokeWidth: 7 },
    { id: 'earth', type: 'circle', x: 1500, y: 430, width: 190, height: 190, fill: '#478DBB', stroke: '#246789', strokeWidth: 7 },
    { id: 'earth-land', type: 'ellipse', x: 1540, y: 466, width: 70, height: 55, fill: '#5F9C69' },
    { id: 'sun-label', type: 'text', x: 230, y: 665, width: 300, text: 'Soleil', fontSize: 36, fontWeight: 'bold', fill: '#31383A' },
    { id: 'earth-label', type: 'text', x: 1470, y: 665, width: 300, text: 'Terre', fontSize: 36, fontWeight: 'bold', fill: '#31383A' },
    { id: 'moon', type: 'circle', x: 540, y: 465, width: 120, height: 120, fill: '#D7DCE0', stroke: '#7E898F', strokeWidth: 5,
      animations: [{ property: 'x', from: 540, to: 1230, start: 2, duration: 11, easing: 'easeInOut' }] },
    { id: 'moon-label', type: 'text', x: 530, y: 615, width: 300, text: 'Lune', fontSize: 36, fontWeight: 'bold', fill: '#31383A',
      animations: [{ property: 'x', from: 530, to: 1220, start: 2, duration: 11, easing: 'easeInOut' }] },
    { id: 'shadow-upper', type: 'line', x: 1280, y: 500, width: 230, height: -70, stroke: '#59636A', strokeWidth: 5, opacity: 0,
      animations: [{ property: 'opacity', from: 0, to: 0.8, start: 13, duration: 2, easing: 'easeOut' }] },
    { id: 'shadow-lower', type: 'line', x: 1280, y: 550, width: 230, height: 100, stroke: '#59636A', strokeWidth: 5, opacity: 0,
      animations: [{ property: 'opacity', from: 0, to: 0.8, start: 13, duration: 2, easing: 'easeOut' }] },
    { id: 'shadow-label', type: 'text', x: 1090, y: 760, width: 680, text: 'La Lune projette son ombre vers la Terre', fontSize: 34, textAlign: 'center', fill: '#31383A', opacity: 0,
      animations: [{ property: 'opacity', from: 0, to: 1, start: 15, duration: 2, easing: 'easeOut' }] },
    { id: 'guide', type: 'line', x: 420, y: 525, width: 1080, height: 0, stroke: '#BBC4C8', strokeWidth: 2, opacity: 0.7 }
  ]
};

export const tapewormDemo: AnimationDocument = {
  formatVersion: 1, name: 'Le cycle de Dipylidium caninum', duration: 30, width: 1920, height: 1080, fps: 30, background: '#FFFFFF',
  objects: [
    { id: 'title', type: 'text', x: 110, y: 72, width: 1700, text: 'Le cycle du ténia du chat', fontSize: 60, fontWeight: 'bold', fill: '#173B36' },
    { id: 'subtitle', type: 'text', x: 112, y: 148, width: 1690, text: 'Dipylidium caninum — schéma explicatif, cycle simplifié', fontSize: 28, fill: '#58666C' },
    { id: 'step1', type: 'text', x: 180, y: 270, width: 680, text: '1  Les larves de puces ingèrent des œufs\nprésents dans l’environnement.', fontSize: 38, fill: '#263438', opacity: 0,
      animations: [{ property: 'opacity', from: 0, to: 1, start: 0, duration: 1 }] },
    { id: 'step2', type: 'text', x: 1020, y: 270, width: 720, text: '2  Le parasite se développe dans la puce.\nLe chat l’avale en faisant sa toilette.', fontSize: 38, fill: '#263438', opacity: 0,
      animations: [{ property: 'opacity', from: 0, to: 1, start: 7, duration: 1 }] },
    { id: 'step3', type: 'text', x: 180, y: 700, width: 700, text: '3  Le ténia adulte vit dans l’intestin\net produit des segments contenant des œufs.', fontSize: 38, fill: '#263438', opacity: 0,
      animations: [{ property: 'opacity', from: 0, to: 1, start: 15, duration: 1 }] },
    { id: 'step4', type: 'text', x: 1020, y: 700, width: 720, text: '4  Les segments libèrent des œufs ;\nle cycle recommence dans l’environnement.', fontSize: 38, fill: '#263438', opacity: 0,
      animations: [{ property: 'opacity', from: 0, to: 1, start: 22, duration: 1 }] },
    { id: 'cat-body', type: 'ellipse', x: 360, y: 440, width: 210, height: 110, fill: '#E9A86D', start: 0, end: 15 },
    { id: 'cat-head', type: 'circle', x: 530, y: 420, width: 100, height: 100, fill: '#E9A86D', start: 0, end: 15 },
    { id: 'cat-ear1', type: 'svg', x: 535, y: 395, width: 35, height: 40, start: 0, end: 15, svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 45"><polygon points="2,42 8,2 34,38" fill="#E9A86D"/></svg>' },
    { id: 'cat-ear2', type: 'svg', x: 580, y: 397, width: 35, height: 40, start: 0, end: 15, svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 45"><polygon points="5,38 30,2 38,42" fill="#E9A86D"/></svg>' },
    { id: 'cat-leg1', type: 'rectangle', x: 390, y: 520, width: 30, height: 65, fill: '#D98D54', start: 0, end: 15 },
    { id: 'cat-leg2', type: 'rectangle', x: 525, y: 520, width: 30, height: 65, fill: '#D98D54', start: 0, end: 15 },
    { id: 'flea', type: 'ellipse', x: 740, y: 475, width: 42, height: 24, fill: '#5C3B2E', rotation: -25, start: 0, end: 8,
      animations: [{ property: 'x', from: 740, to: 590, start: 3, duration: 3, easing: 'easeInOut' }] },
    { id: 'ingestion-note', type: 'text', x: 740, y: 515, width: 270, text: 'Ingestion d’une puce infectée\n(pas par une piqûre)', fontSize: 26, textAlign: 'center', fill: '#A14532', start: 6, end: 16 },
    { id: 'flea-larva', type: 'circle', x: 1170, y: 430, width: 100, height: 100, fill: '#E6D9A8', stroke: '#B7A36B', strokeWidth: 5, start: 0, end: 14 },
    { id: 'worm', type: 'svg', x: 1160, y: 445, width: 420, height: 120, start: 14, end: 30, svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 120"><path d="M10 65 C55 10 85 110 130 60 S205 10 250 60 S330 110 410 45" fill="none" stroke="#6B8E7A" stroke-width="14" stroke-linecap="round"/><circle cx="45" cy="47" r="8" fill="#E6C35A"/><circle cx="95" cy="66" r="8" fill="#E6C35A"/><circle cx="150" cy="53" r="8" fill="#E6C35A"/><circle cx="215" cy="56" r="8" fill="#E6C35A"/><circle cx="275" cy="59" r="8" fill="#E6C35A"/><circle cx="340" cy="71" r="8" fill="#E6C35A"/></svg>' },
    { id: 'intestinal-label', type: 'text', x: 1300, y: 590, width: 420, text: 'Intestin du chat — ténia adulte', fontSize: 30, textAlign: 'center', fill: '#41544B', start: 14, end: 30 },
    { id: 'arrow-a', type: 'arrow', x: 820, y: 610, width: 0, height: 130, stroke: '#678A7A', strokeWidth: 7, start: 8, end: 22 },
    { id: 'arrow-b', type: 'arrow', x: 890, y: 830, width: 200, height: 0, stroke: '#678A7A', strokeWidth: 7, start: 18, end: 30 },
    { id: 'caution', type: 'text', x: 350, y: 950, width: 1220, text: 'La contamination du chat se fait en avalant une puce porteuse du parasite.', fontSize: 34, fontWeight: 'bold', textAlign: 'center', fill: '#A14532', opacity: 0,
      animations: [{ property: 'opacity', from: 0, to: 1, start: 25, duration: 1 }] }
  ]
};
