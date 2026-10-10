/**
 * Experimental OFFLINE policy reference, not a deployed broker or an authentication system.
 * The trustedContext and grant must be supplied by a real verified broker, never by an AI.
 */
const deny = reason => Object.freeze({ decision: 'deny', reason });
export function evaluateAgentRead(request, grant, trustedContext, now = Date.now()) {
  if (!trustedContext || trustedContext.verifiedPrincipal !== true ||
      typeof trustedContext.principal !== 'string' || !trustedContext.principal) return deny('unverified-principal');
  if (!request || request.action !== 'read') return deny('unsupported-action');
  if (!grant || grant.action !== 'read' || typeof grant.id !== 'string' || !grant.id ||
      grant.principal !== trustedContext.principal || request.principal !== trustedContext.principal) {
    return deny('principal-or-grant-mismatch');
  }
  if (typeof request.resource !== 'string' || !request.resource ||
      request.resource !== grant.resource) return deny('resource-mismatch');
  if (!Number.isSafeInteger(grant.issuedAt) || !Number.isSafeInteger(grant.expiresAt) ||
      !Number.isSafeInteger(now) || grant.issuedAt > now || grant.expiresAt <= now ||
      grant.expiresAt - grant.issuedAt > 3600000) return deny('expired-or-invalid-grant');
  return Object.freeze({ decision: 'allow', reason: 'exact-read-grant', grantId: grant.id });
}
