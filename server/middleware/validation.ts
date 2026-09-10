import { Request, Response, NextFunction } from 'express';

const MAX_STRING_LENGTH = 256;
const MAX_TARGET_LENGTH = 512;
const MAX_METADATA_KEYS = 50;

/**
 * Checks for prototype pollution attack vectors (__proto__, constructor, prototype)
 */
function hasPrototypePollution(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;

  const forbiddenKeys = ['__proto__', 'constructor', 'prototype'];

  const propNames = Object.getOwnPropertyNames(obj);
  for (const key of propNames) {
    if (forbiddenKeys.includes(key)) {
      return true;
    }
  }

  for (const key of Object.keys(obj)) {
    if (forbiddenKeys.includes(key)) {
      return true;
    }
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (hasPrototypePollution(obj[key])) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Validates the body of POST /api/actions
 */
export function validateActionInput(req: Request, res: Response, next: NextFunction): void {
  const body = req.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    res.status(400).json({
      error: 'ValidationError',
      message: 'Request body must be a valid JSON object',
    });
    return;
  }

  // Check for prototype pollution attempt
  if ((req as any).prototypePollutionDetected || hasPrototypePollution(body)) {
    res.status(400).json({
      error: 'ValidationError',
      message: 'Payload contains illegal object properties (prototype pollution attempt detected)',
    });
    return;
  }

  const {
    operation,
    scope_required,
    target,
    resource_type,
    session_id,
    action_id,
    metadata,
    principal_id,
  } = body;

  // 1. Required fields: operation, scope_required, target
  if (!operation || typeof operation !== 'string') {
    res.status(400).json({
      error: 'ValidationError',
      message: 'Field "operation" is required and must be a non-empty string',
    });
    return;
  }

  if (operation.length > MAX_STRING_LENGTH) {
    res.status(400).json({
      error: 'ValidationError',
      message: `Field "operation" exceeds maximum allowed length (${MAX_STRING_LENGTH} chars)`,
    });
    return;
  }

  if (!scope_required || typeof scope_required !== 'string') {
    res.status(400).json({
      error: 'ValidationError',
      message: 'Field "scope_required" is required and must be a non-empty string',
    });
    return;
  }

  if (scope_required.length > MAX_STRING_LENGTH) {
    res.status(400).json({
      error: 'ValidationError',
      message: `Field "scope_required" exceeds maximum allowed length (${MAX_STRING_LENGTH} chars)`,
    });
    return;
  }

  if (!target || typeof target !== 'string') {
    res.status(400).json({
      error: 'ValidationError',
      message: 'Field "target" is required and must be a non-empty string',
    });
    return;
  }

  if (target.length > MAX_TARGET_LENGTH) {
    res.status(400).json({
      error: 'ValidationError',
      message: `Field "target" exceeds maximum allowed length (${MAX_TARGET_LENGTH} chars)`,
    });
    return;
  }

  // Optional string fields type and length validation
  if (resource_type !== undefined) {
    if (typeof resource_type !== 'string' || resource_type.length > MAX_STRING_LENGTH) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Field "resource_type" must be a valid string',
      });
      return;
    }
  }

  if (session_id !== undefined) {
    if (typeof session_id !== 'string' || session_id.length > MAX_STRING_LENGTH) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Field "session_id" must be a valid string',
      });
      return;
    }
  }

  if (action_id !== undefined) {
    if (typeof action_id !== 'string' || action_id.length > MAX_STRING_LENGTH) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Field "action_id" must be a valid string',
      });
      return;
    }
  }

  // Validate metadata structure and depth if present
  if (metadata !== undefined) {
    if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Field "metadata" must be a key-value object',
      });
      return;
    }

    const keys = Object.keys(metadata);
    if (keys.length > MAX_METADATA_KEYS) {
      res.status(400).json({
        error: 'ValidationError',
        message: `Field "metadata" contains too many keys (max: ${MAX_METADATA_KEYS})`,
      });
      return;
    }

    // Check row_count_estimate if supplied
    if (metadata.row_count_estimate !== undefined) {
      const rowCount = Number(metadata.row_count_estimate);
      if (isNaN(rowCount) || rowCount < 0) {
        res.status(400).json({
          error: 'ValidationError',
          message: 'metadata.row_count_estimate must be a non-negative number',
        });
        return;
      }
    }
  }

  // Security Binding Check:
  // If request contains principal_id, ensure client is not attempting to override or spoof another principal
  if (req.authenticatedPrincipal) {
    if (principal_id && typeof principal_id === 'string') {
      const clientPrincipal = principal_id.trim();
      const authPrincipal = req.authenticatedPrincipal.principal_id;
      if (clientPrincipal !== authPrincipal) {
        // Enforce principal isolation: reject spoofing attempt with 403 Forbidden
        res.status(403).json({
          error: 'Forbidden',
          message: `Principal spoofing attempt detected. API key is bound to '${authPrincipal}', cannot act as '${clientPrincipal}'.`,
        });
        return;
      }
    }
  }

  next();
}
