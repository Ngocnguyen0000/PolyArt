

import { Settings, LowPolyOutput, Sampler, Triangle, Point, ColorSpace } from '../types';

// Let TypeScript know that d3 is a global variable from the script tag
declare const d3: any;

// A seeded random number generator for deterministic results
const createPRNG = (seed: number) => {
  let s = seed;
  return () => {
    s = Math.sin(s) * 10000;
    return s - Math.floor(s);
  };
};

// --- Main Generation Function ---

export const generateLowPolyData = (
  image: HTMLImageElement,
  sourceFileName: string,
  settings: Settings
): Promise<LowPolyOutput> => {
  return new Promise((resolve, reject) => {
    try {
        const { width, height, imageData } = getScaledImageData(image, settings.maxSize);
        const random = createPRNG(settings.seed);
        
        let points: [number, number][] = [];
        switch (settings.sampler) {
            case Sampler.GRID:
                points = sampleGrid(width, height, settings.points, random);
                break;
            case Sampler.POISSON:
                points = samplePoisson(width, height, settings.points, random);
                break;
            case Sampler.EDGE_AWARE:
                const edgeMap = createEdgeMap(imageData);
                points = sampleEdgeAware(width, height, settings.points, edgeMap, settings.edgeWeight, random);
                break;
        }

        // Ensure corners and border points are included
        addBorderPoints(points, width, height);

        const delaunay = d3.Delaunay.from(points);
        
        const trianglePolygons: [number, number][][] = Array.from(delaunay.trianglePolygons());
        const triangles: Triangle[] = [];
        const triangleIndexMap = new Map<number, number>();
        let currentId = 1;

        for(let i = 0; i < trianglePolygons.length; i++) {
            const vertices = trianglePolygons[i] as [[number, number], [number, number], [number, number]];

            // Discard triangles with vertices outside the canvas
            if (vertices.some(v => v[0] < 0 || v[0] > width || v[1] < 0 || v[1] > height)) {
                continue;
            }

            const centroid = getCentroid(vertices);
            const area = getArea(vertices);

            // Discard tiny/degenerate triangles
            if (area < 1.0) continue;
            
            const avg_color = getAverageColor(vertices, imageData, settings.colorSpace);

            triangles.push({
                id: currentId,
                vertices,
                centroid,
                area_px: area,
                avg_color,
                neighbors: [],
            });
            triangleIndexMap.set(i, currentId);
            currentId++;
        }

        if(settings.withNeighbors) {
            for(const tri of triangles) {
                 const originalIndex = Array.from(triangleIndexMap.entries()).find(([, id]) => id === tri.id)?.[0];
                 if(originalIndex === undefined) continue;

                 const neighborIndexes = delaunay.neighbors(originalIndex);
                 for (const neighborIndex of neighborIndexes) {
                    const neighborId = triangleIndexMap.get(neighborIndex);
                    if(neighborId) {
                        tri.neighbors.push(neighborId);
                    }
                 }
            }
        }
        
        resolve({
            version: "1.0",
            image: { width, height, source: sourceFileName },
            params: {
                sampler: settings.sampler,
                points: settings.points,
                seed: settings.seed,
                color_space: settings.colorSpace
            },
            triangles,
        });

    } catch(e) {
        reject(e);
    }
  });
};

// --- Image & Canvas Utilities ---

const getScaledImageData = (image: HTMLImageElement, maxSize: number) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not get canvas context');

    let { width, height } = image;
    if (width > maxSize || height > maxSize) {
        if (width > height) {
            height = Math.round(height * (maxSize / width));
            width = maxSize;
        } else {
            width = Math.round(width * (maxSize / height));
            height = maxSize;
        }
    }
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    return { width, height, imageData: ctx.getImageData(0, 0, width, height) };
};

// --- Point Sampling Methods ---

const addBorderPoints = (points: [number, number][], width: number, height: number) => {
    points.push([0, 0], [width, 0], [0, height], [width, height]);
    const numBorderPoints = Math.ceil(Math.sqrt(points.length) / 2);
    for (let i = 1; i < numBorderPoints; i++) {
        points.push([i / numBorderPoints * width, 0]);
        points.push([i / numBorderPoints * width, height]);
        points.push([0, i / numBorderPoints * height]);
        points.push([width, i / numBorderPoints * height]);
    }
};

const sampleGrid = (width: number, height: number, numPoints: number, random: () => number): [number, number][] => {
    const points: [number, number][] = [];
    const ratio = width / height;
    const cols = Math.ceil(Math.sqrt(numPoints * ratio));
    const rows = Math.ceil(numPoints / cols);
    const colSize = width / cols;
    const rowSize = height / rows;

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const jitterX = (random() - 0.5) * colSize;
            const jitterY = (random() - 0.5) * rowSize;
            const x = Math.min(width, Math.max(0, j * colSize + colSize / 2 + jitterX));
            const y = Math.min(height, Math.max(0, i * rowSize + rowSize / 2 + jitterY));
            points.push([x, y]);
        }
    }
    return points;
};

const samplePoisson = (width: number, height: number, numPoints: number, random: () => number): [number, number][] => {
    const r = Math.sqrt((width * height) / (numPoints * Math.PI)) * 1.5;
    const k = 30; // Max attempts before rejection
    const grid: ([number, number] | undefined)[] = [];
    const w = r / Math.sqrt(2);
    const cols = Math.floor(width / w);
    const rows = Math.floor(height / w);
    const points: [number, number][] = [];
    const active: [number, number][] = [];

    const initialX = random() * width;
    const initialY = random() * height;
    const i0 = Math.floor(initialX / w);
    const j0 = Math.floor(initialY / w);
    const p0: [number, number] = [initialX, initialY];
    grid[j0 * cols + i0] = p0;
    active.push(p0);

    while(active.length > 0) {
        const randIndex = Math.floor(random() * active.length);
        const pos = active[randIndex];
        let found = false;
        for (let j = 0; j < k; j++) {
            const a = 2 * Math.PI * random();
            const m = r * (1 + random());
            const px = pos[0] + m * Math.cos(a);
            const py = pos[1] + m * Math.sin(a);

            if (px < 0 || px >= width || py < 0 || py >= height) continue;

            const col = Math.floor(px / w);
            const row = Math.floor(py / w);
            let ok = true;

            for (let dy = -2; dy <= 2 && ok; dy++) {
                for (let dx = -2; dx <= 2 && ok; dx++) {
                    const neighborRow = row + dy;
                    const neighborCol = col + dx;
                    if (neighborRow >= 0 && neighborRow < rows && neighborCol >= 0 && neighborCol < cols) {
                        const neighbor = grid[neighborRow * cols + neighborCol];
                        if (neighbor) {
                            const d = Math.sqrt((neighbor[0] - px)**2 + (neighbor[1] - py)**2);
                            if (d < r) ok = false;
                        }
                    }
                }
            }
            if (ok) {
                const p: [number, number] = [px, py];
                grid[row * cols + col] = p;
                active.push(p);
                found = true;
                break;
            }
        }
        if (!found) {
            active.splice(randIndex, 1);
        }
    }
    
    for (const p of grid) {
        if (p) points.push(p);
    }

    return points;
};

const sampleEdgeAware = (width: number, height: number, numPoints: number, edgeMap: Uint8ClampedArray, edgeWeight: number, random: () => number): [number, number][] => {
    const points: [number, number][] = [];
    const len = edgeMap.length;
    let attempts = 0;
    while(points.length < numPoints && attempts < numPoints * 10) {
        const x = Math.floor(random() * width);
        const y = Math.floor(random() * height);
        const edgeValue = edgeMap[y * width + x] / 255;
        // Higher probability to accept points in high-edge areas
        // Also include a base probability to sample flat areas
        const probability = (1 - edgeWeight) + edgeWeight * edgeValue;
        if (random() < probability) {
            points.push([x, y]);
        }
        attempts++;
    }
    return points;
};

// --- Edge Detection ---

const createEdgeMap = (imageData: ImageData): Uint8ClampedArray => {
    const { width, height, data } = imageData;
    const grayscale = new Uint8ClampedArray(width * height);
    const edgeMap = new Uint8ClampedArray(width * height);

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        grayscale[i / 4] = 0.299 * r + 0.587 * g + 0.114 * b;
    }

    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    let maxGradient = 0;

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let gx = 0, gy = 0;
            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    const idx = (y + ky) * width + (x + kx);
                    const weightX = sobelX[(ky + 1) * 3 + (kx + 1)];
                    const weightY = sobelY[(ky + 1) * 3 + (kx + 1)];
                    gx += grayscale[idx] * weightX;
                    gy += grayscale[idx] * weightY;
                }
            }
            const magnitude = Math.sqrt(gx*gx + gy*gy);
            edgeMap[y * width + x] = magnitude;
            if (magnitude > maxGradient) maxGradient = magnitude;
        }
    }
    // Normalize edge map
    if (maxGradient > 0) {
        for (let i = 0; i < edgeMap.length; i++) {
            edgeMap[i] = (edgeMap[i] / maxGradient) * 255;
        }
    }
    return edgeMap;
};

// --- Geometry & Color Calculations ---

const getCentroid = (vertices: [[number, number], [number, number], [number, number]]): [number, number] => {
    const [a, b, c] = vertices;
    return [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3];
};

const getArea = (vertices: [[number, number], [number, number], [number, number]]): number => {
    const [a, b, c] = vertices;
    return Math.abs((a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1])) / 2);
};

const getAverageColor = (
    vertices: [[number, number], [number, number], [number, number]],
    imageData: ImageData,
    colorSpace: ColorSpace
): [number, number, number] => {
    const [p1, p2, p3] = vertices;
    const { data, width, height } = imageData;

    const minX = Math.max(0, Math.floor(Math.min(p1[0], p2[0], p3[0])));
    const maxX = Math.min(width, Math.ceil(Math.max(p1[0], p2[0], p3[0])));
    const minY = Math.max(0, Math.floor(Math.min(p1[1], p2[1], p3[1])));
    const maxY = Math.min(height, Math.ceil(Math.max(p1[1], p2[1], p3[1])));

    let c1 = 0, c2 = 0, c3 = 0;
    let count = 0;

    // Barycentric coordinate check
    const detT = (p2[1] - p3[1]) * (p1[0] - p3[0]) + (p3[0] - p2[0]) * (p1[1] - p3[1]);

    for (let y = minY; y < maxY; y++) {
        for (let x = minX; x < maxX; x++) {
            const lambda1 = ((p2[1] - p3[1]) * (x - p3[0]) + (p3[0] - p2[0]) * (y - p3[1])) / detT;
            const lambda2 = ((p3[1] - p1[1]) * (x - p3[0]) + (p1[0] - p3[0]) * (y - p3[1])) / detT;
            const lambda3 = 1 - lambda1 - lambda2;

            if (lambda1 >= 0 && lambda2 >= 0 && lambda3 >= 0) {
                const index = (y * width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                
                if(colorSpace === ColorSpace.LAB) {
                    const lab = d3.lab(d3.rgb(r, g, b));
                    c1 += lab.l;
                    c2 += lab.a;
                    c3 += lab.b;
                } else {
                    c1 += r;
                    c2 += g;
                    c3 += b;
                }
                count++;
            }
        }
    }

    if (count === 0) {
       const centerIdx = (Math.floor((minY + maxY) / 2) * width + Math.floor((minX + maxX) / 2)) * 4;
       return [data[centerIdx], data[centerIdx + 1], data[centerIdx + 2]];
    }

    if(colorSpace === ColorSpace.LAB) {
        const avgLab = d3.lab(c1 / count, c2 / count, c3 / count).rgb();
        return [Math.round(avgLab.r), Math.round(avgLab.g), Math.round(avgLab.b)];
    } else {
        return [Math.round(c1 / count), Math.round(c2 / count), Math.round(c3 / count)];
    }
};