import * as THREE from 'three';
import {
  geoBounds,
  geoContains,
  geoEquirectangular,
  geoGraticule10,
  geoPath,
  type GeoPermissibleObjects,
} from 'd3-geo';
import { feature } from 'topojson-client';
import countriesAtlas from 'world-atlas/countries-110m.json';
import { ALL_SOVEREIGN_COUNTRIES } from '../data/sovereignStatesCatalog';
import { resolveCountryFromAtlasName } from '../data/globeFeaturesData';

export type GlobeViewMode = 'satellite' | 'terrain' | 'political' | 'physical';

type TopologyInput = Parameters<typeof feature>[0];
type GeoObjectInput = Parameters<typeof feature>[1];

export interface AtlasFeatureEntry {
  name: string;
  id: string;
  feature: GeoPermissibleObjects & {
    properties?: { name?: string };
    geometry: {
      type: 'Polygon' | 'MultiPolygon';
      coordinates: unknown;
    };
  };
  bbox: [[number, number], [number, number]];
}

let cachedAtlasEntries: AtlasFeatureEntry[] | null = null;

export function getAtlasFeatureEntries(): AtlasFeatureEntry[] {
  if (cachedAtlasEntries) return cachedAtlasEntries;
  const topology = countriesAtlas as unknown as TopologyInput & {
    objects: { countries: GeoObjectInput };
  };
  const collection = feature(
    topology,
    topology.objects.countries
  ) as unknown as {
    features: Array<AtlasFeatureEntry['feature'] & { id?: string | number }>;
  };

  cachedAtlasEntries = collection.features.map((feat, idx) => ({
    name: feat.properties?.name || `Territory-${idx}`,
    id: String(feat.id ?? idx),
    feature: feat,
    bbox: geoBounds(feat as unknown as GeoPermissibleObjects),
  }));
  return cachedAtlasEntries;
}

export function findAtlasEntryByName(
  atlasName: string
): AtlasFeatureEntry | null {
  const target = atlasName.trim().toLowerCase();
  const entries = getAtlasFeatureEntries();
  return (
    entries.find((e) => e.name.toLowerCase() === target) ||
    entries.find(
      (e) =>
        e.name.toLowerCase().includes(target) ||
        target.includes(e.name.toLowerCase())
    ) ||
    null
  );
}

export function findAtlasFeatureAtLatLng(
  lat: number,
  lng: number
): AtlasFeatureEntry | null {
  const entries = getAtlasFeatureEntries();
  const pt: [number, number] = [lng, lat];

  for (const entry of entries) {
    const [[minLng, minLat], [maxLng, maxLat]] = entry.bbox;
    if (lat < minLat - 0.8 || lat > maxLat + 0.8) continue;
    // Handle antimeridian wrap (e.g. Russia, Fiji, USA) gracefully
    const crossesDateLine = maxLng - minLng > 180;
    if (!crossesDateLine && (lng < minLng - 0.8 || lng > maxLng + 0.8)) {
      continue;
    }
    try {
      if (geoContains(entry.feature, pt)) {
        return entry;
      }
    } catch {
      // Skip degenerate polygons
    }
  }
  return null;
}

export function latLngToVector3(
  lat: number,
  lng: number,
  radius: number,
  out = new THREE.Vector3()
): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return out.set(x, y, z);
}

export function vector3ToLatLng(localVec: THREE.Vector3): {
  lat: number;
  lng: number;
} {
  const len = localVec.length() || 1;
  const ny = THREE.MathUtils.clamp(localVec.y / len, -1, 1);
  const nx = localVec.x / len;
  const nz = localVec.z / len;
  const lat = (Math.asin(ny) * 180) / Math.PI;
  let theta = Math.atan2(nz, -nx);
  if (theta < 0) theta += Math.PI * 2;
  let lng = (theta * 180) / Math.PI - 180;
  if (lng > 180) lng -= 360;
  if (lng < -180) lng += 360;
  return { lat, lng };
}

/** Deterministic pseudo-noise helper for natural biome/elevation texture detail */
function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const POLITICAL_PALETTE = [
  '#22c55e',
  '#3b82f6',
  '#f59e0b',
  '#ec4899',
  '#14b8a6',
  '#8b5cf6',
  '#f97316',
  '#06b6d4',
  '#84cc16',
  '#6366f1',
  '#eab308',
  '#10b981',
];

const ELEVATION_SPOTS: Array<{
  lng: number;
  lat: number;
  rx: number;
  ry: number;
  strength: number;
}> = [
  // Himalayas & Tibetan Plateau
  { lng: 86, lat: 32, rx: 14, ry: 7, strength: 1.0 },
  // Pamir / Tian Shan
  { lng: 74, lat: 40, rx: 9, ry: 5, strength: 0.85 },
  // Caucasus
  { lng: 43, lat: 42.5, rx: 4.5, ry: 2.5, strength: 0.7 },
  // Alps
  { lng: 10, lat: 46.5, rx: 6, ry: 2.5, strength: 0.72 },
  // Andes (North -> South)
  { lng: -75, lat: 0, rx: 4, ry: 12, strength: 0.85 },
  { lng: -69, lat: -22, rx: 4.5, ry: 16, strength: 0.92 },
  // Rockies
  { lng: -112, lat: 45, rx: 8, ry: 15, strength: 0.78 },
  // Ethiopian Highlands
  { lng: 39, lat: 9, rx: 6, ry: 5, strength: 0.65 },
  // Atlas Mountains
  { lng: -3, lat: 32, rx: 7, ry: 2.5, strength: 0.55 },
  // Ural Mountains
  { lng: 59, lat: 60, rx: 3, ry: 12, strength: 0.5 },
  // Greenland ice dome
  { lng: -42, lat: 72, rx: 12, ry: 10, strength: 0.85 },
];

const DESERT_ZONES: Array<{ lng: number; lat: number; rx: number; ry: number }> = [
  { lng: 12, lat: 23, rx: 28, ry: 9 }, // Sahara
  { lng: 46, lat: 23, rx: 13, ry: 8 }, // Arabia
  { lng: 62, lat: 41, rx: 10, ry: 5 }, // Kyzylkum / Karakum
  { lng: 104, lat: 42, rx: 13, ry: 5 }, // Gobi
  { lng: 133, lat: -24, rx: 14, ry: 7 }, // Australian Outback
  { lng: -69, lat: -23, rx: 3, ry: 6 }, // Atacama
  { lng: 17, lat: -24, rx: 5, ry: 6 }, // Kalahari / Namib
  { lng: -112, lat: 33, rx: 7, ry: 5 }, // Mojave / Sonora
];

export function createEarthTextureCanvas(
  mode: GlobeViewMode,
  width = 2048,
  height = 1024
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const entries = getAtlasFeatureEntries();
  const projection = geoEquirectangular()
    .scale(width / (2 * Math.PI))
    .translate([width / 2, height / 2]);
  const path = geoPath(projection, ctx);

  // 1. Ocean Bathymetry Base
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  if (mode === 'political') {
    oceanGrad.addColorStop(0, '#0f365c');
    oceanGrad.addColorStop(0.5, '#175b93');
    oceanGrad.addColorStop(1, '#0f365c');
  } else if (mode === 'terrain' || mode === 'physical') {
    oceanGrad.addColorStop(0, '#0a2540');
    oceanGrad.addColorStop(0.25, '#0b3e6d');
    oceanGrad.addColorStop(0.5, '#0c5794');
    oceanGrad.addColorStop(0.75, '#0b3e6d');
    oceanGrad.addColorStop(1, '#0a2540');
  } else {
    // Satellite deep blue ocean
    oceanGrad.addColorStop(0, '#061a33');
    oceanGrad.addColorStop(0.25, '#072a4f');
    oceanGrad.addColorStop(0.5, '#093968');
    oceanGrad.addColorStop(0.75, '#072a4f');
    oceanGrad.addColorStop(1, '#061a33');
  }
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle oceanic ridge & trench visualization for satellite / terrain / physical
  if (mode !== 'political') {
    const drawOceanTrench = (
      lng: number,
      lat: number,
      rxDeg: number,
      ryDeg: number,
      color: string
    ) => {
      const p = projection([lng, lat]);
      if (!p) return;
      const rx = (rxDeg / 360) * width;
      const ry = (ryDeg / 180) * height;
      const g = ctx.createRadialGradient(p[0], p[1], 1, p[0], p[1], Math.max(rx, ry));
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save();
      ctx.translate(p[0], p[1]);
      ctx.scale(1, ry / (rx || 1));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    // Deep abyssal trenches
    drawOceanTrench(145, 16, 10, 14, 'rgba(2, 10, 26, 0.55)'); // Mariana
    drawOceanTrench(-66, 19, 9, 4, 'rgba(2, 10, 26, 0.5)'); // Puerto Rico
    drawOceanTrench(108, -10, 11, 4, 'rgba(2, 10, 26, 0.48)'); // Java Trench
    drawOceanTrench(-173, -24, 6, 14, 'rgba(2, 10, 26, 0.45)'); // Tonga-Kermadec
    // Mid-ocean ridges (slightly shallower brighter blue)
    drawOceanTrench(-32, 22, 7, 25, 'rgba(30, 115, 175, 0.25)');
    drawOceanTrench(-110, -25, 10, 28, 'rgba(30, 115, 175, 0.22)');

    // Continental coastal shelf turquoise halo
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (const entry of entries) {
      ctx.beginPath();
      path(entry.feature);
      ctx.strokeStyle =
        mode === 'satellite'
          ? 'rgba(22, 130, 165, 0.42)'
          : 'rgba(56, 189, 248, 0.36)';
      ctx.lineWidth = (width / 2048) * 14;
      ctx.stroke();
    }
    ctx.restore();
  }

  // 2. Continents / Countries Fill
  entries.forEach((entry) => {
    ctx.beginPath();
    path(entry.feature);

    if (entry.name === 'Antarctica') {
      ctx.fillStyle = mode === 'political' ? '#dbeafe' : '#eef5fb';
      ctx.fill();
      return;
    }

    if (mode === 'political') {
      const h = hashString(entry.name);
      ctx.fillStyle = POLITICAL_PALETTE[h % POLITICAL_PALETTE.length];
      ctx.fill();
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.lineWidth = (width / 2048) * 1.1;
      ctx.stroke();
      return;
    }

    // Satellite / Terrain / Physical base biome tint by centroid latitude
    const [[minLng, minLat], [maxLng, maxLat]] = entry.bbox;
    const midLat = (minLat + maxLat) / 2;
    const absLat = Math.abs(midLat);

    if (mode === 'satellite') {
      if (absLat > 65) {
        ctx.fillStyle = '#c4d8d2';
      } else if (absLat < 16) {
        ctx.fillStyle = '#1b5e36';
      } else if (absLat < 34) {
        ctx.fillStyle = '#4e7744';
      } else {
        ctx.fillStyle = '#2d6a43';
      }
    } else if (mode === 'terrain') {
      ctx.fillStyle = absLat > 66 ? '#d7e2dc' : '#4a7c4f';
    } else {
      // Physical
      ctx.fillStyle = absLat > 66 ? '#e2ece9' : '#588157';
    }
    ctx.fill();

    // Subtle interior texture strokes
    const midLng = (minLng + maxLng) / 2;
    void midLng;
  });

  // 3. Overlay natural biome features (Deserts & High Mountain Relief) for non-political modes
  if (mode !== 'political') {
    ctx.save();
    // Clip to land polygons so desert/elevation shading never bleeds into oceans!
    ctx.beginPath();
    for (const entry of entries) {
      if (entry.name === 'Antarctica') continue;
      path(entry.feature);
    }
    ctx.clip();

    // Deserts / Arid Plateaus
    for (const d of DESERT_ZONES) {
      const p = projection([d.lng, d.lat]);
      if (!p) continue;
      const rx = (d.rx / 360) * width;
      const ry = (d.ry / 180) * height;
      ctx.save();
      ctx.translate(p[0], p[1]);
      ctx.scale(1, ry / (rx || 1));
      const g = ctx.createRadialGradient(0, 0, rx * 0.12, 0, 0, rx);
      if (mode === 'satellite') {
        g.addColorStop(0, 'rgba(198, 164, 108, 0.92)');
        g.addColorStop(0.65, 'rgba(176, 146, 94, 0.55)');
        g.addColorStop(1, 'rgba(176, 146, 94, 0)');
      } else {
        g.addColorStop(0, 'rgba(218, 188, 120, 0.85)');
        g.addColorStop(1, 'rgba(218, 188, 120, 0)');
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Tropical Equatorial Belts
    const eqGrad = ctx.createLinearGradient(0, height * 0.38, 0, height * 0.62);
    eqGrad.addColorStop(0, 'rgba(20, 83, 45, 0)');
    eqGrad.addColorStop(0.5, 'rgba(15, 78, 38, 0.36)');
    eqGrad.addColorStop(1, 'rgba(20, 83, 45, 0)');
    ctx.fillStyle = eqGrad;
    ctx.fillRect(0, height * 0.38, width, height * 0.24);

    // Mountain & High Plateau Elevation Colors
    for (const m of ELEVATION_SPOTS) {
      const p = projection([m.lng, m.lat]);
      if (!p) continue;
      const rx = (m.rx / 360) * width;
      const ry = (m.ry / 180) * height;
      ctx.save();
      ctx.translate(p[0], p[1]);
      ctx.scale(1, ry / (rx || 1));
      const g = ctx.createRadialGradient(0, 0, rx * 0.08, 0, 0, rx);
      if (mode === 'terrain' || mode === 'physical') {
        g.addColorStop(0, `rgba(241, 245, 249, ${0.95 * m.strength})`);
        g.addColorStop(0.32, `rgba(146, 98, 62, ${0.9 * m.strength})`);
        g.addColorStop(0.7, `rgba(180, 140, 88, ${0.65 * m.strength})`);
        g.addColorStop(1, 'rgba(180, 140, 88, 0)');
      } else {
        g.addColorStop(0, `rgba(226, 232, 240, ${0.7 * m.strength})`);
        g.addColorStop(0.38, `rgba(125, 102, 82, ${0.72 * m.strength})`);
        g.addColorStop(1, 'rgba(125, 102, 82, 0)');
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    // Crisp faint coastlines
    ctx.beginPath();
    for (const entry of entries) {
      path(entry.feature);
    }
    ctx.strokeStyle =
      mode === 'satellite'
        ? 'rgba(186, 230, 253, 0.28)'
        : 'rgba(226, 244, 240, 0.42)';
    ctx.lineWidth = (width / 2048) * 0.85;
    ctx.stroke();
  }

  return canvas;
}

export function createEarthBumpCanvas(width = 1024, height = 512): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#080808';
  ctx.fillRect(0, 0, width, height);

  const entries = getAtlasFeatureEntries();
  const projection = geoEquirectangular()
    .scale(width / (2 * Math.PI))
    .translate([width / 2, height / 2]);
  const path = geoPath(projection, ctx);

  // Land base height
  ctx.beginPath();
  for (const entry of entries) {
    path(entry.feature);
  }
  ctx.fillStyle = '#4a4a4a';
  ctx.fill();

  // Mountain ranges extra bump height
  ctx.save();
  ctx.beginPath();
  for (const entry of entries) {
    path(entry.feature);
  }
  ctx.clip();

  for (const m of ELEVATION_SPOTS) {
    const p = projection([m.lng, m.lat]);
    if (!p) continue;
    const rx = (m.rx / 360) * width;
    const ry = (m.ry / 180) * height;
    ctx.save();
    ctx.translate(p[0], p[1]);
    ctx.scale(1, ry / (rx || 1));
    const g = ctx.createRadialGradient(0, 0, 1, 0, 0, rx);
    g.addColorStop(0, `rgba(255, 255, 255, ${0.95 * m.strength})`);
    g.addColorStop(0.5, `rgba(190, 190, 190, ${0.7 * m.strength})`);
    g.addColorStop(1, 'rgba(100, 100, 100, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  return canvas;
}

export function createEarthRoughnessCanvas(
  width = 1024,
  height = 512
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Oceans smoother (darker roughness ~0.35), continents matte (~0.88)
  ctx.fillStyle = '#5a5a5a';
  ctx.fillRect(0, 0, width, height);

  const entries = getAtlasFeatureEntries();
  const projection = geoEquirectangular()
    .scale(width / (2 * Math.PI))
    .translate([width / 2, height / 2]);
  const path = geoPath(projection, ctx);

  ctx.beginPath();
  for (const entry of entries) {
    path(entry.feature);
  }
  ctx.fillStyle = '#e2e2e2';
  ctx.fill();

  return canvas;
}

export function createEarthNightLightsCanvas(
  width = 1024,
  height = 512
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  const projection = geoEquirectangular()
    .scale(width / (2 * Math.PI))
    .translate([width / 2, height / 2]);

  // Plot glowing warm city hubs for all sovereign country capitals + major corridors
  for (const country of ALL_SOVEREIGN_COUNTRIES) {
    const pt = projection([country.lng, country.lat]);
    if (!pt) continue;
    const [x, y] = pt;
    const intensity = Math.min(1, 0.45 + Math.log10(Math.max(1, country.populationM) + 1) * 0.25);
    const radius = (width / 1024) * (4.5 + Math.min(10, country.populationM * 0.04));

    const g = ctx.createRadialGradient(x, y, 0.5, x, y, radius);
    g.addColorStop(0, `rgba(255, 214, 110, ${intensity})`);
    g.addColorStop(0.45, `rgba(251, 146, 60, ${intensity * 0.45})`);
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Small neighbor urban scatter around populous countries
    if (country.populationM > 20) {
      const clusters = Math.min(6, Math.floor(country.populationM / 35) + 2);
      for (let i = 1; i <= clusters; i++) {
        const ang = (i * 2.3999) + hashString(country.iso2);
        const dist = (width / 1024) * (5 + (i * 3.5));
        const sx = x + Math.cos(ang) * dist;
        const sy = y + Math.sin(ang) * dist * 0.65;
        ctx.fillStyle = 'rgba(253, 186, 116, 0.45)';
        ctx.beginPath();
        ctx.arc(sx, sy, (width / 1024) * 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  return canvas;
}

export function createCloudsCanvas(width = 1024, height = 512): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.clearRect(0, 0, width, height);

  // Soft atmospheric cloud swirls (zero randomness shift issues — deterministic spirals)
  for (let i = 0; i < 190; i++) {
    const cx = ((i * 173.3) % 1) * width;
    const cy = (0.12 + (((i * 0.6180339) % 1) * 0.76)) * height;
    const rx = (width / 1024) * (24 + (i % 7) * 16);
    const ry = (height / 512) * (6 + (i % 5) * 5);
    const rot = ((i % 11) - 5) * 0.08;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, rx * 0.05, 0, 0, rx);
    const alpha = 0.08 + (i % 4) * 0.04;
    g.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    g.addColorStop(0.55, `rgba(241, 245, 249, ${alpha * 0.5})`);
    g.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  return canvas;
}

function appendRingSegments(
  ring: number[][],
  radius: number,
  out: number[]
): void {
  if (ring.length < 2) return;
  const pA = new THREE.Vector3();
  const pB = new THREE.Vector3();
  for (let i = 0; i < ring.length - 1; i++) {
    const [lng1, lat1] = ring[i];
    const [lng2, lat2] = ring[i + 1];
    // Skip antimeridian wrap jumps
    if (Math.abs(lng2 - lng1) > 180) continue;
    latLngToVector3(lat1, lng1, radius, pA);
    latLngToVector3(lat2, lng2, radius, pB);
    out.push(pA.x, pA.y, pA.z, pB.x, pB.y, pB.z);
  }
}

export function buildAllBordersBufferGeometry(
  radius = 1.0025
): THREE.BufferGeometry {
  const entries = getAtlasFeatureEntries();
  const positions: number[] = [];

  for (const entry of entries) {
    const geom = entry.feature.geometry;
    if (geom.type === 'Polygon') {
      const rings = geom.coordinates as number[][][];
      for (const ring of rings) {
        appendRingSegments(ring, radius, positions);
      }
    } else if (geom.type === 'MultiPolygon') {
      const polys = geom.coordinates as number[][][][];
      for (const poly of polys) {
        for (const ring of poly) {
          appendRingSegments(ring, radius, positions);
        }
      }
    }
  }

  const buffer = new THREE.BufferGeometry();
  buffer.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  return buffer;
}

export function buildSingleCountryBorderGeometry(
  atlasName: string,
  radius = 1.006
): THREE.BufferGeometry | null {
  const entry = findAtlasEntryByName(atlasName);
  if (!entry) return null;

  const positions: number[] = [];
  const geom = entry.feature.geometry;
  if (geom.type === 'Polygon') {
    const rings = geom.coordinates as number[][][];
    for (const ring of rings) {
      appendRingSegments(ring, radius, positions);
    }
  } else if (geom.type === 'MultiPolygon') {
    const polys = geom.coordinates as number[][][][];
    for (const poly of polys) {
      for (const ring of poly) {
        appendRingSegments(ring, radius, positions);
      }
    }
  }

  if (positions.length === 0) return null;
  const buffer = new THREE.BufferGeometry();
  buffer.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  return buffer;
}

export function buildGraticuleGeometry(radius = 1.0018): THREE.BufferGeometry {
  const graticule = geoGraticule10();
  const positions: number[] = [];
  for (const line of graticule.coordinates) {
    appendRingSegments(line as number[][], radius, positions);
  }
  const buffer = new THREE.BufferGeometry();
  buffer.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  return buffer;
}

export function buildGeodesicArcGeometry(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  baseRadius = 1.005,
  peakAltitude = 0.24,
  segments = 56
): THREE.BufferGeometry {
  const vStart = latLngToVector3(lat1, lng1, 1).normalize();
  const vEnd = latLngToVector3(lat2, lng2, 1).normalize();
  const points: THREE.Vector3[] = [];
  const tmp = new THREE.Vector3();

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    tmp.copy(vStart).lerp(vEnd, t).normalize();
    const arcLift = Math.sin(t * Math.PI) * peakAltitude;
    points.push(tmp.clone().multiplyScalar(baseRadius + arcLift));
  }

  return new THREE.BufferGeometry().setFromPoints(points);
}

/** Check whether a raw clicked point maps to a Sovereign country via polygon containment */
export function pickCountryAtLatLng(lat: number, lng: number) {
  const entry = findAtlasFeatureAtLatLng(lat, lng);
  if (!entry) return null;
  return resolveCountryFromAtlasName(entry.name);
}
