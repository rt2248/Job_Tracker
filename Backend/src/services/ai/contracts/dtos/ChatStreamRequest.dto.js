/**
 * @file ChatStreamRequest.dto.js
 * @description Request DTO specification and validation for streaming conversational AI chat.
 *
 * Stage 2B.1 — Option C Provider Abstraction Foundation.
 */

/**
 * @typedef {Object} ChatMessageDTO
 * @property {"system"|"user"|"assistant"} role - Role of the message sender.
 * @property {string} content - Message text content.
 */

/**
 * @typedef {Object} ChatStreamOptions
 * @property {number} [timeoutMs] - Execution timeout boundary in milliseconds.
 * @property {AbortSignal} [signal] - Caller cancellation AbortSignal.
 * @property {number} [maxTokens] - Optional maximum token generation cap.
 */

/**
 * @typedef {Object} ChatStreamRequestDTO
 * @property {string} correlationId - Unique tracing UUID (v4).
 * @property {ChatMessageDTO[]} messages - Prior and current conversation turns.
 * @property {ChatStreamOptions} [options] - Stream lifecycle options.
 */

/**
 * Validates a ChatStreamRequestDTO structure.
 *
 * @param {any} dto - Candidate request object.
 * @returns {{ isValid: boolean, errors: string[] }} Validation result and error descriptions.
 */
function validateChatStreamRequest(dto) {
  const errors = [];

  if (!dto || typeof dto !== "object" || Array.isArray(dto)) {
    return { isValid: false, errors: ["Request must be a non-null object"] };
  }

  if (typeof dto.correlationId !== "string" || dto.correlationId.trim().length === 0) {
    errors.push("correlationId must be a non-empty string");
  }

  if (!Array.isArray(dto.messages) || dto.messages.length === 0) {
    errors.push("messages must be a non-empty array");
  } else {
    const validRoles = new Set(["system", "user", "assistant"]);
    dto.messages.forEach((msg, idx) => {
      if (!msg || typeof msg !== "object") {
        errors.push(`messages[${idx}] must be a valid object`);
      } else {
        if (!validRoles.has(msg.role)) {
          errors.push(`messages[${idx}].role must be one of: system, user, assistant`);
        }
        if (typeof msg.content !== "string") {
          errors.push(`messages[${idx}].content must be a string`);
        }
      }
    });
  }

  if (dto.options !== undefined && dto.options !== null) {
    if (typeof dto.options !== "object" || Array.isArray(dto.options)) {
      errors.push("options must be a valid object if provided");
    } else {
      if (dto.options.timeoutMs !== undefined && (typeof dto.options.timeoutMs !== "number" || dto.options.timeoutMs <= 0)) {
        errors.push("options.timeoutMs must be a positive number");
      }
      if (dto.options.signal !== undefined && !(dto.options.signal instanceof AbortSignal)) {
        errors.push("options.signal must be an instance of AbortSignal");
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateChatStreamRequest,
};
