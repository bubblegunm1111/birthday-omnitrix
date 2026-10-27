import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ShieldAlert,
  Wrench,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Zap,
  Eye,
  Heart,
  RotateCcw,
  CheckCircle2,
  Crosshair,
  Flame,
  Gauge,
  Music,
} from 'lucide-react';
import OmnitrixScene from './components/OmnitrixScene';
import AlienMiniGame from './components/AlienMiniGame';
import AlienArenaPage from './components/AlienArenaPage';
import VolvoMiniGame from './components/VolvoMiniGame';
import { ALIENS, PERSONAL_MEMORIES } from './data/aliens';
import { soundEngine } from './utils/soundEngine';

const BEN10_TRACKS = [
  { id: 'classic', name: 'CLASSIC THEME', src: '/ben10_theme.mp3' },
  { id: 'alien_force', name: 'ALIEN FORCE', src: '/ben10_alien_force.mp3' },
  { id: 'ultimate_alien', name: 'ULTIMATE ALIEN', src: '/ben10_ultimate_alien.mp3' },
];

export default function App() {
  // scrollProgress: 0.0 (Section 1: Ben Tennyson Bust) -> 0.5 (Section 2: 3D Omnitrix Watch) -> 0.75 (Section 3: Characters) -> 1.0 (Section 4: Dedicated Tribute Card)
  const [scrollProgress, setScrollProgress] = useState(0);
  const [watchStage, setWatchStage] = useState('closed');
  const [isDamaged, setIsDamaged] = useState(false);
  const [selectedAlienIndex, setSelectedAlienIndex] = useState(1); // Default to XLR8 (new 3D GLB!)
  const [isMuted, setIsMuted] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [transformFlash, setTransformFlash] = useState(false);
  const audioRef = useRef(null);

  // Alien Ability Mini-Game & Arena feature flag (set to true to restore anytime)
  const SHOW_GAMES_AND_ARENA = false;

  const [abilityScore, setAbilityScore] = useState(0);
  const [attackTriggerCount, setAttackTriggerCount] = useState(0);
  const [activeArenaAlien, setActiveArenaAlien] = useState(null);
  const [isCharacterSelected, setIsCharacterSelected] = useState(false);
  const [abilityLog, setAbilityLog] = useState('SYSTEM READY: Galvanic DNA matrix online.');
  const [memoryUnlocked, setMemoryUnlocked] = useState(false);
  const [exploredAliens, setExploredAliens] = useState(() => new Set([0]));
  const [showBenHologram, setShowBenHologram] = useState(false);
  const [showVolvoGame, setShowVolvoGame] = useState(false);
  const [customOwnerName, setCustomOwnerName] = useState('COMMANDER TENNYSON');

  const timerRef = useRef(null);
  const currentAlien = ALIENS[selectedAlienIndex] || ALIENS[0];

  // State tracking whether the user has unlocked character selection
  const isWatchUnlocked = watchStage === 'diamond_select' || watchStage === 'hologram_active' || watchStage === 'explore' || isCharacterSelected;

  // Always force page to top (Ben Tennyson) on initial load or refresh
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  // Smooth inertia scroll speed limiter:
  // Dampens aggressive/fast mousewheel or trackpad flicking so the cinematic 3D animations glide smoothly!
  useEffect(() => {
    let targetScrollY = window.scrollY;
    let currentScrollY = window.scrollY;
    let animId = null;

    const onWheel = (e) => {
      // Allow normal scrolling inside open modal cards
      if (e.target && e.target.closest && (e.target.closest('.overflow-y-auto') || e.target.closest('[role="dialog"]'))) {
        return;
      }
      e.preventDefault();

      // Clamp delta to prevent ultra-fast flicking from skipping sections
      const maxDelta = 75; // Maximum pixels per wheel tick
      const clampedDelta = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), maxDelta);

      const maxScroll = isCharacterSelected
        ? window.innerHeight * 3
        : isWatchUnlocked
        ? window.innerHeight * 2
        : window.innerHeight;

      targetScrollY = Math.max(0, Math.min(maxScroll, targetScrollY + clampedDelta));

      if (!animId) {
        const smoothStep = () => {
          const diff = targetScrollY - currentScrollY;
          if (Math.abs(diff) > 0.4) {
            // Smooth easing factor (0.09) prevents abrupt jumps and provides a luxurious glide
            currentScrollY += diff * 0.09;
            window.scrollTo(0, currentScrollY);
            animId = requestAnimationFrame(smoothStep);
          } else {
            currentScrollY = targetScrollY;
            window.scrollTo(0, currentScrollY);
            animId = null;
          }
        };
        animId = requestAnimationFrame(smoothStep);
      }
    };

    const onSyncScroll = () => {
      if (!animId) {
        targetScrollY = window.scrollY;
        currentScrollY = window.scrollY;
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', onSyncScroll, { passive: true });

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onSyncScroll);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isCharacterSelected, isWatchUnlocked]);

  // Track Window Scroll normalized against the FIXED base 3-section scroll height (2 * window.innerHeight).
  // Automatically reset the watch state if the user scrolls back up!
  useEffect(() => {
    const handleScroll = () => {
      const baseMaxScroll = window.innerHeight * 2;
      if (baseMaxScroll <= 0) return;

      // If the watch is still closed and character section hasn't been unlocked by pressing the watch,
      // prevent scrolling past Section 2 (limit progress to 0.50 so user must interact with the watch first!)
      if (!isWatchUnlocked && window.scrollY > window.innerHeight * 1.05) {
        window.scrollTo({ top: window.innerHeight, behavior: 'instant' });
        return;
      }

      const maxAllowed = isCharacterSelected ? 1.5 : (isWatchUnlocked ? 1.0 : 0.5);
      const progress = Math.min(maxAllowed, Math.max(0, window.scrollY / baseMaxScroll));
      setScrollProgress(progress);

      // Section boundary auto-reset logic when scrolling back up:
      // If user scrolls back up into Section 1 (Ben Tennyson, progress < 0.28),
      // close the watch and reset selection so it returns to closed state!
      if (progress < 0.28) {
        setWatchStage((prev) => (prev !== 'closed' ? 'closed' : prev));
        setIsCharacterSelected((prev) => (prev ? false : prev));
      } else if (progress < 0.65) {
        // If user scrolls back up into Section 2 (Omnitrix Watch) from Character section
        setIsCharacterSelected((prev) => (prev ? false : prev));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isCharacterSelected, isWatchUnlocked]);

  const scrollToSection = (sectionIndex) => {
    const targetY = sectionIndex * window.innerHeight;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  const clearStageTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Trigger the Satisfying Side-Angle POP-OPEN Animation -> then settle into Diamond Select
  const triggerSideOpenAnimation = useCallback(() => {
    clearStageTimer();
    soundEngine.playDialPress(true);
    setWatchStage('opening_side');
    timerRef.current = setTimeout(() => {
      setWatchStage('diamond_select');
    }, 680);
  }, []);

  // Trigger the Satisfying Side-Angle SLAM-CLICK Animation -> then erupt 3D Hologram!
  const triggerSideSlamAnimation = useCallback(() => {
    clearStageTimer();
    soundEngine.playDialPress(false);
    setWatchStage('slamming_side');
    timerRef.current = setTimeout(() => {
      soundEngine.playTransformation();
      setTransformFlash(true);
      setTimeout(() => setTransformFlash(false), 260);
      setWatchStage('hologram_active');
    }, 680);
  }, []);

  // Rotate through aliens using Left/Right arrows or A/D keys
  const handleRotateAlien = useCallback((dir) => {
    setSelectedAlienIndex((prev) => {
      const next = (prev + dir + ALIENS.length) % ALIENS.length;
      soundEngine.playDialRotate(next);
      return next;
    });
  }, []);

  // Sound Effects Mute Toggle (leaves background music playing or muted independently)
  const handleToggleSfxMute = useCallback(() => {
    const nextMuted = soundEngine.toggleMute();
    setIsMuted(nextMuted);
  }, []);

  const toggleThemeSong = useCallback((e) => {
    if (e) e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      setIsMusicPlaying(false);
    } else {
      audio.play().then(() => {
        setIsMusicPlaying(true);
      }).catch(() => {});
    }
  }, []);

  const handleNextTrack = useCallback((e) => {
    if (e) e.stopPropagation();
    const next = (currentTrackIndex + 1) % BEN10_TRACKS.length;
    setCurrentTrackIndex(next);
  }, [currentTrackIndex]);

  // When track index changes, update source & auto-play if music was active or initially starting
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = BEN10_TRACKS[currentTrackIndex].src;
    audio.load();
    if (isMusicPlaying) {
      audio.play().then(() => {
        setIsMusicPlaying(true);
      }).catch(() => {});
    }
  }, [currentTrackIndex]);

  // Immediate autoplay on initial load, with one-time fallback on first user gesture
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.play().then(() => {
      setIsMusicPlaying(true);
    }).catch(() => {
      // If browser blocks unprompted autoplay, start on the very first gesture
      const onFirstGesture = () => {
        audio.play().then(() => {
          setIsMusicPlaying(true);
        }).catch(() => {});
        ['pointerdown', 'touchstart', 'scroll', 'keydown', 'wheel'].forEach((evt) => {
          window.removeEventListener(evt, onFirstGesture);
        });
      };

      ['pointerdown', 'touchstart', 'scroll', 'keydown', 'wheel'].forEach((evt) => {
        window.addEventListener(evt, onFirstGesture, { passive: true });
      });
    });
  }, []);

  // Keyboard support: ArrowLeft / ArrowRight / A / D
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        handleRotateAlien(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        handleRotateAlien(-1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleRotateAlien]);

  // Clicking directly on the 3D Omnitrix Watch executes the side-angle mechanical click!
  const handleWatchClick = useCallback(() => {
    if (watchStage === 'closed') {
      triggerSideOpenAnimation();
    } else if (watchStage === 'diamond_select') {
      triggerSideSlamAnimation();
    } else if (watchStage === 'hologram_active') {
      triggerSideOpenAnimation();
    }
  }, [watchStage, triggerSideOpenAnimation, triggerSideSlamAnimation]);

  // Interactive Ability execution in Explore Mode
  const handleAbilityHit = useCallback(
    (targetIdx = null) => {
      soundEngine.playAbilitySound(currentAlien.id);
      setAttackTriggerCount((prev) => prev + 1);

      if (currentAlien.id === 'upgrade' && isDamaged) {
        setIsDamaged(false);
      }

      setAbilityScore((prev) => {
        const next = prev + 1;
        if (next >= 3) {
          setMemoryUnlocked(true);
        }
        return next;
      });

      const actionMessages = {
        fourarms: 'SEISMIC SHOCKWAVE IMPACT! Containment barrier integrity critical!',
        xlr8: 'TACHYON VORTEX INTERCEPT! Target neutralized at Mach 1.8!',
        cannonbolt: 'ARMORED SPHERE RICOCHET! Kinetic shell shattered containment target!',
        alienx: 'CELESTIALSAPPIEN MOTION CARRIED! Reality matrix reconfigured!',
        heatblast: 'SUPERNOVA PLASMA FLARE HIT! Thermal output at 4,800 Kelvin!',
        diamondhead: 'TAYDENITE PRISM SHARD ERUPTED! Energy beam refracted 100%!',
        ghostfreak: 'DIMENSIONAL PHASE LOCKED! Hidden spectral signal decoded!',
        upgrade: 'GALVANIC NANITE INJECTION COMPLETE! Damaged Omnitrix circuits repaired!',
      };
      setAbilityLog(
        actionMessages[currentAlien.id] ||
          `Target node #${targetIdx !== null ? targetIdx + 1 : 'ALPHA'} neutralized!`
      );
    },
    [currentAlien.id, isDamaged]
  );

  // Triggered by each character's unique mini-game!
  const handleTrigger3DAttack = useCallback((alienId, customLogMessage) => {
    setWatchStage('explore');
    setAttackTriggerCount((prev) => prev + 1);
    if (customLogMessage) {
      setAbilityLog(customLogMessage);
    }
  }, []);

  const handleOpenMemoryVault = () => {
    clearStageTimer();
    soundEngine.playMemoryUnlock();
    setWatchStage('memory');
    setShowBenHologram(true);
  };

  const handleToggleDamage = () => {
    soundEngine.playInspectPing(!isDamaged);
    setIsDamaged((prev) => !prev);
  };

  // Determine which scroll section is currently active:
  // 0: Ben Tennyson (0.00 - 0.44)
  // 1: 3D Omnitrix Watch (0.44 - 0.72)
  // 2: Character Roster Showcase (0.72 - 1.08)
  // 3: Solo Character on Left & Birthday Tribute Card on Right (> 1.08, unlocked when SELECT is pressed!)
  const activeSection =
    scrollProgress < 0.44
      ? 0
      : scrollProgress < 0.72
      ? 1
      : isCharacterSelected && scrollProgress > 1.08
      ? 3
      : 2;

  const handleSelectCharacter = () => {
    setIsCharacterSelected(true);
    soundEngine.playTransformation();

    // Wait 1 frame for the extra 100vh section (`min-h-[400vh]`) to mount, then smoothly scroll down to it!
    requestAnimationFrame(() => {
      window.scrollTo({ top: window.innerHeight * 3, behavior: 'smooth' });
    });
  };

  // Smooth scroll-driven progress (0.0 -> 1.0) for the Section 4 Birthday Card slide-in
  const tributeScrollProgress = isCharacterSelected
    ? Math.min(1, Math.max(0, (scrollProgress - 1.05) / 0.4))
    : 0;

  const totalPageHeight = isCharacterSelected ? 'min-h-[400vh]' : isWatchUnlocked ? 'min-h-[300vh]' : 'min-h-[200vh]';

  return (
    <div className={`relative w-full ${totalPageHeight} bg-gradient-to-b from-[#0e1318] via-[#11181f] to-[#0a1014] font-sans text-white select-none overflow-x-hidden`}>
      {/* =====================================================================
          LAYER 1 (z-0): PARALLAX TYPOGRAPHY MOVING BEHIND THE 3D MODELS!
          Because the WebGL canvas is at z-10 with alpha:true, this text glides
          cleanly BEHIND Ben Tennyson's head & behind the 3D Omnitrix as you scroll!
      ===================================================================== */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
        {/* Stage 1 Background Title BEHIND Ben Tennyson (Fades out completely by sp=0.14 so NO words are behind the rotating 3D watch!) */}
        <div
          className="absolute inset-x-0 flex flex-col items-center justify-center text-center"
          style={{
            top: '14%',
            transform: `translateY(${-scrollProgress * 420}px) scale(${1 - scrollProgress * 0.25})`,
            opacity: Math.max(0, 1 - scrollProgress * 7.2),
          }}
        >
          <span className="font-mono text-xs md:text-sm tracking-[0.45em] text-[#88ff00]/80 uppercase mb-2">
            UNKNOWN DEVICE DETECTED // PREVIOUS OWNER RECOGNIZED
          </span>
          <h1 className="font-display text-[13vw] leading-none font-black tracking-tighter uppercase text-white/[0.08] select-none">
            BEN TENNYSON
          </h1>
          <h2 className="font-display text-5xl md:text-7xl font-black tracking-[0.18em] uppercase text-[#88ff00]/25 -mt-4">
            IT’S HERO TIME
          </h2>
        </div>

        {/* Stage 1.5 Mid-Scroll Background Title BEHIND the Transition 3D Omnitrix Watch */}
        <div
          className="absolute inset-x-0 flex flex-col items-center justify-center text-center pointer-events-none"
          style={{
            top: '22%',
            transform: `translateY(${(0.28 - scrollProgress) * 260}px)`,
            opacity:
              scrollProgress > 0.14 && scrollProgress < 0.44
                ? Math.min(1, (scrollProgress - 0.14) * 7.0) *
                  Math.max(0, 1 - Math.max(0, scrollProgress - 0.34) * 8.0)
                : 0,
          }}
        >
          <span className="font-mono text-xs md:text-sm tracking-[0.5em] text-[#88ff00] uppercase mb-1">
            LEVEL 20 GALVAN TECHNOLOGY // DNA RECIPIENT AUTHORIZED
          </span>
          <h2 className="font-display text-[9vw] leading-none font-black tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-[#88ff00] to-teal-200 opacity-80 drop-shadow-[0_0_35px_rgba(136,255,0,0.4)]">
            HAPPY BIRTHDAY ZEYAD
          </h2>
        </div>

        {/* Stage 2 Background Title BEHIND the 3D Omnitrix Watch (ONLY appears after sp=0.45 when the watch interface shows!) */}
        <div
          className="absolute inset-x-0 flex flex-col items-center justify-center text-center"
          style={{
            top: '12%',
            transform: `translateY(${(0.55 - scrollProgress) * 280}px)`,
            opacity:
              scrollProgress > 0.45 && scrollProgress < 0.74
                ? Math.min(1, (scrollProgress - 0.45) * 8.0) *
                  Math.max(0, 1 - Math.max(0, scrollProgress - 0.62) * 8.0)
                : 0,
          }}
        >
          <span className="font-mono text-xs tracking-[0.4em] text-[#88ff00]/90 uppercase mb-1">
            GALVANIC DNA MATRIX // 0{selectedAlienIndex + 1} OF 0{ALIENS.length}
          </span>
          <h2 className="font-display text-[11vw] leading-none font-black tracking-widest uppercase text-white/[0.07]">
            {currentAlien.name}
          </h2>
        </div>

        {/* Stage 3 Background Title BEHIND the 3D Alien Character Hologram */}
        <div
          className="absolute inset-x-0 flex flex-col items-center justify-center text-center"
          style={{
            top: '14%',
            transform: `translateY(${(0.88 - scrollProgress) * 280}px)`,
            opacity: scrollProgress > 0.65 ? Math.min(1, (scrollProgress - 0.65) * 3.5) : 0,
          }}
        >
          <span
            className="font-mono text-xs tracking-[0.45em] uppercase mb-1"
            style={{ color: currentAlien.color }}
          >
            {currentAlien.species} // {currentAlien.homeworld}
          </span>
          <h2
            className="font-display text-[12vw] leading-none font-black tracking-tight uppercase opacity-15"
            style={{ color: currentAlien.color }}
          >
            {currentAlien.name}
          </h2>
        </div>
      </div>

      {/* =====================================================================
          LAYER 2 (z-10): TRANSPARENT 3D THREE.JS SCENE CANVAS
          Renders Ben Tennyson, the 3D Omnitrix, and the 3D Holograms IN FRONT of the background text!
      ===================================================================== */}
      <OmnitrixScene
        scrollProgress={scrollProgress}
        watchStage={watchStage}
        isDamaged={isDamaged}
        selectedAlienIndex={selectedAlienIndex}
        attackTriggerCount={attackTriggerCount}
        isCharacterSelected={isCharacterSelected}
        onWatchClick={handleWatchClick}
        onAbilityHit={handleAbilityHit}
        showBenHologram={showBenHologram}
        modelsLoadedCallback={setModelsLoaded}
      />

      {/* BRIEF GREEN FLASH WHEN SLAMMING WATCH CLOSED TO PROJECT HOLOGRAM */}
      {transformFlash && (
        <div
          className="fixed inset-0 z-50 pointer-events-none transition-opacity duration-300"
          style={{ backgroundColor: '#88ff00', opacity: 0.4 }}
        />
      )}

      {/* =====================================================================
          LAYER 3 (z-30): PERIPHERAL HUD & CONTROLS (Never blocks the center character!)
      ===================================================================== */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto bg-black/65 backdrop-blur-md border border-[#88ff00]/35 px-4 py-2 rounded-full">
          <div
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: isDamaged ? '#FF3B30' : '#88ff00' }}
          />
          <span className="font-display text-xs tracking-[0.2em] text-[#88ff00] font-bold">
            OMNITRIX //{' '}
            {activeSection === 0
              ? '01. WIELDER IDENTIFIED'
              : activeSection === 1
              ? '02. 3D OMNITRIX CORE'
              : '03. ALIEN DNA ROSTER'}
          </span>
        </div>

        {/* Section Quick-Jump Pills */}
        <div className="hidden md:flex items-center gap-1.5 pointer-events-auto bg-black/65 backdrop-blur-md border border-white/15 p-1 rounded-full">
          {[
            { idx: 0, label: '01. BEN TENNYSON' },
            { idx: 1, label: '02. 3D OMNITRIX' },
            { idx: 2, label: '03. CHARACTERS' },
          ].map((sec) => (
            <button
              key={sec.idx}
              onClick={() => scrollToSection(sec.idx)}
              className={`px-3.5 py-1.5 rounded-full font-display text-[11px] tracking-wider transition-all ${
                activeSection === sec.idx
                  ? 'bg-[#88ff00] text-black font-black shadow-[0_0_15px_#88ff00]'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5 pointer-events-auto">
          {/* Audio Controls & Helpful Tooltip Note */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 pointer-events-auto">
              {/* Ben 10 Multi-Track Soundtrack Switcher & Play/Pause */}
              <div className="flex items-center gap-1 bg-black/65 border border-white/20 p-0.5 rounded-full backdrop-blur-md">
                <button
                  onClick={toggleThemeSong}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-xs transition-all ${
                    isMusicPlaying
                      ? 'bg-[#88ff00]/20 text-[#88ff00] shadow-[0_0_12px_rgba(136,255,0,0.3)]'
                      : 'text-white/60 hover:text-white'
                  }`}
                  title="Click to toggle music on/off"
                >
                  <Music className={`w-3.5 h-3.5 ${isMusicPlaying ? 'animate-pulse' : ''}`} />
                  <span className="font-bold tracking-wider">
                    {isMusicPlaying ? BEN10_TRACKS[currentTrackIndex].name : 'MUSIC: OFF'}
                  </span>
                </button>

                <button
                  onClick={handleNextTrack}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-[#88ff00] transition"
                  title="Skip to next Ben 10 theme track"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Sound Effects Toggle (independent of background music) */}
              <button
                onClick={handleToggleSfxMute}
                className={`p-2.5 rounded-full border transition ${
                  isMuted
                    ? 'bg-red-950/70 border-red-500/60 text-red-400'
                    : 'bg-black/65 border-white/15 text-[#88ff00] hover:border-[#88ff00]'
                }`}
                title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Discreet Note on Audio Controls */}
            <span className="font-mono text-[10px] text-white/40 tracking-wider pr-1 hidden sm:inline">
              ♫ CLICK MUSIC TO TOGGLE // 🔊 MUTES SFX
            </span>
          </div>
        </div>
      </header>

      {/* SUBTLE BOTTOM-RIGHT SCROLL INDICATOR IN SECTION 1 (Never blocks Ben Tennyson!) */}
      {activeSection === 0 && (
        <div className="fixed bottom-6 right-6 z-30 pointer-events-auto">
          <button
            onClick={() => scrollToSection(1)}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-black/75 hover:bg-[#88ff00] text-[#88ff00] hover:text-black border border-[#88ff00]/50 font-mono text-xs tracking-wider uppercase transition-all shadow-lg"
          >
            <span>SCROLL DOWN TO WATCH</span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </button>
        </div>
      )}

      {/* =====================================================================
          SECTION 2 PERIPHERAL HUD (Only visible when looking at the 3D Omnitrix Watch!)
          Kept cleanly at the left/right edges and bottom dock so the middle is 100% clear!
      ===================================================================== */}
      {activeSection === 1 && watchStage !== 'memory' && (
        <>
          {/* Left & Right Bezel Rotation Arrows (ONLY visible when the watch is opened/unlocked to select an alien!) */}
          {isWatchUnlocked && (
            <div className="fixed inset-x-0 top-1/2 -translate-y-1/2 z-30 pointer-events-none flex items-center justify-between px-6 md:px-16">
              <button
                onClick={() => handleRotateAlien(-1)}
                className="pointer-events-auto p-4 rounded-full bg-black/70 hover:bg-[#88ff00] text-[#88ff00] hover:text-black border border-[#88ff00]/50 shadow-[0_0_25px_rgba(136,255,0,0.25)] transition-all"
                title="Previous Alien (A / Left Arrow)"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>

              <button
                onClick={() => handleRotateAlien(1)}
                className="pointer-events-auto p-4 rounded-full bg-black/70 hover:bg-[#88ff00] text-[#88ff00] hover:text-black border border-[#88ff00]/50 shadow-[0_0_25px_rgba(136,255,0,0.25)] transition-all"
                title="Next Alien (D / Right Arrow)"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            </div>
          )}

          {/* Side Prompt when closed: neatly positioned on the side without covering the watch */}
          {!isWatchUnlocked && (
            <div className="fixed bottom-24 right-8 z-30 pointer-events-auto hidden sm:block">
              <button
                onClick={handleWatchClick}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-black/85 hover:bg-[#88ff00] text-[#88ff00] hover:text-black border-2 border-[#88ff00] font-display font-black text-xs tracking-wider uppercase transition-all shadow-[0_0_25px_rgba(136,255,0,0.4)] animate-bounce"
              >
                <span>TAP WATCH TO POP OPEN</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Prompt when opened: "CHOOSE YOUR ALIEN HERO" on the side (Right edge, never overlapping the bottom bar) */}
          {isWatchUnlocked && (
            <div className="fixed bottom-24 right-8 z-30 pointer-events-auto flex flex-col items-end gap-2 hidden sm:flex">
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/90 border border-[#88ff00]/60 text-[#88ff00] font-display font-black text-xs tracking-wider uppercase shadow-[0_0_25px_rgba(136,255,0,0.3)]">
                <span>CHOOSE YOUR ALIEN HERO ➔</span>
              </div>
              <button
                onClick={() => scrollToSection(2)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#88ff00] text-black font-mono font-bold text-[11px] tracking-wider uppercase hover:brightness-110 shadow-lg transition"
              >
                <span>SCROLL DOWN TO VIEW CHARACTER</span>
                <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
              </button>
            </div>
          )}

          {/* Bottom Dock for Watch Mechanical Actions */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2 px-3 py-2 rounded-full bg-black/80 backdrop-blur-xl border border-[#88ff00]/40 shadow-2xl">
              <button
                onClick={() => {
                  clearStageTimer();
                  soundEngine.playDialPress(false);
                  setWatchStage('closed');
                }}
                className={`px-4 py-2 rounded-full font-display text-xs tracking-wider uppercase transition ${
                  watchStage === 'closed'
                    ? 'bg-[#88ff00] text-black font-black'
                    : 'text-white/75 hover:text-white'
                }`}
              >
                1. CLOSED
              </button>

              <button
                onClick={triggerSideOpenAnimation}
                className={`px-4 py-2 rounded-full font-display text-xs tracking-wider uppercase transition ${
                  watchStage === 'diamond_select' || watchStage === 'opening_side'
                    ? 'bg-[#88ff00] text-black font-black'
                    : 'text-white/75 hover:text-white'
                }`}
              >
                2. POP OPEN (2D SCREEN)
              </button>

              <button
                onClick={triggerSideSlamAnimation}
                className={`px-4 py-2 rounded-full font-display text-xs tracking-wider uppercase transition ${
                  watchStage === 'hologram_active' || watchStage === 'slamming_side'
                    ? 'bg-[#88ff00] text-black font-black'
                    : 'text-white/75 hover:text-white'
                }`}
              >
                3. SIDE-CLICK & HOLOGRAM
              </button>

              {isWatchUnlocked ? (
                <button
                  onClick={() => scrollToSection(2)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#88ff00]/20 hover:bg-[#88ff00]/30 text-[#88ff00] border border-[#88ff00]/50 font-display text-xs tracking-wider uppercase transition"
                >
                  <span>CHARACTERS ➔</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="px-3 py-1.5 text-white/40 font-mono text-[11px] uppercase tracking-wider">
                  [LOCK: PRESS WATCH FIRST]
                </span>
              )}
            </div>
          </div>
        </>
      )}

      {/* =====================================================================
          SECTION 3 PERIPHERAL HUD (Only visible at the bottom Character Showcase!)
          Left Dossier + Right Character Grid, leaving the center 3D Character completely unobstructed!
      ===================================================================== */}
      {activeSection === 2 && watchStage !== 'memory' && (
        <div className="fixed inset-x-0 top-20 bottom-6 z-30 pointer-events-none flex flex-col md:flex-row items-center justify-between px-6">
          {/* Left Character Dossier & Stats Card */}
          <div
            className="pointer-events-auto w-full md:w-88 max-w-sm bg-black/80 backdrop-blur-xl rounded-2xl p-5 border shadow-2xl"
            style={{ borderColor: `${currentAlien.color}88` }}
          >
            <div className="flex items-center justify-between">
              <span
                className="font-mono text-xs tracking-[0.2em] font-bold uppercase"
                style={{ color: currentAlien.color }}
              >
                {currentAlien.code}
              </span>
              {currentAlien.hasRealModel && (
                <span className="px-2 py-0.5 rounded-full bg-[#88ff00]/20 border border-[#88ff00]/50 font-mono text-[10px] text-[#88ff00]">
                  3D GLB ASSET
                </span>
              )}
            </div>

            <h2 className="font-display text-3xl font-black tracking-wider mt-1 text-white">
              {currentAlien.name}
            </h2>
            <p className="font-mono text-xs text-white/60 mb-2">
              SPECIES: {currentAlien.species} // HOMEWORLD: {currentAlien.homeworld}
            </p>

            <p className="text-xs text-white/85 leading-relaxed mb-3">
              {currentAlien.description}
            </p>

            {/* Combat Stats */}
            <div className="space-y-1.5 font-mono text-xs mb-4">
              {Object.entries(currentAlien.stats).map(([statName, val]) => (
                <div key={statName}>
                  <div className="flex justify-between text-[10px] uppercase text-white/70 mb-0.5">
                    <span>{statName}</span>
                    <span style={{ color: currentAlien.color }}>{val}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${val}%`,
                        backgroundColor: currentAlien.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-2 rounded-xl bg-white/5 border border-white/10 font-mono text-[11px] text-emerald-300 mb-2">
              &gt; {abilityLog}
            </div>

            {/* MINI-GAMES & 3D SMASH ARENA (Hidden by default; instant restore via SHOW_GAMES_AND_ARENA) */}
            {SHOW_GAMES_AND_ARENA && (
              <>
                <AlienMiniGame
                  alien={currentAlien}
                  onTrigger3DAttack={handleTrigger3DAttack}
                  onUnlockMemory={() => setMemoryUnlocked(true)}
                  onRepairWatch={() => setIsDamaged(false)}
                />

                <button
                  onClick={() => {
                    soundEngine.playTransformation();
                    setActiveArenaAlien(currentAlien);
                  }}
                  className="mt-2.5 w-full py-3 rounded-xl font-display font-black text-xs tracking-[0.18em] uppercase text-black transition transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-xl"
                  style={{
                    backgroundColor: currentAlien.color,
                    boxShadow: `0 0 25px ${currentAlien.color}77`,
                  }}
                >
                  <Flame className="w-4 h-4 fill-current" />
                  <span>ENTER {currentAlien.name} 3D SMASH ARENA ➔</span>
                </button>
              </>
            )}

            {!SHOW_GAMES_AND_ARENA && (
              <button
                onClick={handleSelectCharacter}
                className="w-full py-3.5 rounded-xl font-display font-black text-xs tracking-[0.2em] uppercase text-black transition transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-xl"
                style={{
                  backgroundColor: currentAlien.color,
                  boxShadow: `0 0 30px ${currentAlien.color}88`,
                }}
              >
                <CheckCircle2 className="w-4 h-4 fill-current" />
                <span>SELECT {currentAlien.name} & VIEW BIRTHDAY TRIBUTE ➔</span>
              </button>
            )}
          </div>

          {/* Right Character Roster Grid with Generated 2D Thumbnails */}
          <div className="pointer-events-auto w-full md:w-84 max-w-sm bg-black/80 backdrop-blur-xl border border-white/15 rounded-2xl p-5 flex flex-col gap-3">
            <div className="font-display text-xs tracking-[0.2em] text-[#88ff00] font-bold uppercase">
              SELECT DNA CHARACTER ({ALIENS.length} UNLOCKED)
            </div>

            <div className="grid grid-cols-2 gap-2">
              {ALIENS.map((alien, idx) => {
                const isSelected = selectedAlienIndex === idx;
                return (
                  <button
                    key={alien.id}
                    onClick={() => {
                      soundEngine.playDialRotate(idx);
                      setSelectedAlienIndex(idx);
                      setExploredAliens((prev) => {
                        const next = new Set(prev);
                        next.add(idx);
                        return next;
                      });
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#88ff00]/20 border-[#88ff00] shadow-[0_0_20px_rgba(136,255,0,0.3)]'
                        : 'bg-black/60 border-white/10 hover:border-white/35'
                    }`}
                  >
                    <img
                      src={`/textures/face_${alien.id}.jpg`}
                      alt={alien.name}
                      className="w-9 h-9 rounded-full object-cover border border-[#88ff00]/50 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-display text-xs font-bold text-white truncate">
                        {alien.name}
                      </div>
                      <div className="font-mono text-[10px] text-white/55 truncate">
                        {alien.species}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SECTION 4: DEDICATED ALIEN BIRTHDAY PRAISE CARD (Smoothly driven by scrollProgress 1.05 -> 1.45!)
          The 3D Character glides to the left while this special birthday card slides in on the right!
      ===================================================================== */}
      {isCharacterSelected && tributeScrollProgress > 0.02 && watchStage !== 'memory' && (
        <div
          className="fixed inset-x-0 top-20 bottom-6 z-30 pointer-events-none flex items-center justify-end px-6 md:px-12 lg:px-20"
          style={{
            opacity: tributeScrollProgress,
            transform: `translateX(${(1 - tributeScrollProgress) * 90}px) translateY(${(1 - tributeScrollProgress) * 30}px)`,
          }}
        >
          <div
            className="pointer-events-auto w-full max-w-lg lg:max-w-xl max-h-full overflow-y-auto bg-black/90 backdrop-blur-2xl rounded-3xl p-6 md:p-7 border-2 shadow-2xl"
            style={{
              borderColor: currentAlien.color,
              boxShadow: `0 0 50px ${currentAlien.color}44`,
            }}
          >
            {/* Top Badge & Tag */}
            <div className="flex items-center justify-between gap-3 mb-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 fill-current" style={{ color: currentAlien.color }} />
                <span
                  className="font-mono text-xs font-bold tracking-[0.25em] uppercase"
                  style={{ color: currentAlien.color }}
                >
                  {currentAlien.birthdayPraise?.tag || 'BIRTHDAY TRIBUTE'}
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 font-mono text-[10px] text-white/80">
                DNA SYNERGY // {currentAlien.name}
              </span>
            </div>

            {/* Headline */}
            <h3 className="font-display text-2xl md:text-3xl font-black text-white leading-tight uppercase mb-2">
              {currentAlien.birthdayPraise?.headline || 'A REMARKABLE HERO'}
            </h3>

            {/* Trait Subheading */}
            <div
              className="inline-block px-3 py-1 rounded-lg font-mono text-xs font-bold tracking-wider uppercase mb-5"
              style={{
                backgroundColor: `${currentAlien.color}22`,
                color: currentAlien.color,
                border: `1px solid ${currentAlien.color}55`,
              }}
            >
              CORE TRAIT: {currentAlien.birthdayPraise?.trait}
            </div>

            {/* Heartfelt Birthday Message */}
            <p className="text-sm md:text-base text-white/90 leading-relaxed font-sans mb-6">
              {currentAlien.birthdayPraise?.message}
            </p>

            {/* Quote Box */}
            <div
              className="p-4 rounded-2xl bg-white/5 border-l-4 font-mono text-xs md:text-sm italic text-emerald-200/90 mb-6"
              style={{ borderLeftColor: currentAlien.color }}
            >
              {currentAlien.birthdayPraise?.quote}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => {
                  soundEngine.playDialRotate(selectedAlienIndex);
                  window.scrollTo({
                    top: window.innerHeight * 2,
                    behavior: 'smooth',
                  });
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs transition cursor-pointer"
              >
                <span>▲ BACK TO CHARACTER ROSTER</span>
              </button>

              {exploredAliens.size >= ALIENS.length ? (
                <button
                  onClick={handleOpenMemoryVault}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-[#88ff00] hover:brightness-110 text-black font-display font-black text-xs tracking-wider uppercase shadow-[0_0_25px_rgba(136,255,0,0.4)] transition animate-pulse cursor-pointer"
                >
                  <span className="text-base">🎁</span>
                  <span>OPEN MASTER BIRTHDAY VAULT</span>
                </button>
              ) : (
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white/60 font-mono text-xs">
                  <span className="text-sm">🔒</span>
                  <span>
                    EXPLORE ALL {ALIENS.length} CHARACTERS TO UNLOCK BIRTHDAY VAULT ({exploredAliens.size}/{ALIENS.length})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED FULL-SCREEN 3D ACTION ARENA PAGE (Hidden by default; controlled by SHOW_GAMES_AND_ARENA) */}
      {SHOW_GAMES_AND_ARENA && activeArenaAlien && (
        <AlienArenaPage
          alien={activeArenaAlien}
          onBack={() => {
            soundEngine.playDialPress(true);
            setActiveArenaAlien(null);
          }}
        />
      )}

      {/* PERSONALIZED BIRTHDAY MEMORY / GIFT VAULT MODAL */}
      {watchStage === 'memory' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-[#0a120e]/95 border-2 border-[#88ff00] rounded-2xl p-6 md:p-8 shadow-[0_0_80px_rgba(136,255,0,0.3)] my-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#88ff00]/30 pb-5">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#88ff00]/15 border border-[#88ff00]/40 text-[#88ff00] font-mono text-xs mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{PERSONAL_MEMORIES.recipientTitle}</span>
                </div>
                <h2 className="font-display text-2xl md:text-3xl font-black text-white leading-tight">
                  {PERSONAL_MEMORIES.quote}
                </h2>
              </div>

              <button
                onClick={() => {
                  setShowBenHologram(false);
                  setWatchStage('diamond_select');
                }}
                className="self-start md:self-center px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 font-mono text-xs text-white shrink-0"
              >
                RETURN TO EXPERIENCE [X]
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              <div className="lg:col-span-2 space-y-5">
                <div className="p-5 rounded-xl bg-gradient-to-br from-[#88ff00]/15 to-transparent border border-[#88ff00]/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-[#88ff00] uppercase tracking-widest">
                      ENCRYPTED BIRTHDAY TRANSMISSION // FOR:
                    </span>
                    <input
                      type="text"
                      value={customOwnerName}
                      onChange={(e) => setCustomOwnerName(e.target.value)}
                      className="bg-black/60 border border-[#88ff00]/40 rounded px-2.5 py-0.5 font-display text-xs text-[#88ff00] font-bold focus:outline-none"
                    />
                  </div>
                  <p className="text-sm md:text-base text-emerald-50/95 leading-relaxed">
                    {PERSONAL_MEMORIES.birthdayMessage}
                  </p>
                </div>

                <div>
                  <h3 className="font-display text-sm tracking-[0.2em] text-[#88ff00] uppercase mb-3">
                    CHRONOLOGY OF THE WIELDER
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    {PERSONAL_MEMORIES.timeline.map((item, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl bg-white/5 border border-white/10"
                      >
                        <div className="font-mono text-[10px] text-[#88ff00] mb-1">{item.year}</div>
                        <div className="font-display text-sm font-bold text-white mb-1">
                          {item.title}
                        </div>
                        <p className="text-xs text-white/70 leading-relaxed">{item.detail}</p>
                      </div>
                    ))}
                  </div>

                  {/* SPECIAL SECRET BIRTHDAY GIFT BOX (Horizontal on the Left) */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border-2 border-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.3)] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 text-left">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-400/20 border border-emerald-400/50 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(52,211,153,0.4)] animate-bounce shrink-0">
                        🎁
                      </div>
                      <div>
                        <h4 className="font-display font-black text-xs md:text-sm text-emerald-300 uppercase tracking-widest mb-0.5">
                          SECRET BIRTHDAY GIFT BOX
                        </h4>
                        <p className="font-mono text-[11px] text-white/70">
                          A special surprise waiting just for you. Open your gift to see what’s inside.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowVolvoGame(true)}
                      className="w-full sm:w-auto shrink-0 px-6 py-2.5 rounded-xl bg-emerald-400 hover:brightness-110 text-black font-display font-black text-xs tracking-widest uppercase transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(52,211,153,0.4)] cursor-pointer active:scale-95"
                    >
                      <span>OPEN GIFT BOX</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-start gap-4 bg-black/60 border border-white/15 rounded-xl p-5">
                <div>
                  <div className="font-mono text-xs text-[#88ff00] uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Gauge className="w-4 h-4" />
                    <span>OWNER ARCHIVE LOGS</span>
                  </div>
                  <ul className="space-y-2.5 text-xs text-white/80 font-mono">
                    {PERSONAL_MEMORIES.insideJokes.map((joke, idx) => (
                      <li
                        key={idx}
                        className="p-2.5 rounded-lg bg-white/5 border-l-2 border-[#88ff00]"
                      >
                        {joke}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* VOLVO S60 3D COMEBACK CRUISE MINI-GAME MODAL */}
      {showVolvoGame && (
        <VolvoMiniGame onClose={() => setShowVolvoGame(false)} />
      )}

      {/* Background Ben 10 Theme Song Audio Element */}
      <audio
        ref={audioRef}
        src={BEN10_TRACKS[currentTrackIndex].src}
        onEnded={handleNextTrack}
        loop={BEN10_TRACKS.length === 1}
        preload="auto"
      />
    </div>
  );
}
