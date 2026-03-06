import * as THREE from 'three';
import { COLORS } from '../utils/constants';

/**
 * Scene Setup Module
 *
 * Creates and configures the Three.js scene, camera, renderer,
 * and static environment elements (ground grid, starfield).
 */

/**
 * Create the Three.js scene with fog
 */
export function createScene() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(COLORS.FOG, 0.004);
  scene.add(new THREE.AmbientLight(0x111122, 0.4));
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
  return renderer;
}

/**
 * Create the ground plane and grid overlay
 */
export function createGround(scene) {
  const grid = new THREE.GridHelper(300, 150, COLORS.GRID, 0x000833);
  grid.material.opacity = 0.3;
  grid.material.transparent = true;
  scene.add(grid);

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
  scene.add(ground);
}

/**
 * Create the starfield as a particle system
 * Generates 5000 colored stars in a hemisphere above the scene
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

  const stars = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.9
    })
  );
  scene.add(stars);
}
