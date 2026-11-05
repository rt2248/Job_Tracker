/**
 * @file minimizedRequestRegistry.js
 * @description Module-private identity registry enforcing mandatory minimization at the AI provider boundary.
 *
 * Stage 2B.4A — Option C Provider Abstraction Foundation.
 *
 * Security Requirements:
 * 1. Uses a module-private WeakSet so that object identities cannot be forged from outside the module.
 * 2. Only the trusted telemetry minimizer can register legitimate minimized requests.
 * 3. Provider adapters verify object presence in this registry before accepting any request.
 */

// Module-private WeakSet storing verified minimized request object identities
const _minimizedIdentityRegistry = new WeakSet();

/**
 * Registers an object identity as a verified, minimized CareerAssessmentRequest.
 * Must only be called by the trusted telemetry minimizer.
 *
 * @param {Object} obj
 * @returns {Object} The registered object.
 */
function registerMinimizedRequest(obj) {
  if (obj && (typeof obj === "object" || typeof obj === "function")) {
    _minimizedIdentityRegistry.add(obj);
  }
  return obj;
}

/**
 * Verifies whether an object identity was legitimately produced by the telemetry minimizer.
 *
 * @param {any} obj
 * @returns {boolean} True if the object was registered by the minimizer; false otherwise.
 */
function isVerifiedMinimizedRequest(obj) {
  if (!obj || (typeof obj !== "object" && typeof obj !== "function")) {
    return false;
  }
  return _minimizedIdentityRegistry.has(obj);
}

module.exports = {
  registerMinimizedRequest,
  isVerifiedMinimizedRequest,
};
