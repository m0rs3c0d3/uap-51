import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { COLORS } from '../utils/constants';

/**
 * Scene Setup Module
 *
 * Creates and configures the Three.js scene, camera, renderer,
 * post-processing composer, and static environment elements
 * (ground, starfield, moon, nebula).
 */

/**
 * Create the Three.js scene with fog and base lighting
 */
export function createScene() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(COLORS.FOG, 0.004);

  scene.add(new THREE.AmbientLight(0x223344, 0.5));

  // Cool sky glow from above, warm city bounce from below
  scene.add(new THREE.HemisphereLight(0x3344aa, 0x110522, 0.6));

  // Dim blue moonlight so metallic surfaces have something to reflect
  const moonLight = new THREE.DirectionalLight(0x8899ff, 0.7);
  moonLight.position.set(-60, 80, -40);
  scene.add(moonLight);

  return scene;
}

/**
 * Create the perspective camera
 */
export function createCamera() {
  return new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
}

/**
 * Create the WebGL renderer attached to a canvas element
 */
export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  return renderer;
}

/**
 * Give metallic materials something to reflect: a dim neutral
 * environment map generated from three's RoomEnvironment.
 */
export function applyEnvironment(renderer, scene) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;
  pmrem.dispose();
}

/**
 * Create the post-processing chain: render -> bloom -> output.
 * Bloom is what makes every emissive surface actually glow.
 */
export function createComposer(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.5,    // strength
    0.35,   // radius
    0.45    // threshold — only genuinely bright surfaces bloom
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  return composer;
}

/**
 * Create the ground plane and grid overlay
 */
export function createGround(scene) {
  // Slightly reflective asphalt-like ground that catches the city glow
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshStandardMaterial({
      color: COLORS.GROUND,
      roughness: 0.35,
      metalness: 0.8
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.1;
  scene.add(ground);

  const grid = new THREE.GridHelper(300, 150, COLORS.GRID, 0x001a4d);
  grid.material.opacity = 0.35;
  grid.material.transparent = true;
  scene.add(grid);

  // Coarse secondary grid for depth parallax
  const coarseGrid = new THREE.GridHelper(300, 30, COLORS.GRID, COLORS.GRID);
  coarseGrid.material.opacity = 0.12;
  coarseGrid.material.transparent = true;
  coarseGrid.position.y = 0.05;
  scene.add(coarseGrid);
}

/**
 * Build a soft radial-gradient texture, used for star sprites,
 * nebula clouds and glow halos.
 */
export function createGlowTexture(innerColor, outerColor) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, innerColor);
  gradient.addColorStop(0.4, outerColor);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

/**
 * Create the night sky: twinkling starfield, moon, and nebula clouds.
 * Returns references used by VisualEffects for animation.
 */
export function createStars(scene) {
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

    const color = new THREE.Color().setHSL(Math.random(), 0.5, 0.7 + Math.random() * 0.3);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const starTexture = createGlowTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0.3)');
  const stars = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: 1.2,
      map: starTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  scene.add(stars);

  // Moon with halo
  const moon = new THREE.Group();
  moon.add(new THREE.Mesh(
    new THREE.SphereGeometry(14, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xdde4ff })
  ));
  const moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: createGlowTexture('rgba(200,215,255,0.8)', 'rgba(120,140,255,0.15)'),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  moonHalo.scale.setScalar(70);
  moon.add(moonHalo);
  moon.position.set(-160, 140, -220);
  scene.add(moon);

  // Nebula clouds: large tinted sprites drifting in the distance
  const nebulaTints = [
    ['rgba(180,60,255,0.30)', 'rgba(80,0,160,0.08)'],
    ['rgba(0,200,255,0.25)', 'rgba(0,60,160,0.07)'],
    ['rgba(255,60,180,0.22)', 'rgba(120,0,80,0.06)']
  ];
  const nebulae = [];
  for (let i = 0; i < 9; i++) {
    const [inner, outer] = nebulaTints[i % nebulaTints.length];
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: createGlowTexture(inner, outer),
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    const angle = (i / 9) * Math.PI * 2;
    const radius = 220 + Math.random() * 120;
    sprite.position.set(
      Math.cos(angle) * radius,
      60 + Math.random() * 120,
      Math.sin(angle) * radius
    );
    sprite.scale.setScalar(90 + Math.random() * 120);
    sprite.userData.baseOpacity = 0.3 + Math.random() * 0.3;
    scene.add(sprite);
    nebulae.push(sprite);
  }

  return { stars, nebulae };
}
