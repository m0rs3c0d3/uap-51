import * as THREE from 'three';
import { GAME_CONFIG, COLORS } from '../utils/constants';
import { createGlowTexture } from './SceneSetup';

/**
 * Alien Factory Module
 *
 * Creates the hostile alien entities and their laser projectiles.
 * Each alien is a classic grey riding a small hover-pod: elongated
 * head with glowing eyes, slim torso and arms, and a saucer-shaped
 * pod with a neon rim ring in the alien's signature hue.
 *
 * Aliens face +Z (Object3D.lookAt convention used by PhysicsEngine).
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
    const hue = i / GAME_CONFIG.ALIEN_COUNT;
    const signatureColor = new THREE.Color().setHSL(hue, 0.9, 0.5);

    const skinMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.4, 0.45),
      metalness: 0.2,
      roughness: 0.6,
      emissive: new THREE.Color().setHSL(hue, 0.8, 0.12)
    });

    // Head (classic elongated grey-alien skull)
    const headGeometry = new THREE.SphereGeometry(1.0, 24, 24);
    headGeometry.scale(0.8, 1.25, 0.9);
    const head = new THREE.Mesh(headGeometry, skinMaterial);
    head.position.y = 1.1;
    alien.add(head);

    // Tapered chin
    const chin = new THREE.Mesh(
      new THREE.ConeGeometry(0.55, 1.0, 16),
      skinMaterial
    );
    chin.position.set(0, 0.35, 0.15);
    chin.rotation.x = Math.PI;
    alien.add(chin);

    // Eyes: large black almonds with glow behind them
    const eyeGeometry = new THREE.SphereGeometry(0.32, 16, 16);
    eyeGeometry.scale(1.5, 1, 0.5);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      metalness: 0.9,
      roughness: 0.1
    });

    const eyeGlowMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.ALIEN_EYES,
      transparent: true,
      opacity: 0.7
    });

    [-1, 1].forEach(side => {
      const eye = new THREE.Mesh(eyeGeometry.clone(), eyeMaterial);
      eye.position.set(side * 0.35, 1.3, 0.62);
      eye.rotation.z = side * -0.35;
      alien.add(eye);

      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 8), eyeGlowMaterial);
      glow.position.set(side * 0.35, 1.3, 0.55);
      alien.add(glow);
    });

    // Slim torso and arms
    const torso = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.35, 0.9, 4, 12),
      skinMaterial
    );
    torso.position.y = -0.5;
    alien.add(torso);

    [-1, 1].forEach(side => {
      const arm = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.1, 0.9, 4, 8),
        skinMaterial
      );
      arm.position.set(side * 0.55, -0.5, 0.1);
      arm.rotation.z = side * 0.35;
      alien.add(arm);
    });

    // Hover-pod: dark saucer with a neon rim in the signature hue
    const podMaterial = new THREE.MeshStandardMaterial({
      color: 0x151525,
      metalness: 0.85,
      roughness: 0.35
    });
    const podTop = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.35, 24), podMaterial);
    podTop.position.y = -1.35;
    alien.add(podTop);
    const podBottom = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.5, 24), podMaterial);
    podBottom.position.y = -1.78;
    podBottom.rotation.x = Math.PI;
    alien.add(podBottom);

    const podRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.1, 0.05, 8, 32),
      new THREE.MeshBasicMaterial({ color: signatureColor })
    );
    podRing.rotation.x = Math.PI / 2;
    podRing.position.y = -1.55;
    alien.add(podRing);

    // Thruster glow beneath the pod
    const thrusterGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: createGlowTexture('rgba(120,255,180,0.7)', 'rgba(0,120,80,0.1)'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    thrusterGlow.scale.setScalar(2.2);
    thrusterGlow.position.y = -2.2;
    alien.add(thrusterGlow);

    // Alien point light in its signature color
    const podLight = new THREE.PointLight(signatureColor, 1.2, 14);
    podLight.position.y = -1.5;
    alien.add(podLight);

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

  // Hot white-green core bolt
  const laser = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 3, 8),
    new THREE.MeshBasicMaterial({ color: 0xccffcc })
  );
  laser.position.copy(start);
  laser.lookAt(target);
  laser.rotateX(Math.PI / 2);

  // Additive glow sheath around the bolt
  const glow = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 3.2, 8),
    new THREE.MeshBasicMaterial({
      color: COLORS.LASER,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  laser.add(glow);

  // Bright muzzle flare at the bolt tip
  const flare = new THREE.Sprite(new THREE.SpriteMaterial({
    map: createGlowTexture('rgba(180,255,180,0.9)', 'rgba(0,255,80,0.2)'),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  flare.scale.setScalar(1.4);
  flare.position.y = 1.5;
  laser.add(flare);

  scene.add(laser);

  return {
    mesh: laser,
    direction,
    speed: GAME_CONFIG.LASER_SPEED,
    distance: 0,
    counted: false
  };
}
