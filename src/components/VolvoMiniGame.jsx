import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js';
import {
  X,
  RotateCcw,
  Trophy,
  Gauge,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Trees,
  Compass,
  AlertOctagon,
  Sparkles,
  Sun,
  Sunset,
  Moon,
  Building2,
  Film,
  Zap,
  ChevronUp,
  ChevronDown,
  Heart,
  Eye,
  Play,
} from 'lucide-react';

// Custom Cinematic Color Grading & Anamorphic Lens Flare Shader
const CinematicColorGradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    saturation: { value: 1.15 },
    contrast: { value: 1.12 },
    warmth: { value: 0.05 },
    anamorphicGlow: { value: 0.15 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float saturation;
    uniform float contrast;
    uniform float warmth;
    varying vec2 vUv;

    void main() {
      vec4 tex = texture2D(tDiffuse, vUv);
      vec3 col = tex.rgb;

      // Contrast
      col = (col - 0.5) * contrast + 0.5;

      // Saturation
      float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(luma), col, saturation);

      // Cinematic warmth tint
      col.r += warmth * 0.06;
      col.b -= warmth * 0.04;

      gl_FragColor = vec4(col, tex.a);
    }
  `,
};

// Generates procedural PBR asphalt texture map with micro-grain and tire tracks
function generateProceduralAsphaltTextures() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#22252a';
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 36;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Subtle tire rubber sheen tracks
  ctx.fillStyle = 'rgba(10, 12, 16, 0.22)';
  ctx.fillRect(80, 0, 90, size);
  ctx.fillRect(340, 0, 90, size);

  const albedoTexture = new THREE.CanvasTexture(canvas);
  albedoTexture.wrapS = THREE.RepeatWrapping;
  albedoTexture.wrapT = THREE.RepeatWrapping;
  albedoTexture.repeat.set(4, 30);

  // Bump map
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d');
  rCtx.fillStyle = '#808080';
  rCtx.fillRect(0, 0, size, size);

  const rImgData = rCtx.getImageData(0, 0, size, size);
  const rData = rImgData.data;
  for (let i = 0; i < rData.length; i += 4) {
    const n = Math.random() * 255;
    rData[i] = n;
    rData[i + 1] = n;
    rData[i + 2] = n;
  }
  rCtx.putImageData(rImgData, 0, 0);

  const bumpTexture = new THREE.CanvasTexture(roughCanvas);
  bumpTexture.wrapS = THREE.RepeatWrapping;
  bumpTexture.wrapT = THREE.RepeatWrapping;
  bumpTexture.repeat.set(8, 60);

  return { albedoTexture, bumpTexture };
}

// Generates glowing windows texture for City Skyscraper facades
function generateSkyscraperTexture(colorHex = '#38bdf8') {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Dark glass concrete tower facade
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, size, size);

  // Grid of illuminated office / residential windows
  const cols = 10;
  const rows = 16;
  const padX = 6;
  const padY = 5;
  const winW = (size - padX * (cols + 1)) / cols;
  const winH = (size - padY * (rows + 1)) / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() > 0.35) {
        // Window on
        ctx.fillStyle = Math.random() > 0.65 ? colorHex : (Math.random() > 0.5 ? '#fef08a' : '#ffffff');
        const x = padX + c * (winW + padX);
        const y = padY + r * (winH + padY);
        ctx.fillRect(x, y, winW, winH);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 6);
  return texture;
}

// Generates realistic spherical texture for Moon
function generateRealisticMoonTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = '#94a3b8';
  const mariaCraters = [
    { x: 180, y: 190, r: 85 },
    { x: 310, y: 170, r: 65 },
    { x: 260, y: 280, r: 90 },
    { x: 140, y: 310, r: 50 },
    { x: 370, y: 320, r: 55 },
    { x: 220, y: 120, r: 45 },
    { x: 340, y: 230, r: 40 },
  ];

  mariaCraters.forEach((m) => {
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    ctx.fill();
  });

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 45;
    data[i] = Math.min(255, Math.max(40, data[i] + grain));
    data[i + 1] = Math.min(255, Math.max(40, data[i + 1] + grain));
    data[i + 2] = Math.min(255, Math.max(50, data[i + 2] + grain));
  }
  ctx.putImageData(imgData, 0, 0);

  for (let c = 0; c < 28; c++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    const cr = 4 + Math.random() * 12;

    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(cx, cy, cr * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Generates glowing solar plasma flare texture for the Sun
function generateRealisticSunTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.35, '#fffbeb');
  grad.addColorStop(0.7, '#fef08a');
  grad.addColorStop(0.9, '#f59e0b');
  grad.addColorStop(1, '#ea580c');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 30;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 0.8));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.3));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Generates procedural high dynamic range 360 environment reflection map
function generatePhotorealEnvMap(renderer) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  const skyGeo = new THREE.SphereGeometry(100, 32, 16);
  const skyMat = new THREE.MeshBasicMaterial({
    color: 0x88ccff,
    side: THREE.BackSide,
  });
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  envScene.add(skyMesh);

  const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(18, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  sunMesh.position.set(40, 60, -80);
  envScene.add(sunMesh);

  const groundMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshBasicMaterial({ color: 0x1a2e22 })
  );
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.y = -10;
  envScene.add(groundMesh);

  const envRT = pmremGenerator.fromScene(envScene);
  pmremGenerator.dispose();
  return envRT.texture;
}

export default function VolvoMiniGame({ onClose }) {
  const mountRef = useRef(null);
  const [score, setScore] = useState(0);
  const [distanceTraveled, setDistanceTraveled] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(90);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameMode, setGameMode] = useState('scenic');
  const [environmentTheme, setEnvironmentTheme] = useState('city'); // 'city' (Metropolis Skyline) or 'mountain' (Mountain Pine Forest)
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState('day'); // 'dawn' | 'day' | 'golden' | 'sunset' | 'night'
  const [timeOfDayName, setTimeOfDayName] = useState('Day');
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('volvo_high_score') || '0', 10);
  });
  const [modelReady, setModelReady] = useState(false);
  const [activeAffirmation, setActiveAffirmation] = useState(null);
  const [collectedCount, setCollectedCount] = useState(0);
  const [hasStartedDriving, setHasStartedDriving] = useState(false);
  const [showOverlookCard, setShowOverlookCard] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const stateRef = useRef({
    carX: 0,
    targetCarX: 0,
    carSpeed: 1.0,
    speedMultiplier: 1.0,
    obstacles: [],
    sceneryItems: [],
    cityBuildings: [],
    roadSegments: [],
    mountainMeshes: [],
    affirmationOrbs: [],
    gameOver: false,
    hasStartedDriving: false,
    score: 0,
    distance: 0,
    mode: 'scenic',
    theme: 'city',
    timeOfDay: 'day',
    currentCycle: 0.22,
    targetCycle: 0.22,
  });

  const keysPressed = useRef({});

  // Sync mode and environment theme
  useEffect(() => {
    stateRef.current.mode = gameMode;
    if (stateRef.current.obstacles) {
      stateRef.current.obstacles.forEach((obs) => {
        obs.mesh.visible = gameMode === 'dodge';
      });
    }
    if (stateRef.current.affirmationOrbs) {
      stateRef.current.affirmationOrbs.forEach((orb) => {
        orb.group.visible = gameMode === 'scenic';
      });
    }
  }, [gameMode]);

  useEffect(() => {
    stateRef.current.timeOfDay = selectedTimeOfDay;
    const timeTargets = {
      dawn: 0.935,
      day: 0.22,
      golden: 0.49,
      sunset: 0.545,
      night: 0.75,
    };
    if (timeTargets[selectedTimeOfDay] !== undefined) {
      stateRef.current.targetCycle = timeTargets[selectedTimeOfDay];
    }
  }, [selectedTimeOfDay]);

  useEffect(() => {
    stateRef.current.theme = environmentTheme;
    // Show/hide nature vs city elements
    if (stateRef.current.sceneryItems) {
      stateRef.current.sceneryItems.forEach((item) => {
        item.visible = environmentTheme === 'mountain';
      });
    }
    if (stateRef.current.mountainMeshes) {
      stateRef.current.mountainMeshes.forEach((mnt) => {
        mnt.visible = environmentTheme === 'mountain';
      });
    }
    if (stateRef.current.cityBuildings) {
      stateRef.current.cityBuildings.forEach((bld) => {
        bld.visible = environmentTheme === 'city';
      });
    }
  }, [environmentTheme]);

  const handleStartDriving = useCallback(() => {
    stateRef.current.hasStartedDriving = true;
    setHasStartedDriving(true);
    setShowOverlookCard(false);
  }, []);

  const handleRestart = useCallback(() => {
    stateRef.current.carX = 0;
    stateRef.current.targetCarX = 0;
    stateRef.current.carSpeed = 1.0;
    stateRef.current.speedMultiplier = 1.0;
    stateRef.current.gameOver = false;
    stateRef.current.hasStartedDriving = false;
    stateRef.current.score = 0;
    stateRef.current.distance = 0;
    setIsGameOver(false);
    setHasStartedDriving(false);
    setShowOverlookCard(true);
    setScore(0);
    setDistanceTraveled(0);
    setSpeedKmh(90);

    const lanes = [-4.8, -1.6, 1.6, 4.8];
    stateRef.current.obstacles.forEach((obs, idx) => {
      // 130m head start buffer so player has plenty of clear road to accelerate and steer
      obs.mesh.position.z = -130 - idx * 45;
      obs.mesh.position.x = lanes[Math.floor(Math.random() * lanes.length)];
      obs.passed = false;
      obs.mesh.visible = stateRef.current.mode === 'dodge';
    });
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xdbeafe, 0.0035);

    // Highway dimensions defined at the top of the scene setup
    const roadWidth = 14.0;
    const roadLength = 260;

    const camera = new THREE.PerspectiveCamera(
      54,
      container.clientWidth / container.clientHeight,
      0.1,
      800
    );
    camera.position.set(0, 3.3, 7.6);
    camera.lookAt(0, 1.25, -20);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const envTexture = generatePhotorealEnvMap(renderer);
    scene.environment = envTexture;

    // 1.5 Cinematic Post-Processing Pipeline with Safe Fallback
    let composer = null;
    let colorGradePass = null;
    try {
      composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);

      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(container.clientWidth, container.clientHeight),
        0.55,
        0.4,
        0.85
      );
      composer.addPass(bloomPass);

      colorGradePass = new ShaderPass(CinematicColorGradeShader);
      composer.addPass(colorGradePass);

      const vignettePass = new ShaderPass(VignetteShader);
      vignettePass.uniforms['offset'].value = 1.05;
      vignettePass.uniforms['darkness'].value = 1.25;
      composer.addPass(vignettePass);
    } catch (e) {
      console.warn('Post-processing could not initialize, falling back to direct WebGL renderer:', e);
      composer = null;
      colorGradePass = null;
    }

    // 2. High Dynamic Range Lighting Setup
    const hemiLight = new THREE.HemisphereLight(0xffedd5, 0x1e3a1e, 1.4);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 3.2);
    sunLight.position.set(35, 55, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 150;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0xe0f2fe, 1.35);
    scene.add(ambientLight);

    // 2.5 Mountain Environment Theme Meshes
    const mountainGroup = new THREE.Group();
    scene.add(mountainGroup);
    const mountainMeshes = [];

    const mountainMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.95,
      metalness: 0.05,
      flatShading: true,
    });

    for (let i = 0; i < 20; i++) {
      const radius = 60 + Math.random() * 40;
      const height = 55 + Math.random() * 45;
      const mountainGeo = new THREE.ConeGeometry(radius, height, 5);
      const mountain = new THREE.Mesh(mountainGeo, mountainMat);
      const side = i % 2 === 0 ? -1 : 1;
      const xDist = side * (135 + Math.random() * 80);
      const zDist = -160 - Math.random() * 260;
      mountain.position.set(xDist, height * 0.42 - 12, zDist);
      mountain.visible = stateRef.current.theme === 'mountain';
      mountainGroup.add(mountain);
      mountainMeshes.push(mountain);
    }
    stateRef.current.mountainMeshes = mountainMeshes;

    // 2.6 City Environment Theme: Varied Architecture Metropolis with Spacings & Gaps
    const cityGroup = new THREE.Group();
    scene.add(cityGroup);
    const cityBuildings = [];

    const skyCyanTexture = generateSkyscraperTexture('#38bdf8');
    const skyAmberTexture = generateSkyscraperTexture('#f59e0b');
    const skyEmeraldTexture = generateSkyscraperTexture('#34d399');

    const towerMaterials = [
      new THREE.MeshStandardMaterial({
        map: skyCyanTexture,
        roughness: 0.35,
        metalness: 0.85,
      }),
      new THREE.MeshStandardMaterial({
        map: skyAmberTexture,
        roughness: 0.35,
        metalness: 0.85,
      }),
      new THREE.MeshStandardMaterial({
        map: skyEmeraldTexture,
        roughness: 0.35,
        metalness: 0.85,
      }),
      new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.8,
        roughness: 0.25,
      }),
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.9,
        roughness: 0.15,
      }),
    ];

    // Neon spire top lights
    const neonColors = [0x38bdf8, 0xf43f5e, 0x10b981, 0xa855f7, 0xfbbf24];

    // Generate diverse buildings with varying styles, heights, widths, and gaps
    for (let side of [-1, 1]) {
      let currentZ = 30;
      while (currentZ > -340) {
        // Natural gap between buildings (open alleys, courtyards, plazas)
        const gap = 8 + Math.random() * 16;
        currentZ -= gap;

        const building = new THREE.Group();
        const archType = Math.floor(Math.random() * 4); // 4 distinct building architectures

        let bWidth = 12;
        let bDepth = 14;
        let bHeight = 40;

        if (archType === 0) {
          // Mega Skyscraper (Tall slender spire)
          bWidth = 14 + Math.random() * 8;
          bDepth = 14 + Math.random() * 8;
          bHeight = 85 + Math.random() * 60; // 85m to 145m

          const mat = towerMaterials[Math.floor(Math.random() * 3)];
          const bGeo = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
          const bMesh = new THREE.Mesh(bGeo, mat);
          bMesh.position.y = bHeight / 2;
          bMesh.castShadow = true;
          bMesh.receiveShadow = true;
          building.add(bMesh);

          // Slender antenna spire + blinking beacon
          const spireGeo = new THREE.CylinderGeometry(0.2, 0.8, 16, 8);
          const spireMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });
          const spire = new THREE.Mesh(spireGeo, spireMat);
          spire.position.y = bHeight + 8;
          building.add(spire);

          const beaconColor = neonColors[Math.floor(Math.random() * neonColors.length)];
          const beacon = new THREE.Mesh(
            new THREE.SphereGeometry(0.9, 12, 12),
            new THREE.MeshBasicMaterial({ color: beaconColor })
          );
          beacon.position.y = bHeight + 16;
          building.add(beacon);

          // Glowing architectural perimeter trim
          const neonTrim = new THREE.Mesh(
            new THREE.BoxGeometry(bWidth * 1.02, 0.8, bDepth * 1.02),
            new THREE.MeshBasicMaterial({ color: beaconColor })
          );
          neonTrim.position.y = bHeight;
          building.add(neonTrim);

        } else if (archType === 1) {
          // Stepped Art-Deco / Setback High-Rise
          bWidth = 18 + Math.random() * 10;
          bDepth = 20 + Math.random() * 10;
          bHeight = 55 + Math.random() * 45;

          const baseMat = towerMaterials[Math.floor(Math.random() * towerMaterials.length)];
          // Tier 1 Base
          const h1 = bHeight * 0.55;
          const tier1 = new THREE.Mesh(new THREE.BoxGeometry(bWidth, h1, bDepth), baseMat);
          tier1.position.y = h1 / 2;
          tier1.castShadow = true;
          tier1.receiveShadow = true;
          building.add(tier1);

          // Tier 2 Mid
          const h2 = bHeight * 0.3;
          const tier2 = new THREE.Mesh(new THREE.BoxGeometry(bWidth * 0.72, h2, bDepth * 0.72), baseMat);
          tier2.position.y = h1 + h2 / 2;
          tier2.castShadow = true;
          building.add(tier2);

          // Tier 3 Crown
          const h3 = bHeight * 0.15;
          const tier3 = new THREE.Mesh(new THREE.BoxGeometry(bWidth * 0.45, h3, bDepth * 0.45), baseMat);
          tier3.position.y = h1 + h2 + h3 / 2;
          building.add(tier3);

          // Crown glow line
          const glowColor = neonColors[Math.floor(Math.random() * neonColors.length)];
          const crownGlow = new THREE.Mesh(
            new THREE.BoxGeometry(bWidth * 0.48, 0.5, bDepth * 0.48),
            new THREE.MeshBasicMaterial({ color: glowColor })
          );
          crownGlow.position.y = bHeight;
          building.add(crownGlow);

        } else if (archType === 2) {
          // Mid-rise Commercial Block (Lower height, wider footprint)
          bWidth = 24 + Math.random() * 12;
          bDepth = 22 + Math.random() * 10;
          bHeight = 22 + Math.random() * 20; // 22m to 42m

          const mat = towerMaterials[Math.floor(Math.random() * towerMaterials.length)];
          const bGeo = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
          const bMesh = new THREE.Mesh(bGeo, mat);
          bMesh.position.y = bHeight / 2;
          bMesh.castShadow = true;
          bMesh.receiveShadow = true;
          building.add(bMesh);

          // Roof helipad or HVAC structures
          const hvac = new THREE.Mesh(
            new THREE.BoxGeometry(bWidth * 0.4, 2.5, bDepth * 0.4),
            new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.4 })
          );
          hvac.position.y = bHeight + 1.25;
          building.add(hvac);

        } else {
          // Modern Glass Slanted/Curved Tower
          bWidth = 16 + Math.random() * 8;
          bDepth = 16 + Math.random() * 8;
          bHeight = 65 + Math.random() * 40;

          const mat = towerMaterials[Math.floor(Math.random() * 3)];
          const bGeo = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
          const bMesh = new THREE.Mesh(bGeo, mat);
          bMesh.position.y = bHeight / 2;
          bMesh.castShadow = true;
          bMesh.receiveShadow = true;
          building.add(bMesh);

          // Illuminated vertical facade beam
          const beamColor = neonColors[Math.floor(Math.random() * neonColors.length)];
          const beam = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, bHeight, 0.8),
            new THREE.MeshBasicMaterial({ color: beamColor })
          );
          beam.position.set(-bWidth * 0.48, bHeight / 2, bDepth * 0.48);
          building.add(beam);
        }

        // Safe distance guarantee: The building's inner edge will NEVER penetrate or touch the road
        // Road outer edge is at roadWidth / 2 (7.0m). Shoulder + sidewalk adds 4m buffer.
        // Therefore, inner edge is placed at least 11.5m away from road center.
        const minInnerEdge = roadWidth / 2 + 4.5;
        const xOffset = minInnerEdge + bWidth / 2 + Math.random() * 14;
        const xPos = side * xOffset;
        building.position.set(xPos, 0, currentZ);
        building.visible = stateRef.current.theme === 'city';
        cityGroup.add(building);
        cityBuildings.push(building);

        currentZ -= bDepth;
      }
    }
    stateRef.current.cityBuildings = cityBuildings;

    // 2.8 Celestial Sky System: Sun, Moon, and Starfield
    const skyGroup = new THREE.Group();
    scene.add(skyGroup);

    const sunTexture = generateRealisticSunTexture();
    const moonTexture = generateRealisticMoonTexture();

    const sunGroup = new THREE.Group();
    const sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(14.0, 36, 36),
      new THREE.MeshBasicMaterial({
        map: sunTexture,
      })
    );
    sunGroup.add(sunMesh);

    const sunInnerCorona = new THREE.Mesh(
      new THREE.SphereGeometry(20.0, 24, 24),
      new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.42,
        blending: THREE.AdditiveBlending,
      })
    );
    sunGroup.add(sunInnerCorona);

    const sunOuterCorona = new THREE.Mesh(
      new THREE.SphereGeometry(32.0, 16, 16),
      new THREE.MeshBasicMaterial({
        color: 0xea580c,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
      })
    );
    sunGroup.add(sunOuterCorona);
    skyGroup.add(sunGroup);

    const moonGroup = new THREE.Group();
    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(11.5, 48, 48),
      new THREE.MeshStandardMaterial({
        map: moonTexture,
        roughness: 0.95,
        metalness: 0.05,
      })
    );
    moonGroup.add(moonMesh);

    const moonHalo = new THREE.Mesh(
      new THREE.SphereGeometry(17.5, 24, 24),
      new THREE.MeshBasicMaterial({
        color: 0x93c5fd,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
      })
    );
    moonGroup.add(moonHalo);
    skyGroup.add(moonGroup);

    // Gradient Sky Dome: zenith→horizon gradient, sun glow, drifting clouds & Milky Way
    const skyUniforms = {
      zenith: { value: new THREE.Color(0x3b82f6) },
      horizon: { value: new THREE.Color(0xbfdbfe) },
      sunColor: { value: new THREE.Color(0xfff1c1) },
      cloudColor: { value: new THREE.Color(0xffffff) },
      sunDir: { value: new THREE.Vector3(0, 0.5, -1).normalize() },
      night: { value: 0 },
      time: { value: 0 },
    };
    const skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(450, 48, 32),
      new THREE.ShaderMaterial({
        uniforms: skyUniforms,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        vertexShader: `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          uniform vec3 zenith, horizon, sunColor, cloudColor, sunDir;
          uniform float night, time;
          varying vec3 vDir;
          float hash(vec3 p){ p = fract(p*0.3183099+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
          float noise(vec3 x){ vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);
            return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
                       mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
          float fbm(vec3 p){ float v=0.0; float a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }
          void main() {
            vec3 dir = normalize(vDir);
            float h = dir.y;
            // Multi-stop vertical gradient
            float g = pow(smoothstep(-0.05, 0.75, h), 0.6);
            vec3 col = mix(horizon, zenith, g);
            col = mix(col, horizon * 0.35, smoothstep(0.0, -0.25, h));
            // Sun scattering glow + horizon band glow near sun
            float d = max(dot(dir, normalize(sunDir)), 0.0);
            float sunUp = smoothstep(-0.25, 0.05, sunDir.y);
            col += sunColor * (pow(d, 6.0) * 0.35 + pow(d, 48.0) * 0.6) * sunUp;
            col += sunColor * pow(d, 2.0) * exp(-abs(h) * 7.0) * 0.45 * sunUp;
            // Milky Way band at night
            vec3 n = normalize(vec3(0.35, 0.55, 0.75));
            float b = dot(dir, n);
            float mw = exp(-b * b * 30.0) * smoothstep(0.35, 0.85, fbm(dir * 7.0 + 3.0));
            col += vec3(0.55, 0.58, 0.9) * mw * night * 0.45 * smoothstep(0.0, 0.2, h);
            // Drifting clouds
            vec2 uv = dir.xz / (h + 0.18);
            float c = fbm(vec3(uv * 1.3 + vec2(time * 0.012, time * 0.004), time * 0.01));
            c = smoothstep(0.52, 0.82, c) * smoothstep(0.02, 0.3, h);
            vec3 cc = cloudColor + sunColor * pow(d, 4.0) * 0.5 * sunUp;
            col = mix(col, cc, c * mix(0.75, 0.35, night));
            gl_FragColor = vec4(col, 1.0);
          }`,
      })
    );
    skyDome.renderOrder = -10;
    skyGroup.add(skyDome);

    // Twinkling Starfield (3500 colored stars of varying brightness)
    const starCount = 3500;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    const starPhases = new Float32Array(starCount);
    const starColors = new Float32Array(starCount * 3);
    const starTints = [
      [1, 1, 1], [0.75, 0.85, 1], [1, 0.92, 0.78], [0.85, 0.9, 1], [1, 0.8, 0.7],
    ];
    for (let i = 0; i < starCount; i++) {
      const radius = 400;
      const theta = Math.random() * Math.PI * 2;
      const y = Math.random() * 0.98 + 0.02;
      const r = Math.sqrt(1 - y * y);
      starPositions[i * 3] = radius * r * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * y;
      starPositions[i * 3 + 2] = radius * r * Math.sin(theta);
      const bright = Math.random();
      starSizes[i] = bright > 0.97 ? 3.6 + Math.random() * 1.8 : 1.0 + Math.pow(bright, 3) * 2.4;
      starPhases[i] = Math.random() * Math.PI * 2;
      const tint = starTints[Math.floor(Math.random() * starTints.length)];
      starColors.set(tint, i * 3);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    starGeo.setAttribute('phase', new THREE.BufferAttribute(starPhases, 1));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.ShaderMaterial({
      uniforms: { opacity: { value: 0 }, time: { value: 0 }, pixelRatio: { value: renderer.getPixelRatio() } },
      transparent: true,
      depthWrite: false,
      fog: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float size; attribute float phase; attribute vec3 color;
        uniform float time; uniform float pixelRatio;
        varying vec3 vColor; varying float vTw; varying float vH;
        void main() {
          vColor = color;
          vTw = 0.6 + 0.4 * sin(time * (1.5 + fract(phase) * 3.0) + phase * 7.0);
          vH = normalize(position).y;
          gl_PointSize = size * pixelRatio * (0.8 + 0.4 * vTw);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform float opacity;
        varying vec3 vColor; varying float vTw; varying float vH;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          a *= opacity * vTw * smoothstep(0.02, 0.18, vH);
          gl_FragColor = vec4(vColor * (1.0 + a), a);
        }`,
    });
    const starField = new THREE.Points(starGeo, starMat);
    starField.renderOrder = -9;
    skyGroup.add(starField);

    // Shooting stars
    const shootingStarMat = new THREE.MeshBasicMaterial({
      color: 0xdbeafe,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    const shootingStar = new THREE.Mesh(new THREE.PlaneGeometry(38, 0.7), shootingStarMat);
    skyGroup.add(shootingStar);
    const shooting = { active: false, life: 0, vel: new THREE.Vector3() };

    // 3. Wide 4-Lane PBR Asphalt Highway
    const { albedoTexture, bumpTexture } = generateProceduralAsphaltTextures();

    const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
    const roadMat = new THREE.MeshStandardMaterial({
      map: albedoTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.04,
      roughness: 0.38,
      metalness: 0.25,
    });

    const roadSegments = [];
    for (let i = 0; i < 2; i++) {
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.z = -i * roadLength;
      road.receiveShadow = true;
      scene.add(road);
      roadSegments.push(road);
    }
    stateRef.current.roadSegments = roadSegments;

    // Road Ground Base Terrain
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.85,
    });
    for (let side of [-1, 1]) {
      const grassGeo = new THREE.PlaneGeometry(90, roadLength * 2);
      const grass = new THREE.Mesh(grassGeo, terrainMat);
      grass.rotation.x = -Math.PI / 2;
      grass.position.set(side * (roadWidth / 2 + 45), -0.05, -roadLength / 2);
      scene.add(grass);
    }

    // Road Shoulders
    const shoulderMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.75 });
    for (let side of [-1, 1]) {
      const shoulderGeo = new THREE.PlaneGeometry(2.5, roadLength * 2);
      const shoulder = new THREE.Mesh(shoulderGeo, shoulderMat);
      shoulder.rotation.x = -Math.PI / 2;
      shoulder.position.set(side * (roadWidth / 2 + 1.25), 0.01, -roadLength / 2);
      scene.add(shoulder);
    }

    // Lane dashes
    const lineGroup = new THREE.Group();
    scene.add(lineGroup);
    const dashes = [];
    const dashGeo = new THREE.PlaneGeometry(0.22, 4.8);
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let laneOffset of [-3.5, 0, 3.5]) {
      for (let z = 30; z > -roadLength * 2; z -= 9.5) {
        const dash = new THREE.Mesh(dashGeo, dashMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(laneOffset, 0.03, z);
        lineGroup.add(dash);
        dashes.push(dash);
      }
    }

    // Luminous highway edge guides
    const edgeLineGeo = new THREE.PlaneGeometry(0.28, roadLength * 2);
    const edgeLineMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
    for (let side of [-1, 1]) {
      const edge = new THREE.Mesh(edgeLineGeo, edgeLineMat);
      edge.rotation.x = -Math.PI / 2;
      edge.position.set(side * (roadWidth / 2 - 0.25), 0.04, -roadLength / 2);
      scene.add(edge);
    }

    // Guard rails
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
    const neonRailMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });

    for (let side of [-1, 1]) {
      const curbGeo = new THREE.BoxGeometry(0.65, 0.55, roadLength * 2);
      const curb = new THREE.Mesh(curbGeo, curbMat);
      curb.position.set(side * (roadWidth / 2 + 0.35), 0.25, -roadLength / 2);
      scene.add(curb);

      const railGeo = new THREE.BoxGeometry(0.14, 0.16, roadLength * 2);
      const rail = new THREE.Mesh(railGeo, neonRailMat);
      rail.position.set(side * (roadWidth / 2 + 0.05), 0.52, -roadLength / 2);
      scene.add(rail);
    }

    // Street Lamps
    const streetLights = [];
    const lampLights = [];
    const lampPoleGeo = new THREE.CylinderGeometry(0.08, 0.12, 6.5, 8);
    const lampPoleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
    const lampBulbMat = new THREE.MeshBasicMaterial({ color: 0xfffae0 });

    for (let z = 20; z > -roadLength * 2; z -= 38) {
      for (let side of [-1, 1]) {
        const lamp = new THREE.Group();
        const pole = new THREE.Mesh(lampPoleGeo, lampPoleMat);
        pole.position.y = 3.25;
        lamp.add(pole);

        const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.08), lampPoleMat);
        arm.position.set(-side * 0.7, 6.4, 0);
        lamp.add(arm);

        const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.25), lampBulbMat);
        bulb.position.set(-side * 1.35, 6.35, 0);
        lamp.add(bulb);

        const light = new THREE.PointLight(0xfffae0, 2.0, 26, 1.4);
        light.position.set(-side * 1.35, 6.0, 0);
        lamp.add(light);
        lampLights.push(light);

        lamp.position.set(side * (roadWidth / 2 + 1.2), 0, z);
        scene.add(lamp);
        streetLights.push(lamp);
      }
    }

    // 3.5 Nature Trees (Visible in Mountain theme)
    const sceneryGroup = new THREE.Group();
    scene.add(sceneryGroup);
    const sceneryItems = [];

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });
    const foliageDarkMat = new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.8 });
    const foliageLightMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.75 });

    const createPineTree = (scale = 1.0) => {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * scale, 0.35 * scale, 2.2 * scale, 7), trunkMat);
      trunk.position.y = 1.1 * scale;
      tree.add(trunk);

      const cone1 = new THREE.Mesh(new THREE.ConeGeometry(2.0 * scale, 3.0 * scale, 7), foliageDarkMat);
      cone1.position.y = 2.9 * scale;
      tree.add(cone1);

      const cone2 = new THREE.Mesh(new THREE.ConeGeometry(1.5 * scale, 2.5 * scale, 7), foliageLightMat);
      cone2.position.y = 4.2 * scale;
      tree.add(cone2);

      const cone3 = new THREE.Mesh(new THREE.ConeGeometry(0.95 * scale, 1.9 * scale, 7), foliageDarkMat);
      cone3.position.y = 5.3 * scale;
      tree.add(cone3);
      return tree;
    };

    for (let side of [-1, 1]) {
      for (let z = 40; z > -roadLength * 2; z -= 14) {
        const xDist = side * (roadWidth / 2 + 3.2 + Math.random() * 7.0);
        const treeScale = 0.85 + Math.random() * 0.45;
        const tree = createPineTree(treeScale);
        tree.position.set(xDist, 0, z);
        tree.visible = stateRef.current.theme === 'mountain';
        sceneryGroup.add(tree);
        sceneryItems.push(tree);

        if (Math.random() > 0.25) {
          const backTree = createPineTree(treeScale * 1.25);
          backTree.position.set(side * (roadWidth / 2 + 12.5 + Math.random() * 7.0), 0, z - 6);
          backTree.visible = stateRef.current.theme === 'mountain';
          sceneryGroup.add(backTree);
          sceneryItems.push(backTree);
        }
      }
    }
    stateRef.current.sceneryItems = sceneryItems;

    // 4. Volvo Car Player Assembly (Tixi / J.O.C.A.S.T.A)
    const carRoot = new THREE.Group();
    carRoot.position.set(0, 0, 0);
    scene.add(carRoot);

    const fallbackMat = new THREE.MeshStandardMaterial({
      color: 0x111115,
      metalness: 0.9,
      roughness: 0.2,
      transparent: true,
      opacity: 0,
    });
    const fallbackCar = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.85, 4.3), fallbackMat);
    fallbackCar.position.y = 0.55;
    fallbackCar.visible = false; // Never show fallback box; user will see real car model once loaded
    carRoot.add(fallbackCar);

    // 4 Realistic Spinning Wheels with High-Fidelity Michelin Tires & Alloy Rims
    const wheelGroup = new THREE.Group();
    wheelGroup.visible = false; // Hide by default so no black wheel blocks appear before GLB loads
    carRoot.add(wheelGroup);
    const wheels = [];

    const tireGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.24, 28);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.85,
      metalness: 0.1,
    });

    const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.25, 20);
    rimGeo.rotateZ(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.95,
      roughness: 0.12,
    });

    // Outer brake disc
    const brakeDiscGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.22, 16);
    brakeDiscGeo.rotateZ(Math.PI / 2);
    const brakeDiscMat = new THREE.MeshStandardMaterial({
      color: 0x71717a,
      metalness: 0.9,
      roughness: 0.3,
    });

    // 5-Spoke Volvo Inscription Diamond-Cut Alloy Pattern
    const spokeGeo = new THREE.BoxGeometry(0.26, 0.44, 0.05);
    const spokeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.98,
      roughness: 0.1,
    });

    // Volvo S60 Exact Wheel Positions aligned to 3D chassis
    // Front: Z = -1.30, Rear: Z = 1.30, Track width: X = +/-0.86, Axle height: Y = 0.35
    const wheelPositions = [
      { x: -0.86, y: 0.35, z: 1.30 },
      { x: 0.86, y: 0.35, z: 1.30 },
      { x: -0.86, y: 0.35, z: -1.30 },
      { x: 0.86, y: 0.35, z: -1.30 },
    ];

    wheelPositions.forEach((pos) => {
      const singleWheel = new THREE.Group();
      singleWheel.position.set(pos.x, pos.y, pos.z);

      const tire = new THREE.Mesh(tireGeo, tireMat);
      singleWheel.add(tire);

      const rim = new THREE.Mesh(rimGeo, rimMat);
      singleWheel.add(rim);

      const brakeDisc = new THREE.Mesh(brakeDiscGeo, brakeDiscMat);
      singleWheel.add(brakeDisc);

      // 5 Dual Spokes for premium Volvo sport rims
      for (let s = 0; s < 5; s++) {
        const spoke = new THREE.Mesh(spokeGeo, spokeMat);
        spoke.rotation.x = (s * Math.PI) / 2.5;
        singleWheel.add(spoke);
      }

      wheelGroup.add(singleWheel);
      wheels.push(singleWheel);
    });

    // Subtle red glow on asphalt
    for (let side of [-0.72, 0.72]) {
      const redGlow = new THREE.PointLight(0xff0022, 1.4, 3.2);
      redGlow.position.set(side, 0.68, 2.3);
      carRoot.add(redGlow);
    }

    // Front Headlights
    const headLights = [];
    for (let side of [-0.65, 0.65]) {
      const beam = new THREE.SpotLight(0xfffae6, 5.0, 50, Math.PI / 6.5, 0.4);
      beam.position.set(side, 0.6, -2.1);
      beam.target.position.set(side * 0.4, 0, -30);
      carRoot.add(beam);
      carRoot.add(beam.target);
      headLights.push(beam);
    }

    // Underglow Neon for Tixi
    const underglow = new THREE.PointLight(0x10b981, 2.8, 4.5);
    underglow.position.set(0, 0.2, 0);
    carRoot.add(underglow);

    // Apply model rotation and photorealistic lacquer clear coat
    const setupCarMesh = (rawModel) => {
      const model = rawModel.clone();
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      const targetLen = 4.4;
      let isSideFacing = size.x > size.z;

      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = targetLen / maxDim;
      model.scale.setScalar(scale);

      model.position.sub(center.multiplyScalar(scale));
      // Ground the car firmly on the road asphalt (zero floating)
      model.position.y = size.y * scale * 0.5;

      if (isSideFacing) {
        model.rotation.y = -Math.PI / 2;
      } else {
        model.rotation.y = Math.PI;
      }

      model.traverse((child) => {
        if (child.isMesh && child.material) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.metalness = 0.92;
            child.material.roughness = 0.16;
            child.material.envMap = envTexture;
            child.material.envMapIntensity = 1.35;
            child.material.needsUpdate = true;
          }
        }
      });

      carRoot.remove(fallbackCar);
      wheelGroup.visible = false; // Hide procedural fallback wheels so only real 3D model wheels show
      carRoot.add(model);
      setModelReady(true);
    };

    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    dracoLoader.setDecoderConfig({ type: 'js' });
    loader.setDRACOLoader(dracoLoader);
    loader.load(
      '/models/volvo_s60_fast.glb',
      (gltf) => {
        setupCarMesh(gltf.scene);
      },
      undefined,
      (err) => {
        console.warn('Could not load volvo_s60_fast.glb, falling back to volvo_s60.glb', err);
        loader.load('/models/volvo_s60.glb', (gltf2) => {
          setupCarMesh(gltf2.scene);
        });
      }
    );

    // 5. Obstacle Assets (Shown only in Obstacle mode)
    const obstacleMeshes = [];
    const lanes = [-4.8, -1.6, 1.6, 4.8];
    const obsCount = 7;

    const barrierMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.75,
      metalness: 0.2,
    });
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    for (let i = 0; i < obsCount; i++) {
      const obsGroup = new THREE.Group();
      const baseBlock = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.95, 0.85), barrierMat);
      baseBlock.position.y = 0.48;
      baseBlock.castShadow = true;
      obsGroup.add(baseBlock);

      const hazardStripe = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.24, 0.87), stripeMat);
      hazardStripe.position.y = 0.58;
      obsGroup.add(hazardStripe);

      const beaconGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.22, 12);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
      for (let side of [-0.95, 0.95]) {
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.set(side, 1.05, 0);
        obsGroup.add(beacon);
      }

      const warningGlow = new THREE.PointLight(0xff4422, 1.5, 6.0);
      warningGlow.position.y = 1.3;
      obsGroup.add(warningGlow);

      // Initial placement with 130m head start buffer
      obsGroup.position.z = -130 - i * 45;
      obsGroup.position.x = lanes[Math.floor(Math.random() * lanes.length)];
      obsGroup.visible = stateRef.current.mode === 'dodge';
      scene.add(obsGroup);

      obstacleMeshes.push({
        mesh: obsGroup,
        width: 2.2,
        depth: 1.1,
        passed: false,
      });
    }
    stateRef.current.obstacles = obstacleMeshes;

    // 5.5 Scenic Mode Affirmation Words Pickups (Galvanic Energy Orbs)
    const affirmationsList = [
      { word: 'PATIENCE', subtitle: 'Great things take steady steps, Zeyad.' },
      { word: 'RESILIENCE', subtitle: 'Stronger with every mile driven.' },
      { word: 'UNSTOPPABLE', subtitle: 'Nothing holds back your inner spark.' },
      { word: 'INNER CALM', subtitle: 'Breathe in the calm air of the open road.' },
      { word: 'FREEDOM', subtitle: 'Your journey is yours to write and own.' },
      { word: 'COURAGE', subtitle: 'Bravery is facing each day with an open heart.' },
      { word: 'FOCUS', subtitle: 'Clear vision, steady hands, peaceful mind.' },
      { word: 'VICTORY', subtitle: 'You are the champion of your own journey.' },
    ];

    const affirmationOrbs = [];
    const orbGroup = new THREE.Group();
    scene.add(orbGroup);

    // Glowing orb geometry and materials
    const orbCoreGeo = new THREE.SphereGeometry(0.75, 20, 20);
    const orbRingGeo = new THREE.TorusGeometry(1.2, 0.08, 12, 28);
    const orbHaloGeo = new THREE.SphereGeometry(1.4, 16, 16);

    const orbColors = [0x34d399, 0x38bdf8, 0xfbbf24, 0xa855f7, 0xf43f5e];

    for (let i = 0; i < affirmationsList.length; i++) {
      const orbMeshGroup = new THREE.Group();
      const colorHex = orbColors[i % orbColors.length];

      // Inner pulsating core
      const coreMat = new THREE.MeshBasicMaterial({
        color: colorHex,
      });
      const core = new THREE.Mesh(orbCoreGeo, coreMat);
      orbMeshGroup.add(core);

      // Rotating gyro ring
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
      });
      const ring = new THREE.Mesh(orbRingGeo, ringMat);
      ring.rotation.x = Math.PI / 4;
      orbMeshGroup.add(ring);

      // Outer soft aura glow
      const haloMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
      });
      const halo = new THREE.Mesh(orbHaloGeo, haloMat);
      orbMeshGroup.add(halo);

      // Light emission
      const orbLight = new THREE.PointLight(colorHex, 2.5, 9);
      orbLight.position.y = 0;
      orbMeshGroup.add(orbLight);

      orbMeshGroup.position.set(
        lanes[i % lanes.length],
        1.2,
        -80 - i * 110 // Placed far apart so they feel special and rare, not crowded
      );
      orbMeshGroup.visible = stateRef.current.mode === 'scenic';
      orbGroup.add(orbMeshGroup);

      affirmationOrbs.push({
        group: orbMeshGroup,
        ring: ring,
        core: core,
        halo: halo,
        light: orbLight,
        data: affirmationsList[i],
        collected: false,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }
    stateRef.current.affirmationOrbs = affirmationOrbs;

    // 5.5 High-Speed Wind Streak Particle System
    const streakCount = 120;
    const streakGeo = new THREE.BufferGeometry();
    const streakPos = new Float32Array(streakCount * 3);
    for (let i = 0; i < streakCount; i++) {
      streakPos[i * 3] = (Math.random() - 0.5) * 14;
      streakPos[i * 3 + 1] = 0.5 + Math.random() * 3.5;
      streakPos[i * 3 + 2] = -Math.random() * 80;
    }
    streakGeo.setAttribute('position', new THREE.BufferAttribute(streakPos, 3));
    const streakMat = new THREE.PointsMaterial({
      color: 0x67e8f9,
      size: 0.22,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });
    const speedStreaks = new THREE.Points(streakGeo, streakMat);
    scene.add(speedStreaks);

    // 6. Keyboard Controls
    const onKeyDown = (e) => {
      keysPressed.current[e.key] = true;
    };
    const onKeyUp = (e) => {
      keysPressed.current[e.key] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // 7. Cinematic Animation Loop with Dynamic Day/Night
    const clock = new THREE.Clock();
    let frameId;
    let timeTicker = 0.05;
    let orbitTicker = 0;

    const C = (h) => new THREE.Color(h);
    const whiteCol = new THREE.Color(0xffffff);
    let lastTimeName = '';
    // t = position in day cycle (sun highest at 0.25, sets ~0.53, rises ~0.97)
    const skyKeyframes = [
      { t: 0.0, name: 'Morning', zenith: C(0x3b82f6), horizon: C(0xc7e0fb), fog: C(0xcfe3f7), sun: C(0xfff1c1), cloud: C(0xffffff), night: 0, sunI: 2.8, amb: 1.2, warmth: 0.03 },
      { t: 0.22, name: 'Midday', zenith: C(0x1d4ed8), horizon: C(0x9cc9fb), fog: C(0xc3dbf5), sun: C(0xfffaf0), cloud: C(0xffffff), night: 0, sunI: 3.3, amb: 1.35, warmth: 0.0 },
      { t: 0.4, name: 'Afternoon', zenith: C(0x2563eb), horizon: C(0xfde7a8), fog: C(0xf2dcb5), sun: C(0xffd27a), cloud: C(0xfff4e0), night: 0, sunI: 2.8, amb: 1.15, warmth: 0.07 },
      { t: 0.49, name: 'Golden Hour', zenith: C(0x3b2f8f), horizon: C(0xff8a3d), fog: C(0xf3a56f), sun: C(0xff6a1f), cloud: C(0xff9a6b), night: 0.05, sunI: 2.0, amb: 0.9, warmth: 0.16 },
      { t: 0.545, name: 'Sunset', zenith: C(0x1e1b4b), horizon: C(0xdb2777), fog: C(0x7a2e5e), sun: C(0xff3d6e), cloud: C(0xb4508f), night: 0.35, sunI: 0.9, amb: 0.6, warmth: 0.1 },
      { t: 0.62, name: 'Dusk', zenith: C(0x0b1030), horizon: C(0x3b2a6b), fog: C(0x1c1838), sun: C(0x6d28d9), cloud: C(0x3b3561), night: 0.8, sunI: 0.35, amb: 0.4, warmth: -0.02 },
      { t: 0.68, name: 'Starry Night', zenith: C(0x01030c), horizon: C(0x0e1a3d), fog: C(0x0a1126), sun: C(0x000000), cloud: C(0x1a2236), night: 1, sunI: 0.2, amb: 0.32, warmth: -0.06 },
      { t: 0.88, name: 'Starry Night', zenith: C(0x01030c), horizon: C(0x101c42), fog: C(0x0a1126), sun: C(0x000000), cloud: C(0x1a2236), night: 1, sunI: 0.2, amb: 0.32, warmth: -0.06 },
      { t: 0.935, name: 'Dawn', zenith: C(0x1e1b4b), horizon: C(0x8b5cf6), fog: C(0x4c3a7a), sun: C(0xff7eb3), cloud: C(0x8b6fb3), night: 0.55, sunI: 0.6, amb: 0.5, warmth: 0.02 },
      { t: 0.975, name: 'Sunrise', zenith: C(0x3b5bdb), horizon: C(0xffb877), fog: C(0xf3c79a), sun: C(0xffa95e), cloud: C(0xffc8a0), night: 0.1, sunI: 1.8, amb: 0.9, warmth: 0.1 },
      { t: 1.0, name: 'Morning', zenith: C(0x3b82f6), horizon: C(0xc7e0fb), fog: C(0xcfe3f7), sun: C(0xfff1c1), cloud: C(0xffffff), night: 0, sunI: 2.8, amb: 1.2, warmth: 0.03 },
    ];

    const currentFogColor = new THREE.Color();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      const state = stateRef.current;

      // Smoothly transition cycle towards targetCycle when user toggles time of day
      const targetCycle = state.targetCycle ?? 0.22;
      let curCycle = state.currentCycle ?? targetCycle;

      // Wrap-around shortest distance lerp on [0, 1)
      let diff = targetCycle - curCycle;
      if (diff > 0.5) diff -= 1.0;
      if (diff < -0.5) diff += 1.0;
      curCycle = (curCycle + diff * Math.min(1.0, delta * 3.5)) % 1.0;
      if (curCycle < 0) curCycle += 1.0;
      state.currentCycle = curCycle;
      const cycle = curCycle;

      // Celestial arc
      const sunAngle = cycle * Math.PI * 2;
      const sunY = Math.sin(sunAngle) * 160 + 35;
      const sunX = Math.cos(sunAngle) * 110;
      sunGroup.position.set(sunX, sunY, -260);
      sunGroup.visible = sunY > -10;

      const moonY = Math.sin(sunAngle + Math.PI) * 160 + 35;
      const moonX = Math.cos(sunAngle + Math.PI) * 110;
      moonGroup.position.set(moonX, moonY, -260);
      moonGroup.visible = moonY > -10;

      // Smooth multi-keyframe sky palette (gradient + lighting + stars)
      const kfA = skyKeyframes.findLast((k) => k.t <= cycle) || skyKeyframes[0];
      const kfB = skyKeyframes.find((k) => k.t > cycle) || skyKeyframes[skyKeyframes.length - 1];
      const span = Math.max(0.0001, kfB.t - kfA.t);
      const kt = THREE.MathUtils.smoothstep((cycle - kfA.t) / span, 0, 1);
      const mixN = (a, b) => a + (b - a) * kt;

      skyUniforms.zenith.value.lerpColors(kfA.zenith, kfB.zenith, kt);
      skyUniforms.horizon.value.lerpColors(kfA.horizon, kfB.horizon, kt);
      skyUniforms.sunColor.value.lerpColors(kfA.sun, kfB.sun, kt);
      skyUniforms.cloudColor.value.lerpColors(kfA.cloud, kfB.cloud, kt);
      currentFogColor.lerpColors(kfA.fog, kfB.fog, kt);
      const nightAmt = mixN(kfA.night, kfB.night);
      skyUniforms.night.value = nightAmt;
      skyUniforms.time.value += delta;
      skyUniforms.sunDir.value.set(sunX, sunY, -260).normalize();

      sunLight.color.lerpColors(kfA.sun, kfB.sun, kt).lerp(whiteCol, 0.45);
      sunLight.intensity = mixN(kfA.sunI, kfB.sunI);
      ambientLight.color.copy(currentFogColor).lerp(whiteCol, 0.35);
      ambientLight.intensity = mixN(kfA.amb, kfB.amb);
      hemiLight.color.copy(skyUniforms.zenith.value).lerp(whiteCol, 0.5);
      hemiLight.intensity = 1.4 * (1 - nightAmt * 0.75);
      starMat.uniforms.opacity.value = Math.pow(nightAmt, 1.5);
      starMat.uniforms.time.value += delta;
      lampLights.forEach((l) => (l.intensity = nightAmt * 2.4));
      headLights.forEach((h) => (h.intensity = nightAmt * 6.0));
      if (colorGradePass) colorGradePass.uniforms.warmth.value = mixN(kfA.warmth, kfB.warmth);
      const tName = kt < 0.5 ? kfA.name : kfB.name;
      if (tName !== lastTimeName) {
        lastTimeName = tName;
        setTimeOfDayName(tName);
      }

      // Occasional shooting star at night
      if (!shooting.active && nightAmt > 0.8 && Math.random() < delta * 0.25) {
        shooting.active = true;
        shooting.life = 1;
        const sx = (Math.random() - 0.5) * 400;
        shootingStar.position.set(sx, 180 + Math.random() * 120, -300);
        shooting.vel.set(sx > 0 ? -260 : 260, -90, 0);
        shootingStar.rotation.z = Math.atan2(shooting.vel.y, shooting.vel.x);
      }
      if (shooting.active) {
        shooting.life -= delta * 1.4;
        shootingStar.position.addScaledVector(shooting.vel, delta);
        shootingStarMat.opacity = Math.max(0, Math.sin(shooting.life * Math.PI)) * 0.9;
        if (shooting.life <= 0) {
          shooting.active = false;
          shootingStarMat.opacity = 0;
        }
      }

      scene.background = skyUniforms.horizon.value;
      scene.fog.color.copy(currentFogColor);

      if (!state.gameOver) {
        const isShowcase = state.mode === 'scenic' && !state.hasStartedDriving;

        if (isShowcase) {
          // Car is resting before start: Orbit around the Volvo S60 in full 360° glory
          state.carSpeed = 0;
          state.targetCarX = 0;
          state.carX = THREE.MathUtils.lerp(state.carX, 0, 0.05);
          carRoot.position.x = state.carX;
          carRoot.rotation.x = THREE.MathUtils.lerp(carRoot.rotation.x, 0, 0.1);
          carRoot.rotation.y = THREE.MathUtils.lerp(carRoot.rotation.y, 0, 0.1);
          carRoot.rotation.z = THREE.MathUtils.lerp(carRoot.rotation.z, 0, 0.1);

          orbitTicker += delta * 0.45;
          const orbitRadius = 6.8;
          const orbitSpeed = orbitTicker * 0.7;
          camera.position.x = Math.sin(orbitSpeed) * orbitRadius;
          camera.position.z = Math.cos(orbitSpeed) * orbitRadius;
          camera.position.y = 1.75 + Math.sin(orbitTicker * 0.5) * 0.35;
          camera.fov = THREE.MathUtils.lerp(camera.fov, 54, 0.08);
          camera.updateProjectionMatrix();

          // When the message card is open, offset the look-target slightly so the Volvo car stays perfectly centered in the visible left portion of the screen
          const targetLookX = showOverlookCard ? carRoot.position.x - 0.75 : carRoot.position.x;
          camera.lookAt(targetLookX, 0.75, carRoot.position.z);
        } else {
          // Dynamic speed control with responsive throttle boost & progressive braking
          let targetMultiplier = 1.0;
          if (keysPressed.current['ArrowUp'] || keysPressed.current['w'] || keysPressed.current['W']) {
            targetMultiplier = 1.65; // Boost up to ~155-165 km/h
          } else if (keysPressed.current['ArrowDown'] || keysPressed.current['s'] || keysPressed.current['S']) {
            targetMultiplier = 0.45; // Brake down to ~45-55 km/h
          }
          state.speedMultiplier = THREE.MathUtils.lerp(state.speedMultiplier, targetMultiplier, 0.12);

          // Stable base speed
          const baseSpeed = 1.05;
          state.carSpeed = baseSpeed * state.speedMultiplier;
          const forwardMove = state.carSpeed * 60 * delta;
          state.distance += forwardMove;
          const currentDistM = Math.floor(state.distance * 0.1);
          setDistanceTraveled(currentDistM);

          // Wheels spin proportional to forward motion
          const spinDelta = (forwardMove / 0.35) * 1.5;
          wheels.forEach((w) => {
            w.rotation.x -= spinDelta;
          });

          // Steering
          const steerSpeed = 8.5 * delta;
          if (keysPressed.current['ArrowLeft'] || keysPressed.current['a'] || keysPressed.current['A']) {
            state.targetCarX = Math.max(-5.2, state.targetCarX - steerSpeed);
          }
          if (keysPressed.current['ArrowRight'] || keysPressed.current['d'] || keysPressed.current['D']) {
            state.targetCarX = Math.min(5.2, state.targetCarX + steerSpeed);
          }

          // Smooth chassis sway
          state.carX = THREE.MathUtils.lerp(state.carX, state.targetCarX, 0.16);
          carRoot.position.x = state.carX;
          const turnAngle = (state.targetCarX - state.carX) * -0.24;
          carRoot.rotation.y = THREE.MathUtils.lerp(carRoot.rotation.y, turnAngle, 0.2);
          carRoot.rotation.z = THREE.MathUtils.lerp(carRoot.rotation.z, turnAngle * 0.45, 0.2);

          // Steer front wheels
          if (wheels.length >= 4) {
            const steerSteerAngle = turnAngle * 0.8;
            wheels[2].rotation.y = THREE.MathUtils.lerp(wheels[2].rotation.y, steerSteerAngle, 0.2);
            wheels[3].rotation.y = THREE.MathUtils.lerp(wheels[3].rotation.y, steerSteerAngle, 0.2);
          }

          // Dynamic Camera FOV & Pitch based on Boost / Brake sensation
          const targetFov = state.speedMultiplier > 1.2 ? 65 : state.speedMultiplier < 0.75 ? 49 : 54;
          camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.08);
          camera.updateProjectionMatrix();

          // Authentic chassis suspension pitch (squats back on hard throttle, dives forward on brake)
          const pitchTarget = state.speedMultiplier > 1.2 ? 0.024 : state.speedMultiplier < 0.75 ? -0.035 : 0;
          carRoot.rotation.x = THREE.MathUtils.lerp(carRoot.rotation.x, pitchTarget, 0.12);

          // Animate Speed Streak Particles
          const isBoosting = state.speedMultiplier > 1.15;
          const targetStreakOpacity = isBoosting ? (state.speedMultiplier - 1.15) * 1.5 : 0.0;
          streakMat.opacity = THREE.MathUtils.lerp(streakMat.opacity, Math.min(0.85, targetStreakOpacity), 0.15);
          if (streakMat.opacity > 0.02) {
            const positions = streakGeo.attributes.position.array;
            for (let i = 0; i < streakCount; i++) {
              positions[i * 3 + 2] += forwardMove * 3.2;
              if (positions[i * 3 + 2] > 10) {
                positions[i * 3 + 2] = -90 - Math.random() * 30;
                positions[i * 3] = carRoot.position.x + (Math.random() - 0.5) * 12;
                positions[i * 3 + 1] = 0.4 + Math.random() * 3.2;
              }
            }
            streakGeo.attributes.position.needsUpdate = true;
          }

          // Immersive Chase Camera with authentic road eye-level
          const speedShake = isBoosting ? (Math.random() - 0.5) * 0.03 : 0;
          const breathe = Math.sin(timeTicker * 14) * 0.02 + speedShake;
          camera.position.x = THREE.MathUtils.lerp(camera.position.x, state.carX * 0.72 + breathe, 0.12);
          camera.position.y = (state.speedMultiplier > 1.2 ? 2.05 : 2.15) + Math.cos(timeTicker * 16) * 0.015;
          camera.position.z = state.speedMultiplier > 1.2 ? 6.55 : 6.2;
          camera.lookAt(state.carX * 0.5, 0.9, -24);

          // Move Road
          dashes.forEach((d) => {
            d.position.z += forwardMove;
            if (d.position.z > 25) {
              d.position.z -= roadLength;
            }
          });

          // Move Lamps
          streetLights.forEach((lamp) => {
            lamp.position.z += forwardMove;
            if (lamp.position.z > 25) {
              lamp.position.z -= roadLength * 2;
            }
          });

          // Move Nature Trees
          sceneryItems.forEach((tree) => {
            tree.position.z += forwardMove;
            if (tree.position.z > 35) {
              tree.position.z -= roadLength * 2;
            }
          });

          // Move Distant Mountain Silhouettes
          mountainMeshes.forEach((mnt) => {
            mnt.position.z += forwardMove * 0.08;
            if (mnt.position.z > -80) {
              mnt.position.z -= 320;
            }
          });

          // Move City Buildings smoothly past the car
          cityBuildings.forEach((bld) => {
            bld.position.z += forwardMove;
            if (bld.position.z > 35) {
              bld.position.z -= 360;
            }
          });

          // Anchor sky dome to camera
          skyGroup.position.z = camera.position.z - 40;

          if (state.mode === 'scenic') {
            const scenicScore = Math.floor(state.distance * 0.8);
            state.score = scenicScore;
            setScore(scenicScore);

            // Update Affirmation Orbs in Scenic Mode
            const carPos = carRoot.position;
            state.affirmationOrbs.forEach((orb) => {
              orb.group.position.z += forwardMove;

              // Ambient float animation & ring rotation
              orb.ring.rotation.x += delta * 2.2;
              orb.ring.rotation.y += delta * 1.8;
              orb.core.rotation.y -= delta * 1.5;
              const floatY = 1.2 + Math.sin(timeTicker * 45 + orb.pulseOffset) * 0.22;
              orb.group.position.y = floatY;

              // Check if car passes through the orb
              const dx = Math.abs(carPos.x - orb.group.position.x);
              const dz = Math.abs(carPos.z - orb.group.position.z);

              if (!orb.collected && dx < 2.0 && dz < 2.2) {
                orb.collected = true;
                orb.group.visible = false;
                setCollectedCount((prev) => prev + 1);
                setActiveAffirmation(orb.data);

                // Auto-dismiss affirmation banner after 4.5s
                setTimeout(() => {
                  setActiveAffirmation((curr) => (curr?.word === orb.data.word ? null : curr));
                }, 4500);
              }

              // Loop orbs seamlessly forward down the road with generous spacing
              if (orb.group.position.z > 20) {
                orb.group.position.z = -350 - Math.random() * 120;
                orb.group.position.x = lanes[Math.floor(Math.random() * lanes.length)];
                orb.collected = false;
                if (state.mode === 'scenic') {
                  orb.group.visible = true;
                }
              }
            });
          } else {
            const carBox = new THREE.Box3().setFromCenterAndSize(
              new THREE.Vector3(carRoot.position.x, 0.6, 0),
              new THREE.Vector3(1.7, 0.9, 3.8)
            );

            state.obstacles.forEach((obs) => {
              obs.mesh.position.z += forwardMove;

              if (!obs.passed && obs.mesh.position.z > carRoot.position.z + 2.0) {
                obs.passed = true;
                state.score += 100;
                setScore(state.score);
                setHighScore((prev) => {
                  const updated = Math.max(prev, state.score);
                  localStorage.setItem('volvo_high_score', updated.toString());
                  return updated;
                });
              }

              const obsBox = new THREE.Box3().setFromCenterAndSize(
                new THREE.Vector3(obs.mesh.position.x, 0.55, obs.mesh.position.z),
                new THREE.Vector3(obs.width, 1.1, obs.depth)
              );

              if (carBox.intersectsBox(obsBox)) {
                state.gameOver = true;
                setIsGameOver(true);
                carRoot.rotation.z = 0.35;
                carRoot.position.y = 0.4;
              }

              if (obs.mesh.position.z > 16) {
                obs.mesh.position.z = -140 - Math.random() * 20;
                obs.mesh.position.x = lanes[Math.floor(Math.random() * lanes.length)];
                obs.passed = false;
              }
            });
          }
        }

        setSpeedKmh(Math.round(state.carSpeed * 95));
      }

      // Render via Post-Processing Pipeline if available, or direct high-performance WebGL
      if (composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
      if (composer) {
        composer.setSize(container.clientWidth, container.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      if (composer) {
        composer.dispose();
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-8 bg-black/85 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl h-[88vh] bg-[#070b0e] border-2 border-emerald-400/80 rounded-3xl overflow-hidden shadow-[0_0_90px_rgba(16,185,129,0.35)] flex flex-col">
        {/* Top HUD Header */}
        <div className="flex flex-wrap items-center justify-between px-6 py-3 bg-black/85 border-b border-white/10 z-20 gap-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-white text-base md:text-lg tracking-wider uppercase">
                  TIXI // J.O.C.A.S.T.A — VOLVO S60
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-400/50 font-mono text-[10px] text-emerald-300 font-bold flex items-center gap-1">
                  <Film className="w-3 h-3 text-emerald-400" />
                  <span>CINEMATIC PBR</span>
                </span>
              </div>
              <p className="font-mono text-xs text-white/60 hidden sm:block">
                {gameMode === 'scenic'
                  ? `Cruise through the ${environmentTheme === 'city' ? 'Metropolis City Skyline' : 'Mountain Pine Pass'} with Tixi`
                  : '⚠️ Obstacle Mode • Steer between oncoming barriers with [A / D] or [Arrows]'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Scene Environment Toggle: City vs Mountain Forest */}
            <div className="flex items-center p-0.5 bg-white/5 border border-white/15 rounded-2xl">
              <button
                onClick={() => setEnvironmentTheme('city')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                  environmentTheme === 'city'
                    ? 'bg-sky-400 text-black shadow-[0_0_12px_rgba(56,189,248,0.4)]'
                    : 'text-white/70 hover:text-white'
                }`}
                title="Switch to City Skyline: Cruise by illuminated skyscrapers and glowing city towers"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>CITY</span>
              </button>

              <button
                onClick={() => setEnvironmentTheme('mountain')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                  environmentTheme === 'mountain'
                    ? 'bg-emerald-400 text-black shadow-[0_0_12px_rgba(52,211,153,0.4)]'
                    : 'text-white/70 hover:text-white'
                }`}
                title="Switch to Mountain Forest: Cruise by pine trees and mountain peaks"
              >
                <Trees className="w-3.5 h-3.5" />
                <span>MOUNTAINS</span>
              </button>
            </div>

            {/* Interactive Time-Of-Day Selector Toggle */}
            <div className="flex items-center p-0.5 bg-white/5 border border-white/15 rounded-2xl">
              <button
                onClick={() => setSelectedTimeOfDay('dawn')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-mono text-[11px] font-bold transition-all cursor-pointer ${
                  selectedTimeOfDay === 'dawn'
                    ? 'bg-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                    : 'text-white/60 hover:text-white'
                }`}
                title="Dawn (Twilight rose and purple)"
              >
                <span>DAWN</span>
              </button>

              <button
                onClick={() => setSelectedTimeOfDay('day')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-mono text-[11px] font-bold transition-all cursor-pointer ${
                  selectedTimeOfDay === 'day'
                    ? 'bg-amber-300 text-black shadow-[0_0_12px_rgba(252,211,77,0.4)]'
                    : 'text-white/60 hover:text-white'
                }`}
                title="Day (Bright blue sky and warm sun)"
              >
                <Sun className="w-3.5 h-3.5" />
                <span>DAY</span>
              </button>

              <button
                onClick={() => setSelectedTimeOfDay('golden')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-mono text-[11px] font-bold transition-all cursor-pointer ${
                  selectedTimeOfDay === 'golden'
                    ? 'bg-orange-400 text-black shadow-[0_0_12px_rgba(251,146,60,0.4)]'
                    : 'text-white/60 hover:text-white'
                }`}
                title="Golden Hour (Warm amber tones)"
              >
                <span>GOLDEN</span>
              </button>

              <button
                onClick={() => setSelectedTimeOfDay('sunset')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-mono text-[11px] font-bold transition-all cursor-pointer ${
                  selectedTimeOfDay === 'sunset'
                    ? 'bg-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.4)]'
                    : 'text-white/60 hover:text-white'
                }`}
                title="Sunset (Deep magenta and sunset hues)"
              >
                <Sunset className="w-3.5 h-3.5" />
                <span>SUNSET</span>
              </button>

              <button
                onClick={() => setSelectedTimeOfDay('night')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-mono text-[11px] font-bold transition-all cursor-pointer ${
                  selectedTimeOfDay === 'night'
                    ? 'bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                    : 'text-white/60 hover:text-white'
                }`}
                title="Night (Starry cosmos with Milky Way)"
              >
                <Moon className="w-3.5 h-3.5" />
                <span>NIGHT</span>
              </button>
            </div>

            {/* Mode Toggle Switch: Scenic Cruise vs Obstacle Course */}
            <div className="flex items-center p-0.5 bg-white/5 border border-white/15 rounded-2xl">
              <button
                onClick={() => {
                  setGameMode('scenic');
                  setIsGameOver(false);
                  stateRef.current.gameOver = false;
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                  gameMode === 'scenic'
                    ? 'bg-emerald-400 text-black shadow-[0_0_12px_rgba(52,211,153,0.4)]'
                    : 'text-white/70 hover:text-white'
                }`}
                title="Scenic Mode: Peaceful drive, zero crashes, zero obstacles"
              >
                <span>CRUISE</span>
              </button>

              <button
                onClick={() => {
                  setShowPasswordModal(true);
                  setPasswordInput('');
                  setPasswordError(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                  gameMode === 'dodge'
                    ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                    : 'text-white/70 hover:text-white'
                }`}
                title="Obstacle Mode: Protected by password"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Speedometer */}
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/15 px-3 py-1.5 rounded-2xl">
              <Gauge className="w-4 h-4 text-emerald-400" />
              <div className="font-mono text-xs text-white font-black tracking-wider">
                {speedKmh} <span className="text-[10px] text-white/50">KM/H</span>
              </div>
            </div>

            {/* Distance / Score */}
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/15 px-3 py-1.5 rounded-2xl">
              {gameMode === 'scenic' ? (
                <>
                  <Compass className="w-4 h-4 text-emerald-300" />
                  <div className="font-mono text-xs text-emerald-300 font-black tracking-wider">
                    {distanceTraveled} <span className="text-[10px] text-white/50">M</span>
                  </div>
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <div className="font-mono text-xs text-amber-300 font-black tracking-wider">
                    {score} <span className="text-[10px] text-white/40">PTS</span>
                  </div>
                </>
              )}
            </div>

            {/* Affirmations Collected Counter in Scenic Mode */}
            {gameMode === 'scenic' && (
              <div
                className="hidden sm:flex items-center gap-1.5 bg-white/5 border border-emerald-400/30 px-3 py-1.5 rounded-2xl"
                title="Affirmation Orbs Collected"
              >
                <Heart className="w-4 h-4 text-rose-400 fill-rose-400/40" />
                <div className="font-mono text-xs text-white font-bold tracking-wider">
                  {collectedCount} <span className="text-[10px] text-rose-300">AFFIRMATIONS</span>
                </div>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Close Volvo Cruise"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3D WebGL Canvas Viewport */}
        <div ref={mountRef} className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing">
          {/* High-Fidelity Loading Overlay until real Volvo 3D GLB model finishes loading */}
          {!modelReady && (
            <div className="absolute inset-0 z-40 bg-[#070b0e] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-full border-2 border-emerald-400/20 border-t-emerald-400 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                </div>
              </div>
              <div className="font-display font-black text-sm tracking-widest text-emerald-300 uppercase mb-1">
                PREPARING VOLVO S60
              </div>
              <p className="font-mono text-xs text-white/60">
                Loading 3D chassis & photorealistic lacquer...
              </p>
            </div>
          )}
          {/* Subtle status indicator placed cleanly at the top-left under the header */}
          {gameMode === 'scenic' && (
            <div className="absolute top-4 left-6 z-20 pointer-events-none bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-emerald-400/30 text-emerald-300 font-mono text-[11px] flex items-center gap-2 shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              <span>
                Cruising through the {environmentTheme === 'city' ? 'Metropolis Skyline' : 'Mountain Pass'} with Tixi • {timeOfDayName}
              </span>
            </div>
          )}

          {/* Floating Affirmation Pickup Celebration Banner */}
          {activeAffirmation && (
            <div className="absolute top-14 inset-x-0 mx-auto w-fit max-w-md z-30 pointer-events-none px-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="bg-black/90 backdrop-blur-xl border-2 border-emerald-400 rounded-3xl p-4 px-6 shadow-[0_0_40px_rgba(52,211,153,0.6)] text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-emerald-400 animate-spin" />
                  <span className="font-display font-black text-xl md:text-2xl tracking-widest text-emerald-300 uppercase">
                    {activeAffirmation.word}
                  </span>
                  <Sparkles className="w-5 h-5 text-emerald-400 animate-spin" />
                </div>
                <p className="font-mono text-xs text-white/90 tracking-wide font-medium">
                  {activeAffirmation.subtitle}
                </p>
              </div>
            </div>
          )}

          {/* Touch / Click On-Screen Controls: Steering & Speed Pedals */}
          <div className="absolute inset-x-0 bottom-6 z-20 flex justify-between px-4 md:px-10 pointer-events-none">
            {/* Left Hand: Steering Controls */}
            <div className="flex items-center gap-3">
              <button
                onPointerDown={() => {
                  stateRef.current.targetCarX = Math.max(-5.2, stateRef.current.targetCarX - 1.6);
                }}
                className="pointer-events-auto p-4 rounded-full bg-black/80 hover:bg-emerald-400 text-emerald-400 hover:text-black border border-emerald-400/40 shadow-xl transition cursor-pointer"
                title="Steer Left (A / Left Arrow)"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>

              <button
                onPointerDown={() => {
                  stateRef.current.targetCarX = Math.min(5.2, stateRef.current.targetCarX + 1.6);
                }}
                className="pointer-events-auto p-4 rounded-full bg-black/80 hover:bg-emerald-400 text-emerald-400 hover:text-black border border-emerald-400/40 shadow-xl transition cursor-pointer"
                title="Steer Right (D / Right Arrow)"
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>

            {/* Right Hand: Speed Controls (Gas Boost / Brake) */}
            <div className="flex items-center gap-3">
              <button
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture?.(e.pointerId);
                  keysPressed.current['ArrowDown'] = true;
                }}
                onPointerUp={(e) => {
                  e.currentTarget.releasePointerCapture?.(e.pointerId);
                  keysPressed.current['ArrowDown'] = false;
                }}
                onPointerCancel={() => {
                  keysPressed.current['ArrowDown'] = false;
                }}
                className="pointer-events-auto px-4 py-3.5 rounded-2xl bg-black/80 hover:bg-amber-400 text-amber-400 hover:text-black border border-amber-400/40 shadow-xl transition cursor-pointer flex items-center gap-1.5 font-mono text-xs font-bold select-none active:scale-95"
                title="Brake / Slow Down (S / Down Arrow)"
              >
                <ChevronDown className="w-5 h-5" />
                <span className="hidden sm:inline">BRAKE</span>
              </button>

              <button
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture?.(e.pointerId);
                  keysPressed.current['ArrowUp'] = true;
                }}
                onPointerUp={(e) => {
                  e.currentTarget.releasePointerCapture?.(e.pointerId);
                  keysPressed.current['ArrowUp'] = false;
                }}
                onPointerCancel={() => {
                  keysPressed.current['ArrowUp'] = false;
                }}
                className="pointer-events-auto px-5 py-3.5 rounded-2xl bg-black/80 hover:bg-emerald-400 text-emerald-400 hover:text-black border border-emerald-400/40 shadow-xl transition cursor-pointer flex items-center gap-1.5 font-mono text-xs font-black shadow-[0_0_20px_rgba(52,211,153,0.3)] select-none active:scale-95"
                title="Accelerate / Boost (W / Up Arrow)"
              >
                <ChevronUp className="w-5 h-5 text-current animate-bounce" />
                <span className="hidden sm:inline">BOOST</span>
              </button>
            </div>
          </div>

          {/* Initial Pre-Drive 3D Showcase & Heartfelt Message Panel (Positioned on the Right) */}
          {gameMode === 'scenic' && !hasStartedDriving && (
            <div className="absolute top-3 bottom-3 right-4 md:right-6 z-30 pointer-events-none flex flex-col items-end justify-start animate-in fade-in slide-in-from-right duration-500 max-w-[340px] md:max-w-sm w-full">
              {/* Toggle Orbit View / Panel Visibility - Always pinned top right */}
              <button
                onClick={() => setShowOverlookCard((prev) => !prev)}
                className="pointer-events-auto shrink-0 mb-2 px-3.5 py-1.5 rounded-full bg-black/85 hover:bg-emerald-400 text-emerald-300 hover:text-black border border-emerald-400/50 text-[10px] md:text-[11px] font-mono font-bold flex items-center gap-2 backdrop-blur-xl shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-all cursor-pointer select-none active:scale-95"
              >
                <Eye className="w-3.5 h-3.5 text-current" />
                <span>{showOverlookCard ? 'HIDE PANEL (FULL 360° ORBIT)' : 'SHOW MESSAGE & START'}</span>
              </button>

              {showOverlookCard && (
                <div className="pointer-events-auto w-full max-h-full overflow-y-auto bg-[#070d12]/95 border border-emerald-400/80 rounded-2xl md:rounded-3xl p-4 md:p-5 shadow-[0_0_50px_rgba(52,211,153,0.35)] backdrop-blur-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="font-display font-black text-[11px] md:text-xs text-emerald-300 tracking-wider uppercase">
                        TIXI // ONE LAST MEMORY
                      </span>
                      <span className="ml-auto font-mono text-[8px] text-white/50 border border-white/10 px-1.5 py-0.5 rounded-full uppercase">
                        360° VIEW
                      </span>
                    </div>

                    <p className="font-mono text-[11px] md:text-xs text-white/90 mb-4 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/10 italic">
                      "I know how much you miss her, and I know nothing in this world can ever truly replace the feeling of gripping the wheel and driving your favorite car again. But I wanted you to have this—a place where she lives on, looking just as stunning as the day you drove her. Take all the time you need to look around, and whenever you're ready, take her out on the open road and drive as long as you want. Let this be a sweet, lasting memory."
                    </p>
                  </div>

                  <button
                    onClick={handleStartDriving}
                    className="w-full shrink-0 py-2.5 md:py-3 rounded-xl md:rounded-2xl bg-emerald-400 hover:brightness-110 text-black font-display font-black text-[11px] md:text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(52,211,153,0.45)] cursor-pointer active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>START DRIVING // HIT THE ROAD</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Password Protection Modal for Obstacle Mode */}
          {showPasswordModal && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
              <div className="w-full max-w-sm bg-[#0a1117] border-2 border-amber-400/80 rounded-3xl p-6 text-center shadow-[0_0_50px_rgba(251,191,36,0.3)]">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-400/10 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <AlertOctagon className="w-6 h-6" />
                </div>
                <h4 className="font-display font-black text-lg text-white uppercase tracking-wider mb-1">
                  ACCESS CODE REQUIRED
                </h4>
                <p className="font-mono text-xs text-white/70 mb-4 leading-relaxed">
                  If you want to play this challenge mode, ask the owner. This module includes road barrier tests.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (passwordInput.trim() === '1234' || passwordInput.trim().toLowerCase() === 'volvo') {
                      setShowPasswordModal(false);
                      setGameMode('dodge');
                      stateRef.current.hasStartedDriving = true;
                      setHasStartedDriving(true);
                      handleRestart();
                      stateRef.current.hasStartedDriving = true;
                      setHasStartedDriving(true);
                    } else {
                      setPasswordError(true);
                    }
                  }}
                  className="space-y-3"
                >
                  <input
                    type="password"
                    autoFocus
                    placeholder="Enter Security PIN"
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setPasswordError(false);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/20 text-center font-mono text-white text-sm tracking-widest focus:outline-none focus:border-amber-400 transition"
                  />

                  {passwordError && (
                    <p className="text-[11px] font-mono text-rose-400">
                      Incorrect access code. Mode locked.
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:brightness-110 text-black font-display font-bold text-xs tracking-wider uppercase transition cursor-pointer"
                    >
                      UNLOCK
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPasswordModal(false)}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs transition cursor-pointer"
                    >
                      CANCEL
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Game Over Crash Screen Overlay (Only active in Obstacle Mode) */}
          {gameMode === 'dodge' && isGameOver && (
            <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
              <div className="w-full max-w-md bg-[#0d141a] border-2 border-emerald-500/70 rounded-3xl p-6 md:p-8 text-center shadow-[0_0_60px_rgba(16,185,129,0.3)]">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="font-display font-black text-2xl md:text-3xl text-white tracking-wide uppercase mb-1">
                  PIT STOP // TIXI IS READY
                </h3>
                <p className="font-mono text-xs text-white/70 mb-5 leading-relaxed">
                  "J.O.C.A.S.T.A is built to roll forever. Ready for another run, or switch to Scenic Cruise?"
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6 font-mono bg-white/5 border border-white/10 p-4 rounded-2xl">
                  <div>
                    <span className="text-[10px] text-white/50 uppercase">FINAL SCORE</span>
                    <div className="text-xl font-bold text-emerald-400">{score}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/50 uppercase">RECORD HIGH</span>
                    <div className="text-xl font-bold text-amber-300">{highScore}</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setGameMode('scenic');
                      handleRestart();
                    }}
                    className="flex-1 py-3 rounded-2xl bg-emerald-400 hover:brightness-110 text-black font-display font-black text-xs tracking-widest uppercase transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    <Trees className="w-4 h-4" />
                    <span>SCENIC CRUISE (NO OBSTACLES)</span>
                  </button>

                  <button
                    onClick={handleRestart}
                    className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>RETRY</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
