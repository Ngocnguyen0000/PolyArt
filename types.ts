

export enum Sampler {
  GRID = 'grid',
  POISSON = 'poisson',
  EDGE_AWARE = 'edge-aware',
}

export enum ColorSpace {
  RGB = 'rgb',
  LAB = 'lab',
}

export interface Settings {
  maxSize: number;
  points: number;
  sampler: Sampler;
  seed: number;
  edgeWeight: number;
  colorSpace: ColorSpace;
  withNeighbors: boolean;
  previewOutline: boolean;
  showPointIds: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface Triangle {
  id: number;
  vertices: [[number, number], [number, number], [number, number]];
  centroid: [number, number];
  area_px: number;
  avg_color: [number, number, number];
  neighbors: number[];
}

export interface LowPolyOutput {
  version: string;
  image: {
    width: number;
    height: number;
    source: string;
  };
  params: {
    sampler: Sampler;
    points: number;
    seed: number;
    color_space: ColorSpace;
  };
  triangles: Triangle[];
}