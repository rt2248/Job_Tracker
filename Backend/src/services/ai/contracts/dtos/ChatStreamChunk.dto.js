/**
 * @file ChatStreamChunk.dto.js
 * @description Incremental token chunk DTO for streaming responses.
 *
 * Stage 2B.1 — Option C Provider Abstraction Foundation.
 */

/**
 * @typedef {import('./RawProviderAssessmentOutput.dto').ProviderTelemetryMetadata} ProviderTelemetryMetadata
 */

/**
 * @typedef {Object} ChatStreamChunkDTO
 * @property {number} chunkIndex - Monotonically increasing zero-based chunk index.
 * @property {string} textDelta - Incremental text tokens received from model.
 * @property {boolean} isComplete - True if this is the final terminal chunk.
 * @property {"stop"|"length"|"abort"|"error"|null} finishReason - Completion state or termination reason.
 * @property {ProviderTelemetryMetadata|null} [telemetry] - Final token and latency telemetry (populated on terminal chunk).
 */

/**
 * Factory helper for creating ChatStreamChunkDTO.
 *
 * @param {Object} params
 * @param {number} params.chunkIndex
 * @param {string} params.textDelta
 * @param {boolean} [params.isComplete=false]
 * @param {"stop"|"length"|"abort"|"error"|null} [params.finishReason=null]
 * @param {ProviderTelemetryMetadata|null} [params.telemetry=null]
 * @returns {ChatStreamChunkDTO}
 */
function createChatStreamChunk({
  chunkIndex,
  textDelta,
  isComplete = false,
  finishReason = null,
  telemetry = null,
}) {
  if (typeof chunkIndex !== "number" || chunkIndex < 0) {
    throw new TypeError("chunkIndex must be a non-negative number");
  }
  if (typeof textDelta !== "string") {
    throw new TypeError("textDelta must be a string");
  }

  return {
    chunkIndex,
    textDelta,
    isComplete: Boolean(isComplete),
    finishReason: finishReason || null,
    telemetry: telemetry || null,
  };
}

module.exports = {
  createChatStreamChunk,
};
