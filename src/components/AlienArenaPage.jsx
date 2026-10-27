import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { ArrowLeft, Trophy, RotateCcw, Crosshair } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

/**
 * 3RD PERSON STATIONARY ARCADE ARENA WITH USER'S REAL GLB ASSETS:
 * - Four Arms: Meshy PS2 Big Rock (`big_rock.glb`) incoming; Four Arms aims & all 4 arms smash/punch!
 * - Heatblast: Meshy Drones (`drone.glb`) swooping in; shoot dual plasma fireballs!
 * - Diamondhead: Meshy Laser Turrets (`laser_turret.glb`) firing at you; launch Taydenite spikes!
 * - XLR8: Meshy High-Speed Missiles (`missile.glb`) zooming in; slice them down!
 * - Cannonbolt: Meshy Concrete Barriers (`concrete_barriers.glb`) advancing; roll-smash them!
 * - Alien X / Ghostfreak / Upgrade: Real drones, turrets & rocks with custom powers!
 * 
 * Character stands firmly in place, dynamically rotates upper body/torso toward mouse cursor,
 * and physically animates all 4 arms on click!
 */

const TARGET_MODELS = {
  fourarms: {
    model: '/models/big_rock.glb',
    title: 'FOUR ARMS: PS2 BOULDER SMASH',
    objective: 'AIM AT FLYING KHOROS BOULDERS & SMASH WITH ALL 4 FISTS!',
    actionName: 'QUAD-FIST SMASH',
    scale: 2.2,
    speed: 7.5,
    label: 'Boulders Smashed',
    colorStr: '#FF3333',
    colorHex: 0xff3333,
  },
  heatblast: {
    model: '/models/drone.glb',
    title: 'HEATBLAST: DRONE SKEET SHOOTER',
    objective: 'AIM RETICLE AT SWOOPING DRONES & SHOOT TWIN PLASMA FIREBALLS!',
    actionName: 'SUPERNOVA FIREBALLS',
    scale: 1.8,
    speed: 8.5,
    label: 'Drones Incinerated',
    colorStr: '#FF6B00',
    colorHex: 0xff6b00,
  },
  diamondhead: {
    model: '/models/laser_turret.glb',
    title: 'DIAMONDHEAD: LASER TURRET SNIPER',
    objective: 'AIM AT ENEMY LASER TURRETS & LAUNCH RAZOR TAYDENITE CRYSTAL SPIKES!',
    actionName: 'TAYDENITE VOLLEY',
    scale: 1.5,
    speed: 6.5,
    label: 'Turrets Destroyed',
    colorStr: '#00FFB2',
    colorHex: 0x00ffb2,
  },
  xlr8: {
    model: '/models/missile.glb',
    title: 'XLR8: HYPERSONIC MISSILE INTERCEPT',
    objective: 'AIM & INTERCEPT INCOMING MACH-5 MISSILES WITH TACHYON SLASHES!',
    actionName: 'TACHYON INTERCEPT',
    scale: 1.9,
    speed: 12.0,
    label: 'Missiles Intercepted',
    colorStr: '#00E5FF',
    colorHex: 0x00e5ff,
  },
  cannonbolt: {
    model: '/models/concrete_barriers.glb',
    title: 'CANNONBOLT: CONCRETE BARRICADE BREAKER',
    objective: 'AIM AT FORTRESS CONCRETE BARRIERS & LAUNCH ARMORED ROLLING SHELLS!',
    actionName: 'CANNONBALL IMPACT',
    scale: 1.8,
    speed: 7.0,
    label: 'Barriers Smashed',
    colorStr: '#FFB800',
    colorHex: 0xffb800,
  },
  alienx: {
    model: '/models/big_rock.glb',
    title: 'ALIEN X: CELESTIAL METEOR ERASURE',
    objective: 'AIM AT QUANTUM METEORS & WARP REALITY TO ERASE THEM FROM EXISTENCE!',
    actionName: 'WARP REALITY',
    scale: 2.0,
    speed: 7.0,
    label: 'Meteors Erased',
    colorStr: '#88FF00',
    colorHex: 0x88ff00,
  },
  ghostfreak: {
    model: '/models/drone.glb',
    title: 'GHOSTFREAK: SPECTRAL DRONE VOID',
    objective: 'AIM AT PATROL DRONES & LASH SHADOW ECTONURITE TENDRILS!',
    actionName: 'PHASE BLAST',
    scale: 1.7,
    speed: 7.5,
    label: 'Drones Harvested',
    colorStr: '#A855F7',
    colorHex: 0xa855f7,
  },
  upgrade: {
    model: '/models/laser_turret.glb',
    title: 'UPGRADE: GALVANIC TURRET OVERCLOCK',
    objective: 'AIM OPTIC LASER AT CORRUPTED TURRETS TO OVERCLOCK & REBOOT THEM!',
    actionName: 'NANITE OPTIC BEAM',
    scale: 1.6,
    speed: 7.0,
    label: 'Turrets Reconfigured',
    colorStr: '#39FF14',
    colorHex: 0x39ff14,
  },
};

export default function AlienArenaPage({ alien, onBack }) {
  const mountRef = useRef(null);
  const cfg = TARGET_MODELS[alien.id] || TARGET_MODELS.fourarms;

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [reticlePos, setReticlePos] = useState({ x: 50, y: 50 });
  const [statusLog, setStatusLog] = useState('AIM WITH MOUSE // CLICK OR PRESS SPACE TO ATTACK!');
  const [victory, setVictory] = useState(false);

  const shootRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. THIRD PERSON ARCADE STAGE
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06090e);
    scene.fog = new THREE.FogExp2(0x06090e, 0.024);

    const camera = new THREE.PerspectiveCamera(
      52,
      container.clientWidth / container.clientHeight,
      0.1,
      150
    );
    // Over-the-shoulder third person camera (behind character, looking forward into the arena)
    camera.position.set(0, 2.3, 4.4);
    camera.lookAt(0, 1.8, -15);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // Arena Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(-6, 16, 10);
    scene.add(dirLight);

    const arenaFloor = new THREE.GridHelper(60, 40, cfg.colorHex, 0x182433);
    arenaFloor.position.set(0, 0, -10);
    scene.add(arenaFloor);

    // Glowing combat podium under character
    const podium = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.8, 0.2, 32),
      new THREE.MeshStandardMaterial({
        color: 0x111923,
        emissive: cfg.colorHex,
        emissiveIntensity: 0.35,
        roughness: 0.4,
      })
    );
    podium.position.set(0, 0.1, 0.8);
    scene.add(podium);

    // 2. LOAD CHARACTER (STATIONARY ON PODIUM, FACING ARENA WITH BACK TOWARDS USER)
    const charGroup = new THREE.Group();
    charGroup.position.set(0, 0.2, 0.8);
    charGroup.rotation.y = Math.PI; // Face straight forward (-Z) into the arena!
    scene.add(charGroup);

    let charMesh = null;
    let origPositions = null;
    let mixer = null;
    const actionsMap = {};
    let activeAction = null;

    const loader = new GLTFLoader();
    const charModelPath = alien.id === 'alienx'
      ? '/models/alienx_punches.glb'
      : alien.id === 'fourarms'
      ? '/models/fourarms_animated.glb'
      : alien.modelPath || '/models/fourarms.glb';

    loader.load(charModelPath, (gltf) => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const scale = 2.45 / Math.max(size.x, size.y, size.z);
      model.scale.setScalar(scale);
      model.position.sub(center.multiplyScalar(scale));
      model.position.y += (size.y * scale) * 0.5;

      // Real Bone/Skeletal Animations!
      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        gltf.animations.forEach((clip) => {
          const action = mixer.clipAction(clip);
          actionsMap[clip.name] = action;
        });

        // Pick initial idle/combat stance
        const idleClipName = gltf.animations.find(a =>
          a.name.toLowerCase().includes('alert') ||
          a.name.toLowerCase().includes('idle') ||
          a.name.toLowerCase().includes('breathe') ||
          a.name.toLowerCase().includes('walk')
        )?.name || gltf.animations[0].name;

        if (actionsMap[idleClipName]) {
          activeAction = actionsMap[idleClipName];
          activeAction.play();
        }
      }

      model.traverse((child) => {
        if (child.isMesh && child.geometry) {
          charMesh = child;
          const pos = child.geometry.attributes.position;
          if (pos && (!gltf.animations || gltf.animations.length === 0)) {
            origPositions = new Float32Array(pos.array);
          }
        }
      });

      charGroup.add(model);
    });

    // 3. LOAD USER'S REAL GLB TARGET ASSETS & MANAGE INCOMING SPAWN WAVES
    const activeTargets = [];
    let targetTemplate = null;

    loader.load(cfg.model, (gltf) => {
      const tModel = gltf.scene;
      const box = new THREE.Box3().setFromObject(tModel);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const s = cfg.scale / Math.max(size.x, size.y, size.z);
      tModel.scale.setScalar(s);
      tModel.position.sub(center.multiplyScalar(s));

      tModel.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material = child.material.clone();
          child.material.roughness = 0.5;
        }
      });

      const wrapper = new THREE.Group();
      wrapper.add(tModel);
      targetTemplate = wrapper;

      // Spawn initial 4 incoming targets
      for (let i = 0; i < 4; i++) {
        spawnIncomingTarget(i * -7 - 14);
      }
    });

    const spawnIncomingTarget = (startZ = -28) => {
      if (!targetTemplate) return;
      const clone = targetTemplate.clone();
      const laneX = (Math.random() - 0.5) * 11.0;
      const laneY = 1.2 + Math.random() * 2.2;
      clone.position.set(laneX, laneY, startZ);
      clone.userData = {
        speed: cfg.speed * (0.85 + Math.random() * 0.3),
        rotSpeedX: (Math.random() - 0.5) * 1.5,
        rotSpeedY: 1.0 + Math.random() * 1.5,
        rotSpeedZ: (Math.random() - 0.5) * 1.5,
      };
      scene.add(clone);
      activeTargets.push(clone);
    };

    // 4. FLYING PROJECTILES & SHATTER DEBRIS POOL
    const projectiles = [];
    const debris = [];
    const debrisGeo = new THREE.DodecahedronGeometry(0.24, 0);
    const debrisMat = new THREE.MeshStandardMaterial({
      color: cfg.colorHex,
      emissive: cfg.colorHex,
      emissiveIntensity: 0.65,
      flatShading: true,
    });
    for (let i = 0; i < 45; i++) {
      const p = new THREE.Mesh(debrisGeo, debrisMat);
      p.visible = false;
      p.userData = { vel: new THREE.Vector3(), life: 0 };
      scene.add(p);
      debris.push(p);
    }

    const explodeTarget = (pos) => {
      debris.forEach((p) => {
        p.visible = true;
        p.position.copy(pos);
        p.scale.setScalar(0.7 + Math.random() * 0.9);
        p.userData.vel.set(
          (Math.random() - 0.5) * 12.0,
          2.5 + Math.random() * 8.0,
          (Math.random() - 0.5) * 12.0
        );
        p.userData.life = 1.0;
      });
    };

    // 5. REAL MOUSE AIM: AIM RAY INTO SCENE & UPPER BODY ROTATION
    const raycaster = new THREE.Raycaster();
    const mouseNorm = new THREE.Vector2(0, 0);
    let aimWorldPoint = new THREE.Vector3(0, 1.8, -16);
    let punchTime = -10;
    let punchArmCycle = 0; // Alternates through all 4 arms for Four Arms!

    const handleMouseMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;
      setReticlePos({ x: px, y: py });

      mouseNorm.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseNorm.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Project aim ray onto a plane at Z = -16
      raycaster.setFromCamera(mouseNorm, camera);
      const aimPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 16);
      raycaster.ray.intersectPlane(aimPlane, aimWorldPoint);
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 6. EXECUTE ATTACK (CLICK / SPACEBAR)
    const fireAttack = () => {
      soundEngine.playAbilitySound(alien.id);
      punchTime = performance.now() * 0.001;
      punchArmCycle = (punchArmCycle + 1) % 4; // Cycles all 4 arms!

      // Play real skeletal attack / punch animations if available!
      if (mixer) {
        const punchClip =
          actionsMap['Punch_Combo'] ||
          actionsMap['Jumping_Punch'] ||
          actionsMap['Running'] ||
          actionsMap['Alert'];

        if (punchClip) {
          punchClip.reset();
          punchClip.setLoop(THREE.LoopOnce, 1);
          punchClip.clampWhenFinished = true;
          punchClip.play();

          // Smoothly crossfade back to idle stance when punch finishes
          setTimeout(() => {
            if (activeAction) {
              activeAction.reset().play();
            }
          }, 650);
        }
      }

      // Origin point from character's arms
      const origin = new THREE.Vector3(
        (punchArmCycle % 2 === 0 ? -0.35 : 0.35),
        (punchArmCycle < 2 ? 1.75 : 1.35),
        0.5
      );

      // Aim direction
      const aimDir = aimWorldPoint.clone().sub(origin).normalize();

      // Spawn projectile
      let pGeo;
      if (alien.id === 'heatblast') {
        pGeo = new THREE.SphereGeometry(0.38, 16, 16);
      } else if (alien.id === 'diamondhead') {
        pGeo = new THREE.ConeGeometry(0.2, 1.1, 8);
      } else if (alien.id === 'xlr8') {
        pGeo = new THREE.BoxGeometry(0.15, 0.15, 1.5);
      } else if (alien.id === 'fourarms') {
        pGeo = new THREE.TorusGeometry(0.75, 0.14, 16, 32); // Quad sonic shockwave ring!
      } else {
        pGeo = new THREE.SphereGeometry(0.35, 16, 16);
      }

      const pMat = new THREE.MeshBasicMaterial({ color: cfg.colorHex });
      const proj = new THREE.Mesh(pGeo, pMat);
      proj.position.copy(origin);
      if (alien.id === 'diamondhead' || alien.id === 'xlr8') {
        proj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), aimDir);
      }
      scene.add(proj);

      projectiles.push({
        mesh: proj,
        pos: origin,
        dir: aimDir,
        life: 2.2,
      });

      // Quick impact check for close targets
      activeTargets.forEach((t) => {
        if (t.position.distanceTo(origin) < 4.5) {
          t.userData.hit = true;
        }
      });
    };

    shootRef.current = fireAttack;
    const handlePointerDown = () => fireAttack();
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        fireAttack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // 7. GAME RENDER LOOP (60 FPS)
    const clock = new THREE.Clock();
    let frameId;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const now = performance.now() * 0.001;

      if (mixer) mixer.update(dt);

      // A. ROTATE CHARACTER UPPER BODY/TORSO TO AIM TOWARDS MOUSE WORLD POINT!
      const toAim = aimWorldPoint.clone().sub(charGroup.position);
      const targetAngleY = Math.PI - Math.atan2(toAim.x, -toAim.z) * 0.85;
      charGroup.rotation.y = THREE.MathUtils.lerp(charGroup.rotation.y, targetAngleY, 0.18);

      // B. DIRECT CPU VERTEX RIGGING: ALL 4 ARMS MOVE & PUNCH ON CLICK!
      const pAge = now - punchTime;
      const isPunch = pAge >= 0 && pAge < 0.42;
      const punchEnv = isPunch ? Math.sin((pAge / 0.42) * Math.PI) : 0;

      if (charMesh && origPositions) {
        const posAttr = charMesh.geometry.attributes.position;
        const arr = posAttr.array;
        const count = posAttr.count;

        for (let i = 0; i < count; i++) {
          const idx = i * 3;
          const ox = origPositions[idx];
          const oy = origPositions[idx + 1];
          const oz = origPositions[idx + 2];

          // Identify arm vertices
          const isArm = Math.abs(ox) > 0.22 && oy > -0.25 && oy < 0.85;
          const isLeft = ox > 0;
          const isUpper = oy > 0.25;

          let dx = 0;
          let dy = 0;
          let dz = 0;

          // Continuous idle combat breathing
          if (isArm) {
            dy += Math.sin(now * 3.8 + (isLeft ? 0 : 3.14)) * 0.02;
            dz += Math.cos(now * 3.2 + (isUpper ? 1.5 : 0)) * 0.02;
          }

          // Active punch motion
          if (isPunch && isArm) {
            const armId = (isUpper ? 0 : 2) + (isLeft ? 0 : 1);
            const isThisArm = armId === punchArmCycle || punchEnv > 0.65;
            const thrust = isThisArm ? punchEnv * 0.52 : punchEnv * 0.24;
            dz += thrust; // Thrusts forward straight towards the target!
            dy += Math.sin(punchEnv * Math.PI) * (isUpper ? 0.09 : -0.07);
            dx += (isLeft ? 0.06 : -0.06) * punchEnv;
          }

          arr[idx] = ox + dx;
          arr[idx + 1] = oy + dy;
          arr[idx + 2] = oz + dz;
        }
        posAttr.needsUpdate = true;
      }

      // C. ADVANCE INCOMING GLB TARGETS TOWARDS THE CHARACTER
      for (let i = activeTargets.length - 1; i >= 0; i--) {
        const t = activeTargets[i];
        t.position.z += t.userData.speed * dt;
        t.rotation.x += t.userData.rotSpeedX * dt;
        t.rotation.y += t.userData.rotSpeedY * dt;
        t.rotation.z += t.userData.rotSpeedZ * dt;

        let destroyed = t.userData.hit;

        // Check collision with flying projectiles
        projectiles.forEach((p) => {
          if (p.mesh.position.distanceTo(t.position) < 1.7) {
            destroyed = true;
            p.life = 0;
          }
        });

        if (destroyed) {
          explodeTarget(t.position);
          scene.remove(t);
          activeTargets.splice(i, 1);

          setScore((s) => {
            const next = s + 1;
            if (next >= 10) {
              setVictory(true);
              soundEngine.playMemoryUnlock();
            }
            return next;
          });
          setCombo((c) => c + 1);

          const hitTexts = {
            fourarms: '💥 QUAD-FIST SMASH! PS2 Boulder shattered into fragments!',
            heatblast: '🔥 SUPERNOVA BURST! Cryo-Drone melted into slag!',
            diamondhead: '💎 TAYDENITE VOLLEY! Laser Turret pulverized!',
            xlr8: '⚡ TACHYON SLICE! Hypersonic Missile sliced in half!',
            cannonbolt: '🟡 CANNONBALL CRUSH! Concrete Barrier demolished!',
            alienx: '✦ CELESTIAL WARP! Quantum Meteor erased from reality!',
            ghostfreak: '👻 SPECTRAL PHASE! Drone phased into the void!',
            upgrade: '🟢 OPTIC NANITE REBOOT! Turret firmware overclocked!',
          };
          setStatusLog(hitTexts[alien.id] || 'TARGET DEMOLISHED!');

          // Spawn new replacement target in the back
          spawnIncomingTarget(-32 - Math.random() * 8);
        } else if (t.position.z > 2.5) {
          // Reached behind character: recycle to back
          t.position.z = -30;
          t.position.x = (Math.random() - 0.5) * 11.0;
          setCombo(0);
        }
      }

      // D. UPDATE FLYING PROJECTILES
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.pos.addScaledVector(p.dir, 42.0 * dt);
        p.mesh.position.copy(p.pos);
        p.life -= dt;
        if (p.life <= 0) {
          scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          p.mesh.material.dispose();
          projectiles.splice(i, 1);
        }
      }

      // E. UPDATE SHATTER DEBRIS
      debris.forEach((p) => {
        if (!p.visible) return;
        p.position.addScaledVector(p.userData.vel, dt);
        p.userData.vel.y -= 16.0 * dt; // Gravity
        p.rotation.x += dt * 8;
        p.rotation.y += dt * 10;
        p.userData.life -= dt * 1.6;
        p.scale.setScalar(Math.max(0.001, p.userData.life * 0.9));
        if (p.userData.life <= 0) p.visible = false;
      });

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
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [alien.id, cfg]);

  return (
    <div className="fixed inset-0 z-50 bg-[#06090e] text-white font-sans select-none overflow-hidden">
      {/* 3D VIEWPORT */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-none"
        title="Aim with mouse, click or space to attack!"
      />

      {/* DYNAMIC RETICLE FOLLOWING MOUSE */}
      <div
        className="pointer-events-none fixed z-20 -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${reticlePos.x}%`, top: `${reticlePos.y}%` }}
      >
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div
            className="w-2.5 h-2.5 rounded-full border-2 animate-ping"
            style={{ borderColor: cfg.colorStr, backgroundColor: `${cfg.colorStr}55` }}
          />
          <div
            className="absolute inset-0 rounded-full border border-dashed opacity-80 animate-spin"
            style={{ borderColor: cfg.colorStr, animationDuration: '6s' }}
          />
          {/* Crosshair ticks */}
          <div className="absolute top-0 w-0.5 h-2" style={{ backgroundColor: cfg.colorStr }} />
          <div className="absolute bottom-0 w-0.5 h-2" style={{ backgroundColor: cfg.colorStr }} />
          <div className="absolute left-0 w-2 h-0.5" style={{ backgroundColor: cfg.colorStr }} />
          <div className="absolute right-0 w-2 h-0.5" style={{ backgroundColor: cfg.colorStr }} />
        </div>
      </div>

      {/* TOP BAR HUD */}
      <div className="fixed top-0 left-0 right-0 z-10 flex flex-wrap items-center justify-between gap-4 px-6 py-4 pointer-events-none">
        <button
          onClick={onBack}
          className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/85 hover:bg-[#88ff00] text-white hover:text-black border border-[#88ff00]/50 font-display text-xs font-bold tracking-wider uppercase transition shadow-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO OMNITRIX ROSTER</span>
        </button>

        <div className="flex flex-col items-center text-center bg-black/85 backdrop-blur-md border border-white/15 px-6 py-2 rounded-2xl shadow-xl">
          <span
            className="font-display text-sm md:text-base font-black tracking-widest uppercase"
            style={{ color: cfg.colorStr }}
          >
            {cfg.title}
          </span>
          <span className="font-mono text-[10px] text-white/80 tracking-wider">
            {cfg.objective}
          </span>
        </div>

        <div
          className="pointer-events-auto flex items-center gap-4 px-5 py-2.5 rounded-full bg-black/85 border font-mono text-xs shadow-xl"
          style={{ borderColor: cfg.colorStr }}
        >
          <div>
            <span className="text-white/60 mr-1.5">{cfg.label}:</span>
            <span className="font-bold text-base" style={{ color: cfg.colorStr }}>
              {score} / 10
            </span>
          </div>
          <div className="h-4 w-px bg-white/20" />
          <div className="text-amber-400 font-bold">COMBO x{combo}</div>
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="fixed bottom-6 inset-x-0 z-10 flex flex-col items-center gap-2.5 px-6 pointer-events-none">
        <div className="px-5 py-2 rounded-full bg-black/85 border border-white/15 font-mono text-xs text-emerald-300 shadow-xl">
          &gt; {statusLog}
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={() => shootRef.current && shootRef.current()}
            className="px-8 py-3.5 rounded-xl font-display font-black text-xs md:text-sm tracking-widest uppercase text-black shadow-2xl transform active:scale-95 transition flex items-center gap-2"
            style={{
              backgroundColor: cfg.colorStr,
              boxShadow: `0 0 30px ${cfg.colorStr}88`,
            }}
          >
            <Crosshair className="w-4 h-4 fill-current" />
            <span>{cfg.actionName}</span>
            <span className="px-2 py-0.5 rounded bg-black/25 font-mono text-[10px]">
              [CLICK / SPACE / F]
            </span>
          </button>

          {victory && (
            <button
              onClick={() => {
                setScore(0);
                setCombo(0);
                setVictory(false);
              }}
              className="p-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white transition"
              title="Reset Arena Score"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* VICTORY OVERLAY */}
      {victory && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center gap-3 px-6 py-3 rounded-2xl bg-[#88ff00] text-black font-display font-black text-sm tracking-widest uppercase shadow-[0_0_50px_#88ff00] animate-bounce">
          <Trophy className="w-5 h-5" />
          <span>MISSION ACCOMPLISHED! ALL TARGETS DEMOLISHED!</span>
        </div>
      )}
    </div>
  );
}
