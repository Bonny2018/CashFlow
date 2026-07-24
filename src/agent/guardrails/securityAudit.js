/**
 * Security Audit System
 * Centralized audit tracker for AI Guardrail security violations and tool invocations.
 */
import { logSecurityAuditEvent } from '../dbService.js';

export async function auditViolation({ sessionId, userEmail, eventType, threatLevel, inputText, sanitizedText, actionTaken, details }) {
  console.warn(`[AI SECURITY GUARDRAIL ALERT] Type: ${eventType} | Threat: ${threatLevel} | Action: ${actionTaken}`);

  return await logSecurityAuditEvent({
    sessionId,
    userEmail,
    eventType,
    threatLevel,
    inputText,
    sanitizedText,
    actionTaken,
    details
  });
}
