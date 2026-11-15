import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ChevronDown,
  ChevronUp,
  Expand,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { GeoCountry } from '../data/geoWorldData';
import {
  ALL_SOVEREIGN_COUNTRIES,
  type FullCountryLesson,
} from '../data/sovereignStatesCatalog';
import {
  ALL_GLOBE_FEATURES,
  findNearestCountryByLatLng,
  type GlobeGeoFeature,
} from '../data/globeFeaturesData';
import {
  buildAllBordersBufferGeometry,
  buildGeodesicArcGeometry,
  buildGraticuleGeometry,
  buildSingleCountryBorderGeometry,
  createCloudsCanvas,
  createEarthBumpCanvas,
  createEarthNightLightsCanvas,
  createEarthRoughnessCanvas,
  createEarthTextureCanvas,
  latLngToVector3,
  pickCountryAtLatLng,
  vector3ToLatLng,
  type GlobeViewMode,
} from '../utils/earthTextures';

export interface GlobeLayerToggles {
  borders: boolean;
  grid: boolean;
  clouds: boolean;
  nightLights: boolean;
  labels: boolean;
  capitals: boolean;
  landmarks: boolean;
  mountains: boolean;
  rivers: boolean;
  islands: boolean;
  oceans: boolean;
}

export const DEFAULT_GLOBE_LAYERS: GlobeLayerToggles = {
  borders: true,
  grid: true,
  clouds: true,
  nightLights: true,
  labels: true,
  capitals: true,
  landmarks: false,
  mountains: false,
  rivers: false,
  islands: false,
  oceans: false,
};

interface EarthGlobe3DProps {
  countries?: GeoCountry[];
  selectedCountry?: GeoCountry | null;
  onSelectCountry?: (country: GeoCountry) => void;
  selectedSovereignCountry?: FullCountryLesson | null;
  onSelectSovereignCountry?: (
    country: FullCountryLesson,
    coords: { lat: number; lng: number }
  ) => void;
  highlightedIso2s?: string[];
  onSelectGeoFeature?: (feature: GlobeGeoFeature) => void;
  onCursorCoords?: (coords: { lat: number; lng: number } | null) => void;
  isDark: boolean;
  viewMode?: GlobeViewMode;
  onChangeViewMode?: (mode: GlobeViewMode) => void;
  layers?: GlobeLayerToggles;
  compareArc?: {
    from: { lat: number; lng: number; name: string };
    to: { lat: number; lng: number; name: string };
  } | null;
  flyToCommand?: {
    lat: number;
    lng: number;
    zoomDistance?: number;
    seq: number;
  } | null;
  customFeaturePins?: GlobeGeoFeature[];
  disablePinAutoRotate?: boolean;
  heightClass?: string;
  allowFullscreen?: boolean;
  showModeChips?: boolean;
}

interface ProjectedLabel {
  id: string;
  text: string;
  subtext?: string;
  x: number;
  y: number;
  kind: 'country' | 'capital' | 'feature' | 'hover';
}

const _vec3 = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _worldPos = new THREE.Vector3();
const _camDir = new THREE.Vector3();
const _normDir = new THREE.Vector3();
const _targetQuat = new THREE.Quaternion();
const _upAxis = new THREE.Vector3(0, 1, 0);

const FEATURE_COLORS: Record<GlobeGeoFeature['category'], number> = {
  landmark: 0xf59e0b,
  mountain: 0xe2e8f0,
  river: 0x22d3ee,
  island: 0x10b981,
  ocean: 0x3b82f6,
};

export function EarthGlobe3D({
  countries = [],
  selectedCountry = null,
  onSelectCountry,
  selectedSovereignCountry = null,
  onSelectSovereignCountry,
  highlightedIso2s = [],
  onSelectGeoFeature,
  onCursorCoords,
  isDark,
  viewMode = 'satellite',
  onChangeViewMode,
  layers = DEFAULT_GLOBE_LAYERS,
  compareArc = null,
  flyToCommand = null,
  customFeaturePins,
  disablePinAutoRotate = false,
  heightClass = 'h-[430px] sm:h-[480px]',
  allowFullscreen = true,
  showModeChips = false,
}: EarthGlobe3DProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [autoRotate, setAutoRotate] = useState(!disablePinAutoRotate);
  const [dockOpen, setDockOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [projectedLabels, setProjectedLabels] = useState<ProjectedLabel[]>([]);

  const autoRotateRef = useRef(autoRotate);
  const onSelectCountryRef = useRef(onSelectCountry);
  const onSelectSovereignRef = useRef(onSelectSovereignCountry);
  const onSelectFeatureRef = useRef(onSelectGeoFeature);
  const onCursorCoordsRef = useRef(onCursorCoords);
  const layersRef = useRef(layers);
  const countriesRef = useRef(countries);
  const customFeaturePinsRef = useRef(customFeaturePins);

  const activeFocusLat =
    selectedSovereignCountry?.lat ?? selectedCountry?.lat ?? 41.3;
  const activeFocusLng =
    selectedSovereignCountry?.lng ?? selectedCountry?.lng ?? 64.6;
  const activeAtlasName =
    selectedSovereignCountry?.atlasName ?? selectedCountry?.atlasName ?? null;
  const activeSelectedIso2 =
    selectedSovereignCountry?.iso2 ?? selectedCountry?.code ?? null;

  const focusTriggerRef = useRef<{
    lat: number;
    lng: number;
    zoomDistance?: number;
    active: boolean;
  }>({
    lat: activeFocusLat,
    lng: activeFocusLng,
    active: false,
  });

  // Scene refs for dynamic updates without rebuilding WebGL context
  const sceneHandlesRef = useRef<{
    renderer: THREE.WebGLRenderer;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    globeGroup: THREE.Group;
    earthMat: THREE.MeshStandardMaterial;
    cloudsMesh: THREE.Mesh;
    bordersLine: THREE.LineSegments;
    gridLine: THREE.LineSegments;
    keyLight: THREE.DirectionalLight;
    ambientLight: THREE.AmbientLight;
    selectedBorderGroup: THREE.Group;
    compareArcGroup: THREE.Group;
    featurePinsGroup: THREE.Group;
    riverLinesGroup: THREE.Group;
    capitalPinsGroup: THREE.Group;
    pinHitTargets: THREE.Mesh[];
    featureHitTargets: THREE.Mesh[];
    texturesCache: Partial<Record<GlobeViewMode, THREE.CanvasTexture>>;
    borderGeosToDispose: THREE.BufferGeometry[];
  } | null>(null);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    onSelectCountryRef.current = onSelectCountry;
  }, [onSelectCountry]);

  useEffect(() => {
    onSelectSovereignRef.current = onSelectSovereignCountry;
  }, [onSelectSovereignCountry]);

  useEffect(() => {
    onSelectFeatureRef.current = onSelectGeoFeature;
  }, [onSelectGeoFeature]);

  useEffect(() => {
    onCursorCoordsRef.current = onCursorCoords;
  }, [onCursorCoords]);

  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);

  useEffect(() => {
    countriesRef.current = countries;
  }, [countries]);

  useEffect(() => {
    customFeaturePinsRef.current = customFeaturePins;
  }, [customFeaturePins]);

  // Trigger camera slerp when flyToCommand or selected country changes
  useEffect(() => {
    if (!flyToCommand) return;
    focusTriggerRef.current = {
      lat: flyToCommand.lat,
      lng: flyToCommand.lng,
      zoomDistance: flyToCommand.zoomDistance,
      active: true,
    };
  }, [flyToCommand]);

  useEffect(() => {
    if (selectedSovereignCountry) {
      focusTriggerRef.current = {
        lat: selectedSovereignCountry.lat,
        lng: selectedSovereignCountry.lng,
        active: true,
      };
    } else if (selectedCountry) {
      focusTriggerRef.current = {
        lat: selectedCountry.lat,
        lng: selectedCountry.lng,
        active: true,
      };
    }
  }, [selectedSovereignCountry, selectedCountry]);

  const activeFeaturesToRender = useMemo(() => {
    if (customFeaturePins) return customFeaturePins;
    return ALL_GLOBE_FEATURES.filter((f) => {
      if (f.category === 'landmark') return layers.landmarks;
      if (f.category === 'mountain') return layers.mountains;
      if (f.category === 'river') return layers.rivers;
      if (f.category === 'island') return layers.islands;
      if (f.category === 'ocean') return layers.oceans;
      return false;
    });
  }, [customFeaturePins, layers]);

  // Initialize Three.js WebGL Engine ONCE per mount/theme change
  useEffect(() => {
    const mount = containerRef.current;
    if (!mount) return;

    const isSoftwareGl = (() => {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2') || probe.getContext('webgl');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglFailed(true);
      return;
    }

    const initialW = mount.clientWidth || 640;
    const initialH = mount.clientHeight || 460;
    const texW = isSoftwareGl ? 1024 : 2048;
    const texH = isSoftwareGl ? 512 : 1024;
    const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    renderer.setSize(initialW, initialH);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglFailed(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    const scene = new THREE.Scene();

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    scene.environment = envTexture;
    scene.environmentIntensity = 0.45;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(38, initialW / initialH, 0.1, 100);
    camera.position.set(0, 0.4, 3.05);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.065;
    controls.minDistance = 1.48;
    controls.maxDistance = 4.6;
    controls.rotateSpeed = 0.62;
    controls.zoomSpeed = 0.85;

    controls.addEventListener('start', () => {
      focusTriggerRef.current.active = false;
    });

    // Sun + Rim + Ambient lighting
    const keyLight = new THREE.DirectionalLight(0xfff7e6, 2.35);
    keyLight.position.set(5, 2.6, 4.5);
    scene.add(keyLight);

    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.55);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x0f172a, 0.5);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.65);
    rimLight.position.set(-4.5, -1.5, -4);
    scene.add(rimLight);

    // Composite Earth Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 1. Primary Earth Sphere with Multi-Mode Albedo + Bump + Roughness + Night Lights
    const initialAlbedo = new THREE.CanvasTexture(
      createEarthTextureCanvas(viewMode, texW, texH)
    );
    initialAlbedo.colorSpace = THREE.SRGBColorSpace;
    initialAlbedo.anisotropy = maxAniso;

    const bumpTex = new THREE.CanvasTexture(createEarthBumpCanvas(1024, 512));
    bumpTex.colorSpace = THREE.NoColorSpace;

    const roughTex = new THREE.CanvasTexture(createEarthRoughnessCanvas(1024, 512));
    roughTex.colorSpace = THREE.NoColorSpace;

    const nightTex = new THREE.CanvasTexture(createEarthNightLightsCanvas(1024, 512));
    nightTex.colorSpace = THREE.SRGBColorSpace;

    const earthGeo = new THREE.SphereGeometry(1, 72, 54);
    const earthMat = new THREE.MeshStandardMaterial({
      map: initialAlbedo,
      bumpMap: bumpTex,
      bumpScale: 0.022,
      roughnessMap: roughTex,
      roughness: 0.86,
      metalness: 0.06,
      emissiveMap: nightTex,
      emissive: new THREE.Color(0xfbbf24),
      emissiveIntensity: layersRef.current.nightLights ? 0.65 : 0.0,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earthMesh);

    const texturesCache: Partial<Record<GlobeViewMode, THREE.CanvasTexture>> = {
      [viewMode]: initialAlbedo,
    };

    // 2. Animated Cloud Sphere
    const cloudsTex = new THREE.CanvasTexture(createCloudsCanvas(1024, 512));
    cloudsTex.colorSpace = THREE.SRGBColorSpace;
    const cloudsGeo = new THREE.SphereGeometry(1.015, 56, 42);
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: cloudsTex,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      roughness: 0.9,
      metalness: 0,
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    cloudsMesh.visible = layersRef.current.clouds;
    globeGroup.add(cloudsMesh);

    // 3. Atmospheric Fresnel Shell
    const atmosGeo = new THREE.SphereGeometry(1.06, 56, 42);
    const atmosMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      uniforms: {
        uColor: { value: new THREE.Color(0x38bdf8) },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        uniform vec3 uColor;
        void main() {
          float intensity = pow(0.66 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.6);
          gl_FragColor = vec4(uColor, clamp(intensity, 0.0, 0.6));
        }
      `,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    globeGroup.add(atmosMesh);

    // 4. Country Borders Overlay (3D Spherical Segments)
    const bordersGeo = buildAllBordersBufferGeometry(1.0025);
    const bordersMat = new THREE.LineBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.38,
    });
    const bordersLine = new THREE.LineSegments(bordersGeo, bordersMat);
    bordersLine.visible = layersRef.current.borders;
    globeGroup.add(bordersLine);

    // 5. Lat/Lng Graticule Grid
    const gridGeo = buildGraticuleGeometry(1.0018);
    const gridMat = new THREE.LineBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.16,
    });
    const gridLine = new THREE.LineSegments(gridGeo, gridMat);
    gridLine.visible = layersRef.current.grid;
    globeGroup.add(gridLine);

    // 6. Selected / Highlighted Country Boundary Group
    const selectedBorderGroup = new THREE.Group();
    globeGroup.add(selectedBorderGroup);

    // 7. Country Comparison Geodesic Arc Group
    const compareArcGroup = new THREE.Group();
    globeGroup.add(compareArcGroup);

    // 8. Geographic Feature Pins & River Splines Groups
    const featurePinsGroup = new THREE.Group();
    const riverLinesGroup = new THREE.Group();
    const capitalPinsGroup = new THREE.Group();
    globeGroup.add(featurePinsGroup, riverLinesGroup, capitalPinsGroup);

    // 9. Tilted Orbital Accent Ring
    const orbitGeo = new THREE.TorusGeometry(1.28, 0.003, 10, 128);
    const orbitMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.3,
      metalness: 0.7,
      transparent: true,
      opacity: 0.3,
    });
    const orbitRing = new THREE.Mesh(orbitGeo, orbitMat);
    orbitRing.rotation.x = Math.PI / 2.25;
    orbitRing.rotation.y = 0.2;
    scene.add(orbitRing);

    // 10. Deep Space Starfield
    const starCount = 420;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 7 + (i % 9) * 1.2;
      const theta = i * 2.399963;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / starCount);
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: isDark ? 0xe2e8f0 : 0x94a3b8,
      size: 0.045,
      transparent: true,
      opacity: isDark ? 0.8 : 0.45,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // Initial Capital / Country Beacon Pins (major countries from props or key capitals)
    const pinHitTargets: THREE.Mesh[] = [];
    const pinBaseGeo = new THREE.CylinderGeometry(0.011, 0.014, 0.005, 12);
    const pinStemGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.028, 8);
    const pinHeadGeo = new THREE.SphereGeometry(0.014, 12, 10);
    const pinHitGeo = new THREE.SphereGeometry(0.042, 10, 8);
    const pinBaseMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.4,
    });
    const pinHitMat = new THREE.MeshBasicMaterial({ visible: false });
    const capitalHeadMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.55,
      roughness: 0.25,
      metalness: 0.25,
    });

    const sourceCountries: Array<{
      id: string;
      name: string;
      code: string;
      lat: number;
      lng: number;
      geo?: GeoCountry;
    }> =
      countriesRef.current.length > 0
        ? countriesRef.current.map((c) => ({
            id: c.id,
            name: c.name,
            code: c.code,
            lat: c.lat,
            lng: c.lng,
            geo: c,
          }))
        : ALL_SOVEREIGN_COUNTRIES.filter(
            (c) => c.populationM >= 22 || c.iso2 === 'UZ' || c.iso2 === 'CH'
          ).map((c) => ({
            id: c.iso2,
            name: c.nameUz,
            code: c.iso2,
            lat: c.lat,
            lng: c.lng,
          }));

    sourceCountries.forEach((c) => {
      const grp = new THREE.Group();
      const pos = latLngToVector3(c.lat, c.lng, 1.003);
      grp.position.copy(pos);
      grp.quaternion.setFromUnitVectors(
        _upAxis,
        _normDir.copy(pos).normalize()
      );
      const b = new THREE.Mesh(pinBaseGeo, pinBaseMat);
      const s = new THREE.Mesh(pinStemGeo, pinBaseMat);
      s.position.y = 0.014;
      const h = new THREE.Mesh(pinHeadGeo, capitalHeadMat);
      h.position.y = 0.032;
      const hit = new THREE.Mesh(pinHitGeo, pinHitMat);
      hit.position.y = 0.025;
      hit.userData = { pinCountry: c };
      grp.add(b, s, h, hit);
      capitalPinsGroup.add(grp);
      pinHitTargets.push(hit);
    });
    capitalPinsGroup.visible = layersRef.current.capitals;

    const featureHitTargets: THREE.Mesh[] = [];
    const borderGeosToDispose: THREE.BufferGeometry[] = [];

    sceneHandlesRef.current = {
      renderer,
      camera,
      controls,
      globeGroup,
      earthMat,
      cloudsMesh,
      bordersLine,
      gridLine,
      keyLight,
      ambientLight,
      selectedBorderGroup,
      compareArcGroup,
      featurePinsGroup,
      riverLinesGroup,
      capitalPinsGroup,
      pinHitTargets,
      featureHitTargets,
      texturesCache,
      borderGeosToDispose,
    };

    // Raycaster for Feature Pins -> Country Pins -> Globe Sphere Polygon Lookup!
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const handlePointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(
        e.clientX - pointerDownPos.x,
        e.clientY - pointerDownPos.y
      );
      if (dist > 7) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      // 1. Check custom/layer feature pins first (Landmarks, Mountains, Oceans, Islands, Rivers)
      if (featureHitTargets.length > 0 && onSelectFeatureRef.current) {
        const fHits = raycaster.intersectObjects(featureHitTargets, false);
        if (fHits.length > 0) {
          const pickedFeat = fHits[0].object.userData.geoFeature as
            | GlobeGeoFeature
            | undefined;
          if (pickedFeat) {
            onSelectFeatureRef.current(pickedFeat);
            return;
          }
        }
      }

      // 2. Check capital pins if HomePage-style pin handler exists
      const pHits = raycaster.intersectObjects(pinHitTargets, false);
      if (pHits.length > 0) {
        const pinData = pHits[0].object.userData.pinCountry as
          | { code: string; geo?: GeoCountry }
          | undefined;
        if (pinData?.geo && onSelectCountryRef.current) {
          onSelectCountryRef.current(pinData.geo);
          if (!onSelectSovereignRef.current) return;
        }
      }

      // 3. Exact raycast onto the Earth sphere surface -> lat/lng -> real World-Atlas polygon lookup!
      const earthHits = raycaster.intersectObject(earthMesh, false);
      if (earthHits.length > 0) {
        const localPt = earthMesh.worldToLocal(earthHits[0].point.clone());
        const { lat, lng } = vector3ToLatLng(localPt);

        let matched = pickCountryAtLatLng(lat, lng);
        if (!matched) {
          matched = findNearestCountryByLatLng(lat, lng, 7.5);
        }

        if (matched) {
          if (onSelectSovereignRef.current) {
            onSelectSovereignRef.current(matched, { lat, lng });
          }
          if (onSelectCountryRef.current) {
            const matchingGeo =
              countriesRef.current.find((c) => c.code === matched.iso2) || {
                id: matched.iso2.toLowerCase(),
                code: matched.iso2,
                atlasName: matched.atlasName,
                name: matched.nameUz,
                capital: matched.capitalUz,
                continent: matched.continent,
                population: `${matched.populationM} mln`,
                areaKm2: `${matched.areaKm2.toLocaleString('uz-UZ')} km²`,
                languages: [matched.languagesUz],
                currency: matched.currencyUz,
                lat: matched.lat,
                lng: matched.lng,
                shortNote: matched.geoCharacteristics,
                facts: matched.tenGeoFacts.slice(0, 3),
                landmarks: matched.landmarksUz,
              };
            onSelectCountryRef.current(matchingGeo);
          }
        }
      }
    };

    let lastHoverCheck = 0;
    const handlePointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const fHits = raycaster.intersectObjects(featureHitTargets, false);
      if (fHits.length > 0) {
        const feat = fHits[0].object.userData.geoFeature as
          | GlobeGeoFeature
          | undefined;
        renderer.domElement.style.cursor = 'pointer';
        setHoveredName(feat ? feat.nameUz : null);
        return;
      }

      const now = performance.now();
      if (now - lastHoverCheck < 55) return;
      lastHoverCheck = now;

      const earthHits = raycaster.intersectObject(earthMesh, false);
      if (earthHits.length > 0) {
        const localPt = earthMesh.worldToLocal(earthHits[0].point.clone());
        const coords = vector3ToLatLng(localPt);
        setCursorCoords(coords);
        onCursorCoordsRef.current?.(coords);

        const hovered = pickCountryAtLatLng(coords.lat, coords.lng);
        setHoveredName(hovered ? hovered.nameUz : null);
        renderer.domElement.style.cursor = hovered ? 'pointer' : 'grab';
      } else {
        setCursorCoords(null);
        setHoveredName(null);
        onCursorCoordsRef.current?.(null);
        renderer.domElement.style.cursor = 'grab';
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);

    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth || 640;
      const h = mount.clientHeight || 460;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Face Eurasia / Uzbekistan cleanly on boot
    globeGroup.rotation.y = -((64 + 90) * Math.PI) / 180;
    globeGroup.rotation.x = (24 * Math.PI) / 180;

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let frameId = 0;
    let disposed = false;
    const clock = new THREE.Clock();
    let labelFrameCounter = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    }

    const labelCandidates = ALL_SOVEREIGN_COUNTRIES.filter((c) =>
      [
        'UZ', 'KZ', 'RU', 'CN', 'IN', 'JP', 'TR', 'SA', 'GB', 'FR', 'DE', 'IT',
        'ES', 'US', 'CA', 'MX', 'BR', 'AR', 'EG', 'ZA', 'NG', 'AU', 'ID',
      ].includes(c.iso2)
    );

    function tick() {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.1);

      if (focusTriggerRef.current.active) {
        const targetPos = latLngToVector3(
          focusTriggerRef.current.lat,
          focusTriggerRef.current.lng,
          1,
          _vec3B
        ).normalize();
        const desiredCamDir = _vec3.set(0, 0.08, 1).normalize();
        _targetQuat.setFromUnitVectors(targetPos, desiredCamDir);
        globeGroup.quaternion.slerp(_targetQuat, 1 - Math.exp(-4.8 * delta));

        if (focusTriggerRef.current.zoomDistance) {
          const curDist = camera.position.length();
          const nextDist = THREE.MathUtils.lerp(
            curDist,
            focusTriggerRef.current.zoomDistance,
            1 - Math.exp(-4.5 * delta)
          );
          camera.position.setLength(nextDist);
        }

        if (globeGroup.quaternion.angleTo(_targetQuat) < 0.012) {
          focusTriggerRef.current.active = false;
        }
      } else if (autoRotateRef.current) {
        globeGroup.rotateOnWorldAxis(_upAxis, delta * 0.12);
      }

      if (cloudsMesh.visible) {
        cloudsMesh.rotation.y += delta * 0.018;
      }
      orbitRing.rotation.z += delta * 0.06;

      controls.update();
      renderer.render(scene, camera);

      // Update projected 2D DOM labels at ~12fps to keep React lightweight
      labelFrameCounter++;
      if (labelFrameCounter % 5 === 0 && mount) {
        if (!layersRef.current.labels) {
          setProjectedLabels((prev) => (prev.length === 0 ? prev : []));
        } else {
          const w = mount.clientWidth;
          const h = mount.clientHeight;
          const nextLabels: ProjectedLabel[] = [];
          const camDir = _camDir.copy(camera.position).normalize();

          const pushIfFront = (
            id: string,
            text: string,
            lat: number,
            lng: number,
            kind: ProjectedLabel['kind'],
            subtext?: string
          ) => {
            latLngToVector3(lat, lng, 1.02, _worldPos);
            _worldPos.applyQuaternion(globeGroup.quaternion);
            _normDir.copy(_worldPos).normalize();
            const facing = _normDir.dot(camDir);
            if (facing < 0.28) return;

            _vec3.copy(_worldPos).project(camera);
            const sx = (_vec3.x * 0.5 + 0.5) * w;
            const sy = (-_vec3.y * 0.5 + 0.5) * h;
            if (sx < 24 || sx > w - 24 || sy < 24 || sy > h - 36) return;
            nextLabels.push({ id, text, subtext, x: sx, y: sy, kind });
          };

          const zoomDist = camera.position.length();
          const pool =
            zoomDist < 2.25 ? ALL_SOVEREIGN_COUNTRIES.slice(0, 55) : labelCandidates;
          for (const c of pool) {
            if (nextLabels.length >= 16) break;
            pushIfFront(c.iso2, c.nameUz, c.lat, c.lng, 'country', c.capitalUz);
          }

          if (customFeaturePinsRef.current) {
            for (const f of customFeaturePinsRef.current.slice(0, 10)) {
              pushIfFront(f.id, f.nameUz, f.lat, f.lng, 'feature');
            }
          }

          setProjectedLabels(nextLabels);
        }
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);

      controls.dispose();
      earthGeo.dispose();
      earthMat.dispose();
      Object.values(texturesCache).forEach((t) => t?.dispose());
      bumpTex.dispose();
      roughTex.dispose();
      nightTex.dispose();
      cloudsGeo.dispose();
      cloudsMat.dispose();
      cloudsTex.dispose();
      atmosGeo.dispose();
      atmosMat.dispose();
      bordersGeo.dispose();
      bordersMat.dispose();
      gridGeo.dispose();
      gridMat.dispose();
      orbitGeo.dispose();
      orbitMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      pinBaseGeo.dispose();
      pinStemGeo.dispose();
      pinHeadGeo.dispose();
      pinHitGeo.dispose();
      pinBaseMat.dispose();
      pinHitMat.dispose();
      capitalHeadMat.dispose();
      borderGeosToDispose.forEach((g) => g.dispose());
      envTexture.dispose();
      renderer.dispose();
      sceneHandlesRef.current = null;
    };
    // Rebuild WebGL scene only if isDark or countries list changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark, countries]);

  // Dynamically update ViewMode texture without losing rotation or WebGL context!
  useEffect(() => {
    const h = sceneHandlesRef.current;
    if (!h) return;
    let tex = h.texturesCache[viewMode];
    if (!tex) {
      const canvas = createEarthTextureCanvas(viewMode, 2048, 1024);
      tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = Math.min(8, h.renderer.capabilities.getMaxAnisotropy());
      h.texturesCache[viewMode] = tex;
    }
    h.earthMat.map = tex;
    h.earthMat.needsUpdate = true;
  }, [viewMode]);

  // Dynamically toggle layers (borders, grid, clouds, nightLights, capitals)
  useEffect(() => {
    const h = sceneHandlesRef.current;
    if (!h) return;
    h.bordersLine.visible = layers.borders;
    h.gridLine.visible = layers.grid;
    h.cloudsMesh.visible = layers.clouds;
    h.capitalPinsGroup.visible = layers.capitals;
    h.earthMat.emissiveIntensity = layers.nightLights ? 0.72 : 0.0;
    h.keyLight.intensity = layers.nightLights ? 2.4 : 1.75;
    h.ambientLight.intensity = layers.nightLights ? 0.42 : 1.25;
  }, [layers]);

  // Update 3D Selected + Highlighted Country Boundary Outlines
  useEffect(() => {
    const h = sceneHandlesRef.current;
    if (!h) return;

    while (h.selectedBorderGroup.children.length > 0) {
      const child = h.selectedBorderGroup.children[0] as THREE.Object3D;
      h.selectedBorderGroup.remove(child);
      if ('geometry' in child && child.geometry instanceof THREE.BufferGeometry) {
        child.geometry.dispose();
      }
      if ('material' in child && child.material instanceof THREE.Material) {
        child.material.dispose();
      }
    }

    if (activeAtlasName) {
      const geo = buildSingleCountryBorderGeometry(activeAtlasName, 1.006);
      if (geo) {
        const mat = new THREE.LineBasicMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: 0.98,
        });
        h.selectedBorderGroup.add(new THREE.LineSegments(geo, mat));
      }
    }

    for (const iso of highlightedIso2s) {
      if (iso === activeSelectedIso2) continue;
      const c = ALL_SOVEREIGN_COUNTRIES.find((x) => x.iso2 === iso);
      if (!c) continue;
      const geo = buildSingleCountryBorderGeometry(c.atlasName, 1.005);
      if (geo) {
        const mat = new THREE.LineBasicMaterial({
          color: 0x10b981,
          transparent: true,
          opacity: 0.9,
        });
        h.selectedBorderGroup.add(new THREE.LineSegments(geo, mat));
      }
    }
  }, [activeAtlasName, activeSelectedIso2, highlightedIso2s]);

  // Update Country Comparison Geodesic Arc
  useEffect(() => {
    const h = sceneHandlesRef.current;
    if (!h) return;
    while (h.compareArcGroup.children.length > 0) {
      const child = h.compareArcGroup.children[0] as THREE.Object3D;
      h.compareArcGroup.remove(child);
      if ('geometry' in child && child.geometry instanceof THREE.BufferGeometry) {
        child.geometry.dispose();
      }
      if ('material' in child && child.material instanceof THREE.Material) {
        child.material.dispose();
      }
    }
    if (!compareArc) return;

    const arcGeo = buildGeodesicArcGeometry(
      compareArc.from.lat,
      compareArc.from.lng,
      compareArc.to.lat,
      compareArc.to.lng,
      1.006,
      0.26
    );
    const arcMat = new THREE.LineBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.95,
    });
    h.compareArcGroup.add(new THREE.Line(arcGeo, arcMat));

    const beaconGeo = new THREE.SphereGeometry(0.022, 14, 12);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.8,
    });
    for (const pt of [compareArc.from, compareArc.to]) {
      const m = new THREE.Mesh(beaconGeo, beaconMat);
      latLngToVector3(pt.lat, pt.lng, 1.01, m.position);
      h.compareArcGroup.add(m);
    }
  }, [compareArc]);

  // Update Composite 3D Feature Markers & Glowing River Lines
  useEffect(() => {
    const h = sceneHandlesRef.current;
    if (!h) return;

    h.featureHitTargets.length = 0;

    const clearGroup = (group: THREE.Group) => {
      while (group.children.length > 0) {
        const obj = group.children[0];
        group.remove(obj);
        obj.traverse((child) => {
          if ('geometry' in child && child.geometry instanceof THREE.BufferGeometry) {
            child.geometry.dispose();
          }
          if ('material' in child && child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        });
      }
    };

    clearGroup(h.featurePinsGroup);
    clearGroup(h.riverLinesGroup);

    if (activeFeaturesToRender.length === 0) return;

    const hitGeo = new THREE.SphereGeometry(0.055, 10, 8);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const pedGeo = new THREE.CylinderGeometry(0.016, 0.02, 0.006, 12);
    const coneGeo = new THREE.ConeGeometry(0.02, 0.048, 4);
    const octGeo = new THREE.OctahedronGeometry(0.02, 0);
    const ringGeo = new THREE.TorusGeometry(0.026, 0.004, 8, 24);
    const sphereGeo = new THREE.SphereGeometry(0.018, 12, 10);

    for (const feat of activeFeaturesToRender) {
      const color = FEATURE_COLORS[feat.category];
      const pinGrp = new THREE.Group();
      const pos = latLngToVector3(feat.lat, feat.lng, 1.006);
      pinGrp.position.copy(pos);
      pinGrp.quaternion.setFromUnitVectors(_upAxis, pos.clone().normalize());

      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.65,
        roughness: 0.25,
        metalness: 0.3,
      });

      const ped = new THREE.Mesh(pedGeo, mat);
      pinGrp.add(ped);

      if (feat.category === 'mountain') {
        const cone = new THREE.Mesh(coneGeo, mat);
        cone.position.y = 0.026;
        pinGrp.add(cone);
      } else if (feat.category === 'landmark') {
        const oct = new THREE.Mesh(octGeo, mat);
        oct.position.y = 0.036;
        pinGrp.add(oct);
      } else if (feat.category === 'ocean' || feat.category === 'island') {
        const ring = new THREE.Mesh(ringGeo, mat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.008;
        const orb = new THREE.Mesh(sphereGeo, mat);
        orb.position.y = 0.022;
        pinGrp.add(ring, orb);
      } else {
        const orb = new THREE.Mesh(sphereGeo, mat);
        orb.position.y = 0.024;
        pinGrp.add(orb);
      }

      const hit = new THREE.Mesh(hitGeo, hitMat);
      hit.position.y = 0.026;
      hit.userData = { geoFeature: feat };
      pinGrp.add(hit);

      h.featurePinsGroup.add(pinGrp);
      h.featureHitTargets.push(hit);

      // Draw glowing 3D river spline if riverPath is available
      if (feat.category === 'river' && feat.riverPath && feat.riverPath.length >= 2) {
        const pts = feat.riverPath.map(([lng, lat]) =>
          latLngToVector3(lat, lng, 1.007)
        );
        const rGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const rMat = new THREE.LineBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.95,
        });
        h.riverLinesGroup.add(new THREE.Line(rGeo, rMat));
      }
    }

    return () => {
      hitGeo.dispose();
      hitMat.dispose();
      pedGeo.dispose();
      coneGeo.dispose();
      octGeo.dispose();
      ringGeo.dispose();
      sphereGeo.dispose();
    };
  }, [activeFeaturesToRender]);

  // Fullscreen sync
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => setIsFullscreen(false));
    } else if (typeof el.requestFullscreen === 'function') {
      void el.requestFullscreen().catch(() => setIsFullscreen((v) => !v));
    } else {
      setIsFullscreen((v) => !v);
    }
  }, []);

  const handleZoom = useCallback((deltaRatio: number) => {
    const h = sceneHandlesRef.current;
    if (!h) return;
    const len = h.camera.position.length();
    const target = THREE.MathUtils.clamp(len * deltaRatio, 1.48, 4.5);
    h.camera.position.setLength(target);
  }, []);

  const quickFocusCountries = countries.filter((c) => c.featured).slice(0, 5);

  if (webglFailed) {
    return (
      <div className="relative h-[420px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-sky-950 via-indigo-950 to-slate-900 flex flex-col items-center justify-center p-8 text-center text-white">
        <p className="font-display text-xl font-semibold mb-2">
          3D Yer Globusi ko‘rinishi
        </p>
        <p className="text-sm text-sky-200 max-w-md mb-5">
          Qurilmangizda WebGL tezlatgichi mavjud emas. Tezkor davlatlar orqali
          ma’lumotlarni ko‘rishingiz mumkin.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {quickFocusCountries.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectCountry?.(c)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors"
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={`relative ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen rounded-none' : `${heightClass} rounded-2xl`
      } border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-950 via-[#05152b] to-slate-950 overflow-hidden select-none`}
    >
      <div
        ref={containerRef}
        className="w-full h-full"
        aria-label="Interaktiv 3D Yer globusi — davlat hududlarini bosing va aylantiring"
      />

      {/* Projected 2D Front-Hemisphere Labels */}
      {projectedLabels.length > 0 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {projectedLabels.map((lbl) => (
            <div
              key={lbl.id}
              style={{
                transform: `translate(${Math.round(lbl.x)}px, ${Math.round(lbl.y)}px) translate(-50%, -100%)`,
              }}
              className={`absolute top-0 left-0 px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-tight whitespace-nowrap ${
                lbl.kind === 'feature'
                  ? 'bg-amber-950/90 text-amber-200 border border-amber-500/50'
                  : 'bg-slate-950/80 text-sky-100 border border-slate-700/70'
              }`}
            >
              {lbl.text}
            </div>
          ))}
        </div>
      )}

      {/* Minimal Top Telemetry Corner Strip (No backdrop-blur over WebGL!) */}
      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto px-3 py-1.5 rounded-lg bg-slate-950/90 border border-slate-700/80 text-xs font-medium text-sky-200 flex items-center gap-2">
          <span>
            {hoveredName ? `${hoveredName}` : '3D Yer Globusi · Istalgan davlatni bosing'}
          </span>
          {cursorCoords && (
            <span className="hidden sm:inline font-mono text-[11px] text-slate-400 tabular-nums">
              {Math.abs(cursorCoords.lat).toFixed(1)}°{cursorCoords.lat >= 0 ? 'N' : 'S'}{' '}
              {Math.abs(cursorCoords.lng).toFixed(1)}°{cursorCoords.lng >= 0 ? 'E' : 'W'}
            </span>
          )}
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setAutoRotate((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950/90 border border-slate-700/80 text-xs font-medium text-slate-200 hover:text-white hover:border-slate-500 transition-colors whitespace-nowrap shrink-0"
          >
            {autoRotate ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">To‘xtatish</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Aylantirish</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleZoom(0.84)}
            aria-label="Yaqinlashtirish"
            className="p-1.5 rounded-lg bg-slate-950/90 border border-slate-700/80 text-slate-200 hover:text-white hover:border-slate-500 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => handleZoom(1.18)}
            aria-label="Uzoqlashtirish"
            className="p-1.5 rounded-lg bg-slate-950/90 border border-slate-700/80 text-slate-200 hover:text-white hover:border-slate-500 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              focusTriggerRef.current = {
                lat: activeFocusLat,
                lng: activeFocusLng,
                zoomDistance: 3.0,
                active: true,
              };
            }}
            aria-label="Markazlash"
            className="p-1.5 rounded-lg bg-slate-950/90 border border-slate-700/80 text-slate-200 hover:text-white hover:border-slate-500 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {allowFullscreen && (
            <button
              type="button"
              onClick={handleToggleFullscreen}
              aria-label={isFullscreen ? 'Kichraytirish' : 'To‘liq ekran'}
              className="p-1.5 rounded-lg bg-slate-950/90 border border-slate-700/80 text-slate-200 hover:text-white hover:border-slate-500 transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Expand className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Bottom Control Dock (Solid semi-opaque, NO backdrop-blur over WebGL) */}
      {(quickFocusCountries.length > 0 || showModeChips) && (
        <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 max-w-[92%] flex flex-col items-center gap-1.5 z-10">
          {dockOpen && (
            <div className="bg-slate-950/92 border border-slate-700/80 rounded-xl px-3 py-2 flex items-center gap-2 overflow-x-auto max-w-full">
              {showModeChips && onChangeViewMode ? (
                <>
                  <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap shrink-0">
                    Xarita turi:
                  </span>
                  {(
                    [
                      ['satellite', 'Sun’iy yo‘ldosh'],
                      ['terrain', 'Relyef'],
                      ['political', 'Siyosiy'],
                      ['physical', 'Fizik'],
                    ] as Array<[GlobeViewMode, string]>
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onChangeViewMode(id)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                        viewMode === id
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <span className="text-xs font-medium text-slate-300 whitespace-nowrap shrink-0 pl-1">
                    Tezkor tanlov:
                  </span>
                  {quickFocusCountries.map((country) => {
                    const isActive = country.id === selectedCountry?.id;
                    return (
                      <button
                        key={country.id}
                        type="button"
                        onClick={() => {
                          onSelectCountry?.(country);
                          focusTriggerRef.current = {
                            lat: country.lat,
                            lng: country.lng,
                            active: true,
                          };
                        }}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                          isActive
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {country.name}
                      </button>
                    );
                  })}
                </>
              )}
              <button
                type="button"
                onClick={() => setDockOpen(false)}
                aria-label="Panelni yig‘ish"
                className="p-1 text-slate-400 hover:text-white shrink-0"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {!dockOpen && (
            <button
              type="button"
              onClick={() => setDockOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/92 border border-slate-700/80 text-xs font-medium text-slate-200 hover:text-white"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Boshqaruv paneli</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
