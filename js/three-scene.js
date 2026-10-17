/**
 * KTM Bikeville - Premium 3D Showroom & Interactive Engine
 * Dynamic Three.js Stage, Real-Time PBR Materials, Camera Lerping & CAD Exploded Anatomy
 */

(function () {
  'use strict';

  let scene, camera, renderer, controls;
  let studioGroup, cadBikeGroup, stageGroup, particleSystem;
  let exhaustFlameMesh = null;
  let bikeParts = {};
  let currentBikeType = '1290';
  const urlParams = new URLSearchParams(window.location.search);
  let activeMode = urlParams.get('view') === 'cad' ? 'cad' : 'studio'; // 'studio' | 'cad'
  let explodeProgress = 0;
  let targetExplode = urlParams.get('view') === 'cad' ? 0.85 : 0;
  let isAutoRotating = true;
  let container;
  let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let throttleShake = 0;
  let studioTextures = {};
  let studioMesh = null;
  let groundReflectionMesh = null;

  // High-End Physically Based Materials
  const materials = {
    ktmOrange: new THREE.MeshPhysicalMaterial({
      color: 0xff6600,
      metalness: 0.15,
      roughness: 0.14,
      clearcoat: 0.95,
      clearcoatRoughness: 0.12,
      reflectivity: 0.95
    }),
    stealthBlack: new THREE.MeshStandardMaterial({
      color: 0x121418,
      metalness: 0.45,
      roughness: 0.25
    }),
    ghostWhite: new THREE.MeshPhysicalMaterial({
      color: 0xf4f7fa,
      metalness: 0.1,
      roughness: 0.18,
      clearcoat: 0.8
    }),
    engineMetal: new THREE.MeshStandardMaterial({
      color: 0x383c44,
      metalness: 0.9,
      roughness: 0.22
    }),
    chrome: new THREE.MeshStandardMaterial({
      color: 0xf0f3f8,
      metalness: 0.98,
      roughness: 0.08
    }),
    goldFork: new THREE.MeshStandardMaterial({
      color: 0xe0a526,
      metalness: 0.92,
      roughness: 0.15
    }),
    rubberTire: new THREE.MeshStandardMaterial({
      color: 0x151619,
      metalness: 0.05,
      roughness: 0.9
    }),
    brakeRotor: new THREE.MeshStandardMaterial({
      color: 0xd8dce4,
      metalness: 0.95,
      roughness: 0.15
    }),
    exhaustTitanium: new THREE.MeshStandardMaterial({
      color: 0x828b99,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0x000000,
      emissiveIntensity: 0
    }),
    glowOrange: new THREE.MeshBasicMaterial({
      color: 0xff6600
    }),
    glowHeadlight: new THREE.MeshBasicMaterial({
      color: 0xe6f4ff
    }),
    glowTaillight: new THREE.MeshBasicMaterial({
      color: 0xff1515
    }),
    carbonFiber: new THREE.MeshStandardMaterial({
      color: 0x181a20,
      metalness: 0.5,
      roughness: 0.3
    }),
    clearWindshield: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      roughness: 0.05,
      transmission: 0.94,
      ior: 1.52
    })
  };

  // 3D Exploded Displacement Vectors
  const explodedOffsets = {
    tank: new THREE.Vector3(0, 1.45, 0.4),
    engine: new THREE.Vector3(0, -0.75, 0.15),
    frontAssembly: new THREE.Vector3(0, 0.6, 2.1),
    rearAssembly: new THREE.Vector3(0, 0.5, -2.2),
    tailSeat: new THREE.Vector3(0, 1.6, -1.0),
    exhaust: new THREE.Vector3(1.2, -0.7, -0.9),
    frame: new THREE.Vector3(0, 0, 0)
  };

  function initThree() {
    container = document.getElementById('three-canvas-container');
    if (!container) return;

    // 1. Scene Setup
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0c0e12, 0.035);

    // 2. Camera Setup
    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
    camera.position.set(4.3, 1.9, 4.2);

    // 3. WebGL Renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      container.appendChild(renderer.domElement);
    } catch (err) {
      console.warn('WebGL initialization error:', err);
      initFallbackStage();
      return;
    }

    // 4. Orbit Controls
    if (window.THREE && window.THREE.OrbitControls) {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.maxPolarAngle = Math.PI / 2 + 0.05;
      controls.minDistance = 2.4;
      controls.maxDistance = 8.5;
      controls.target.set(0, 0.85, 0);

      controls.addEventListener('start', () => {
        isAutoRotating = false;
        updateAutoSpinUI();
      });
    }

    // 5. Lighting Setup
    setupLighting();

    // 6. Turntable Stage Platform
    buildStagePlatform();

    // 7. Atmospheric Embers / Particle Sparks
    buildAtmosphericParticles();

    // 8. Build Studio 3D Display (Photorealistic Model Presentation matching Reel)
    buildStudioShowcase();

    // 9. Build CAD Disassembly Motorcycle
    buildCadMotorcycleModel();

    // 10. Mouse Interaction
    setupMouseInteraction();

    // 11. Initial State
    if (window.KTM3D) {
      window.KTM3D.setMode(activeMode);
      window.KTM3D.setBikeModel(currentBikeType);
    }

    // 12. Animation Loop
    animate();
  }

  function setupLighting() {
    // Ambient Soft Fill
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    // Main Overhead Directional Key Light
    const mainKey = new THREE.DirectionalLight(0xfff5ea, 2.2);
    mainKey.position.set(3.5, 6.5, 3.5);
    mainKey.castShadow = true;
    mainKey.shadow.mapSize.width = 2048;
    mainKey.shadow.mapSize.height = 2048;
    mainKey.shadow.bias = -0.0005;
    scene.add(mainKey);

    // Signature KTM Orange Floor Spotlight
    const orangeSpot = new THREE.SpotLight(0xff6600, 5.5, 12, Math.PI / 3.2, 0.6);
    orangeSpot.position.set(0, 4.5, 0);
    orangeSpot.target.position.set(0, 0, 0);
    scene.add(orangeSpot);
    scene.add(orangeSpot.target);

    // KTM Orange Warm Floor Uplight
    const floorGlow = new THREE.PointLight(0xff6600, 3.8, 7);
    floorGlow.position.set(0, 0.25, 0);
    scene.add(floorGlow);

    // Cool Ice-Blue Rim Backlight
    const rimBack = new THREE.DirectionalLight(0x70aaff, 1.6);
    rimBack.position.set(-4.5, 3.2, -4.5);
    scene.add(rimBack);
  }

  function buildStagePlatform() {
    stageGroup = new THREE.Group();

    // Base Circular Podium
    const podiumGeo = new THREE.CylinderGeometry(2.9, 3.05, 0.16, 64);
    const podiumMat = new THREE.MeshStandardMaterial({
      color: 0x11141c,
      metalness: 0.7,
      roughness: 0.3
    });
    const podium = new THREE.Mesh(podiumGeo, podiumMat);
    podium.position.y = -0.08;
    podium.receiveShadow = true;
    stageGroup.add(podium);

    // Glowing Neon Orange Outer Ring
    const outerRingGeo = new THREE.TorusGeometry(2.92, 0.024, 16, 96);
    const outerRingMesh = new THREE.Mesh(outerRingGeo, materials.glowOrange);
    outerRingMesh.rotation.x = Math.PI / 2;
    outerRingMesh.position.y = -0.01;
    stageGroup.add(outerRingMesh);

    // Inner Glowing Accent Ring with Ticks
    const innerRingGeo = new THREE.TorusGeometry(2.15, 0.012, 16, 96);
    const innerRingMesh = new THREE.Mesh(innerRingGeo, new THREE.MeshBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0.65 }));
    innerRingMesh.rotation.x = Math.PI / 2;
    innerRingMesh.position.y = -0.01;
    stageGroup.add(innerRingMesh);

    // Dark Reflective Floor
    const groundGeo = new THREE.PlaneGeometry(40, 40);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x090b0e,
      roughness: 0.2,
      metalness: 0.55
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.16;
    ground.receiveShadow = true;
    stageGroup.add(ground);

    scene.add(stageGroup);
  }

  // Floating Ember Sparks
  function buildAtmosphericParticles() {
    const particleCount = 160;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8.5;
      positions[i * 3 + 1] = Math.random() * 4.8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8.5;
      speeds[i] = Math.random() * 0.008 + 0.003;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));

    const pMaterial = new THREE.PointsMaterial({
      color: 0xff7722,
      size: 0.042,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });

    particleSystem = new THREE.Points(geometry, pMaterial);
    scene.add(particleSystem);
  }

  // -------------------------------------------------------------
  // STUDIO 3D SHOWCASE (Photorealistic Model Presentation matching Reel)
  // -------------------------------------------------------------
  function buildStudioShowcase() {
    studioGroup = new THREE.Group();
    studioGroup.position.set(0, 0.85, 0);

    const textureLoader = new THREE.TextureLoader();
    const bikeImages = {
      '1290': 'assets/ktm_1290_super_adventure.jpg',
      '1390': 'assets/ktm_1390_super_duke.jpg',
      '350': 'assets/ktm_350_excf.jpg',
      '390': 'assets/ktm_390_enduro.jpg'
    };

    for (const key in bikeImages) {
      studioTextures[key] = textureLoader.load(bikeImages[key], () => {
        if (renderer) renderer.render(scene, camera);
      });
    }

    // Double-sided 3D Display Billboard with Depth Bevel
    const planeGeo = new THREE.PlaneGeometry(3.6, 2.05, 32, 32);
    const planeMat = new THREE.MeshBasicMaterial({
      map: studioTextures['1290'],
      transparent: true,
      opacity: 0.98,
      side: THREE.DoubleSide
    });

    studioMesh = new THREE.Mesh(planeGeo, planeMat);
    studioMesh.position.set(0, 0.22, 0);
    studioGroup.add(studioMesh);

    scene.add(studioGroup);
  }

  // -------------------------------------------------------------
  // CAD DISASSEMBLY 3D MOTORCYCLE MODEL
  // -------------------------------------------------------------
  function buildCadMotorcycleModel() {
    cadBikeGroup = new THREE.Group();
    cadBikeGroup.position.set(0, 0, 0);

    // 1. CHASSIS / TRELLIS FRAME
    const framePart = new THREE.Group();
    const tubeGeo = new THREE.CylinderGeometry(0.038, 0.038, 1.25, 16);

    const tube1 = new THREE.Mesh(tubeGeo, materials.ktmOrange);
    tube1.rotation.z = Math.PI / 3.3;
    tube1.position.set(0, 0.92, 0.15);
    tube1.castShadow = true;
    framePart.add(tube1);

    const tube2 = new THREE.Mesh(tubeGeo, materials.ktmOrange);
    tube2.rotation.z = -Math.PI / 3.5;
    tube2.position.set(0, 0.92, -0.25);
    tube2.castShadow = true;
    framePart.add(tube2);

    const tube3 = tube1.clone();
    tube3.position.x = 0.22;
    framePart.add(tube3);

    const tube4 = tube2.clone();
    tube4.position.x = 0.22;
    framePart.add(tube4);

    const headStock = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.38, 16), materials.stealthBlack);
    headStock.rotation.x = 0.38;
    headStock.position.set(0.11, 1.22, 0.92);
    framePart.add(headStock);

    bikeParts.frame = { mesh: framePart, basePos: framePart.position.clone(), offset: explodedOffsets.frame };
    cadBikeGroup.add(framePart);

    // 2. LC8 V-TWIN ENGINE
    const enginePart = new THREE.Group();
    const crankcase = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.58), materials.engineMetal);
    crankcase.position.set(0.11, 0.48, 0.08);
    crankcase.castShadow = true;
    enginePart.add(crankcase);

    const clutchCover = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.09, 24), materials.ktmOrange);
    clutchCover.name = 'clutchCover';
    clutchCover.rotation.z = Math.PI / 2;
    clutchCover.position.set(0.33, 0.48, 0.02);
    enginePart.add(clutchCover);

    const cyl1 = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.38, 16), materials.engineMetal);
    cyl1.rotation.x = 0.48;
    cyl1.position.set(0.11, 0.76, 0.26);
    enginePart.add(cyl1);

    const cyl2 = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.38, 16), materials.engineMetal);
    cyl2.rotation.x = -0.48;
    cyl2.position.set(0.11, 0.76, -0.18);
    enginePart.add(cyl2);

    const radiator = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.38, 0.08), materials.carbonFiber);
    radiator.position.set(0.11, 0.88, 0.65);
    enginePart.add(radiator);

    bikeParts.engine = { mesh: enginePart, basePos: enginePart.position.clone(), offset: explodedOffsets.engine };
    cadBikeGroup.add(enginePart);

    // 3. FUEL TANK & ERGONOMIC COWL
    const tankPart = new THREE.Group();
    const tankMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.44, 0.82), materials.ktmOrange);
    tankMesh.name = 'fuelTank';
    tankMesh.position.set(0.11, 1.24, 0.28);
    tankMesh.rotation.x = -0.12;
    tankMesh.castShadow = true;
    tankPart.add(tankMesh);

    const shroudGeo = new THREE.BoxGeometry(0.08, 0.35, 0.7);
    const leftShroud = new THREE.Mesh(shroudGeo, materials.ktmOrange);
    leftShroud.position.set(0.38, 1.14, 0.42);
    leftShroud.rotation.y = -0.15;
    tankPart.add(leftShroud);

    const rightShroud = new THREE.Mesh(shroudGeo, materials.ktmOrange);
    rightShroud.position.set(-0.16, 1.14, 0.42);
    rightShroud.rotation.y = 0.15;
    tankPart.add(rightShroud);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.44, 0.035), materials.clearWindshield);
    windshield.name = 'windshield';
    windshield.position.set(0.11, 1.6, 0.88);
    windshield.rotation.x = -0.35;
    tankPart.add(windshield);

    bikeParts.tank = { mesh: tankPart, basePos: tankPart.position.clone(), offset: explodedOffsets.tank };
    cadBikeGroup.add(tankPart);

    // 4. FRONT WP FORKS & WHEEL ASSEMBLY
    const frontPart = new THREE.Group();
    const forkGeo = new THREE.CylinderGeometry(0.048, 0.048, 1.05, 16);
    const leftFork = new THREE.Mesh(forkGeo, materials.goldFork);
    leftFork.rotation.x = 0.38;
    leftFork.position.set(0.3, 0.76, 1.15);
    leftFork.castShadow = true;
    frontPart.add(leftFork);

    const rightFork = new THREE.Mesh(forkGeo, materials.goldFork);
    rightFork.rotation.x = 0.38;
    rightFork.position.set(-0.08, 0.76, 1.15);
    rightFork.castShadow = true;
    frontPart.add(rightFork);

    const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.88, 12), materials.stealthBlack);
    handlebar.rotation.z = Math.PI / 2;
    handlebar.position.set(0.11, 1.34, 0.94);
    frontPart.add(handlebar);

    const tftDash = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.035), materials.carbonFiber);
    tftDash.position.set(0.11, 1.38, 0.84);
    tftDash.rotation.x = -0.4;
    frontPart.add(tftDash);

    // Split Predator LED Headlights
    const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, 0.15), materials.ktmOrange);
    headlight.position.set(0.11, 1.25, 1.12);
    const ledLens = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.03), materials.glowHeadlight);
    ledLens.position.set(0.11, 1.25, 1.21);
    frontPart.add(headlight);
    frontPart.add(ledLens);

    // Front Wheel
    const frontWheelGroup = new THREE.Group();
    frontWheelGroup.name = 'frontWheel';
    frontWheelGroup.position.set(0.11, 0.38, 1.35);

    const frontTire = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.1, 16, 48), materials.rubberTire);
    frontTire.rotation.y = Math.PI / 2;
    frontTire.castShadow = true;
    frontWheelGroup.add(frontTire);

    const frontRim = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.14, 24), materials.ktmOrange);
    frontRim.name = 'frontRim';
    frontRim.rotation.z = Math.PI / 2;
    frontWheelGroup.add(frontRim);

    const rotorGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.018, 24);
    const leftRotor = new THREE.Mesh(rotorGeo, materials.brakeRotor);
    leftRotor.rotation.z = Math.PI / 2;
    leftRotor.position.x = 0.11;
    frontWheelGroup.add(leftRotor);

    const rightRotor = leftRotor.clone();
    rightRotor.position.x = -0.11;
    frontWheelGroup.add(rightRotor);

    const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.08), materials.ktmOrange);
    caliper.position.set(0.12, 0.14, -0.18);
    frontWheelGroup.add(caliper);

    frontPart.add(frontWheelGroup);
    bikeParts.frontAssembly = { mesh: frontPart, basePos: frontPart.position.clone(), offset: explodedOffsets.frontAssembly };
    cadBikeGroup.add(frontPart);

    // 5. REAR SWINGARM & SUSPENSION
    const rearPart = new THREE.Group();
    const swingArmGeo = new THREE.BoxGeometry(0.06, 0.1, 0.92);
    const leftArm = new THREE.Mesh(swingArmGeo, materials.stealthBlack);
    leftArm.position.set(0.26, 0.44, -0.66);
    leftArm.rotation.x = -0.22;
    leftArm.castShadow = true;
    rearPart.add(leftArm);

    const rightArm = new THREE.Mesh(swingArmGeo, materials.stealthBlack);
    rightArm.position.set(-0.06, 0.44, -0.66);
    rightArm.rotation.x = -0.22;
    rightArm.castShadow = true;
    rearPart.add(rightArm);

    const shockCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.42, 16), materials.ghostWhite);
    shockCyl.rotation.x = -0.62;
    shockCyl.position.set(0.11, 0.69, -0.36);
    rearPart.add(shockCyl);

    const rearWheelGroup = new THREE.Group();
    rearWheelGroup.name = 'rearWheel';
    rearWheelGroup.position.set(0.11, 0.38, -1.14);

    const rearTire = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.14, 16, 48), materials.rubberTire);
    rearTire.rotation.y = Math.PI / 2;
    rearTire.castShadow = true;
    rearWheelGroup.add(rearTire);

    const rearRim = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.2, 24), materials.ktmOrange);
    rearRim.name = 'rearRim';
    rearRim.rotation.z = Math.PI / 2;
    rearWheelGroup.add(rearRim);

    const sprocket = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.024, 24), materials.chrome);
    sprocket.rotation.z = Math.PI / 2;
    sprocket.position.x = 0.14;
    rearWheelGroup.add(sprocket);

    rearPart.add(rearWheelGroup);
    bikeParts.rearAssembly = { mesh: rearPart, basePos: rearPart.position.clone(), offset: explodedOffsets.rearAssembly };
    cadBikeGroup.add(rearPart);

    // 6. TAIL SEAT & COWL
    const tailPart = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.72), materials.stealthBlack);
    seat.position.set(0.11, 1.05, -0.28);
    seat.rotation.x = 0.15;
    seat.castShadow = true;
    tailPart.add(seat);

    const cowl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.62), materials.ktmOrange);
    cowl.position.set(0.11, 1.14, -0.72);
    cowl.rotation.x = 0.34;
    tailPart.add(cowl);

    const tailLED = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.048, 0.038), materials.glowTaillight);
    tailLED.position.set(0.11, 1.24, -1.02);
    tailPart.add(tailLED);

    bikeParts.tailSeat = { mesh: tailPart, basePos: tailPart.position.clone(), offset: explodedOffsets.tailSeat };
    cadBikeGroup.add(tailPart);

    // 7. AKRAPOVIC TITANIUM EXHAUST & FLAME JET
    const exhaustPart = new THREE.Group();
    const header = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.72, 16), materials.exhaustTitanium);
    header.rotation.z = Math.PI / 2;
    header.rotation.y = 0.42;
    header.position.set(0.3, 0.38, 0.12);
    exhaustPart.add(header);

    const muffler = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.075, 0.7, 16), materials.exhaustTitanium);
    muffler.name = 'muffler';
    muffler.rotation.x = 0.46;
    muffler.rotation.z = -0.16;
    muffler.position.set(0.42, 0.62, -0.72);
    muffler.castShadow = true;
    exhaustPart.add(muffler);

    const endCap = new THREE.Mesh(new THREE.CylinderGeometry(0.076, 0.046, 0.12, 16), materials.carbonFiber);
    endCap.rotation.x = 0.46;
    endCap.rotation.z = -0.16;
    endCap.position.set(0.44, 0.88, -1.02);
    exhaustPart.add(endCap);

    // Animated Exhaust Flame Emitter Cone
    const flameGeo = new THREE.ConeGeometry(0.065, 0.35, 16);
    flameGeo.rotateX(-Math.PI / 2.3);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xff4400,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });
    exhaustFlameMesh = new THREE.Mesh(flameGeo, flameMat);
    exhaustFlameMesh.position.set(0.45, 0.96, -1.18);
    exhaustPart.add(exhaustFlameMesh);

    bikeParts.exhaust = { mesh: exhaustPart, basePos: exhaustPart.position.clone(), offset: explodedOffsets.exhaust };
    cadBikeGroup.add(exhaustPart);

    cadBikeGroup.visible = false;
    scene.add(cadBikeGroup);
  }

  // Mouse Parallax Setup
  function setupMouseInteraction() {
    window.addEventListener('mousemove', function (e) {
      mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    window.addEventListener('resize', onWindowResize);
  }

  function onWindowResize() {
    if (!container || !camera || !renderer) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  // -------------------------------------------------------------
  // Public 3D API
  // -------------------------------------------------------------
  window.KTM3D = {
    setMode: function (mode) {
      activeMode = mode;
      if (mode === 'cad') {
        if (studioGroup) studioGroup.visible = false;
        if (cadBikeGroup) cadBikeGroup.visible = true;
      } else {
        if (studioGroup) studioGroup.visible = true;
        if (cadBikeGroup) cadBikeGroup.visible = false;
      }
      return activeMode;
    },

    setBikeModel: function (modelKey) {
      currentBikeType = modelKey;
      if (studioMesh && studioTextures[modelKey]) {
        studioMesh.material.map = studioTextures[modelKey];
        studioMesh.material.needsUpdate = true;
      }

      if (cadBikeGroup) {
        const windshield = cadBikeGroup.getObjectByName('windshield');
        if (windshield) windshield.visible = (modelKey === '1290');
      }

      // Model swap flash
      if (studioMesh) {
        studioMesh.material.opacity = 0.5;
        setTimeout(() => {
          if (studioMesh) studioMesh.material.opacity = 0.98;
        }, 180);
      }
    },

    setExplode: function (progress) {
      targetExplode = Math.max(0, Math.min(1, progress));
      if (targetExplode > 0.05 && activeMode !== 'cad') {
        this.setMode('cad');
      }
    },

    toggleExplode: function () {
      targetExplode = targetExplode > 0.5 ? 0 : 1;
      if (targetExplode > 0.05) this.setMode('cad');
      return targetExplode;
    },

    setBodyColor: function (colorHex) {
      materials.ktmOrange.color.setHex(colorHex);
    },

    setRimColor: function (colorHex) {
      if (!cadBikeGroup) return;
      const fRim = cadBikeGroup.getObjectByName('frontRim');
      const rRim = cadBikeGroup.getObjectByName('rearRim');
      if (fRim) fRim.material.color.setHex(colorHex);
      if (rRim) rRim.material.color.setHex(colorHex);
    },

    triggerThrottleShake: function (intensity) {
      throttleShake = intensity || 0.08;
    },

    setCameraAngle: function (angleName) {
      if (!camera || !controls) return;
      isAutoRotating = false;
      updateAutoSpinUI();

      let targetPos;
      switch (angleName) {
        case 'profile': targetPos = new THREE.Vector3(5.4, 1.2, 0); break;
        case 'front': targetPos = new THREE.Vector3(3.8, 1.7, 3.8); break;
        case 'cockpit': targetPos = new THREE.Vector3(0.12, 1.85, 0.45); break;
        case 'rear': targetPos = new THREE.Vector3(-4.0, 1.6, -3.6); break;
        case 'top': targetPos = new THREE.Vector3(0, 6.4, 0.4); break;
        default: targetPos = new THREE.Vector3(4.3, 1.9, 4.2);
      }

      const startPos = camera.position.clone();
      const startTime = performance.now();
      const duration = 750;

      function tweenCam(now) {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        const ease = t * (2 - t);
        camera.position.lerpVectors(startPos, targetPos, ease);
        controls.target.set(0, 0.85, 0);
        if (t < 1) requestAnimationFrame(tweenCam);
      }
      requestAnimationFrame(tweenCam);
    },

    toggleAutoSpin: function () {
      isAutoRotating = !isAutoRotating;
      updateAutoSpinUI();
      return isAutoRotating;
    }
  };

  function updateAutoSpinUI() {
    const btn = document.getElementById('cam-btn-spin');
    if (btn) {
      if (isAutoRotating) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  }

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);

    // Mouse Parallax Damping
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    if (controls) controls.update();

    // Auto-spin active model
    const activeTarget = (activeMode === 'cad') ? cadBikeGroup : studioGroup;
    if (isAutoRotating && activeTarget) {
      activeTarget.rotation.y += 0.0075;
    }

    // Interactive Mouse Tilt applied to Studio Viewport
    if (studioGroup && activeMode === 'studio' && !isAutoRotating) {
      studioGroup.rotation.y = mouse.x * 0.28;
      studioGroup.rotation.x = -mouse.y * 0.12;
    }

    // Engine Throttle Vibration Shake
    if (throttleShake > 0.001) {
      const shakeOffset = (Math.random() - 0.5) * throttleShake;
      if (activeTarget) activeTarget.position.y = (activeMode === 'studio' ? 0.85 : 0) + shakeOffset;

      // Exhaust Flame Flicker
      if (exhaustFlameMesh) {
        exhaustFlameMesh.material.opacity = Math.min(1, throttleShake * 12);
        const scaleF = 0.8 + Math.random() * 0.6;
        exhaustFlameMesh.scale.set(scaleF, scaleF, scaleF * 1.4);
      }

      materials.exhaustTitanium.emissive.setHex(0xff3300);
      materials.exhaustTitanium.emissiveIntensity = Math.min(1.2, throttleShake * 10);

      throttleShake *= 0.88;
    } else {
      if (activeTarget) activeTarget.position.y = (activeMode === 'studio' ? 0.85 : 0);
      if (exhaustFlameMesh) exhaustFlameMesh.material.opacity = 0;
      materials.exhaustTitanium.emissiveIntensity = 0;
    }

    // Floating Atmospheric Particle Embers
    if (particleSystem) {
      particleSystem.rotation.y += 0.0012;
      const positions = particleSystem.geometry.attributes.position.array;
      const speeds = particleSystem.geometry.attributes.speed.array;

      for (let i = 0; i < speeds.length; i++) {
        positions[i * 3 + 1] += speeds[i];
        if (positions[i * 3 + 1] > 4.8) {
          positions[i * 3 + 1] = 0;
          positions[i * 3] = (Math.random() - 0.5) * 8.5;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 8.5;
        }
      }
      particleSystem.geometry.attributes.position.needsUpdate = true;
    }

    // Explode Interpolation in CAD Mode
    explodeProgress += (targetExplode - explodeProgress) * 0.08;
    for (const key in bikeParts) {
      const part = bikeParts[key];
      if (part && part.mesh) {
        part.mesh.position.x = part.basePos.x + part.offset.x * explodeProgress;
        part.mesh.position.y = part.basePos.y + part.offset.y * explodeProgress;
        part.mesh.position.z = part.basePos.z + part.offset.z * explodeProgress;
      }
    }

    // Wheel rotation while auto-spinning or revving
    if (cadBikeGroup && cadBikeGroup.visible) {
      const fWheel = cadBikeGroup.getObjectByName('frontWheel');
      const rWheel = cadBikeGroup.getObjectByName('rearWheel');
      if (fWheel && (isAutoRotating || throttleShake > 0.01)) fWheel.rotation.x -= 0.04;
      if (rWheel && (isAutoRotating || throttleShake > 0.01)) rWheel.rotation.x -= 0.04;
    }

    renderer.render(scene, camera);
  }

  function initFallbackStage() {
    if (!container) return;
    container.innerHTML = `
      <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; position: relative;">
        <img id="fallback-bike-img" src="assets/card_1290_trans.png" alt="KTM Motorcycle" style="max-width: 90%; max-height: 85%; object-fit: contain; filter: drop-shadow(0 25px 40px rgba(0,0,0,0.8)); transition: transform 0.4s ease;">
      </div>
    `;

    window.KTM3D.setBikeModel = function (modelKey) {
      const img = document.getElementById('fallback-bike-img');
      if (img) img.src = `assets/card_${modelKey}_trans.png`;
    };
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThree);
  } else {
    initThree();
  }
})();
