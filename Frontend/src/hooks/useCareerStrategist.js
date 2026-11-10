import { useState, useCallback, useRef, useEffect } from "react";
import {
  generateCareerAssessment,
  CareerStrategistError,
  CAREER_STRATEGIST_ERROR_CODES,
} from "../services/careerStrategistService.js";

/**
 * Custom React hook for orchestrating Career Strategist assessments.
 *
 * Provides reactive assessment state, request deduplication, AbortController lifecycle
 * management, fallback detection, and error presentation.
 *
 * @returns {Object} Career strategist state and actions
 */
export function useCareerStrategist() {
  const [assessment, setAssessment] = useState(null);
  const [validationAudit, setValidationAudit] = useState(null);
  const [fallbackActive, setFallbackActive] = useState(false);
  const [fallbackMetadata, setFallbackMetadata] = useState(null);
  const [correlationId, setCorrelationId] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reference to in-flight AbortController for deterministic cancellation
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  // Track component mount status to avoid state updates on unmounted trees
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  /**
   * Triggers generation of an evidence-grounded career assessment.
   *
   * @param {Object} [params]
   * @param {string[]} [params.targetRoles]
   * @param {number} [params.yearsOfExperience]
   * @param {string} [params.userNotes]
   * @returns {Promise<Object|null>} Parsed assessment payload or null on error/abort
   */
  const generateAssessment = useCallback(async (params = {}) => {
    // Prevent duplicate concurrent requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const data = await generateCareerAssessment({
        ...params,
        signal: controller.signal,
      });

      if (!isMountedRef.current) return null;

      setAssessment(data.assessment || null);
      setValidationAudit(data.validationAudit || null);
      setFallbackActive(Boolean(data.fallbackActive));
      setFallbackMetadata(data.fallbackMetadata || null);
      setCorrelationId(data.correlationId || null);
      setTelemetry(data.telemetry || null);
      setError(null);

      return data;
    } catch (err) {
      if (!isMountedRef.current) return null;

      // Ignore user-initiated cancellation from triggering an error banner
      if (err instanceof CareerStrategistError && err.code === CAREER_STRATEGIST_ERROR_CODES.ABORTED) {
        return null;
      }

      setError(err);
      return null;
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Cancels the active in-flight assessment request.
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (isMountedRef.current) {
      setIsLoading(false);
    }
  }, []);

  /**
   * Resets assessment state back to initial empty state.
   */
  const reset = useCallback(() => {
    cancel();
    setAssessment(null);
    setValidationAudit(null);
    setFallbackActive(false);
    setFallbackMetadata(null);
    setCorrelationId(null);
    setTelemetry(null);
    setError(null);
  }, [cancel]);

  return {
    assessment,
    validationAudit,
    fallbackActive,
    fallbackMetadata,
    correlationId,
    telemetry,
    isLoading,
    error,
    generateAssessment,
    cancel,
    reset,
  };
}

export default useCareerStrategist;
