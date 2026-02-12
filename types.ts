
export enum SupportType {
  PINNED = 'PINNED',
  ROLLER = 'ROLLER',
  FIXED = 'FIXED',
  HINGE = 'HINGE'
}

export enum LoadType {
  POINT = 'POINT',
  UDL = 'UDL',
  UVL = 'UVL',
  MOMENT = 'MOMENT'
}

export enum ILDType {
  REACTION = 'REACTION',
  SHEAR = 'SHEAR',
  MOMENT = 'MOMENT'
}

export enum UnitSystem {
  MKS = 'MKS',
  FPS = 'FPS'
}

export interface Support {
  id: string;
  type: SupportType;
  position: number;
}

export interface Load {
  id: string;
  type: LoadType;
  magnitude: number;
  endMagnitude?: number;
  position: number;
  endPosition?: number;
}

export interface BeamConfig {
  length: number;
  elasticModulus: number;
  momentOfInertia: number;
}

export interface ILDPoint {
  x: number;
  value: number;
}

export interface AnalysisResults {
  nodes: number[];
  shearForce: number[];
  bendingMoment: number[];
  deflection: number[];
  reactions: { position: number; force: number; moment: number; label: string; id: string }[];
  maxShear: number;
  minShear: number;
  maxMoment: number;
  minMoment: number;
  maxDeflection: number;
  minDeflection: number;
  determinacy: number;
  isStable: boolean;
  ildReactions: { [supportId: string]: ILDPoint[] };
  ildShearAtProbe: ILDPoint[];
  ildMomentAtProbe: ILDPoint[];
}
