import { Action, AuthResult, Principal } from './types.js';

export class AuthorizationEngine {
  public checkAuth(action: Action, principal: Principal): AuthResult {
    if (!principal) {
      return {
        auth_ok: false,
        reason: `Unknown or unauthenticated principal: ${action.principal_id}`,
      };
    }

    if (!principal.authorized_scopes || !Array.isArray(principal.authorized_scopes)) {
      return {
        auth_ok: false,
        reason: `Principal ${principal.principal_id} has no valid authorized scopes configured`,
      };
    }

    const hasScope = principal.authorized_scopes.includes(action.scope_required);
    if (!hasScope) {
      return {
        auth_ok: false,
        reason: `Scope '${action.scope_required}' not authorized for principal '${principal.principal_id}' (Role: ${principal.role})`,
      };
    }

    return {
      auth_ok: true,
    };
  }
}
