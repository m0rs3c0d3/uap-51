import * as THREE from 'three';
import { PIDController } from '../utils/PIDController';
import { GAME_CONFIG, COLORS } from '../utils/constants';

/**
 * UAP-51 Game Engine
 * 
 * Handles all Three.js rendering, physics, and game logic
 */
export class GameEngine {
  constructor(canvas, onStateChange) {
    this.canvas = canvas;
    this.onStateChange = onStateChange;
    
    // Three.js core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();
    
    // Game objects
    this.uap = null;
    this.uapVelocity = new THREE.Vector3();
    this.aliens = [];
    this.lasers = [];
    this.buildings = [];
    
    // Game state
    this.shields = GAME_CONFIG.SHIELD_MAX;
    this.boost = 100;
    this.survivalTime = 0;
    this.evadeCount = 0;
    this.isBoosting = false;
    this.autopilot = true;
    
    // Control state
    this.gameStarted = false;
    this.gamePaused = false;
    this.gameOver = false;
    this.keys = {};
    
    // PID Controllers for autonomous flight
    this.pidX = new PIDController(
      GAME_CONFIG.PID.X.P,
      GAME_CONFIG.PID.X.I,
      GAME_CONFIG.PID.X.D
    );
    this.pidY = new PIDController(
      GAME_CONFIG.PID.Y.P,
      GAME_CONFIG.PID.Y.I,
      GAME_CONFIG.PID.Y.D
    );
    this.pidZ = new PIDController(
      GAME_CONFIG.PID.Z.P,
      GAME_CONFIG.PID.Z.I,
      GAME_CONFIG.PID.Z.D
    );
    
    this.disposed = false;
  }

  init() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(COLORS.FOG, 0.004);
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Lighting
    this.scene.add(new THREE.AmbientLight(0x111122, 0.4));
    
    // Create world
    this.createGround();
    this.createStars();
    this.createBuildings();
    this.createUAP();
    this.createAliens();
    
    // Event listeners
    this.handleResize = this.handleResize.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    
    // Start render loop
    this.animate();
  }

  createGround() {
    // Grid
    const grid = new THREE.GridHelper(300, 150, COLORS.GRID, 0x000833);
    grid.material.opacity = 0.3;
    grid.material.transparent = true;
    this.scene.add(grid);
    
    // Ground plane
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      new THREE.MeshBasicMaterial({
        color: COLORS.GROUND,
        transparent: true,
        opacity: 0.9
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    this.scene.add(ground);
  }

  createStars() {
    const geometry = new THREE.BufferGeometry();
    const count = 5000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.6;
      const r = 200 + Math.random() * 200;
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 20;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      
      // Colorful stars
      const color = new THREE.Color().setHSL(Math.random(), 0.5, 0.7 + Math.random() * 0.3);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const stars = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        size: 0.8,
        vertexColors: true,
        transparent: true,
        opacity: 0.9
      })
    );
    this.scene.add(stars);
  }

  createBuildings() {
    for (let i = 0; i < GAME_CONFIG.BUILDING_COUNT; i++) {
      const w = 3 + Math.random() * 8;
      const h = 5 + Math.random() * 35;
      const d = 3 + Math.random() * 8;
      
      // Position in ring around center
      const angle = Math.random() * Math.PI * 2;
      const radius = GAME_CONFIG.BUILDING_MIN_RADIUS + 
        Math.random() * (GAME_CONFIG.BUILDING_MAX_RADIUS - GAME_CONFIG.BUILDING_MIN_RADIUS);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      const color = COLORS.NEON[Math.floor(Math.random() * COLORS.NEON.length)];
      
      // Main building
      const geometry = new THREE.BoxGeometry(w, h, d);
      const material = new THREE.MeshBasicMaterial({
        color: 0x050510,
        transparent: true,
        opacity: 0.9
      });
      const building = new THREE.Mesh(geometry, material);
      building.position.set(x, h / 2, z);
      this.scene.add(building);
      
      // Neon edges
      const edges = new THREE.EdgesGeometry(geometry);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8
      });
      building.add(new THREE.LineSegments(edges, lineMaterial));
      
      // Glow effect
      const glowMaterial = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3
      });
      const glow = new THREE.LineSegments(edges, glowMaterial);
      glow.scale.setScalar(1.02);
      building.add(glow);
      
      // Windows
      const windowCount = Math.floor(h / 3);
      for (let j = 0; j < windowCount; j++) {
        if (Math.random() > 0.4) {
          const winGeometry = new THREE.PlaneGeometry(w * 0.6, 1);
          const winMaterial = new THREE.MeshBasicMaterial({
            color: Math.random() > 0.5 ? color : 0x00ffff,
            transparent: true,
            opacity: 0.3 + Math.random() * 0.4,
            side: THREE.DoubleSide
          });
          const win = new THREE.Mesh(winGeometry, winMaterial);
          win.position.set(0, -h / 2 + 2 + j * 3, d / 2 + 0.1);
          building.add(win);
        }
      }
      
      // Rooftop light
      const lightGeometry = new THREE.SphereGeometry(0.5, 8, 8);
      const lightMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8
      });
      const roofLight = new THREE.Mesh(lightGeometry, lightMaterial);
      roofLight.position.y = h / 2 + 0.5;
      building.add(roofLight);
      
      // Point light
      const pointLight = new THREE.PointLight(color, 0.5, 15);
      pointLight.position.y = h / 2;
      building.add(pointLight);
      
      this.buildings.push(building);
    }
    
    // Spotlights
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const spot = new THREE.SpotLight(
        COLORS.NEON[i % COLORS.NEON.length],
        2,
        100,
        Math.PI / 6,
        0.5
      );
      spot.position.set(Math.cos(angle) * 50, 0, Math.sin(angle) * 50);
      spot.target.position.set(0, 30, 0);
      this.scene.add(spot);
      this.scene.add(spot.target);
    }
  }

  createUAP() {
    this.uap = new THREE.Group();
    
    // Core (brightest)
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 32, 32),
      new THREE.MeshBasicMaterial({
        color: COLORS.UAP_CORE,
        transparent: true,
        opacity: 1
      })
    );
    this.uap.add(core);
    this.uap.core = core;
    
    // Multiple glow layers for ultra-glow effect
    const glowLayers = [
      { size: 0.8, opacity: 0.6, color: COLORS.UAP_CORE },
      { size: 1.1, opacity: 0.4, color: COLORS.UAP_GLOW },
      { size: 1.5, opacity: 0.2, color: 0x0044ff },
      { size: 2.5, opacity: 0.08, color: 0x00d4ff }
    ];
    
    glowLayers.forEach((layer, index) => {
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(layer.size, 32, 32),
        new THREE.MeshBasicMaterial({
          color: layer.color,
          transparent: true,
          opacity: layer.opacity,
          side: THREE.BackSide
        })
      );
      this.uap.add(glow);
      this.uap[`glow${index}`] = glow;
    });
    
    // Spinning rings
    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.05, 8, 32),
      new THREE.MeshBasicMaterial({
        color: COLORS.UAP_CORE,
        transparent: true,
        opacity: 0.8
      })
    );
    ring1.rotation.x = Math.PI / 2;
    this.uap.add(ring1);
    this.uap.ring1 = ring1;
    
    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.2, 0.03, 8, 32),
      new THREE.MeshBasicMaterial({
        color: 0xff00ff,
        transparent: true,
        opacity: 0.5
      })
    );
    ring2.rotation.x = Math.PI / 3;
    this.uap.add(ring2);
    this.uap.ring2 = ring2;
    
    // Point light
    const light = new THREE.PointLight(COLORS.UAP_CORE, 4, 40);
    this.uap.add(light);
    this.uap.light = light;
    
    this.uap.position.set(0, 10, 0);
    this.scene.add(this.uap);
  }

  createAliens() {
    for (let i = 0; i < GAME_CONFIG.ALIEN_COUNT; i++) {
      const angle = (i / GAME_CONFIG.ALIEN_COUNT) * Math.PI * 2;
      const radius = 25 + Math.random() * 15;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = 3 + Math.random() * 5;
      
      const alien = new THREE.Group();
      
      // Head
      const headGeometry = new THREE.SphereGeometry(1.2, 16, 16);
      headGeometry.scale(0.8, 1.3, 0.9);
      const hue = i / GAME_CONFIG.ALIEN_COUNT;
      const headMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(hue, 0.8, 0.35),
        transparent: true,
        opacity: 0.9
      });
      alien.add(new THREE.Mesh(headGeometry, headMaterial));
      
      // Eyes
      const eyeGeometry = new THREE.SphereGeometry(0.35, 16, 16);
      eyeGeometry.scale(1.5, 1, 0.5);
      const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
      
      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-0.35, 0.25, 0.7);
      alien.add(leftEye);
      
      const rightEye = new THREE.Mesh(eyeGeometry.clone(), eyeMaterial);
      rightEye.position.set(0.35, 0.25, 0.7);
      alien.add(rightEye);
      
      // Eye glow
      const eyeGlowMaterial = new THREE.MeshBasicMaterial({
        color: COLORS.ALIEN_EYES,
        transparent: true,
        opacity: 0.5
      });
      
      const leftGlow = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), eyeGlowMaterial);
      leftGlow.position.set(-0.35, 0.25, 0.7);
      alien.add(leftGlow);
      
      const rightGlow = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), eyeGlowMaterial);
      rightGlow.position.set(0.35, 0.25, 0.7);
      alien.add(rightGlow);
      
      // Alien light
      alien.add(new THREE.PointLight(0x00ff44, 1, 12));
      
      alien.position.set(x, y, z);
      alien.userData = {
        alive: true,
        baseY: y,
        lastShot: Math.random() * 2000,
        shotInterval: GAME_CONFIG.ALIEN_FIRE_RATE_MIN + 
          Math.random() * (GAME_CONFIG.ALIEN_FIRE_RATE_MAX - GAME_CONFIG.ALIEN_FIRE_RATE_MIN)
      };
      
      this.aliens.push(alien);
      this.scene.add(alien);
    }
  }

  createLaser(start, target) {
    const direction = new THREE.Vector3().subVectors(target, start).normalize();
    
    const laser = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 3, 8),
      new THREE.MeshBasicMaterial({
        color: COLORS.LASER,
        transparent: true,
        opacity: 0.9
      })
    );
    laser.position.copy(start);
    laser.lookAt(target);
    laser.rotateX(Math.PI / 2);
    
    // Glow
    const glow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 3, 8),
      new THREE.MeshBasicMaterial({
        color: COLORS.LASER,
        transparent: true,
        opacity: 0.3
      })
    );
    laser.add(glow);
    
    this.scene.add(laser);
    
    return {
      mesh: laser,
      direction,
      speed: GAME_CONFIG.LASER_SPEED,
      distance: 0,
      counted: false
    };
  }

  /**
   * Calculate safe position for autopilot evasion
   * Uses threat avoidance algorithm combined with PID control
   */
  calculateEvadeTarget() {
    const dangerDirection = new THREE.Vector3();
    
    // Avoid lasers (primary threat)
    this.lasers.forEach(laser => {
      const toUAP = new THREE.Vector3().subVectors(this.uap.position, laser.mesh.position);
      const distance = toUAP.length();
      if (distance < 20) {
        // Stronger avoidance for closer lasers
        toUAP.normalize().multiplyScalar(20 / (distance + 1));
        dangerDirection.add(toUAP);
      }
    });
    
    // Avoid aliens (secondary threat)
    this.aliens.forEach(alien => {
      if (!alien.userData.alive) return;
      const toUAP = new THREE.Vector3().subVectors(this.uap.position, alien.position);
      const distance = toUAP.length();
      if (distance < 15) {
        toUAP.normalize().multiplyScalar(10 / (distance + 1));
        dangerDirection.add(toUAP);
      }
    });
    
    // Calculate target position
    const target = this.uap.position.clone().add(dangerDirection.multiplyScalar(2));
    
    // Keep in bounds and at good altitude
    const bounds = GAME_CONFIG.WORLD_BOUNDS;
    target.y = Math.max(5, Math.min(25, target.y + (15 - this.uap.position.y) * 0.1));
    target.x = Math.max(-bounds.x * 0.7, Math.min(bounds.x * 0.7, target.x));
    target.z = Math.max(-bounds.z * 0.7, Math.min(bounds.z * 0.7, target.z));
    
    // Add patrol movement when safe
    if (dangerDirection.length() < 1) {
      target.x += Math.sin(this.survivalTime * 0.5) * 10;
      target.z += Math.cos(this.survivalTime * 0.7) * 10;
      target.y = 10 + Math.sin(this.survivalTime * 0.3) * 5;
    }
    
    return target;
  }

  start(isAutopilot) {
    this.autopilot = isAutopilot;
    this.gameStarted = true;
    this.gamePaused = false;
    this.gameOver = false;
    this.updateState();
  }

  togglePause() {
    if (!this.gameStarted || this.gameOver) return;
    this.gamePaused = !this.gamePaused;
    this.updateState();
  }

  toggleAutopilot() {
    this.autopilot = !this.autopilot;
    this.pidX.reset();
    this.pidY.reset();
    this.pidZ.reset();
    this.updateState();
  }

  restart() {
    this.shields = GAME_CONFIG.SHIELD_MAX;
    this.boost = 100;
    this.survivalTime = 0;
    this.evadeCount = 0;
    this.uap.position.set(0, 10, 0);
    this.uapVelocity.set(0, 0, 0);
    
    // Reset aliens
    this.aliens.forEach(alien => {
      alien.userData.alive = true;
      alien.visible = true;
      alien.userData.lastShot = Math.random() * 2000;
    });
    
    // Clear lasers
    this.lasers.forEach(laser => this.scene.remove(laser.mesh));
    this.lasers = [];
    
    // Reset PIDs
    this.pidX.reset();
    this.pidY.reset();
    this.pidZ.reset();
    
    this.gameStarted = true;
    this.gamePaused = false;
    this.gameOver = false;
    
    this.updateState();
  }

  quit() {
    this.restart();
    this.gameStarted = false;
    this.updateState();
  }

  endGame() {
    this.gameOver = true;
    this.updateState();
  }

  updateState() {
    this.onStateChange({
      gameStarted: this.gameStarted,
      gamePaused: this.gamePaused,
      gameOver: this.gameOver,
      autopilot: this.autopilot,
      shields: this.shields,
      boost: this.boost,
      survivalTime: this.survivalTime,
      evadeCount: this.evadeCount,
      altitude: this.uap?.position.y || 0,
      velocity: this.uapVelocity?.length() || 0,
      pid: {
        p: Math.abs(this.pidX.lastP),
        i: Math.abs(this.pidX.lastI),
        d: Math.abs(this.pidX.lastD)
      }
    });
  }

  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  handleKeyDown(e) {
    this.keys[e.code] = true;
    if (e.code === 'Space') e.preventDefault();
    if (e.code === 'Tab') e.preventDefault();
  }

  handleKeyUp(e) {
    this.keys[e.code] = false;
  }

  update(dt, time) {
    this.survivalTime += dt;
    
    // Boost management
    this.isBoosting = this.keys['KeyE'] && this.boost > 0;
    if (this.isBoosting) {
      this.boost = Math.max(0, this.boost - GAME_CONFIG.UAP_BOOST_DRAIN * dt);
    } else if (this.boost < 100) {
      this.boost = Math.min(100, this.boost + GAME_CONFIG.UAP_BOOST_RECHARGE * dt);
    }
    
    // Movement calculation
    const thrust = this.isBoosting ? GAME_CONFIG.UAP_BOOST_THRUST : GAME_CONFIG.UAP_THRUST;
    const force = new THREE.Vector3();
    
    if (this.autopilot) {
      // PID-controlled autonomous evasion
      const target = this.calculateEvadeTarget();
      force.x = this.pidX.calculate(target.x - this.uap.position.x, dt);
      force.y = this.pidY.calculate(target.y - this.uap.position.y, dt);
      force.z = this.pidZ.calculate(target.z - this.uap.position.z, dt);
    } else {
      // Manual control
      if (this.keys['KeyW']) force.z -= thrust;
      if (this.keys['KeyS']) force.z += thrust;
      if (this.keys['KeyA']) force.x -= thrust;
      if (this.keys['KeyD']) force.x += thrust;
      if (this.keys['Space']) force.y += thrust;
      if (this.keys['ShiftLeft'] || this.keys['ShiftRight']) force.y -= thrust * 0.5;
      force.y += GAME_CONFIG.UAP_GRAVITY + GAME_CONFIG.UAP_HOVER_FORCE;
    }
    
    // Apply physics
    this.uapVelocity.add(force.multiplyScalar(dt));
    this.uapVelocity.multiplyScalar(GAME_CONFIG.UAP_DAMPING);
    this.uap.position.add(this.uapVelocity.clone().multiplyScalar(dt));
    
    // Bounds checking
    const bounds = GAME_CONFIG.WORLD_BOUNDS;
    if (this.uap.position.y < bounds.y.min) {
      this.uap.position.y = bounds.y.min;
      this.uapVelocity.y = Math.max(0, this.uapVelocity.y);
    }
    if (this.uap.position.y > bounds.y.max) this.uap.position.y = bounds.y.max;
    this.uap.position.x = Math.max(-bounds.x, Math.min(bounds.x, this.uap.position.x));
    this.uap.position.z = Math.max(-bounds.z, Math.min(bounds.z, this.uap.position.z));
    
    // Shield regeneration
    if (this.shields < GAME_CONFIG.SHIELD_MAX) {
      this.shields = Math.min(GAME_CONFIG.SHIELD_MAX, this.shields + GAME_CONFIG.SHIELD_REGEN * dt);
    }
    
    // Update aliens
    const now = performance.now();
    this.aliens.forEach((alien, index) => {
      if (!alien.userData.alive) return;
      
      // Hover animation
      alien.position.y = alien.userData.baseY + Math.sin(time * 2 + index) * 0.5;
      alien.lookAt(this.uap.position);
      
      // Shooting
      const distance = alien.position.distanceTo(this.uap.position);
      if (distance < GAME_CONFIG.ALIEN_RANGE && 
          now - alien.userData.lastShot > alien.userData.shotInterval) {
        alien.userData.lastShot = now;
        
        // Aim with prediction (less accurate in autopilot to be fair)
        const aim = this.uap.position.clone();
        if (!this.autopilot) {
          aim.add(this.uapVelocity.clone().multiplyScalar(0.2));
        }
        this.lasers.push(this.createLaser(alien.position.clone(), aim));
      }
    });
    
    // Update lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      laser.distance += laser.speed * dt;
      laser.mesh.position.add(laser.direction.clone().multiplyScalar(laser.speed * dt));
      
      // Check collision with UAP
      const distanceToUAP = laser.mesh.position.distanceTo(this.uap.position);
      if (distanceToUAP < 1.8) {
        this.shields = Math.max(0, this.shields - GAME_CONFIG.LASER_DAMAGE);
        this.scene.remove(laser.mesh);
        this.lasers.splice(i, 1);
        if (this.shields <= 0) this.endGame();
        continue;
      }
      
      // Count near misses as evades
      if (distanceToUAP < 4 && distanceToUAP > 1.8 && !laser.counted) {
        laser.counted = true;
        this.evadeCount++;
      }
      
      // Remove old lasers
      if (laser.distance > GAME_CONFIG.LASER_MAX_DISTANCE || laser.mesh.position.y < 0) {
        this.scene.remove(laser.mesh);
        this.lasers.splice(i, 1);
      }
    }
    
    // Camera follow
    const cameraTarget = this.uap.position.clone().add(new THREE.Vector3(0, 4, 12));
    this.camera.position.lerp(cameraTarget, 0.05);
    this.camera.lookAt(this.uap.position);
    
    this.updateState();
  }

  updateVisuals(time) {
    if (!this.uap) return;
    
    // UAP pulsing
    const pulse = 1 + Math.sin(time * 4) * 0.1;
    const fastPulse = 1 + Math.sin(time * 12) * 0.05;
    
    if (this.uap.glow0) this.uap.glow0.scale.setScalar(pulse * 1.1);
    if (this.uap.glow1) this.uap.glow1.scale.setScalar(pulse * 1.05);
    if (this.uap.glow2) this.uap.glow2.scale.setScalar(fastPulse);
    if (this.uap.glow3) this.uap.glow3.scale.setScalar(pulse * 1.2);
    
    // Ring rotation
    this.uap.ring1.rotation.z = time * 3;
    this.uap.ring2.rotation.z = -time * 2;
    this.uap.ring2.rotation.x = Math.PI / 3 + Math.sin(time) * 0.2;
    
    // Light intensity
    this.uap.light.intensity = 3 + Math.sin(time * 5);
    
    // Color based on boost state
    if (this.isBoosting) {
      this.uap.core.material.color.setHex(COLORS.UAP_BOOST);
      this.uap.glow0.material.color.setHex(0xff8800);
      this.uap.light.color.setHex(0xff8800);
    } else {
      this.uap.core.material.color.setHex(COLORS.UAP_CORE);
      this.uap.glow0.material.color.setHex(COLORS.UAP_CORE);
      this.uap.light.color.setHex(COLORS.UAP_CORE);
    }
    
    // Building lights animation
    this.buildings.forEach((building, i) => {
      const pointLight = building.children.find(c => c.isPointLight);
      if (pointLight) {
        pointLight.intensity = 0.3 + Math.sin(time * 2 + i) * 0.2;
      }
    });
  }

  animate = () => {
    if (this.disposed) return;
    requestAnimationFrame(this.animate);
    
    const dt = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();
    
    if (this.gameStarted && !this.gamePaused && !this.gameOver) {
      this.update(dt, time);
    }
    
    this.updateVisuals(time);
    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    this.disposed = true;
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.renderer.dispose();
  }
}

export default GameEngine;
