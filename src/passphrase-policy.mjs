/**
 * Offline, conservative NEW-Vault onboarding preflight.
 *
 * This is a short local denylist/pattern screen, NOT a strength meter or breach
 * corpus. Does not normalize or modify the actual passphrase sent to scrypt.
 * Existing v1 unlock passphrases remain backward compatible.
 */
const BLOCKED = new Set([
  'passwordpassword',
  'password12345678',
  '123456789012345',
  '1234567890123456',
  'qwertyuiopasdfgh',
  'letmeinletmein',
  'correcthorsebatterystaple',
  'carnoacarnoacarnoa'
]);

export function validateNewMasterPassphrase(passphrase) {
  if (typeof passphrase !== 'string') {
    throw new Error('Invalid master passphrase.');
  }
  const characters = [...passphrase];
  if (characters.length < 15) {
    throw new Error('New master passphrases require at least 15 Unicode characters.');
  }
  if (Buffer.byteLength(passphrase, 'utf8') > 4096) {
    throw new Error('Master passphrase exceeds the 4096-byte safety limit.');
  }
  // NFKC is used only to compare predictable strings; do not alter the KDF input.
  const compareValue = passphrase.normalize('NFKC').toLowerCase().trim();
  if (!compareValue) {
    throw new Error('Master passphrase must contain non-whitespace characters.');
  }
  if (BLOCKED.has(compareValue)) {
    throw new Error('Common or predictable passphrase. Choose a different one.');
  }
  // Reject a wholly repeating pattern, without rejecting normal words inside
  // an otherwise long passphrase or imposing character-class composition rules.
  const normalized = [...compareValue];
  for (let width = 1; width <= Math.min(12, Math.floor(normalized.length / 2)); width++) {
    if (normalized.length % width !== 0) continue;
    const unit = normalized.slice(0, width).join('');
    if (unit.repeat(normalized.length / width) === compareValue) {
      throw new Error('Repeating master passphrase pattern is too predictable.');
    }
  }
  return true;
}
