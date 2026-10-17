/**
 * KTM BIKEVILLE - Main Application Controller
 * Handles Bike Data, Sound Synthesizer, Configurator, Cart, Modals & UI Interactions
 */

(function () {
  'use strict';

  // -------------------------------------------------------------
  // 1. BIKE SPECIFICATIONS DATABASE (Matching Reel Details)
  // -------------------------------------------------------------
  const BIKES_DATA = {
    '1290': {
      id: '1290',
      name: 'KTM 1290 Super Adv S',
      fullName: 'KTM 1290 Super Adventure S',
      category: 'Adventure',
      priceFormatted: '₹21,50,000',
      priceRaw: 2150000,
      hp: '160 HP',
      powerDesc: 'Peak Power',
      description: 'Experience the thrill of performance and precision with the KTM 1290 Super Adv S. Built for adrenaline. Born to dominate.',
      engine: '1301cc, V-Twin, LC8',
      suspension: 'WP Apex Semi-Active Suspension',
      brakes: 'Brembo Stylema Dual 320mm',
      frame: 'Chromoly Trellis Frame',
      transImg: 'assets/card_1290_trans.png',
      cardImg: 'assets/card_1290.jpg',
      bgImg: 'assets/ktm_1290_super_adventure.jpg'
    },
    '1390': {
      id: '1390',
      name: 'KTM 1390 Super Duke R',
      fullName: 'KTM 1390 Super Duke R (The Beast)',
      category: 'Naked',
      priceFormatted: '₹24,00,000',
      priceRaw: 2400000,
      hp: '190 HP',
      powerDesc: 'Hyper-Torque Output',
      description: 'The apex predator of naked hyper-streetfighters. Uncompromising ergonomics, razor precision, and pure unleashed Austrian fury.',
      engine: '1350cc, V-Twin, Cam-Shift LC8',
      suspension: 'WP Apex 48mm Open Cartridge',
      brakes: 'Brembo Stylema Monobloc Calipers',
      frame: 'Laser-Cut Steel Trellis Frame',
      transImg: 'assets/card_1390_trans.png',
      cardImg: 'assets/card_1390.jpg',
      bgImg: 'assets/ktm_1390_super_duke.jpg'
    },
    '350': {
      id: '350',
      name: 'KTM 350 EXC-F',
      fullName: 'KTM 350 EXC-F Enduro Champion',
      category: 'Enduro',
      priceFormatted: '₹12,50,000',
      priceRaw: 1250000,
      hp: '51 HP',
      powerDesc: 'Class-Leading Power-to-Weight',
      description: 'The ultimate 4-stroke enduro weapon. 250 agility with 450 punch, built for champions on demanding technical trails.',
      engine: '349.7cc, DOHC 1-Cylinder 4-Stroke',
      suspension: 'WP XPLOR Inverted 48mm Split Forks',
      brakes: 'Brembo Wave Discs & Floating Calipers',
      frame: 'Central Double-Cradle 25CrMo4',
      transImg: 'assets/card_350_trans.png',
      cardImg: 'assets/card_350.jpg',
      bgImg: 'assets/ktm_350_excf.jpg'
    },
    '390': {
      id: '390',
      name: 'KTM 390 Enduro R',
      fullName: 'KTM 390 Enduro R Dual-Sport',
      category: 'Enduro',
      priceFormatted: '₹4,50,000',
      priceRaw: 450000,
      hp: '44 HP',
      powerDesc: 'Single-Cylinder Torque',
      description: 'Dual-sport dominance for everyday exploration. Light, nimble, and eager to conquer asphalt highways or rugged mountain gravel.',
      engine: '398.7cc, Single-Cylinder LC4c',
      suspension: 'WP Apex USD 43mm Long Travel',
      brakes: 'ByBre 4-Piston Radial Caliper',
      frame: 'Split Trellis Lightweight Steel',
      transImg: 'assets/card_390_trans.png',
      cardImg: 'assets/card_390.jpg',
      bgImg: 'assets/ktm_390_enduro.jpg'
    }
  };

  // State
  let activeBikeId = '1290';
  let cartItems = [];
  let isSoundEnabled = false;
  let audioCtx = null;

  // Active Configurator Configuration
  let currentConfig = {
    bikeId: '390',
    wheel: 'Default Orange Spoke',
    wheelPrice: 0,
    livery: 'Factory KTM Orange',
    liveryPrice: 0,
    exhaust: 'OEM Stainless Race',
    exhaustPrice: 0,
    seat: 'Standard Ergonomic Seat',
    seatPrice: 0
  };

  // -------------------------------------------------------------
  // 2. WEB AUDIO API SYNTHESIZER (Throaty KTM V-Twin Rev Simulator)
  // -------------------------------------------------------------
  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playUiClickSound() {
    if (!isSoundEnabled) return;
    try {
      initAudio();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.06);
    } catch (e) {
      console.warn('Audio click error:', e);
    }
  }

  function playKtmEngineRev() {
    try {
      initAudio();
      const t0 = audioCtx.currentTime;

      // Master Gain
      const masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.35, t0);
      masterGain.connect(audioCtx.destination);

      // Low rumble sub-oscillator
      const osc1 = audioCtx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(55, t0); // Idle
      osc1.frequency.exponentialRampToValueAtTime(160, t0 + 0.4); // Throttle blip
      osc1.frequency.exponentialRampToValueAtTime(220, t0 + 0.7); // High RPM scream
      osc1.frequency.exponentialRampToValueAtTime(60, t0 + 1.4); // Decel back to idle

      // Cylinder pulse harmonic oscillator
      const osc2 = audioCtx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(110, t0);
      osc2.frequency.exponentialRampToValueAtTime(320, t0 + 0.4);
      osc2.frequency.exponentialRampToValueAtTime(440, t0 + 0.7);
      osc2.frequency.exponentialRampToValueAtTime(120, t0 + 1.4);

      // Distorted exhaust filter
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, t0);
      filter.frequency.exponentialRampToValueAtTime(1800, t0 + 0.5);
      filter.frequency.exponentialRampToValueAtTime(600, t0 + 1.4);

      // Gain Envelope
      const env = audioCtx.createGain();
      env.gain.setValueAtTime(0.1, t0);
      env.gain.linearRampToValueAtTime(0.4, t0 + 0.3);
      env.gain.linearRampToValueAtTime(0.5, t0 + 0.7);
      env.gain.exponentialRampToValueAtTime(0.01, t0 + 1.6);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(env);
      env.connect(masterGain);

      osc1.start(t0);
      osc2.start(t0);
      osc1.stop(t0 + 1.6);
      osc2.stop(t0 + 1.6);

      showToast('🔊 Engine Started: Throttle Rev Active!');
    } catch (e) {
      console.warn('Audio rev error:', e);
    }
  }

  // -------------------------------------------------------------
  // 3. UI INITIALIZATION & EVENT LISTENERS
  // -------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', function () {
    initPreloader();
    initNavbarScroll();
    initBikeSwitcher();
    initStageModeSwitcher();
    init3DCameraControls();
    initKtmHorizontalSlider();
    initSlideDotsObserver();
    initExplodedViewControls();
    initCategoryFilters();
    initSoundToggle();
    initConfiguratorModal();
    initCartDrawer();
    initTestRideModal();
    initHUDHotspots();
    initTachometerGauge();
    init3DCardTiltEffect();
  });

  // -------------------------------------------------------------
  // 3B. KTM RACING DIGITAL TACHOMETER CONTROLLER
  // -------------------------------------------------------------
  function initTachometerGauge() {
    const revBtn = document.getElementById('btn-throttle-rev');
    const rpmDigits = document.getElementById('rpm-digits');
    const meterFill = document.getElementById('tacho-meter-fill');
    const shiftLight = document.getElementById('tacho-shift-light');
    const gearBadge = document.getElementById('tacho-gear-text');
    if (!revBtn || !rpmDigits || !meterFill) return;

    let isHolding = false;
    let currentRpm = 1850;
    let targetRpm = 1850;
    let animId = null;

    function updateGauge() {
      // Smooth RPM interpolation
      currentRpm += (targetRpm - currentRpm) * 0.14;

      rpmDigits.textContent = Math.round(currentRpm).toLocaleString('en-US');
      const pct = Math.min(100, Math.max(12, (currentRpm / 11500) * 100));
      meterFill.style.width = pct + '%';

      // Dynamic gear display
      if (gearBadge) {
        if (currentRpm > 9800) gearBadge.textContent = 'GEAR 3';
        else if (currentRpm > 5500) gearBadge.textContent = 'GEAR 2';
        else gearBadge.textContent = 'GEAR 1';
      }

      if (currentRpm > 9200) {
        if (shiftLight) shiftLight.classList.add('redline');
        if (window.KTM3D && typeof window.KTM3D.triggerThrottleShake === 'function') {
          window.KTM3D.triggerThrottleShake(0.09);
        }
      } else {
        if (shiftLight) shiftLight.classList.remove('redline');
      }

      if (isHolding || Math.abs(currentRpm - targetRpm) > 20) {
        animId = requestAnimationFrame(updateGauge);
      }
    }

    const startRev = (e) => {
      if (e) e.preventDefault();
      if (isHolding) return;
      isHolding = true;
      targetRpm = 10900 + Math.random() * 500;
      revBtn.classList.add('revving');
      isSoundEnabled = true;
      playKtmEngineRev();
      cancelAnimationFrame(animId);
      animId = requestAnimationFrame(updateGauge);
    };

    const stopRev = () => {
      if (!isHolding) return;
      isHolding = false;
      targetRpm = 1850;
      revBtn.classList.remove('revving');
      cancelAnimationFrame(animId);
      animId = requestAnimationFrame(updateGauge);
    };

    revBtn.addEventListener('mousedown', startRev);
    window.addEventListener('mouseup', stopRev);
    revBtn.addEventListener('touchstart', startRev, { passive: false });
    window.addEventListener('touchend', stopRev);

    // Keyboard Spacebar Revving
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        startRev();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        stopRev();
      }
    });
  }

  // -------------------------------------------------------------
  // 3C. VANILLA 3D CARD PERSPECTIVE TILT EFFECT
  // -------------------------------------------------------------
  function init3DCardTiltEffect() {
    const cards = document.querySelectorAll('.feature-card, .bike-catalog-card, .step-card, .glass-badge, .stage-left-card');
    cards.forEach(card => {
      card.style.transformStyle = 'preserve-3d';
      card.style.willChange = 'transform';

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -9;
        const rotateY = ((x - centerX) / centerX) * 9;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        card.style.transition = 'transform 0.4s ease';
      });

      card.addEventListener('mouseenter', () => {
        card.style.transition = 'none';
      });
    });
  }

  // Preloader fadeout
  function initPreloader() {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;

    const dismiss = () => {
      preloader.classList.add('fade-out');
      setTimeout(() => {
        preloader.style.display = 'none';
      }, 800);
    };

    preloader.addEventListener('click', dismiss);

    window.addEventListener('load', () => {
      setTimeout(dismiss, 700);
    });

    // Fallback
    setTimeout(dismiss, 1200);

    // Support ?scroll=id query param
    const urlParams = new URLSearchParams(window.location.search);
    const scrollTarget = urlParams.get('scroll');
    if (scrollTarget) {
      preloader.style.display = 'none';
      setTimeout(() => {
        const el = document.getElementById(scrollTarget);
        if (el) {
          document.documentElement.style.scrollBehavior = 'auto';
          window.scrollTo(0, el.offsetTop);
        }
      }, 50);
    }
  }

  // Navbar scroll background
  function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  // Sound Toggle in Navbar
  function initSoundToggle() {
    const btn = document.getElementById('sound-toggle-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      isSoundEnabled = !isSoundEnabled;
      if (isSoundEnabled) {
        initAudio();
        btn.classList.add('playing');
        btn.querySelector('.sound-label').textContent = 'AUDIO ON';
        playKtmEngineRev();
      } else {
        btn.classList.remove('playing');
        btn.querySelector('.sound-label').textContent = 'SOUND FX';
      }
    });
  }

  // -------------------------------------------------------------
  // 4. BIKE SWITCHER (Frame 7-10)
  // -------------------------------------------------------------
  function initBikeSwitcher() {
    const tabs = document.querySelectorAll('.pill-tab[data-bike]');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const bikeId = tab.dataset.bike;
        switchBike(bikeId);
      });
    });

    // "Start Engine" button on 3D Stage
    const startEngineBtn = document.getElementById('btn-start-engine');
    if (startEngineBtn) {
      startEngineBtn.addEventListener('click', () => {
        isSoundEnabled = true;
        const soundBtn = document.getElementById('sound-toggle-btn');
        if (soundBtn) {
          soundBtn.classList.add('playing');
          soundBtn.querySelector('.sound-label').textContent = 'AUDIO ON';
        }
        playKtmEngineRev();
      });
    }

    // Configure Bike button on left stage panel
    const cfgBtn = document.getElementById('btn-configure-stage');
    if (cfgBtn) {
      cfgBtn.addEventListener('click', () => {
        openConfigurator(activeBikeId);
      });
    }
  }

  function switchBike(bikeId) {
    if (!BIKES_DATA[bikeId]) return;
    activeBikeId = bikeId;
    const data = BIKES_DATA[bikeId];

    playUiClickSound();

    // Update Left Stage Card
    const titleEl = document.getElementById('stage-bike-title');
    const descEl = document.getElementById('stage-bike-desc');
    const hpEl = document.getElementById('stage-bike-hp');
    const hpDescEl = document.getElementById('stage-bike-hp-desc');

    if (titleEl) titleEl.textContent = data.name;
    if (descEl) descEl.textContent = data.description;
    if (hpEl) hpEl.textContent = data.hp;
    if (hpDescEl) hpDescEl.textContent = data.powerDesc;

    // Update Bottom Specs Bar
    const specEngine = document.getElementById('spec-engine-val');
    const specSuspension = document.getElementById('spec-suspension-val');
    const specBrakes = document.getElementById('spec-brakes-val');
    const specFrame = document.getElementById('spec-frame-val');

    if (specEngine) specEngine.textContent = data.engine;
    if (specSuspension) specSuspension.textContent = data.suspension;
    if (specBrakes) specBrakes.textContent = data.brakes;
    if (specFrame) specFrame.textContent = data.frame;

    // Update 3D Model
    if (window.KTM3D && typeof window.KTM3D.setBikeModel === 'function') {
      window.KTM3D.setBikeModel(bikeId);
    }
  }

  // -------------------------------------------------------------
  // 5. 3D CAMERA & ORBIT CONTROLS
  // -------------------------------------------------------------
  function init3DCameraControls() {
    const camBtns = document.querySelectorAll('.cam-btn[data-cam]');
    camBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        camBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const angle = btn.dataset.cam;
        if (window.KTM3D && typeof window.KTM3D.setCameraAngle === 'function') {
          window.KTM3D.setCameraAngle(angle);
        }
      });
    });

    const spinBtn = document.getElementById('cam-btn-spin');
    if (spinBtn) {
      spinBtn.addEventListener('click', () => {
        if (window.KTM3D && typeof window.KTM3D.toggleAutoSpin === 'function') {
          const spinning = window.KTM3D.toggleAutoSpin();
          if (spinning) {
            spinBtn.classList.add('active');
          } else {
            spinBtn.classList.remove('active');
          }
        }
      });
    }
  }

  // -------------------------------------------------------------
  // 6. EXPLODED 3D VIEW CONTROLS (Frame 14-16)
  // -------------------------------------------------------------
  function initExplodedViewControls() {
    const slider = document.getElementById('explode-slider');
    const toggleBtn = document.getElementById('btn-toggle-explode');

    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (window.KTM3D && typeof window.KTM3D.setExplode === 'function') {
          window.KTM3D.setExplode(val);
        }
        updateExplodeLabels(val > 0.35);
      });
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (window.KTM3D && typeof window.KTM3D.toggleExplode === 'function') {
          const state = window.KTM3D.toggleExplode();
          if (slider) slider.value = state;
          toggleBtn.textContent = state > 0.5 ? 'ASSEMBLE BIKE' : 'EXPLODE 3D VIEW';
          updateExplodeLabels(state > 0.5);
          playUiClickSound();
        }
      });
    }
  }

  function initStageModeSwitcher() {
    const modeBtns = document.querySelectorAll('.mode-btn[data-mode]');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        if (window.KTM3D && typeof window.KTM3D.setMode === 'function') {
          window.KTM3D.setMode(mode);
        }
        playUiClickSound();
        showToast(`3D View Mode: ${mode === 'studio' ? '🌟 Studio 3D' : '⚙️ CAD Disassembly'}`);
      });
    });
  }

  function updateExplodeLabels(isExploded) {
    const hudLabels = document.querySelectorAll('.hud-callout');
    hudLabels.forEach(label => {
      label.style.opacity = isExploded ? '1' : '0.6';
    });
  }

  const COMPONENT_DETAILS = {
    frame: {
      title: 'CHROMOLY TUBULAR TRELLIS FRAME',
      desc: 'Laser-cut, robot-welded 25CrMo4 alloy space-frame designed for razor-sharp flex balance and track stability.',
      metal: '25CrMo4 Chrome-Moly Alloy',
      weight: '9.8 kg Ultra-Light',
      rating: 'MotoGP World Champion Spec',
      damping: 'Torsional Stiffness 3,200 Nm/°',
      cameraAngle: 'profile'
    },
    engine: {
      title: 'LC8 1301cc 75° V-TWIN RACING ENGINE',
      desc: 'Twin-spark ignition with titanium valves and forged box-pistons delivering instantaneous throttle response.',
      metal: 'High-Pressure Die-Cast Aluminum',
      weight: '62 kg Engine Assembly',
      rating: '190 HP @ 9,500 RPM',
      damping: 'Cam-Shift Variable Timing',
      cameraAngle: 'profile'
    },
    forks: {
      title: 'WP APEX PRO 48MM INVERTED FORKS',
      desc: 'Fully adjustable semi-active suspension system with electronically managed damping cartridges.',
      metal: 'Hard-Anodized Aircraft Aluminum',
      weight: '5.2 kg (-18% vs standard)',
      rating: 'Factory Racing WP Kit',
      damping: 'Dynamic Cornering Damping',
      cameraAngle: 'front'
    },
    tank: {
      title: '16L LIGHTWEIGHT ERGONOMIC FUEL TANK',
      desc: 'Low center of gravity profile with integrated aerodynamic downforce spoilers and knee-grip contours.',
      metal: 'Multi-Layer Polymer Composite',
      weight: '3.4 kg Dry Mass',
      rating: 'Impact Resistant FIM Spec',
      damping: 'Integrated Baffle Foam',
      cameraAngle: 'cockpit'
    },
    exhaust: {
      title: 'AKRAPOVIČ FULL TITANIUM RACE SYSTEM',
      desc: 'Hydroformed link pipe with carbon fiber silencer end-cap providing +6 HP and authentic throaty roar.',
      metal: 'Grade-1 Titanium & Carbon 3K',
      weight: '3.8 kg (-4.2 kg reduction)',
      rating: 'Track Use Only (+6 HP Gain)',
      damping: 'Resonance Tuned Chamber',
      cameraAngle: 'rear'
    },
    wheels: {
      title: 'FORGED ALLOY WHEELS & BREMBO STYLEMA',
      desc: 'Lightweight multi-spoke rims equipped with dual 320mm floating discs and Brembo 4-piston radial calipers.',
      metal: 'Forged 6061-T6 Billet Aluminum',
      weight: '8.4 kg Set with Discs',
      rating: 'Cornering ABS Supermoto Mode',
      damping: 'Floating Wave Rotor Design',
      cameraAngle: 'front'
    }
  };

  let activeInspectedPart = 'forks';

  function initHUDHotspots() {
    const modal = document.getElementById('component-modal');
    const closeBtn = document.getElementById('btn-component-close');
    const inspect3dBtn = document.getElementById('btn-inspect-in-3d');

    const pinMap = {
      'pin-frame': 'frame',
      'pin-engine': 'engine',
      'pin-forks': 'forks',
      'pin-tank': 'tank',
      'pin-exhaust': 'exhaust',
      'pin-wheels': 'wheels'
    };

    for (const pinClass in pinMap) {
      const pinEl = document.querySelector(`.${pinClass}`);
      if (pinEl) {
        pinEl.addEventListener('click', () => {
          const partKey = pinMap[pinClass];
          openComponentModal(partKey);
        });
      }
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.remove('open'));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    }

    if (inspect3dBtn && modal) {
      inspect3dBtn.addEventListener('click', () => {
        modal.classList.remove('open');
        const stageEl = document.getElementById('stage-3d');
        if (stageEl) stageEl.scrollIntoView({ behavior: 'smooth' });

        if (window.KTM3D) {
          window.KTM3D.setMode('cad');
          window.KTM3D.setExplode(0.85);
          const detail = COMPONENT_DETAILS[activeInspectedPart];
          if (detail && detail.cameraAngle) {
            setTimeout(() => window.KTM3D.setCameraAngle(detail.cameraAngle), 400);
          }
        }

        // Update mode button UI
        const modeBtns = document.querySelectorAll('.mode-btn[data-mode]');
        modeBtns.forEach(b => {
          if (b.dataset.mode === 'cad') b.classList.add('active');
          else b.classList.remove('active');
        });

        const slider = document.getElementById('explode-slider');
        if (slider) slider.value = 0.85;
      });
    }
  }

  function openComponentModal(partKey) {
    const detail = COMPONENT_DETAILS[partKey];
    if (!detail) return;
    activeInspectedPart = partKey;

    const modal = document.getElementById('component-modal');
    const titleEl = document.getElementById('comp-title');
    const descEl = document.getElementById('comp-desc');
    const metalEl = document.getElementById('comp-metal');
    const weightEl = document.getElementById('comp-weight');
    const ratingEl = document.getElementById('comp-rating');
    const dampingEl = document.getElementById('comp-damping');

    if (titleEl) titleEl.textContent = detail.title;
    if (descEl) descEl.textContent = detail.desc;
    if (metalEl) metalEl.textContent = detail.metal;
    if (weightEl) weightEl.textContent = detail.weight;
    if (ratingEl) ratingEl.textContent = detail.rating;
    if (dampingEl) dampingEl.textContent = detail.damping;

    playUiClickSound();
    if (modal) modal.classList.add('open');
  }

  // -------------------------------------------------------------
  // 7. CONFIGURATOR MODAL (Exact Replica of Reel Frame 13)
  // -------------------------------------------------------------
  function initConfiguratorModal() {
    const backdrop = document.getElementById('configurator-modal');
    const backBtn = document.getElementById('config-back-btn');
    const addCartBtn = document.getElementById('btn-config-add-cart');

    if (backBtn) {
      backBtn.addEventListener('click', closeConfigurator);
    }

    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeConfigurator();
      });
    }

    // Config category tabs (Wheels, Body, Exhaust, Seat)
    const catBtns = document.querySelectorAll('.config-cat-btn');
    catBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        catBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.cat;
        showConfigCategory(cat);
      });
    });

    // Swatches (Wheels & Colors)
    const swatches = document.querySelectorAll('.swatch-item');
    swatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        swatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        const colorHex = parseInt(swatch.dataset.hex, 16);
        const name = swatch.dataset.name;
        const price = parseInt(swatch.dataset.price || 0);

        currentConfig.wheel = name;
        currentConfig.wheelPrice = price;

        if (window.KTM3D && typeof window.KTM3D.setRimColor === 'function') {
          window.KTM3D.setRimColor(colorHex);
        }

        updateConfigPrice();
        playUiClickSound();
      });
    });

    // Accessories selection
    const accItems = document.querySelectorAll('.acc-option-item');
    accItems.forEach(item => {
      item.addEventListener('click', () => {
        const cat = item.dataset.cat;
        document.querySelectorAll(`.acc-option-item[data-cat="${cat}"]`).forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');

        const name = item.dataset.name;
        const price = parseInt(item.dataset.price || 0);

        if (cat === 'exhaust') {
          currentConfig.exhaust = name;
          currentConfig.exhaustPrice = price;
        } else if (cat === 'seat') {
          currentConfig.seat = name;
          currentConfig.seatPrice = price;
        } else if (cat === 'livery') {
          currentConfig.livery = name;
          currentConfig.liveryPrice = price;
          if (window.KTM3D && typeof window.KTM3D.setBodyColor === 'function' && item.dataset.hex) {
            window.KTM3D.setBodyColor(parseInt(item.dataset.hex, 16));
          }
        }

        updateConfigPrice();
        playUiClickSound();
      });
    });

    // Add to Cart from Configurator
    if (addCartBtn) {
      addCartBtn.addEventListener('click', () => {
        const bike = BIKES_DATA[currentConfig.bikeId];
        const totalPrice = bike.priceRaw + currentConfig.wheelPrice + currentConfig.exhaustPrice + currentConfig.seatPrice + currentConfig.liveryPrice;

        cartItems.push({
          id: Date.now(),
          name: bike.fullName,
          priceFormatted: formatCurrency(totalPrice),
          priceRaw: totalPrice,
          configSummary: `${currentConfig.wheel} | ${currentConfig.exhaust} | ${currentConfig.livery}`,
          img: bike.transImg
        });

        updateCartUI();
        closeConfigurator();
        showToast(`✔ Added to Cart: ${bike.fullName}!`);
      });
    }

    // Attach openConfigurator to all relevant trigger buttons
    document.querySelectorAll('.trigger-configurator').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const bikeId = e.currentTarget.dataset.bike || activeBikeId;
        openConfigurator(bikeId);
      });
    });
  }

  function showConfigCategory(catName) {
    document.querySelectorAll('.config-option-section').forEach(sec => {
      sec.style.display = 'none';
    });
    const target = document.getElementById(`config-section-${catName}`);
    if (target) {
      target.style.display = 'block';
    }
  }

  function openConfigurator(bikeId) {
    const modal = document.getElementById('configurator-modal');
    if (!modal) return;

    currentConfig.bikeId = bikeId || '390';
    const bike = BIKES_DATA[currentConfig.bikeId];

    document.getElementById('config-modal-title').textContent = bike.fullName;
    document.getElementById('config-preview-bike-img').src = bike.transImg;

    updateConfigPrice();
    modal.classList.add('open');
  }

  function closeConfigurator() {
    const modal = document.getElementById('configurator-modal');
    if (modal) modal.classList.remove('open');
  }

  function updateConfigPrice() {
    const bike = BIKES_DATA[currentConfig.bikeId];
    if (!bike) return;

    const total = bike.priceRaw + currentConfig.wheelPrice + currentConfig.exhaustPrice + currentConfig.seatPrice + currentConfig.liveryPrice;
    const priceDisplay = document.getElementById('config-calc-price');
    if (priceDisplay) {
      priceDisplay.textContent = formatCurrency(total);
    }
  }

  // -------------------------------------------------------------
  // 8. SHOPPING CART DRAWER
  // -------------------------------------------------------------
  function initCartDrawer() {
    const cartBtn = document.getElementById('cart-open-btn');
    const drawerBackdrop = document.getElementById('cart-drawer-backdrop');
    const closeBtn = document.getElementById('cart-close-btn');
    const checkoutBtn = document.getElementById('btn-cart-checkout');

    if (cartBtn) {
      cartBtn.addEventListener('click', () => {
        drawerBackdrop.classList.add('open');
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        drawerBackdrop.classList.remove('open');
      });
    }

    if (drawerBackdrop) {
      drawerBackdrop.addEventListener('click', (e) => {
        if (e.target === drawerBackdrop) drawerBackdrop.classList.remove('open');
      });
    }

    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        if (cartItems.length === 0) {
          showToast('Your cart is empty. Add a bike to proceed!');
          return;
        }
        drawerBackdrop.classList.remove('open');
        openTestRideModal('Booking Order Checkout');
      });
    }

    // Direct Quick-Add Buttons in Catalog
    document.querySelectorAll('.btn-card-add').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const bikeId = e.currentTarget.dataset.bike;
        const bike = BIKES_DATA[bikeId];
        if (!bike) return;

        cartItems.push({
          id: Date.now(),
          name: bike.fullName,
          priceFormatted: bike.priceFormatted,
          priceRaw: bike.priceRaw,
          configSummary: 'Standard Factory Configuration',
          img: bike.transImg
        });

        updateCartUI();
        showToast(`✔ Added to Cart: ${bike.fullName}`);
      });
    });
  }

  function updateCartUI() {
    const badge = document.getElementById('cart-badge-count');
    const list = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total-amount');

    if (badge) badge.textContent = cartItems.length;

    if (!list) return;

    if (cartItems.length === 0) {
      list.innerHTML = `<div style="text-align: center; color: #888; padding: 3rem 0;">Your showroom garage is empty.<br>Select a motorcycle to begin.</div>`;
      if (totalEl) totalEl.textContent = '₹0';
      return;
    }

    let grandTotal = 0;
    list.innerHTML = '';

    cartItems.forEach(item => {
      grandTotal += item.priceRaw;
      const el = document.createElement('div');
      el.className = 'cart-item';
      el.innerHTML = `
        <img class="cart-item-img" src="${item.img}" alt="${item.name}">
        <div class="cart-item-info">
          <h5>${item.name}</h5>
          <p>${item.priceFormatted}</p>
          <small style="color: #646E7E; font-size: 0.72rem;">${item.configSummary}</small>
        </div>
        <button class="cart-remove-btn" title="Remove" data-id="${item.id}">&times;</button>
      `;

      el.querySelector('.cart-remove-btn').addEventListener('click', () => {
        cartItems = cartItems.filter(i => i.id !== item.id);
        updateCartUI();
      });

      list.appendChild(el);
    });

    if (totalEl) totalEl.textContent = formatCurrency(grandTotal);
  }

  // -------------------------------------------------------------
  // 9. TEST RIDE & SHOWROOM BOOKING MODAL
  // -------------------------------------------------------------
  function initTestRideModal() {
    const modal = document.getElementById('test-ride-modal');
    const closeBtn = document.getElementById('test-ride-close-btn');
    const form = document.getElementById('test-ride-form');

    document.querySelectorAll('.trigger-test-ride').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const bikeId = e.currentTarget.dataset.bike;
        openTestRideModal(bikeId);
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('open');
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const bikeSelect = document.getElementById('test-ride-bike-select');
        const bikeName = bikeSelect ? bikeSelect.options[bikeSelect.selectedIndex].text : 'KTM Motorcycle';
        modal.classList.remove('open');
        showToast(`🏁 Test Ride Reserved for ${bikeName}! An advisor will contact you within 15 minutes.`);
        form.reset();
      });
    }
  }

  function openTestRideModal(defaultBikeId) {
    const modal = document.getElementById('test-ride-modal');
    if (!modal) return;
    const select = document.getElementById('test-ride-bike-select');
    if (select && defaultBikeId && BIKES_DATA[defaultBikeId]) {
      select.value = defaultBikeId;
    }
    modal.classList.add('open');
  }

  // -------------------------------------------------------------
  // 10. CATEGORY FILTER (Frame 18 Browse by Type)
  // -------------------------------------------------------------
  function initCategoryFilters() {
    const filterTabs = document.querySelectorAll('.type-tab-item');
    const cards = document.querySelectorAll('.bike-catalog-card');

    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const cat = tab.dataset.filter;

        cards.forEach(card => {
          if (cat === 'all' || card.dataset.category.toLowerCase().includes(cat.toLowerCase())) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });

        playUiClickSound();
      });
    });
  }

  // -------------------------------------------------------------
  // 11. TOAST NOTIFICATIONS HELPER
  // -------------------------------------------------------------
  function showToast(msg) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;

    toast.querySelector('.toast-text').textContent = msg;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3800);
  }

  function formatCurrency(amount) {
    return '₹' + amount.toLocaleString('en-IN');
  }

  // -------------------------------------------------------------
  // 12. KTM BIKES HORIZONTAL SLIDER (Reel Frame 10-12)
  // -------------------------------------------------------------
  function initKtmHorizontalSlider() {
    const track = document.getElementById('slider-track');
    const viewport = document.getElementById('slider-viewport');
    const prevBtn = document.getElementById('slider-btn-prev');
    const nextBtn = document.getElementById('slider-btn-next');
    const items = document.querySelectorAll('.slider-bike-item');
    if (!track || !items.length) return;

    const bikeKeys = ['1290', '1390', '350', '390'];
    const bikeSpecs = {
      '1290': { hp: '160 HP', torque: '138 Nm', weight: '220 kg' },
      '1390': { hp: '190 HP', torque: '145 Nm', weight: '200 kg' },
      '350': { hp: '51 HP', torque: '42 Nm', weight: '104 kg' },
      '390': { hp: '44 HP', torque: '39 Nm', weight: '159 kg' }
    };

    let currentIndex = 3; // 390 is default as shown in Frame 11

    function updateSlider(index) {
      if (index < 0) index = bikeKeys.length - 1;
      if (index >= bikeKeys.length) index = 0;
      currentIndex = index;

      const activeBikeKey = bikeKeys[currentIndex];
      const bikeData = BIKES_DATA[activeBikeKey];
      const specs = bikeSpecs[activeBikeKey];

      // Update active class on items
      items.forEach((item, i) => {
        if (i === currentIndex) item.classList.add('active');
        else item.classList.remove('active');
      });

      // Slide track so active item is centered / visible
      const itemWidth = 320;
      const gap = 40;
      const offset = Math.max(0, (currentIndex * (itemWidth + gap)) - 80);
      track.style.transform = `translateX(-${offset}px)`;

      // Update Right Card
      const titleEl = document.getElementById('slider-card-title');
      const hpEl = document.getElementById('slider-card-hp');
      const torqueEl = document.getElementById('slider-card-torque');
      const weightEl = document.getElementById('slider-card-weight');
      const imgEl = document.getElementById('slider-card-preview-img');
      const priceEl = document.getElementById('slider-card-price');
      const actionBtn = document.getElementById('slider-card-btn');

      if (titleEl && bikeData) titleEl.textContent = bikeData.name.replace('KTM ', '');
      if (hpEl && specs) hpEl.textContent = specs.hp;
      if (torqueEl && specs) torqueEl.textContent = specs.torque;
      if (weightEl && specs) weightEl.textContent = specs.weight;
      if (imgEl && bikeData) imgEl.src = bikeData.transImg;
      if (priceEl && bikeData) priceEl.textContent = bikeData.priceFormatted;
      if (actionBtn) actionBtn.dataset.bike = activeBikeKey;
    }

    items.forEach((item, idx) => {
      item.addEventListener('click', () => {
        playUiClickSound();
        updateSlider(idx);
      });
    });

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        playUiClickSound();
        updateSlider(currentIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        playUiClickSound();
        updateSlider(currentIndex + 1);
      });
    }

    // Touch / Drag swipe
    let startX = 0;
    let isDragging = false;

    if (viewport) {
      viewport.addEventListener('mousedown', (e) => {
        startX = e.clientX;
        isDragging = true;
      });

      window.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        const diff = e.clientX - startX;
        if (diff > 50) updateSlider(currentIndex - 1);
        else if (diff < -50) updateSlider(currentIndex + 1);
      });

      viewport.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
      }, { passive: true });

      viewport.addEventListener('touchend', (e) => {
        const diff = e.changedTouches[0].clientX - startX;
        if (diff > 40) updateSlider(currentIndex - 1);
        else if (diff < -40) updateSlider(currentIndex + 1);
      }, { passive: true });
    }

    updateSlider(currentIndex);
  }

  // -------------------------------------------------------------
  // 13. VERTICAL FLOATING SLIDE NAVIGATOR OBSERVER
  // -------------------------------------------------------------
  function initSlideDotsObserver() {
    const dots = document.querySelectorAll('.slide-dot');
    const sections = document.querySelectorAll('section, footer');
    if (!dots.length || !sections.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
          const id = entry.target.id;
          dots.forEach(dot => {
            const href = dot.getAttribute('href');
            if (href === `#${id}`) dot.classList.add('active');
            else dot.classList.remove('active');
          });

          // Also sync navbar links
          document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${id}`) link.classList.add('active');
            else link.classList.remove('active');
          });
        }
      });
    }, {
      threshold: [0.35, 0.6]
    });

    sections.forEach(sec => observer.observe(sec));
  }

})();
