import React, { useState, useEffect, useRef } from 'react';
import { Flame, Zap, Shield, Sparkles, Eye, Wrench, Orbit, Trophy, RotateCcw } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

/**
 * 8 UNIQUE INTERACTIVE MINI-GAMES WITH CUSTOM ANIMATIONS & 3D CHARACTER SYNCHRONIZATION!
 * Each alien has its own distinct gameplay mechanic, visual FX, and triggers a custom 3D animation on the character!
 */
export default function AlienMiniGame({ alien, onTrigger3DAttack, onUnlockMemory, onRepairWatch }) {
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);

  // 1. FOUR ARMS: Seismic Power Meter (Timing Bar Smash)
  const [seismicCursor, setSeismicCursor] = useState(50);
  const [seismicDir, setSeismicDir] = useState(1);
  const [barrierHp, setBarrierHp] = useState(100);
  const [crackFlash, setCrackFlash] = useState(false);

  // 2. XLR8: Tachyon Speed Reflex (Fast-moving target nodes in a radar ring)
  const [xlr8TargetPos, setXlr8TargetPos] = useState({ x: 65, y: 40 });
  const [xlr8Streak, setXlr8Streak] = useState(0);

  // 3. CANNONBOLT: Pinball Bumper Ricochet (Aim angle & launch rolling ball to smash 4 bumpers)
  const [cannonAngle, setCannonAngle] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [bumpersHit, setBumpersHit] = useState([false, false, false, false]);

  // 4. ALIEN X: Celestial Voice Alignment (Align Bellicus & Serena concentric rings)
  const [ringAngle1, setRingAngle1] = useState(90);
  const [ringAngle2, setRingAngle2] = useState(210);
  const [voicesAligned, setVoicesAligned] = useState(0);

  // 5. HEATBLAST: Supernova Drone Defense (Click descending cryo-drones to incinerate with fireballs)
  const [drones, setDrones] = useState([
    { id: 1, x: 22, y: 28, alive: true },
    { id: 2, x: 52, y: 55, alive: true },
    { id: 3, x: 78, y: 32, alive: true },
  ]);
  const [fireballFx, setFireballFx] = useState(null);

  // 6. DIAMONDHEAD: Taydenite Prism Deflector (Click 4 crystal shield slots to reflect lasers)
  const [shieldsUp, setShieldsUp] = useState([false, false, false, false]);
  const [activeLaserSlot, setActiveLaserSlot] = useState(1);

  // 7. GHOSTFREAK: Ectonurite Phase Sonar (Sweep invisible spectral anomalies & lock on)
  const [sonarAngle, setSonarAngle] = useState(0);
  const [anomalies, setAnomalies] = useState([
    { id: 1, x: 28, y: 38, caught: false },
    { id: 2, x: 68, y: 28, caught: false },
    { id: 3, x: 54, y: 68, caught: false },
  ]);

  // 8. UPGRADE: Galvanic Circuit Nanite Link (Toggle 4 circuit nodes to complete the green energy path)
  const [circuitNodes, setCircuitNodes] = useState([true, false, false, false]);

  // Reset mini-game state when switching aliens
  useEffect(() => {
    setScore(0);
    setWon(false);
    setBarrierHp(100);
    setXlr8Streak(0);
    setBumpersHit([false, false, false, false]);
    setVoicesAligned(0);
    setRingAngle1(120);
    setRingAngle2(240);
    setDrones([
      { id: 1, x: 22, y: 28, alive: true },
      { id: 2, x: 52, y: 55, alive: true },
      { id: 3, x: 78, y: 32, alive: true },
    ]);
    setShieldsUp([false, false, false, false]);
    setAnomalies([
      { id: 1, x: 28, y: 38, caught: false },
      { id: 2, x: 68, y: 28, caught: false },
      { id: 3, x: 54, y: 68, caught: false },
    ]);
    setCircuitNodes([true, false, false, false]);
  }, [alien.id]);

  // Animate loops for active mini-game
  useEffect(() => {
    const interval = setInterval(() => {
      if (alien.id === 'fourarms') {
        setSeismicCursor((prev) => {
          let next = prev + seismicDir * 4.5;
          if (next >= 96) {
            setSeismicDir(-1);
            next = 96;
          } else if (next <= 4) {
            setSeismicDir(1);
            next = 4;
          }
          return next;
        });
      } else if (alien.id === 'cannonbolt') {
        setCannonAngle((prev) => (prev + 6) % 360);
      } else if (alien.id === 'alienx') {
        setRingAngle1((prev) => (prev + 3.5) % 360);
        setRingAngle2((prev) => (prev - 2.5 + 360) % 360);
      } else if (alien.id === 'diamondhead') {
        setActiveLaserSlot((prev) => (prev + 1) % 4);
      } else if (alien.id === 'ghostfreak') {
        setSonarAngle((prev) => (prev + 8) % 360);
      }
    }, 45);
    return () => clearInterval(interval);
  }, [alien.id, seismicDir]);

  const registerWin = () => {
    setWon(true);
    if (onUnlockMemory) onUnlockMemory();
  };

  // --- HANDLERS FOR EACH ALIEN'S UNIQUE MINI-GAME ---

  // 1. FOUR ARMS: Sonic Clap Timing Smash
  const handleFourArmsSmash = () => {
    soundEngine.playAbilitySound('fourarms');
    const isCritical = seismicCursor >= 35 && seismicCursor <= 65;
    const dmg = isCritical ? 40 : 20;
    setCrackFlash(true);
    setTimeout(() => setCrackFlash(false), 260);
    onTrigger3DAttack('fourarms', isCritical ? 'CRITICAL SONIC CLAP! -40% BARRIER HP!' : 'TETRAMAND SLAM! -20% BARRIER HP!');

    setBarrierHp((prev) => {
      const next = Math.max(0, prev - dmg);
      if (next === 0) registerWin();
      return next;
    });
  };

  // 2. XLR8: Tachyon Speed Intercept
  const handleXlr8Catch = () => {
    soundEngine.playAbilitySound('xlr8');
    const nextStreak = xlr8Streak + 1;
    setXlr8Streak(nextStreak);
    setXlr8TargetPos({
      x: 15 + Math.floor(Math.random() * 70),
      y: 18 + Math.floor(Math.random() * 64),
    });
    onTrigger3DAttack('xlr8', `MACH-5 INTERCEPT #${nextStreak}! Tachyon vortex locked!`);
    if (nextStreak >= 4) registerWin();
  };

  // 3. CANNONBOLT: Armored Sphere Ricochet
  const handleCannonboltLaunch = (idx) => {
    soundEngine.playAbilitySound('cannonbolt');
    setIsRolling(true);
    setTimeout(() => setIsRolling(false), 650);
    const updated = [...bumpersHit];
    updated[idx] = true;
    setBumpersHit(updated);
    onTrigger3DAttack('cannonbolt', `RICOCHET HIT ON NODE #0${idx + 1}! Kinetic shell spinning!`);
    if (updated.every(Boolean)) registerWin();
  };

  // 4. ALIEN X: Voice of Cosmos Alignment
  const handleAlienXConsensus = () => {
    soundEngine.playAbilitySound('alienx');
    const nextCount = voicesAligned + 1;
    setVoicesAligned(nextCount);
    onTrigger3DAttack(
      'alienx',
      nextCount >= 3
        ? 'MOTION CARRIED! Reality warped across the Omniverse!'
        : `VOICE ALIGNED (${nextCount}/3): Serena & Bellicus deliberating...`
    );
    if (nextCount >= 3) registerWin();
  };

  // 5. HEATBLAST: Pyrokinetic Drone Ignition
  const handleHeatblastShoot = (drone) => {
    soundEngine.playAbilitySound('heatblast');
    setFireballFx({ x: drone.x, y: drone.y });
    setTimeout(() => setFireballFx(null), 350);
    const updated = drones.map((d) => (d.id === drone.id ? { ...d, alive: false } : d));
    setDrones(updated);
    onTrigger3DAttack('heatblast', `SUPERNOVA FLARE! Drone #0${drone.id} vaporized at 4,800K!`);
    if (updated.every((d) => !d.alive)) registerWin();
  };

  // 6. DIAMONDHEAD: Taydenite Crystal Wall Eruption
  const handleDiamondheadShield = (slotIdx) => {
    soundEngine.playAbilitySound('diamondhead');
    const updated = [...shieldsUp];
    updated[slotIdx] = true;
    setShieldsUp(updated);
    onTrigger3DAttack('diamondhead', `TAYDENITE SPIRE #0${slotIdx + 1} ERUPTED! Laser refracted!`);
    if (updated.every(Boolean)) registerWin();
  };

  // 7. GHOSTFREAK: Ectonurite Phase Catch
  const handleGhostfreakPhase = (anom) => {
    soundEngine.playAbilitySound('ghostfreak');
    const updated = anomalies.map((a) => (a.id === anom.id ? { ...a, caught: true } : a));
    setAnomalies(updated);
    onTrigger3DAttack('ghostfreak', `INTANGIBLE PHASE SHIFT! Spectral node #0${anom.id} absorbed!`);
    if (updated.every((a) => a.caught)) registerWin();
  };

  // 8. UPGRADE: Galvanic Nanite Circuit Repair
  const handleUpgradeNode = (idx) => {
    soundEngine.playAbilitySound('upgrade');
    const updated = [...circuitNodes];
    updated[idx] = true;
    setCircuitNodes(updated);
    onTrigger3DAttack('upgrade', `NANITE TRACE #0${idx + 1} MERGED! Overclocking Omnitrix core!`);
    if (updated.every(Boolean)) {
      if (onRepairWatch) onRepairWatch();
      registerWin();
    }
  };

  return (
    <div
      className="mt-2 rounded-xl bg-black/75 border p-3.5 relative overflow-hidden"
      style={{ borderColor: `${alien.color}66` }}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" style={{ color: alien.color }} />
          <span
            className="font-display text-[11px] font-black tracking-wider uppercase"
            style={{ color: alien.color }}
          >
            MINI-GAME: {alien.abilityName}
          </span>
        </div>
        {won && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#88ff00]/20 border border-[#88ff00] font-mono text-[10px] text-[#88ff00] font-bold">
            <Trophy className="w-3 h-3" /> MASTERED
          </span>
        )}
      </div>

      {/* ===================================================================
          1. FOUR ARMS: SEISMIC TIMING SMASH METER
      =================================================================== */}
      {alien.id === 'fourarms' && (
        <div className="space-y-2.5">
          <div className="flex justify-between text-[10px] font-mono text-white/75">
            <span>HIT THE CRITICAL ZONE TO SHATTER ARMOR</span>
            <span className="text-red-400 font-bold">BARRIER HP: {barrierHp}%</span>
          </div>

          {/* Cracked Barrier Health Bar */}
          <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden border border-red-500/40">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-orange-400 transition-all duration-300"
              style={{ width: `${barrierHp}%` }}
            />
          </div>

          {/* Oscillating Timing Gauge */}
          <div
            className={`relative w-full h-7 rounded-lg bg-black/90 border border-white/20 overflow-hidden flex items-center ${
              crackFlash ? 'ring-2 ring-red-500 scale-[1.02]' : ''
            } transition`}
          >
            {/* Critical Sweet Spot (35% - 65%) */}
            <div className="absolute left-[35%] width-[30%] w-[30%] h-full bg-red-500/30 border-x border-red-400 flex items-center justify-center">
              <span className="font-mono text-[9px] text-red-200 tracking-widest">CRIT 2X</span>
            </div>
            {/* Moving Cursor */}
            <div
              className="absolute top-0 bottom-0 w-2 bg-white shadow-[0_0_12px_#ff3333]"
              style={{ left: `${seismicCursor}%` }}
            />
          </div>

          <button
            onClick={handleFourArmsSmash}
            className="w-full py-2.5 rounded-lg bg-red-500 hover:bg-red-400 text-black font-display font-black text-xs tracking-widest uppercase shadow-[0_0_20px_rgba(255,51,51,0.5)] active:scale-95 transition"
          >
            💥 QUAD-FIST SONIC CLAP!
          </button>
        </div>
      )}

      {/* ===================================================================
          2. XLR8: HIGH-SPEED TACHYON ORB INTERCEPTOR
      =================================================================== */}
      {alien.id === 'xlr8' && (
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-mono text-cyan-200/80">
            <span>CLICK THE SPEED ORB TO DASH AT MACH 5</span>
            <span>INTERCEPTED: {xlr8Streak} / 4</span>
          </div>

          <div className="relative w-full h-28 rounded-lg bg-[#04141c] border border-cyan-500/40 overflow-hidden">
            {/* Speed lines background */}
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_center,#00e5ff_1px,transparent_1px)] bg-[length:12px_12px]" />
            <button
              onClick={handleXlr8Catch}
              style={{ left: `${xlr8TargetPos.x}%`, top: `${xlr8TargetPos.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full bg-cyan-400 text-black font-mono text-[10px] font-black shadow-[0_0_20px_#00e5ff] animate-pulse hover:scale-110 active:scale-90 transition-all"
            >
              ⚡ TACHYON
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================
          3. CANNONBOLT: ARMORED PINBALL BUMPER RICOCHET
      =================================================================== */}
      {alien.id === 'cannonbolt' && (
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-mono text-amber-200/80">
            <span>SMASH ALL 4 KINETIC BUMPERS IN SPHERE MODE</span>
            <span>{bumpersHit.filter(Boolean).length} / 4 SMASHED</span>
          </div>

          <div className="grid grid-cols-4 gap-2 py-1">
            {bumpersHit.map((hit, idx) => (
              <button
                key={idx}
                onClick={() => handleCannonboltLaunch(idx)}
                className={`h-14 rounded-xl border font-display text-xs font-black flex flex-col items-center justify-center transition-all ${
                  hit
                    ? 'bg-amber-400/25 border-amber-400 text-amber-300 scale-95'
                    : 'bg-amber-500 text-black border-amber-300 shadow-[0_0_15px_rgba(255,184,0,0.45)] hover:scale-105'
                }`}
              >
                <span className={isRolling ? 'animate-spin inline-block' : ''}>🟡</span>
                <span className="text-[9px] mt-0.5">{hit ? 'SMASHED' : `BUMPER ${idx + 1}`}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================
          4. ALIEN X: CELESTIAL CONSENSUS RING ALIGNMENT
      =================================================================== */}
      {alien.id === 'alienx' && (
        <div className="space-y-2.5">
          <div className="flex justify-between text-[10px] font-mono text-lime-200/80">
            <span>ALIGN BELLICUS & SERENA TO WARP REALITY</span>
            <span>CONSENSUS: {voicesAligned} / 3</span>
          </div>

          <div className="relative h-24 rounded-lg bg-[#05080c] border border-[#88ff00]/40 flex items-center justify-center overflow-hidden">
            {/* Rotating Cosmic Rings */}
            <div
              className="w-16 h-16 rounded-full border-2 border-dashed border-[#88ff00]"
              style={{ transform: `rotate(${ringAngle1}deg)` }}
            />
            <div
              className="absolute w-11 h-11 rounded-full border-2 border-dotted border-emerald-300"
              style={{ transform: `rotate(${ringAngle2}deg)` }}
            />
            <button
              onClick={handleAlienXConsensus}
              className="absolute px-3 py-1 rounded-full bg-[#88ff00] text-black font-display text-[10px] font-black tracking-wider shadow-[0_0_20px_#88ff00] hover:scale-105 active:scale-95 transition"
            >
              ✦ SECOND MOTION
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================
          5. HEATBLAST: SUPERNOVA FIREBALL DRONE HUNTER
      =================================================================== */}
      {alien.id === 'heatblast' && (
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-mono text-orange-200/80">
            <span>CLICK CRYO-DRONES TO INCINERATE WITH PLASMA</span>
            <span>{drones.filter((d) => !d.alive).length} / 3 VAPORIZED</span>
          </div>

          <div className="relative h-28 rounded-lg bg-gradient-to-t from-orange-950/60 to-black border border-orange-500/40 overflow-hidden">
            {drones.map((drone) =>
              drone.alive ? (
                <button
                  key={drone.id}
                  onClick={() => handleHeatblastShoot(drone)}
                  style={{ left: `${drone.x}%`, top: `${drone.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-amber-400 text-black font-mono text-[10px] font-black shadow-[0_0_15px_#ff6b00] animate-bounce"
                >
                  🔥 DRONE 0{drone.id}
                </button>
              ) : (
                <span
                  key={drone.id}
                  style={{ left: `${drone.x}%`, top: `${drone.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 font-mono text-[10px] text-orange-400/60"
                >
                  💥 ASHED
                </span>
              )
            )}
            {fireballFx && (
              <div
                style={{ left: `${fireballFx.x}%`, top: `${fireballFx.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-orange-400/70 blur-sm animate-ping pointer-events-none"
              />
            )}
          </div>
        </div>
      )}

      {/* ===================================================================
          6. DIAMONDHEAD: TAYDENITE CRYSTAL WALL DEFLECTOR
      =================================================================== */}
      {alien.id === 'diamondhead' && (
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-mono text-emerald-200/80">
            <span>ERUPT ALL 4 TAYDENITE CRYSTALFORTRESS SPIRES</span>
            <span>{shieldsUp.filter(Boolean).length} / 4 ERECTED</span>
          </div>

          <div className="grid grid-cols-4 gap-2 py-1">
            {shieldsUp.map((up, idx) => (
              <button
                key={idx}
                onClick={() => handleDiamondheadShield(idx)}
                className={`h-14 rounded-xl border font-mono text-[10px] font-bold flex flex-col items-center justify-center transition-all ${
                  up
                    ? 'bg-emerald-400 text-black border-white shadow-[0_0_18px_#00ffb2]'
                    : activeLaserSlot === idx
                    ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 animate-pulse'
                    : 'bg-black/70 border-emerald-500/30 text-emerald-300/70 hover:border-emerald-400'
                }`}
              >
                <span>💎</span>
                <span>{up ? 'ERUPTED' : `SPIRE ${idx + 1}`}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================
          7. GHOSTFREAK: ECTONURITE DIMENSIONAL PHASE RADAR
      =================================================================== */}
      {alien.id === 'ghostfreak' && (
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-mono text-purple-200/80">
            <span>PHASE-LOCK ALL 3 SHADOW ANOMALIES IN THE DARK</span>
            <span>{anomalies.filter((a) => a.caught).length} / 3 PHASED</span>
          </div>

          <div className="relative h-28 rounded-lg bg-[#0d0517] border border-purple-500/40 overflow-hidden">
            {/* Rotating radar sweep line */}
            <div
              className="absolute left-1/2 top-1/2 w-24 h-0.5 bg-gradient-to-r from-purple-400 to-transparent origin-left pointer-events-none"
              style={{ transform: `rotate(${sonarAngle}deg)` }}
            />
            {anomalies.map((anom) => (
              <button
                key={anom.id}
                onClick={() => handleGhostfreakPhase(anom)}
                style={{ left: `${anom.x}%`, top: `${anom.y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full font-mono text-[10px] font-bold transition-all ${
                  anom.caught
                    ? 'bg-purple-900/40 border border-purple-400/40 text-purple-300/50 scale-90'
                    : 'bg-purple-500 text-black shadow-[0_0_15px_#a855f7] animate-pulse hover:scale-110'
                }`}
              >
                {anom.caught ? '👁️ LOCKED' : '👻 PHASE'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================
          8. UPGRADE: GALVANIC NANITE CIRCUITRY MATRIX
      =================================================================== */}
      {alien.id === 'upgrade' && (
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-mono text-lime-200/80">
            <span>BRIDGE ALL 4 GALVANIC NANITE NODES TO OVERCLOCK</span>
            <span>{circuitNodes.filter(Boolean).length} / 4 LINKED</span>
          </div>

          <div className="flex items-center justify-between gap-1.5 py-2">
            {circuitNodes.map((linked, idx) => (
              <React.Fragment key={idx}>
                <button
                  onClick={() => handleUpgradeNode(idx)}
                  className={`flex-1 py-2.5 rounded-lg border font-mono text-[10px] font-black transition-all ${
                    linked
                      ? 'bg-[#39ff14] text-black border-white shadow-[0_0_15px_#39ff14]'
                      : 'bg-black/80 text-[#39ff14] border-[#39ff14]/40 hover:border-[#39ff14]'
                  }`}
                >
                  {linked ? '⚡ ON' : `NODE ${idx + 1}`}
                </button>
                {idx < 3 && (
                  <div
                    className={`w-3 h-1 rounded-full ${
                      linked && circuitNodes[idx + 1] ? 'bg-[#39ff14]' : 'bg-white/15'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
