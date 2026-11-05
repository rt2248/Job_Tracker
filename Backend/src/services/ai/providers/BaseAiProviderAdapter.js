/**
 * @file BaseAiProviderAdapter.js
 * @description Concrete shared base class implementing common AI provider mechanics.
 *
 * Stage 2B.2 — Option C Provider Abstraction Foundation.
 *
 * Responsibilities:
 * 1. Configuration validation and safe credential masking.
 * 2. Standardized execution boundary (_withExecutionBoundary) with leak-free single-listener cancellation.
 * 3. Safe diagnostic allowlisting preventing credential, PII, and circular-reference leakage.
 * 4. Deterministic non-transmission retry policy (max 1 retry, strictly on pre-write connection refusal).
 * 5. Abstract capability interface declarations for concrete subclasses.
 */

const { AiError, AI_ERROR_CODES, ALLOWED_DIAGNOSTIC_KEYS } = require("../contracts/errors/AiError");
const { AiCancellationError } = require("../contracts/errors/AiCancellationError");
const { AiTimeoutError } = require("../contracts/errors/AiTimeoutError");
const { AiConfigurationError } = require("../contracts/errors/AiConfigurationError");
const { AiNetworkError } = require("../contracts/errors/AiNetworkError");

class BaseAiProviderAdapter {
  /**
   * @param {Object} options
   * @param {string} options.providerId - Unique provider ID (e.g., "groq").
   * @param {string} options.modelIdentifier - Target model ID (e.g., "openai/gpt-oss-120b").
   * @param {string|null} [options.apiKey=null] - Configured API credential (never logged or exposed).
   * @param {number} [options.timeoutMs=15000] - Default execution boundary timeout in milliseconds.
   * @param {Function|null} [options.transport=null] - Optional HTTP transport function for offline testing.
   */
  constructor({ providerId, modelIdentifier, apiKey = null, timeoutMs = 15000, transport = null } = {}) {
    if (!providerId || typeof providerId !== "string" || providerId.trim().length === 0) {
      throw new AiConfigurationError("Adapter initialization failed: providerId must be a non-empty string");
    }
    if (!modelIdentifier || typeof modelIdentifier !== "string" || modelIdentifier.trim().length === 0) {
      throw new AiConfigurationError("Adapter initialization failed: modelIdentifier must be a non-empty string");
    }
    if (typeof timeoutMs !== "number" || timeoutMs <= 0 || !Number.isFinite(timeoutMs)) {
      throw new AiConfigurationError("Adapter initialization failed: timeoutMs must be a positive finite number");
    }

    this._providerId = providerId.trim();
    this._modelIdentifier = modelIdentifier.trim();
    this._apiKey = apiKey && typeof apiKey === "string" ? apiKey.trim() : null;
    this._timeoutMs = timeoutMs;
    this._transport = typeof transport === "function" ? transport : null;
  }

  get providerId() {
    return this._providerId;
  }

  get modelIdentifier() {
    return this._modelIdentifier;
  }

  get timeoutMs() {
    return this._timeoutMs;
  }

  /**
   * Protected status indicator. NEVER returns key characters, prefixes, or suffixes.
   *
   * @returns {string|null} "[CONFIGURED_PROTECTED]" if configured; null otherwise.
   */
  getMaskedKey() {
    if (!this._apiKey || this._apiKey.length === 0) {
      return null;
    }
    return "[CONFIGURED_PROTECTED]";
  }

  /**
   * Feature capabilities matrix. Must be implemented by concrete subclasses.
   *
   * @abstract
   * @returns {import('../contracts/IAiBaseProvider').ProviderCapabilities}
   */
  get capabilities() {
    throw new Error("Getter 'capabilities' must be implemented by concrete subclass");
  }

  /**
   * Non-generation health check verifying endpoint accessibility.
   *
   * @abstract
   * @returns {Promise<import('../contracts/IAiBaseProvider').EndpointAccessibilityCheck>}
   */
  async verifyAccessibility() {
    throw new Error("Method 'verifyAccessibility()' must be implemented by concrete subclass");
  }

  /**
   * Sanitizes diagnostic context using an explicit allowlist of safe scalar properties.
   * Prevents credential, raw request/response body, PII, and circular-reference leakage.
   *
   * @protected
   * @param {Object} [rawContext]
   * @returns {Object|null}
   */
  _buildDiagnosticContext(rawContext) {
    if (!rawContext || typeof rawContext !== "object" || Array.isArray(rawContext)) {
      return null;
    }

    const sanitized = {};
    for (const [key, val] of Object.entries(rawContext)) {
      if (ALLOWED_DIAGNOSTIC_KEYS.has(key)) {
        if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
          sanitized[key] = val;
        }
      }
    }

    return Object.keys(sanitized).length > 0 ? sanitized : null;
  }

  /**
   * Memory-safe execution boundary with deterministic cancellation and timeout race handling.
   * Incorporates Stage 2B.1-R finding: single-listener cancellation cleanup in finally.
   *
   * @protected
   * @template T
   * @param {(signal: AbortSignal) => Promise<T>} executeFn - Provider dispatch function.
   * @param {Object} [options]
   * @param {number} [options.timeoutMs] - Execution timeout boundary.
   * @param {AbortSignal|null} [options.callerSignal] - Caller cancellation signal.
   * @returns {Promise<T>}
   */
  async _withExecutionBoundary(executeFn, { timeoutMs = this._timeoutMs, callerSignal = null } = {}) {
    // 1. Fail fast if caller already aborted before dispatch
    if (callerSignal?.aborted) {
      throw new AiCancellationError("AI operation was cancelled by caller prior to dispatch", {
        providerId: this.providerId,
        diagnosticContext: this._buildDiagnosticContext({
          providerId: this.providerId,
          modelIdentifier: this.modelIdentifier,
          reason: "PRE_DISPATCH_ABORT",
        }),
      });
    }

    const internalController = new AbortController();
    let timeoutId = null;
    let timeoutFired = false;
    let boundarySettled = false;
    let onCallerAbort = null;

    try {
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          timeoutFired = true;
          internalController.abort("TIMEOUT_EXCEEDED");
          reject(
            new AiTimeoutError(`AI operation timed out after ${timeoutMs}ms`, {
              providerId: this.providerId,
              diagnosticContext: this._buildDiagnosticContext({
                providerId: this.providerId,
                modelIdentifier: this.modelIdentifier,
                timeoutMs,
              }),
            })
          );
        }, timeoutMs);
      });

      const callerAbortPromise = new Promise((_, reject) => {
        if (callerSignal) {
          onCallerAbort = () => {
            if (!boundarySettled) {
              if (timeoutId) clearTimeout(timeoutId);
              internalController.abort("CALLER_CANCELLED");
              reject(
                new AiCancellationError("AI operation was cancelled by caller during execution", {
                  providerId: this.providerId,
                  diagnosticContext: this._buildDiagnosticContext({
                    providerId: this.providerId,
                    modelIdentifier: this.modelIdentifier,
                    reason: "CALLER_SIGNAL_ABORTED",
                  }),
                })
              );
            }
          };

          if (callerSignal.aborted) {
            onCallerAbort();
          } else {
            callerSignal.addEventListener("abort", onCallerAbort, { once: true });
          }
        }
      });

      // Execute provider operation, racing against timeout and caller abort
      const executionPromise = executeFn(internalController.signal).then(
        (res) => {
          if (boundarySettled) {
            // Late resolution suppressed: do not return as success
            return null;
          }
          return res;
        },
        (err) => {
          if (boundarySettled) {
            // Late rejection suppressed: prevent unhandled promise rejection without allocating hanging promises
            return null;
          }
          throw err;
        }
      );

      const racePromises = [executionPromise, timeoutPromise];
      if (callerSignal) {
        racePromises.push(callerAbortPromise);
      }

      const result = await Promise.race(racePromises);
      boundarySettled = true;
      return result;
    } catch (err) {
      boundarySettled = true;

      // Deterministic race resolution: caller cancellation takes precedence
      if (callerSignal?.aborted) {
        throw new AiCancellationError("AI operation was cancelled by caller during execution", {
          providerId: this.providerId,
          originalError: err,
        });
      }

      if (timeoutFired) {
        throw new AiTimeoutError(`AI operation timed out after ${timeoutMs}ms`, {
          providerId: this.providerId,
          originalError: err,
        });
      }

      throw err;
    } finally {
      boundarySettled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (callerSignal && onCallerAbort) {
        // Guaranteed single-listener cleanup on all return/throw paths
        callerSignal.removeEventListener("abort", onCallerAbort);
        onCallerAbort = null;
      }
    }
  }

  /**
   * Deterministically evaluates whether a network error established non-transmission.
   * Only pre-transmission errors (refused connection before writing headers/body) qualify.
   * Mid-stream disconnects, reset connections, and ambiguous drops return false.
   *
   * @protected
   * @param {any} err - Caught network error.
   * @returns {boolean} True if non-transmission is proven; false otherwise.
   */
  _isNonTransmissionError(err) {
    if (!err) return false;

    const code = err.code || err.cause?.code || "";
    // Pre-write refusal or DNS failure
    return code === "ECONNREFUSED" || code === "ENOTFOUND";
  }

  /**
   * Executes a network operation with strict non-transmission retry semantics.
   * - Max 1 retry.
   * - Retries ONLY when non-transmission is deterministically proven.
   * - Never retries ambiguous drops, 502, 503, 504, timeouts, or cancellations.
   *
   * @protected
   * @template T
   * @param {(attempt: number) => Promise<T>} dispatchFn
   * @param {Object} [options]
   * @param {AbortSignal|null} [options.signal]
   * @returns {Promise<T>}
   */
  async _executeWithRetry(dispatchFn, { signal = null } = {}) {
    let attempt = 0;

    while (true) {
      if (signal?.aborted) {
        throw new AiCancellationError("Operation aborted before attempt dispatch", {
          providerId: this.providerId,
        });
      }

      try {
        return await dispatchFn(attempt);
      } catch (err) {
        // Evaluate retry eligibility
        const canRetry = attempt === 0 && this._isNonTransmissionError(err) && !signal?.aborted;

        if (canRetry) {
          attempt++;
          continue;
        }

        // If non-retryable network failure, normalize to AiNetworkError if not already AiError
        if (!(err instanceof AiError)) {
          throw new AiNetworkError(err.message || "Network communication error with AI provider", {
            providerId: this.providerId,
            originalError: err,
            diagnosticContext: this._buildDiagnosticContext({
              providerId: this.providerId,
              modelIdentifier: this.modelIdentifier,
              attemptCount: attempt + 1,
              networkErrorCode: err.code || err.cause?.code || "NETWORK_FAIL",
            }),
          });
        }

        throw err;
      }
    }
  }

  /**
   * Safe fetch dispatcher using configured transport or global fetch.
   *
   * @protected
   * @param {string} url
   * @param {Object} init
   * @returns {Promise<Response>}
   */
  async _fetch(url, init) {
    const fetchFn = this._transport || globalThis.fetch;
    if (typeof fetchFn !== "function") {
      throw new AiConfigurationError("No HTTP transport available for provider adapter");
    }
    return fetchFn(url, init);
  }
}

module.exports = {
  BaseAiProviderAdapter,
};
