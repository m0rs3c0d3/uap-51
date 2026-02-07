/**
 * PID Controller for autonomous navigation
 * 
 * PID stands for Proportional-Integral-Derivative, a control loop
 * mechanism that calculates an error value as the difference between
 * a desired setpoint and a measured process variable.
 * 
 * - P (Proportional): Reacts to current error. Higher = more aggressive response
 * - I (Integral): Accumulates past errors. Helps eliminate steady-state offset
 * - D (Derivative): Predicts future error based on rate of change. Adds damping
 * 
 * The UAP uses three PID controllers (X, Y, Z axes) to smoothly navigate
 * toward safe positions while evading incoming threats.
 */
export class PIDController {
  constructor(kp, ki, kd, maxOutput = 80) {
    this.kp = kp;           // Proportional gain
    this.ki = ki;           // Integral gain
    this.kd = kd;           // Derivative gain
    this.maxOutput = maxOutput;
    
    this.integral = 0;      // Accumulated error over time
    this.prevError = 0;     // Previous error for derivative calculation
    
    // For visualization
    this.lastP = 0;
    this.lastI = 0;
    this.lastD = 0;
  }

  /**
   * Calculate control output based on error
   * @param {number} error - Difference between target and current position
   * @param {number} dt - Delta time since last update
   * @returns {number} - Control output (force to apply)
   */
  calculate(error, dt) {
    // Proportional term: directly proportional to error
    this.lastP = this.kp * error;
    
    // Integral term: accumulates error over time
    // Clamped to prevent "integral windup"
    this.integral = Math.max(-15, Math.min(15, this.integral + error * dt));
    this.lastI = this.ki * this.integral;
    
    // Derivative term: rate of change of error
    const derivative = (error - this.prevError) / dt;
    this.lastD = this.kd * derivative;
    this.prevError = error;
    
    // Sum all terms and clamp to max output
    const output = this.lastP + this.lastI + this.lastD;
    return Math.max(-this.maxOutput, Math.min(this.maxOutput, output));
  }

  /**
   * Reset controller state (call when switching modes)
   */
  reset() {
    this.integral = 0;
    this.prevError = 0;
    this.lastP = 0;
    this.lastI = 0;
    this.lastD = 0;
  }

  /**
   * Get current PID values for visualization
   */
  getValues() {
    return {
      p: this.lastP,
      i: this.lastI,
      d: this.lastD
    };
  }
}

export default PIDController;
