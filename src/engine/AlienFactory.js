import * as THREE from 'three';
import { GAME_CONFIG, COLORS } from '../utils/constants';

/**
 * Alien Factory Module
 *
 * Creates the hostile alien entities and their laser projectiles.
 * Aliens are positioned in a ring around the play area and have
 * colored heads with glowing eyes.
 */

/**
 * Create all alien entities and add them to the scene
 * Returns an array of alien groups
 */
export function createAliens(scene) {
  const aliens = [];

  for (let i = 0; i < GAME_CONFIG.ALIEN_COUNT; i++) {
    const angle = (i / GAME_CONFIG.ALIEN_COUNT) * Math.PI * 2;
    const radius = 25 + Math.random() * 15;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = 3 + Math.random() * 5;

    const alien = new THREE.Group();

    // Head (elongated sphere with unique hue per alien)
    const headGeometry = new THREE.SphereGeometry(1.2, 16, 16);
    headGeometry.scale(0.8, 1.3, 0.9);
    const hue = i / GAME_CONFIG.ALIEN_COUNT;
    const headMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(hue, 0.8, 0.35),
      transparent: true,
      opacity: 0.9
    });
    alien.add(new THREE.Mesh(headGeometry, headMaterial));

    // Eye sockets (dark ellipses)
    const eyeGeometry = new THREE.SphereGeometry(0.35, 16, 16);
    eyeGeometry.scale(1.5, 1, 0.5);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.35, 0.25, 0.7);
    alien.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry.clone(), eyeMaterial);
    rightEye.position.set(0.35, 0.25, 0.7);
    alien.add(rightEye);

    // Eye glow (green glow behind the sockets)
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

    // Alien point light
    alien.add(new THREE.PointLight(0x00ff44, 1, 12));

    alien.position.set(x, y, z);
    alien.userData = {
      alive: true,
      baseY: y,
      lastShot: Math.random() * 2000,
      shotInterval: GAME_CONFIG.ALIEN_FIRE_RATE_MIN +
        Math.random() * (GAME_CONFIG.ALIEN_FIRE_RATE_MAX - GAME_CONFIG.ALIEN_FIRE_RATE_MIN)
    };

    aliens.push(alien);
    scene.add(alien);
  }

  return aliens;
}

/**
 * Create a laser projectile fired from a start position toward a target
 * Returns a laser object with mesh, direction, speed, and tracking data
 */
export function createLaser(scene, start, target) {
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

  // Glow halo around laser bolt
  const glow = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 3, 8),
    new THREE.MeshBasicMaterial({
      color: COLORS.LASER,
      transparent: true,
      opacity: 0.3
    })
  );
  laser.add(glow);

  scene.add(laser);

  return {
    mesh: laser,
    direction,
    speed: GAME_CONFIG.LASER_SPEED,
    distance: 0,
    counted: false
  };
}
