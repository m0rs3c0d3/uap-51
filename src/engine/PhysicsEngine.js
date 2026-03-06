import * as THREE from 'three';
import { GAME_CONFIG } from '../utils/constants';
import { calculateEvadeTarget } from './AutopilotController';
import { createLaser } from './AlienFactory';

/**
 * Physics Engine Module
 *
 * Handles all per-frame game logic:
 * - UAP movement (manual controls or PID autopilot)
 * - Velocity, damping, and bounds enforcement
 * - Shield regeneration
 * - Alien AI (hovering, aiming, shooting)
 * - Laser movement, collision detection, and cleanup
 * - Camera follow behavior
 */

/**
 * Update UAP movement using either autopilot PID or manual keyboard input
 */
export function updateUAPMovement(engine, dt) {
  const thrust = engine.isBoosting ? GAME_CONFIG.UAP_BOOST_THRUST : GAME_CONFIG.UAP_THRUST;
  const force = new THREE.Vector3();

  if (engine.autopilot) {
    // PID-controlled autonomous evasion
    const target = calculateEvadeTarget(
      engine.uap.position,
      engine.lasers,
      engine.aliens,
      engine.survivalTime
    );
    force.x = engine.pidX.calculate(target.x - engine.uap.position.x, dt);
    force.y = engine.pidY.calculate(target.y - engine.uap.position.y, dt);
    force.z = engine.pidZ.calculate(target.z - engine.uap.position.z, dt);
  } else {
    // Manual keyboard control
    if (engine.keys['KeyW']) force.z -= thrust;
    if (engine.keys['KeyS']) force.z += thrust;
    if (engine.keys['KeyA']) force.x -= thrust;
    if (engine.keys['KeyD']) force.x += thrust;
    if (engine.keys['Space']) force.y += thrust;
    if (engine.keys['ShiftLeft'] || engine.keys['ShiftRight']) force.y -= thrust * 0.5;
    force.y += GAME_CONFIG.UAP_GRAVITY + GAME_CONFIG.UAP_HOVER_FORCE;
  }

  // Apply physics: force -> velocity -> position
  engine.uapVelocity.add(force.multiplyScalar(dt));
  engine.uapVelocity.multiplyScalar(GAME_CONFIG.UAP_DAMPING);
  engine.uap.position.add(engine.uapVelocity.clone().multiplyScalar(dt));
}

/**
 * Enforce world boundaries so the UAP cannot fly out of the play area
 */
export function enforceBounds(engine) {
  const bounds = GAME_CONFIG.WORLD_BOUNDS;

  if (engine.uap.position.y < bounds.y.min) {
    engine.uap.position.y = bounds.y.min;
    engine.uapVelocity.y = Math.max(0, engine.uapVelocity.y);
  }
  if (engine.uap.position.y > bounds.y.max) {
    engine.uap.position.y = bounds.y.max;
  }

  engine.uap.position.x = Math.max(-bounds.x, Math.min(bounds.x, engine.uap.position.x));
  engine.uap.position.z = Math.max(-bounds.z, Math.min(bounds.z, engine.uap.position.z));
}

/**
 * Manage boost energy: drain when active, recharge when idle
 */
export function updateBoost(engine, dt) {
  engine.isBoosting = engine.keys['KeyE'] && engine.boost > 0;

  if (engine.isBoosting) {
    engine.boost = Math.max(0, engine.boost - GAME_CONFIG.UAP_BOOST_DRAIN * dt);
  } else if (engine.boost < 100) {
    engine.boost = Math.min(100, engine.boost + GAME_CONFIG.UAP_BOOST_RECHARGE * dt);
  }
}

/**
 * Regenerate shields over time up to max
 */
export function updateShields(engine, dt) {
  if (engine.shields < GAME_CONFIG.SHIELD_MAX) {
    engine.shields = Math.min(
      GAME_CONFIG.SHIELD_MAX,
      engine.shields + GAME_CONFIG.SHIELD_REGEN * dt
    );
  }
}

/**
 * Update alien behavior: hovering animation, facing the UAP, and shooting
 */
export function updateAliens(engine, time) {
  const now = performance.now();

  engine.aliens.forEach((alien, index) => {
    if (!alien.userData.alive) return;

    // Hover animation
    alien.position.y = alien.userData.baseY + Math.sin(time * 2 + index) * 0.5;
    alien.lookAt(engine.uap.position);

    // Shooting logic
    const distance = alien.position.distanceTo(engine.uap.position);
    if (distance < GAME_CONFIG.ALIEN_RANGE &&
        now - alien.userData.lastShot > alien.userData.shotInterval) {
      alien.userData.lastShot = now;

      // Aim with prediction (less accurate in autopilot to be fair)
      const aim = engine.uap.position.clone();
      if (!engine.autopilot) {
        aim.add(engine.uapVelocity.clone().multiplyScalar(0.2));
      }
      engine.lasers.push(createLaser(engine.scene, alien.position.clone(), aim));
    }
  });
}

/**
 * Update laser positions, check collisions, count evasions, and remove old lasers
 */
export function updateLasers(engine, dt) {
  for (let i = engine.lasers.length - 1; i >= 0; i--) {
    const laser = engine.lasers[i];
    laser.distance += laser.speed * dt;
    laser.mesh.position.add(laser.direction.clone().multiplyScalar(laser.speed * dt));

    // Check collision with UAP
    const distanceToUAP = laser.mesh.position.distanceTo(engine.uap.position);
    if (distanceToUAP < 1.8) {
      engine.shields = Math.max(0, engine.shields - GAME_CONFIG.LASER_DAMAGE);
      engine.scene.remove(laser.mesh);
      engine.lasers.splice(i, 1);
      if (engine.shields <= 0) engine.endGame();
      continue;
    }

    // Count near misses as evasions
    if (distanceToUAP < 4 && distanceToUAP > 1.8 && !laser.counted) {
      laser.counted = true;
      engine.evadeCount++;
    }

    // Remove lasers that have traveled too far or hit the ground
    if (laser.distance > GAME_CONFIG.LASER_MAX_DISTANCE || laser.mesh.position.y < 0) {
      engine.scene.remove(laser.mesh);
      engine.lasers.splice(i, 1);
    }
  }
}

/**
 * Smoothly follow the UAP with the camera from behind and above
 */
export function updateCamera(camera, uapPosition) {
  const cameraTarget = uapPosition.clone().add(new THREE.Vector3(0, 4, 12));
  camera.position.lerp(cameraTarget, 0.05);
  camera.lookAt(uapPosition);
}
