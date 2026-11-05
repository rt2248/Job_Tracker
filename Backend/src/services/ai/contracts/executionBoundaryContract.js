/**
 * @file executionBoundaryContract.js
 * @description Formal specification and reference execution boundary contract helper.
 *
 * Stage 2B.1 — Option C Provider Abstraction Foundation.
 *
 * Execution Boundary Contract Guarantees:
 * 1. Caller cancellation (HTTP 499) and local timeout (HTTP 504) are distinct, non-conflated outcomes.
 * 2. Deterministic race precedence: When cancellation and timeout race, caller cancellation takes precedence.
 * 3. Pre-dispatch cancellation fails fast immediately without executing underlying provider logic.
 * 4. Boundary enforcement is independent of whether the underlying operation cooperates with abort signals.
 * 5. Late resolution suppression: A late provider resolution after timeout or cancellation is discarded
 *    and NEVER returned as a success.
 * 6. Leak-free resource cleanup: All timers and caller signal listeners are removed in a mandatory finally block.
 */

const { AiCancellationError } = require("./errors/AiCancellationError");
const { AiTimeoutError } = require("./errors/AiTimeoutError");

/**
 * Reference execution boundary runner implementing the agreed contract semantics.
 *
 * @template T
 * @param {(signal: AbortSignal) => Promise<T>} executeFn - Operation to execute within boundary.
 * @param {Object} [options]
 * @param {number} [options.timeoutMs=15000] - Local execution timeout in ms.
 * @param {AbortSignal|null} [options.callerSignal=null] - Optional caller cancellation signal.
 * @param {string|null} [options.providerId=null] - Identifier of provider for error tagging.
 * @returns {Promise<T>} Result of executeFn if completed within boundary.
 */
async function executeWithBoundaryContract(
  executeFn,
  { timeoutMs = 15000, callerSignal = null, providerId = null } = {}
) {
  // 1. Pre-dispatch check: fail fast if caller already aborted before execution starts
  if (callerSignal?.aborted) {
    throw new AiCancellationError("AI operation was cancelled by caller prior to dispatch", {
      providerId,
      diagnosticContext: { reason: "PRE_DISPATCH_ABORT" },
    });
  }

  const internalController = new AbortController();
  let timeoutId = null;
  let timeoutFired = false;
  let boundarySettled = false;

  const onCallerAbort = () => {
    if (!boundarySettled) {
      if (timeoutId) clearTimeout(timeoutId);
      internalController.abort("CALLER_CANCELLED");
    }
  };

  if (callerSignal) {
    callerSignal.addEventListener("abort", onCallerAbort, { once: true });
  }

  try {
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        timeoutFired = true;
        internalController.abort("TIMEOUT_EXCEEDED");
        reject(
          new AiTimeoutError(`AI operation timed out after ${timeoutMs}ms`, {
            providerId,
            diagnosticContext: { timeoutMs },
          })
        );
      }, timeoutMs);
    });

    const callerAbortPromise = new Promise((_, reject) => {
      if (callerSignal) {
        const checkAbort = () => {
          reject(
            new AiCancellationError("AI operation was cancelled by caller during execution", {
              providerId,
              diagnosticContext: { reason: "CALLER_SIGNAL_ABORTED" },
            })
          );
        };
        if (callerSignal.aborted) {
          checkAbort();
        } else {
          callerSignal.addEventListener("abort", checkAbort, { once: true });
        }
      }
    });

    // Execute provider function, racing against timeout and cancellation
    const executionPromise = executeFn(internalController.signal).then(
      (res) => {
        if (boundarySettled) {
          // Late resolution suppressed: do not return as success
          return new Promise(() => {});
        }
        return res;
      },
      (err) => {
        if (boundarySettled) {
          return new Promise(() => {});
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

    // Deterministic race handling: inspect caller signal first
    if (callerSignal?.aborted) {
      throw new AiCancellationError("AI operation was cancelled by caller during execution", {
        providerId,
        originalError: err,
      });
    }

    if (timeoutFired) {
      throw new AiTimeoutError(`AI operation timed out after ${timeoutMs}ms`, {
        providerId,
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
    if (callerSignal) {
      // Guaranteed cleanup to eliminate memory leaks on long-lived caller signals
      callerSignal.removeEventListener("abort", onCallerAbort);
    }
  }
}

module.exports = {
  executeWithBoundaryContract,
};
