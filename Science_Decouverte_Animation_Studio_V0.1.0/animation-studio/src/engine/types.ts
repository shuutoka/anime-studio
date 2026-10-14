export type Easing = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
export type AnimatedProperty = 'x' | 'y' | 'width' | 'height' | 'rotation' | 'scale' | 'opacity' | 'fill' | 'stroke';
export type AnimValue = number | string;

export interface Keyframe {
  property: AnimatedProperty;
  from: AnimValue;
  to: AnimValue;
  start: number;
  duration: number;
  easing?: Easing;
}

export interface BaseObject {
  id: string;
  type: 'text' | 'rectangle' | 'circle' | 'ellipse' | 'line' | 'arrow' | 'group' | 'image' | 'svg';
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  scale?: number;
  opacity?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  start?: number;
  end?: number;
  animations?: Keyframe[];
  children?: SceneObject[];
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  textAlign?: CanvasTextAlign;
  lineHeight?: number;
  asset?: string;
  svg?: string;
}
export type SceneObject = BaseObject;

export interface AnimationDocument {
  formatVersion: 1;
  name: string;
  duration: number;
  width: number;
  height: number;
  fps: 30;
  background: string;
  objects: SceneObject[];
}

export interface SceneState extends BaseObject {
  opacity: number;
  rotation: number;
  scale: number;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  value?: AnimationDocument;
}

export const DEFAULT_DOCUMENT: AnimationDocument = {
  formatVersion: 1,
  name: 'Nouvelle animation',
  duration: 10,
  width: 1920,
  height: 1080,
  fps: 30,
  background: '#FFFFFF',
  objects: []
};
