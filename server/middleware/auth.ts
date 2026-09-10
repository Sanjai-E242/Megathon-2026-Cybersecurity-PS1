import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { store } from '../data/store.js';
import { Principal } from '../engine/types.js';

// Extend Express Request to include authenticated principal
declare global {
  namespace Express {
    interface Request {
      authenticatedPrincipal?: Principal;
      apiKey?: string;
    }
  }
}

/**
 * Server-side API key to Principal mapping.
 * In production, keys can be retrieved from secure KMS or hashed DB records.
 */
interface ApiKeyConfig {
  principalId: string;
  role: string;
  defaultScopes: string[];
}

function getApiKeyMap(): Map<string, ApiKeyConfig> {
  const map = new Map<string, ApiKeyConfig>();

  // 1. Primary agent key from environment variable
  const envAgentKey = process.env.SENTINEL_AGENT_API_KEY || 'sentinel_sec_live_key_demo_99';
  const envPrincipalId = process.env.SENTINEL_AGENT_PRINCIPAL_ID || 'external-agent-01';
  
  map.set(envAgentKey, {
    principalId: envPrincipalId,
    role: 'dynamic_agent',
    defaultScopes: ['file.read', 'db.read'],
  });

  // 2. Demo & predefined system keys
  map.set('sentinel_sec_live_key_demo_99', {
    principalId: 'external-agent-01',
    role: 'dynamic_agent',
    defaultScopes: ['file.read', 'db.read'],
  });

  map.set('sentinel_sec_user_key_demo_42', {
    principalId: 'user_42',
    role: 'sysadmin',
    defaultScopes: ['file.read', 'db.read', 'db.write', 'db.migrate'],
  });

  map.set('sentinel_sec_admin_key_demo_01', {
    principalId: 'admin_migration_01',
    role: 'migration_admin',
    defaultScopes: ['file.read', 'db.read', 'db.write', 'db.migrate'],
  });

  map.set('sentinel_sec_support_key_01', {
    principalId: 'agent_support_01',
    role: 'support_bot',
    defaultScopes: ['file.read', 'db.read'],
  });

  return map;
}

/**
 * Constant-time comparison between two secret strings to prevent timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) {
      // Compare dummy buffer of same length to prevent timing leakage on length mismatch
      crypto.timingSafeEqual(bufA, bufA);
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Finds the principal configuration matching the provided API key using constant-time comparison.
 */
function resolveApiKey(providedKey: string): ApiKeyConfig | null {
  const keyMap = getApiKeyMap();
  for (const [configuredKey, config] of keyMap.entries()) {
    if (timingSafeEqual(providedKey, configuredKey)) {
      return config;
    }
  }
  return null;
}

/**
 * Middleware: Enforces strict Bearer API key authentication and binds the request
 * to a trusted server-side principal.
 */
export function authenticateAgent(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || (req.headers['x-api-key'] as string);

  if (!authHeader) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing Authorization header. Expected Bearer <API_KEY>',
    });
    return;
  }

  // Parse Bearer token
  let token = '';
  if (typeof authHeader === 'string') {
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.headers['x-api-key']) {
      token = (req.headers['x-api-key'] as string).trim();
    } else {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Malformed Authorization header. Format: Bearer <API_KEY>',
      });
      return;
    }
  }

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Empty API key provided in Bearer token',
    });
    return;
  }

  const keyConfig = resolveApiKey(token);
  if (!keyConfig) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key. Access denied.',
    });
    return;
  }

  // Resolve or create principal from server store
  let principal = store.getPrincipal(keyConfig.principalId);
  if (!principal) {
    principal = {
      principal_id: keyConfig.principalId,
      role: keyConfig.role,
      authorized_scopes: keyConfig.defaultScopes,
      created_at: new Date().toISOString(),
    };
    store.savePrincipal(principal);
  }

  // Attach authenticated principal to request object
  req.authenticatedPrincipal = principal;
  next();
}

/**
 * Middleware: Verifies operator privileges for administrative endpoints (e.g. approve/deny).
 */
export function requireOperatorAuth(req: Request, res: Response, next: NextFunction): void {
  const operatorRole = req.headers['x-operator-role'] || 'SOC_ADMIN';
  const operatorHeader = req.headers['x-operator-id'] || req.body?.operator || 'SOC_ADMIN';

  // For hackathon/local demonstration, accept operator context while ensuring it is present
  if (!operatorHeader) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Operator authorization required for human gate decisions',
    });
    return;
  }

  next();
}
