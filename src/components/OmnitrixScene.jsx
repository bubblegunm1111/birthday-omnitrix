import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ALIENS } from '../data/aliens';
import {
  preloadOmnitrixFaceImages,
  renderOmnitrixFaceplate,
} from '../utils/omnitrixFaceRenderer';

// Procedural stylized 3D hologram meshes for aliens without a dedicated GLB
function createProceduralAlienHologram(alienId, colorHex) {
  const group = new THREE.Group();
  const holoMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 1.4,
    transparent: true,
    opacity: 0.9,
    roughness: 0.15,
    metalness: 0.8,
  });

  const wireMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true,
    opacity: 0.25,
  });

  const addPart = (geo, pos, rot = [0, 0, 0], scale = [1, 1, 1]) => {
    const mesh = new THREE.Mesh(geo, holoMat);
    const wire = new THREE.Mesh(geo, wireMat);
    mesh.position.set(...pos);
    mesh.rotation.set(...rot);
    mesh.scale.set(...scale);
    wire.position.set(...pos);
    wire.rotation.set(...rot);
    wire.scale.set(scale[0] * 1.02, scale[1] * 1.02, scale[2] * 1.02);
    group.add(mesh);
    group.add(wire);
    return mesh;
  };

  if (alienId === 'heatblast') {
    addPart(new THREE.OctahedronGeometry(0.32, 2), [0, 0.25, 0], [0, 0, 0], [1, 1.35, 0.7]);
    addPart(new THREE.SphereGeometry(0.19, 12, 12), [0, 0.78, 0]);
    addPart(new THREE.ConeGeometry(0.16, 0.45, 6), [0, 1.06, 0]);
    addPart(new THREE.ConeGeometry(0.09, 0.32, 5), [-0.14, 0.98, 0], [0, 0, 0.4]);
    addPart(new THREE.ConeGeometry(0.09, 0.32, 5), [0.14, 0.98, 0], [0, 0, -0.4]);
    addPart(new THREE.DodecahedronGeometry(0.18, 0), [-0.42, 0.52, 0]);
    addPart(new THREE.DodecahedronGeometry(0.18, 0), [0.42, 0.52, 0]);
    addPart(new THREE.CylinderGeometry(0.09, 0.13, 0.55, 8), [-0.52, 0.15, 0.1], [0.3, 0, 0.25]);
    addPart(new THREE.CylinderGeometry(0.09, 0.13, 0.55, 8), [0.52, 0.15, 0.1], [0, 0, -0.25]);
    addPart(new THREE.CylinderGeometry(0.11, 0.08, 0.65, 8), [-0.18, -0.45, 0]);
    addPart(new THREE.CylinderGeometry(0.11, 0.08, 0.65, 8), [0.18, -0.45, 0]);
  } else if (alienId === 'xlr8') {
    addPart(new THREE.ConeGeometry(0.26, 0.75, 8), [0, 0.28, 0], [0.35, 0, 0], [1, 1, 0.75]);
    addPart(new THREE.ConeGeometry(0.2, 0.58, 8), [0, 0.82, -0.1], [-1.1, 0, 0]);
    addPart(new THREE.ConeGeometry(0.12, 0.7, 6), [0, -0.1, -0.45], [1.1, 0, 0]);
    addPart(new THREE.CylinderGeometry(0.06, 0.04, 0.5, 6), [-0.34, 0.3, 0.22], [0.8, 0, 0.3]);
    addPart(new THREE.CylinderGeometry(0.06, 0.04, 0.5, 6), [0.34, 0.3, 0.22], [0.8, 0, -0.3]);
    addPart(new THREE.CylinderGeometry(0.08, 0.05, 0.55, 6), [-0.18, -0.35, 0.05], [-0.2, 0, 0]);
    addPart(new THREE.CylinderGeometry(0.08, 0.05, 0.55, 6), [0.18, -0.35, 0.05], [-0.2, 0, 0]);
    addPart(new THREE.TorusGeometry(0.13, 0.05, 8, 16), [-0.18, -0.68, 0.1], [0, Math.PI / 2, 0]);
    addPart(new THREE.TorusGeometry(0.13, 0.05, 8, 16), [0.18, -0.68, 0.1], [0, Math.PI / 2, 0]);
  } else if (alienId === 'diamondhead') {
    addPart(new THREE.OctahedronGeometry(0.38, 0), [0, 0.28, 0], [0, Math.PI / 4, 0], [1.15, 1.35, 0.8]);
    addPart(new THREE.ConeGeometry(0.2, 0.45, 4), [0, 0.88, 0], [0, Math.PI / 4, 0]);
    addPart(new THREE.ConeGeometry(0.12, 0.55, 4), [-0.25, 0.65, -0.2], [-0.5, 0, 0.4]);
    addPart(new THREE.ConeGeometry(0.12, 0.55, 4), [0.25, 0.65, -0.2], [-0.5, 0, -0.4]);
    addPart(new THREE.ConeGeometry(0.15, 0.72, 4), [-0.54, 0.2, 0.15], [Math.PI / 1.4, 0, 0.3]);
    addPart(new THREE.ConeGeometry(0.15, 0.72, 4), [0.54, 0.2, 0.15], [Math.PI / 1.4, 0, -0.3]);
    addPart(new THREE.CylinderGeometry(0.14, 0.09, 0.65, 5), [-0.2, -0.45, 0]);
    addPart(new THREE.CylinderGeometry(0.14, 0.09, 0.65, 5), [0.2, -0.45, 0]);
  } else if (alienId === 'ghostfreak') {
    addPart(new THREE.SphereGeometry(0.35, 16, 16), [0, 0.52, 0], [0, 0, 0], [1.1, 1.25, 0.85]);
    addPart(new THREE.ConeGeometry(0.34, 0.95, 12), [0, -0.25, -0.05], [Math.PI + 0.15, 0, 0.12]);
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x39ff14 })
    );
    eye.position.set(0.05, 0.65, 0.29);
    group.add(eye);
    addPart(new THREE.ConeGeometry(0.09, 0.55, 6), [-0.48, 0.35, 0.2], [1.1, 0, 0.5]);
    addPart(new THREE.ConeGeometry(0.09, 0.55, 6), [0.48, 0.35, 0.2], [1.1, 0, -0.5]);
  } else {
    addPart(new THREE.CylinderGeometry(0.28, 0.34, 0.68, 16), [0, 0.2, 0], [0, 0, 0], [1, 1, 0.7]);
    addPart(new THREE.SphereGeometry(0.22, 16, 16), [0, 0.74, 0]);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.11, 0.032, 12, 24),
      new THREE.MeshBasicMaterial({ color: 0x39ff14 })
    );
    ring.position.set(0, 0.75, 0.19);
    group.add(ring);
    addPart(new THREE.CylinderGeometry(0.1, 0.08, 0.62, 10), [-0.44, 0.2, 0], [0, 0, 0.2]);
    addPart(new THREE.CylinderGeometry(0.1, 0.08, 0.62, 10), [0.44, 0.2, 0], [0, 0, -0.2]);
    addPart(new THREE.CylinderGeometry(0.12, 0.09, 0.65, 10), [-0.18, -0.45, 0]);
    addPart(new THREE.CylinderGeometry(0.12, 0.09, 0.65, 10), [0.18, -0.45, 0]);
  }

  return group;
}

// Build the Classic Prototype Omnitrix with visible mechanical piston rods & glowing spring column
function buildClassicOmnitrixAssembly(dialTexture) {
  const root = new THREE.Group();

  const darkMetal = new THREE.MeshStandardMaterial({
    color: 0x1a2220,
    roughness: 0.42,
    metalness: 0.68,
  });

  const cuffBase = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.18, 0.42, 36), darkMetal);
  cuffBase.position.y = -0.22;
  cuffBase.castShadow = true;
  cuffBase.receiveShadow = true;
  root.add(cuffBase);

  const tubeMat = new THREE.MeshStandardMaterial({
    color: 0x5c7572,
    roughness: 0.35,
    metalness: 0.45,
  });

  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const wingGroup = new THREE.Group();
    wingGroup.rotation.y = angle;

    const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.44, 0.72), darkMetal);
    bumper.position.set(0, -0.15, 1.05);
    bumper.rotation.x = 0.2;
    wingGroup.add(bumper);

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.12, 0.78),
      new THREE.Vector3(0.08, 0.2, 0.98),
      new THREE.Vector3(0.18, 0.04, 1.16),
    ]);
    const pipeGeo = new THREE.TubeGeometry(curve, 16, 0.11, 12, false);
    const pipeMesh = new THREE.Mesh(pipeGeo, tubeMat);
    wingGroup.add(pipeMesh);

    root.add(wingGroup);
  }

  const bottomButtonHousing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.2, 0.25, 20),
    new THREE.MeshStandardMaterial({ color: 0x3b4d3b, roughness: 0.4, metalness: 0.7 })
  );
  bottomButtonHousing.position.set(0, 0.0, 1.02);
  bottomButtonHousing.rotation.x = Math.PI / 3;
  root.add(bottomButtonHousing);

  const bottomButtonGlow = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.27, 20),
    new THREE.MeshBasicMaterial({ color: 0x80ff00 })
  );
  bottomButtonGlow.position.set(0, 0.0, 1.02);
  bottomButtonGlow.rotation.x = Math.PI / 3;
  root.add(bottomButtonGlow);

  // Pop-Up Dial Core Assembly
  const dialCore = new THREE.Group();
  dialCore.position.y = 0.42;
  root.add(dialCore);

  const coreSleeve = new THREE.Mesh(
    new THREE.CylinderGeometry(0.76, 0.8, 0.65, 36),
    new THREE.MeshStandardMaterial({
      color: 0x162919,
      emissive: 0x66ff00,
      emissiveIntensity: 0.75,
      metalness: 0.7,
      roughness: 0.2,
    })
  );
  coreSleeve.position.y = -0.32;
  dialCore.add(coreSleeve);

  for (let r = 0; r < 3; r++) {
    const sideRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.79, 0.02, 12, 48),
      new THREE.MeshBasicMaterial({ color: 0x9eff00 })
    );
    sideRing.rotation.x = Math.PI / 2;
    sideRing.position.y = -0.12 - r * 0.14;
    dialCore.add(sideRing);
  }

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xd0e0d8,
    metalness: 0.95,
    roughness: 0.15,
  });
  for (let p = 0; p < 4; p++) {
    const pa = (p * Math.PI) / 2 + Math.PI / 4;
    const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.62, 12), chromeMat);
    piston.position.set(Math.cos(pa) * 0.82, -0.3, Math.sin(pa) * 0.82);
    dialCore.add(piston);
  }

  const bezelGroup = new THREE.Group();
  dialCore.add(bezelGroup);

  const bezelMat = new THREE.MeshStandardMaterial({
    color: 0x3a542e,
    roughness: 0.32,
    metalness: 0.72,
  });

  const bezelRim = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.13, 24, 64), bezelMat);
  bezelRim.rotation.x = Math.PI / 2;
  bezelRim.position.y = 0.06;
  bezelGroup.add(bezelRim);

  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const studHolder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.13, 0.14, 20),
      bezelMat
    );
    studHolder.position.set(Math.cos(a) * 0.88, 0.09, Math.sin(a) * 0.88);
    bezelGroup.add(studHolder);

    const studGlow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 0.16, 20),
      new THREE.MeshBasicMaterial({ color: 0x88ff00 })
    );
    studGlow.position.set(Math.cos(a) * 0.88, 0.09, Math.sin(a) * 0.88);
    bezelGroup.add(studGlow);
  }

  const faceplateMesh = new THREE.Mesh(
    new THREE.CircleGeometry(0.75, 64),
    new THREE.MeshBasicMaterial({ map: dialTexture })
  );
  faceplateMesh.rotation.x = -Math.PI / 2;
  faceplateMesh.position.y = 0.088;
  dialCore.add(faceplateMesh);

  return { root, dialCore, bezelGroup, faceplateMesh };
}

export default function OmnitrixScene({
  scrollProgress = 0,
  watchStage,
  isDamaged,
  selectedAlienIndex,
  attackTriggerCount = 0,
  isCharacterSelected = false,
  onWatchClick,
  onAbilityHit,
  showBenHologram,
  modelsLoadedCallback,
}) {
  const mountRef = useRef(null);

  const stateRef = useRef({
    scrollProgress,
    watchStage,
    isDamaged,
    selectedAlienIndex,
    showBenHologram,
    isCharacterSelected,
    attackStartTime: -10,
  });

  const callbacksRef = useRef({
    onWatchClick,
    onAbilityHit,
  });

  useEffect(() => {
    stateRef.current.scrollProgress = scrollProgress;
    stateRef.current.watchStage = watchStage;
    stateRef.current.isDamaged = isDamaged;
    stateRef.current.selectedAlienIndex = selectedAlienIndex;
    stateRef.current.showBenHologram = showBenHologram;
    stateRef.current.isCharacterSelected = isCharacterSelected;
  }, [scrollProgress, watchStage, isDamaged, selectedAlienIndex, showBenHologram, isCharacterSelected]);

  useEffect(() => {
    if (attackTriggerCount > 0) {
      stateRef.current.attackStartTime = performance.now() * 0.001;
      const objs = sceneObjectsRef.current;
      if (objs.shockwaveMesh) {
        const activeAlien = ALIENS[stateRef.current.selectedAlienIndex] || ALIENS[0];
        objs.shockwaveMesh.material.color.setHex(activeAlien.emissiveHex);
        objs.shockwaveMesh.position.set(0, 0.75, 0);
        objs.shockwaveMesh.scale.setScalar(0.3);
        objs.shockwaveMesh.material.opacity = 1.0;
      }
    }
  }, [attackTriggerCount]);

  useEffect(() => {
    callbacksRef.current = {
      onWatchClick,
      onAbilityHit,
    };
  }, [onWatchClick, onAbilityHit]);

  const sceneObjectsRef = useRef({});

  useEffect(() => {
    preloadOmnitrixFaceImages();

    const container = mountRef.current;
    if (!container) return;

    // 1. TRANSPARENT RENDERER SO HTML TEXT CAN SIT BEHIND THE 3D CHARACTERS!
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 7.6, 3.6);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true, // Transparent background so the parallax typography sits BEHIND Ben & the Omnitrix!
      powerPreference: 'high-performance',
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.domElement.style.touchAction = 'pan-y';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.target.set(0, 7.5, 0);

    // 2. SOFT, BRIGHT, FLAT-SHADED ANIME/CARTOON LIGHTING (No dark shadows or shiny plastic look, just enough soft angle for his lips & nose to show cleanly!)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.85);
    scene.add(ambientLight);

    const softFrontLight = new THREE.DirectionalLight(0xffffff, 0.95);
    softFrontLight.position.set(1.2, 9.5, 5.0);
    scene.add(softFrontLight);

    const softFillLight = new THREE.DirectionalLight(0xffffff, 0.45);
    softFillLight.position.set(-2.0, 6.5, 4.0);
    scene.add(softFillLight);

    const coreLight = new THREE.PointLight(0x88ff00, 1.8, 6);
    coreLight.position.set(0, 1.2, 0);
    scene.add(coreLight);

    // =========================================================================
    // STAGE 1 (TOP HERO SECTION at Y = 7.5):
    // Clean Ben Tennyson Bust (`Meshy_AI_Ben_Tennyson_1026124237_texture (1).glb`)
    // NO ugly green dot or ring obscuring his chest!
    // =========================================================================
    const heroStageGroup = new THREE.Group();
    heroStageGroup.position.set(0, 7.45, 0);
    scene.add(heroStageGroup);

    const benBustHolder = new THREE.Group();
    heroStageGroup.add(benBustHolder);

    // =========================================================================
    // STAGE 1.5 (TRANSITION BRIDGE at Y = 3.8):
    // The User's Real 3D Omnitrix GLB (`/models/omnitrix.glb`) doing a clean 360° rotation in mid-space
    // AFTER the camera leaves Ben Tennyson, before morphing into the Ready Watch in Stage 2!
    // (No weird neon rings or overlapping watch on Ben's chest!)
    // =========================================================================
    const transitionWatchGroup = new THREE.Group();
    transitionWatchGroup.position.set(0, 3.8, 0);
    scene.add(transitionWatchGroup);

    const glbOmnitrixHolder = new THREE.Group();
    transitionWatchGroup.add(glbOmnitrixHolder);

    // =========================================================================
    // STAGE 2 (MIDDLE SECTION at Y = 0):
    // Interactive 3D Omnitrix Watch + 2D Generated Screen + Side-Angle Click!
    // =========================================================================
    const dialCanvas = document.createElement('canvas');
    dialCanvas.width = 512;
    dialCanvas.height = 512;
    const dialCtx = dialCanvas.getContext('2d');
    const dialTexture = new THREE.CanvasTexture(dialCanvas);
    dialTexture.anisotropy = 4;

    const { root: watchRoot, dialCore, bezelGroup } = buildClassicOmnitrixAssembly(dialTexture);
    watchRoot.position.set(0, 0, 0);
    scene.add(watchRoot);

    const damageGroup = new THREE.Group();
    watchRoot.add(damageGroup);
    const crackLines = [];
    for (let i = 0; i < 4; i++) {
      const points = [];
      const startAngle = (i / 4) * Math.PI * 2;
      let cx = Math.cos(startAngle) * 0.85;
      let cy = 0.15;
      let cz = Math.sin(startAngle) * 0.85;
      for (let j = 0; j < 4; j++) {
        points.push(new THREE.Vector3(cx, cy, cz));
        cx += (Math.random() - 0.5) * 0.16;
        cy += (Math.random() - 0.5) * 0.16;
        cz += (Math.random() - 0.5) * 0.16;
      }
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.7 })
      );
      damageGroup.add(line);
      crackLines.push(line);
    }

    // =========================================================================
    // STAGE 3 (CHARACTER FOCUS & 3D HOLOGRAM STAGE):
    // =========================================================================
    // The hologram projector base (light glow beam, energy rings, dial glow disc) stays attached to watchRoot
    const hologramStage = new THREE.Group();
    hologramStage.position.set(0, 0.2, 0);
    watchRoot.add(hologramStage);

    // Subtle, faint volumetric light glow beam emerging from the watch dial
    const beamGeo = new THREE.CylinderGeometry(0.85, 0.25, 1.8, 32, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x88ff00,
      transparent: true,
      opacity: 0.07,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const hologramBeam = new THREE.Mesh(beamGeo, beamMat);
    hologramBeam.position.y = 0.85;
    hologramStage.add(hologramBeam);

    // Glowing emitter lens disc on the watch face (soft faint glow)
    const baseGlowDisc = new THREE.Mesh(
      new THREE.CircleGeometry(0.35, 32),
      new THREE.MeshBasicMaterial({
        color: 0x88ff00,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    baseGlowDisc.rotation.x = -Math.PI / 2;
    baseGlowDisc.position.y = 0.02;
    hologramStage.add(baseGlowDisc);

    // The Alien Character container sits at the ROOT of the scene so that when you press SELECT,
    // the character can physically walk/slide AWAY from the watch dial into their own solo space on the left!
    const alienHologramContainer = new THREE.Group();
    alienHologramContainer.position.set(0, 1.35, 0);
    scene.add(alienHologramContainer);

    const alienMeshesMap = {};
    ALIENS.forEach((alien) => {
      alienMeshesMap[alien.id] = createProceduralAlienHologram(alien.id, alien.emissiveHex);
    });

    function updateActiveAlienMesh(index) {
      while (alienHologramContainer.children.length > 0) {
        alienHologramContainer.remove(alienHologramContainer.children[0]);
      }
      const alien = ALIENS[index] || ALIENS[0];
      const mesh = alienMeshesMap[alien.id];
      if (mesh) {
        alienHologramContainer.add(mesh);
      }
    }
    updateActiveAlienMesh(stateRef.current.selectedAlienIndex);

    // 5. EXPLORE / ALIEN ABILITY TARGETS
    const abilityArenaGroup = new THREE.Group();
    abilityArenaGroup.visible = false;
    scene.add(abilityArenaGroup);

    const interactiveTargets = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const radius = 0.85;
      const targetMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.11, 1),
        new THREE.MeshStandardMaterial({
          color: 0xff3333,
          emissive: 0xff3333,
          emissiveIntensity: 0.9,
          roughness: 0.2,
          metalness: 0.8,
        })
      );
      targetMesh.position.set(
        Math.cos(angle) * radius,
        0.95 + (i % 2) * 0.28,
        Math.sin(angle) * radius
      );
      targetMesh.userData = { isAbilityTarget: true, index: i, baseAngle: angle };
      abilityArenaGroup.add(targetMesh);
      interactiveTargets.push(targetMesh);
    }

    const shockwaveMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.65, 0.05, 16, 64),
      new THREE.MeshBasicMaterial({
        color: 0x9eff00,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      })
    );
    shockwaveMesh.rotation.x = Math.PI / 2;
    shockwaveMesh.position.y = 0.22;
    scene.add(shockwaveMesh);

    // 6. LOAD USER'S REAL GLB MODELS (Ben Tennyson, New Omnitrix, and all 8 Aliens!)
    const loader = new GLTFLoader();
    let loadedCount = 0;
    const totalToLoad = 10;
    const markLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalToLoad && modelsLoadedCallback) {
        modelsLoadedCallback(true);
      }
    };

    const loadAlienGLBIntoRoster = (url, alienId, targetHeight = 1.25) => {
      loader.load(
        url,
        (gltf) => {
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const scale = targetHeight / Math.max(size.x, size.y, size.z);
          model.scale.setScalar(scale);
          model.position.sub(center.multiplyScalar(scale));

          model.traverse((child) => {
            if (child.isMesh && child.material) {
              child.material = child.material.clone();
              child.material.roughness = 0.82;
              child.material.metalness = 0.12;
            }
          });

          const wrapper = new THREE.Group();
          wrapper.add(model);
          alienMeshesMap[alienId] = wrapper;
          if (ALIENS[stateRef.current.selectedAlienIndex]?.id === alienId) {
            updateActiveAlienMesh(stateRef.current.selectedAlienIndex);
          }
          markLoaded();
        },
        undefined,
        () => markLoaded()
      );
    };

    // (0) Load the NEW 3D OMNITRIX GLB (`/models/omnitrix.glb` -> `Meshy_AI_Omnitrix_1026135845_texture.glb`)!
    loader.load(
      '/models/omnitrix.glb',
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const scale = 1.05 / Math.max(size.x, size.y, size.z);
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));

        model.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material = child.material.clone();
            child.material.roughness = 0.45;
            child.material.metalness = 0.55;
          }
        });

        glbOmnitrixHolder.add(model);
        markLoaded();
      },
      undefined,
      () => markLoaded()
    );

    // (A) Load BEN TENNYSON BUST as the Hero Head of the Website (Y = 7.45)
    // Uses optimized fast model (`/models/ben_tennyson_fast.glb`) for immediate rendering with zero delay!
    loader.load(
      '/models/ben_tennyson_fast.glb',
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const scale = 2.25 / Math.max(size.x, size.y, size.z);
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));

        model.traverse((child) => {
          if (child.isMesh && child.material) {
            child.castShadow = false;
            child.receiveShadow = false;
            child.material.roughness = 1.0;
            child.material.metalness = 0.0;
            child.material.needsUpdate = true;
          }
        });

        benBustHolder.add(model);
        markLoaded();
      },
      undefined,
      () => markLoaded()
    );

    // (B) Load all 8 Real Alien Character GLB Models into their designated slots!
    loadAlienGLBIntoRoster('/models/fourarms.glb', 'fourarms', 1.25);
    loadAlienGLBIntoRoster('/models/xlr8.glb', 'xlr8', 1.25);
    loadAlienGLBIntoRoster('/models/cannonbolt.glb', 'cannonbolt', 1.25);
    loadAlienGLBIntoRoster('/models/alienx.glb', 'alienx', 1.25);
    loadAlienGLBIntoRoster('/models/heatblast.glb', 'heatblast', 1.25);
    loadAlienGLBIntoRoster('/models/diamondhead.glb', 'diamondhead', 1.25);
    loadAlienGLBIntoRoster('/models/ghostfreak.glb', 'ghostfreak', 1.25);
    loadAlienGLBIntoRoster('/models/upgrade.glb', 'upgrade', 1.25);

    sceneObjectsRef.current = {
      updateActiveAlienMesh,
      shockwaveMesh,
      watchRoot,
      dialCore,
      camera,
      controls,
    };

    // 7. CLICK / TAP DETECTION ON THE WATCH
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const handlePointerDown = (e) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e) => {
      const dx = Math.abs(e.clientX - pointerDownPos.x);
      const dy = Math.abs(e.clientY - pointerDownPos.y);
      if (dx > 8 || dy > 8) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const current = stateRef.current;
      const cbs = callbacksRef.current;

      if (current.watchStage === 'explore') {
        const targetHits = raycaster.intersectObjects(interactiveTargets, true);
        if (targetHits.length > 0) {
          let hitObj = targetHits[0].object;
          while (hitObj && !hitObj.userData?.isAbilityTarget && hitObj.parent) {
            hitObj = hitObj.parent;
          }
          if (hitObj && hitObj.userData?.isAbilityTarget) {
            hitObj.scale.setScalar(1.65);
            shockwaveMesh.position.copy(hitObj.position);
            shockwaveMesh.scale.setScalar(0.3);
            shockwaveMesh.material.opacity = 1.0;
            if (cbs.onAbilityHit) cbs.onAbilityHit(hitObj.userData.index);
            return;
          }
        }
      }

      const watchHits = raycaster.intersectObjects([watchRoot], true);
      if (watchHits.length > 0 && cbs.onWatchClick) {
        cbs.onWatchClick();
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);

    // 8. ANIMATION LOOP:
    const clock = new THREE.Clock();
    let frameId;
    let currentOpenFactor = 1.0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const current = stateRef.current;
      const activeAlien = ALIENS[current.selectedAlienIndex] || ALIENS[0];
      const stage = current.watchStage;
      const sp = current.scrollProgress; // 0.0 -> 0.5 -> 1.0

      // Gentle breathing & slight turn on Ben Tennyson Bust at the top of the website
      benBustHolder.rotation.y = Math.sin(elapsed * 0.6) * 0.14;
      benBustHolder.position.y = Math.sin(elapsed * 1.6) * 0.04;

      // =======================================================================
      // 4-PHASE ULTRA-SMOOTH SCROLL CHOREOGRAPHY (NO EMPTY GAP!):
      // - Phase 1 (sp 0.00 -> 0.16): Camera zooms into Ben Tennyson's crossed-arm wrist Omnitrix.
      // - Phase 2 (sp 0.16 -> 0.44): As the camera scrolls down through the gap (`Y = 6.95 -> 0.15`),
      //   the 3D Omnitrix GLB (`Meshy_AI_Omnitrix_1026135845_texture.glb`) stays DEAD-CENTER in the camera's
      //   view the entire way down, rotating 360° smoothly until it faces the user!
      // - Phase 3 (sp 0.36 -> 0.48): Smoothly locks into the Ready-to-Choose Watch facing the user!
      // - Phase 4 (sp 0.72 -> 1.00): Camera tilts up to showcase the 3D Alien Character!
      // =======================================================================

      // 1. Faceplate Shutter Blades Open Factor
      const isCharacterSection = sp > 0.72;
      // In Section 3 (Character showcase), the watch returns to its CLOSED form (shutters closed, dial core lowered),
      // serving as the sleek pedestal projecting the character standing above it!
      // In Section 2, it opens only when in 'diamond_select' or 'opening_side'.
      const isDiamondOpen =
        sp > 0.42 &&
        !isCharacterSection &&
        (stage === 'diamond_select' || stage === 'opening_side');
      const targetOpenFactor = isDiamondOpen ? 1.0 : 0.0;
      currentOpenFactor = THREE.MathUtils.lerp(currentOpenFactor, targetOpenFactor, 0.15);

      renderOmnitrixFaceplate(dialCtx, {
        openFactor: currentOpenFactor,
        alienId: activeAlien.id,
        damaged: current.isDamaged,
      });
      dialTexture.needsUpdate = true;

      // 2. Mechanical Dial Core Pop-Up & Slam-Down Elevation + Smooth Watch Exit on Tribute Scroll
      let targetDialY = 0.04;
      if (isDiamondOpen) {
        targetDialY = 0.44;
      } else if (stage === 'slamming_side') {
        targetDialY = -0.02;
      }
      dialCore.position.y = THREE.MathUtils.lerp(dialCore.position.y, targetDialY, 0.22);

      // Tribute Section progress (sp: 1.0 -> 1.45 when isCharacterSelected is true)
      const shiftActive = current.isCharacterSelected && sp > 1.0;
      const shiftT = shiftActive ? THREE.MathUtils.clamp((sp - 1.0) / 0.45, 0, 1) : 0;
      const smoothShift = shiftT * shiftT * (3 - 2 * shiftT);

      const baseWatchY = stage === 'slamming_side' ? -0.14 : Math.sin(elapsed * 2) * 0.02;
      const targetWatchY = baseWatchY - smoothShift * 4.5;
      watchRoot.position.y = THREE.MathUtils.lerp(watchRoot.position.y, targetWatchY, 0.2);

      const extraTwist = stage === 'opening_side' ? 0.5 : stage === 'slamming_side' ? -0.5 : 0;
      const targetBezelRot = current.selectedAlienIndex * (Math.PI / 4) + extraTwist;
      bezelGroup.rotation.y = THREE.MathUtils.lerp(bezelGroup.rotation.y, targetBezelRot, 0.15);

      // 3. Cinematic Scroll Camera Choreography:
      let desiredCamPos = new THREE.Vector3(0, 7.55, 3.6);
      let desiredTarget = new THREE.Vector3(0, 7.45, 0);

      if (sp < 0.16) {
        // Phase 1: Gentle focus toward Ben Tennyson's crossed-arm hand & wrist Omnitrix
        const t = THREE.MathUtils.clamp(sp / 0.16, 0, 1);
        const smoothT = t * t * (3 - 2 * t);
        const benFullCam = new THREE.Vector3(0, 7.55, 3.6);
        const benWristCam = new THREE.Vector3(-0.08, 7.05, 2.45);
        desiredCamPos.lerpVectors(benFullCam, benWristCam, smoothT);

        const benFullTarget = new THREE.Vector3(0, 7.45, 0);
        const benWristTarget = new THREE.Vector3(-0.08, 6.95, 0.35);
        desiredTarget.lerpVectors(benFullTarget, benWristTarget, smoothT);
      } else if (sp < 0.46) {
        // Phase 2 & 3: Camera travels down from Ben's wrist to the Stage 2 Ready Watch,
        // ALWAYS looking straight at the rotating 3D Omnitrix in the center of the screen!
        const t = THREE.MathUtils.clamp((sp - 0.16) / 0.3, 0, 1);
        const smoothT = t * t * (3 - 2 * t);
        const benWristCam = new THREE.Vector3(-0.08, 7.05, 2.45);
        const readyWatchCam = new THREE.Vector3(0, 3.35, 0.85);
        desiredCamPos.lerpVectors(benWristCam, readyWatchCam, smoothT);
        desiredCamPos.z += Math.sin(smoothT * Math.PI) * 1.45;

        const benWristTarget = new THREE.Vector3(-0.08, 6.95, 0.35);
        const readyWatchTarget = new THREE.Vector3(0, 0.15, -0.12);
        desiredTarget.lerpVectors(benWristTarget, readyWatchTarget, smoothT);
      } else if (sp <= 0.72) {
        if (stage === 'opening_side' || stage === 'slamming_side') {
          desiredCamPos.set(1.85, 1.35, 2.35);
          desiredTarget.set(0, 0.18, 0);
        } else if (stage === 'hologram_active' || stage === 'explore') {
          desiredCamPos.set(0, 1.45, 3.85);
          desiredTarget.set(0, 0.72, 0);
        } else {
          desiredCamPos.set(0, 3.35, 0.85);
          desiredTarget.set(0, 0.15, -0.12);
        }
      } else {
        const t = THREE.MathUtils.clamp((sp - 0.72) / 0.28, 0, 1);
        const smoothT = t * t * (3 - 2 * t);
        const watchCam = new THREE.Vector3(0, 3.35, 0.85);
        const charCam = new THREE.Vector3(0, 1.25 - smoothShift * 0.25, 3.95);
        desiredCamPos.lerpVectors(watchCam, charCam, smoothT);

        const watchTarget = new THREE.Vector3(0, 0.15, -0.12);
        const charTarget = new THREE.Vector3(0, 0.75, 0);
        desiredTarget.lerpVectors(watchTarget, charTarget, smoothT);
      }

      camera.position.lerp(desiredCamPos, 0.12);
      controls.target.lerp(desiredTarget, 0.14);

      // Only show the 3D Transition Omnitrix (`omnitrix.glb`) AFTER the camera has scrolled below Ben Tennyson
      // (`controls.target.y <= 5.25`, when Ben is leaving the top of the frame) so it NEVER overlaps on Ben!
      if (controls.target.y <= 5.25 && sp <= 0.45) {
        transitionWatchGroup.visible = true;
        // Progress based on the camera's actual vertical journey from Y=5.25 (just below Ben) to Y=0.15 (Stage 2 Watch)
        const t = THREE.MathUtils.clamp((5.25 - controls.target.y) / (5.25 - 0.15), 0, 1);
        const smoothT = t * t * (3 - 2 * t);

        // Lock 1:1 to `controls.target` so it sits dead-center in the viewport the entire way through the gap!
        transitionWatchGroup.position.copy(controls.target);

        // Smooth scale in the middle of the frame
        const fadeIn = THREE.MathUtils.clamp(t / 0.15, 0, 1);
        const fadeOut = t > 0.82 ? 1 - (t - 0.82) / 0.18 : 1.0;
        const scaleVal = (0.78 + Math.sin(smoothT * Math.PI) * 0.38) * fadeIn * fadeOut;
        transitionWatchGroup.scale.setScalar(Math.max(0.001, scaleVal));

        // Full 360° rotation + tilt that finishes facing directly toward the user!
        const remainingSpin = 1 - smoothT;
        glbOmnitrixHolder.rotation.y = remainingSpin * Math.PI * 2.0;
        glbOmnitrixHolder.rotation.x = remainingSpin * Math.PI * 0.65 + 0.55 * (1 - remainingSpin);
        glbOmnitrixHolder.rotation.z = Math.sin(smoothT * Math.PI) * 0.25;
      } else {
        transitionWatchGroup.visible = false;
      }

      // Stage 2 Ready Watch Focusing-In Scale & Spin Animation as the Transition Watch locks into place!
      const watchFocusProgress = THREE.MathUtils.clamp((sp - 0.34) / 0.14, 0, 1);
      const smoothWatchFocus =
        watchFocusProgress * watchFocusProgress * (3 - 2 * watchFocusProgress);
      const watchExitScale = Math.max(0.001, 1 - smoothShift * 0.99);
      watchRoot.scale.setScalar((0.01 + smoothWatchFocus * 0.99) * watchExitScale);
      watchRoot.rotation.y = (1 - smoothWatchFocus) * Math.PI * 0.5;

      // 4. 3D Alien Character Visibility, Scale & Smooth Move Away from Watch!
      // The 3D Character ONLY activates if the watch has been unlocked/opened (`hologram_active`, `explore`, or `diamond_select` with character section)
      const showCharacter =
        (stage === 'hologram_active' || stage === 'explore') ||
        (isCharacterSection && (stage === 'diamond_select' || stage === 'opening_side' || stage === 'slamming_side'));
      alienHologramContainer.visible = showCharacter;

      if (showCharacter) {
        const targetColorObj = new THREE.Color(activeAlien.emissiveHex);
        coreLight.color.lerp(targetColorObj, 0.1);

        // Faint, subtle light glow beam emerging from the watch dial when displaying character,
        // and smoothly turning off once the Birthday Card opens (`smoothShift` -> 1)!
        const glowFade = Math.max(0, 1 - smoothShift * 1.8);
        hologramStage.visible = glowFade > 0.01;
        if (hologramStage.visible) {
          beamMat.color.lerp(targetColorObj, 0.15);
          baseGlowDisc.material.color.lerp(targetColorObj, 0.15);

          const pulse = 0.92 + Math.sin(elapsed * 3.5) * 0.08;
          beamMat.opacity = 0.07 * pulse * glowFade;
          baseGlowDisc.material.opacity = 0.28 * pulse * glowFade;
        }

        // When user presses SELECT and scrolls down into Section 4 (sp: 1.0 -> 1.45):
        // 1. The Watch smoothly drops down and shrinks out of sight (`watchRoot.position.y -> -4.5`).
        // 2. The Character smoothly slides out of the watch to the LEFT (`X = -1.15, Y = 0.78, Z = 0.35`),
        //    perfectly vertically centered in the left half of the screen next to the Birthday Card on the right!
        const posX = THREE.MathUtils.lerp(0, -1.15, smoothShift);
        const posY = THREE.MathUtils.lerp(
          0.95 + Math.sin(elapsed * 2.5) * 0.03,
          0.78 + Math.sin(elapsed * 2.0) * 0.025,
          smoothShift
        );
        const posZ = THREE.MathUtils.lerp(0, 0.35, smoothShift);

        // Smoothly settle from watch turntable spin into a heroic 3/4 pose facing the viewer & birthday card
        const spinningAngle = (elapsed * 0.95) % (Math.PI * 2);
        const heroicAngle = 0.32 + Math.sin(elapsed * 1.4) * 0.08;
        let angleDiff = heroicAngle - spinningAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        const rotY = spinningAngle + angleDiff * smoothShift;

        const targetScale = isCharacterSection ? (0.98 + smoothShift * 0.18) : 0.88;
        alienHologramContainer.scale.lerp(
          new THREE.Vector3(targetScale, targetScale, targetScale),
          0.16
        );
        alienHologramContainer.position.set(posX, posY, posZ);
        alienHologramContainer.rotation.set(0, rotY, 0);
      } else {
        hologramStage.visible = false;
        alienHologramContainer.scale.setScalar(0.01);
        coreLight.color.lerp(new THREE.Color(0x88ff00), 0.1);
      }

      // Damaged energy cracks
      damageGroup.visible = current.isDamaged;
      if (current.isDamaged) {
        crackLines.forEach((line, idx) => {
          line.material.opacity = 0.3 + Math.abs(Math.sin(elapsed * 8 + idx * 1.7)) * 0.6;
        });
      }

      // Explore / Ability Arena targets animation (fade out cleanly when character moves to solo Tribute view)
      abilityArenaGroup.visible = (stage === 'explore' || isCharacterSection) && smoothShift < 0.85;
      if (abilityArenaGroup.visible) {
        const targetColorObj = new THREE.Color(activeAlien.emissiveHex);
        const speedMultiplier = activeAlien.id === 'xlr8' ? 2.4 : 0.85;
        const gemScale = Math.max(0.001, 1 - smoothShift);
        interactiveTargets.forEach((t, idx) => {
          const a = t.userData.baseAngle + elapsed * speedMultiplier;
          const r = 0.82 + Math.sin(elapsed * 2 + idx) * 0.08;
          t.position.x = Math.cos(a) * r;
          t.position.z = Math.sin(a) * r;
          t.position.y = 0.85 + Math.sin(elapsed * 3 + idx) * 0.22;
          t.rotation.x += 0.02;
          t.rotation.y += 0.03;
          t.scale.lerp(new THREE.Vector3(gemScale, gemScale, gemScale), 0.15);
          t.material.color.copy(targetColorObj);
          t.material.emissive.copy(targetColorObj);
        });
      }

      // Shockwave expansion fade
      if (shockwaveMesh.material.opacity > 0.01) {
        shockwaveMesh.scale.addScalar(0.18);
        shockwaveMesh.material.opacity *= 0.88;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const objs = sceneObjectsRef.current;
    if (!objs.shockwaveMesh) return;
    if (watchStage === 'slamming_side' || watchStage === 'opening_side') {
      objs.shockwaveMesh.position.set(0, 0.28, 0);
      objs.shockwaveMesh.scale.setScalar(0.35);
      objs.shockwaveMesh.material.opacity = 1.0;
    }
  }, [watchStage]);

  useEffect(() => {
    const objs = sceneObjectsRef.current;
    if (!objs.updateActiveAlienMesh) return;
    objs.updateActiveAlienMesh(selectedAlienIndex);
  }, [selectedAlienIndex]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full fixed inset-0 z-10 pointer-events-auto cursor-pointer active:cursor-grabbing"
    />
  );
}
