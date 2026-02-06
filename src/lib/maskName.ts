/**
 * Name Masking Utility
 * Privacy-preserving display of member identities
 * Shows first 3 characters followed by asterisks
 */

/**
 * Mask a display name or member ID for privacy
 * Examples:
 * - "TERESITA" -> "TER*"
 * - "ABC-2026-0001" -> "ABC*"
 * - "Jonathan" -> "JON*"
 */
export function maskDisplayName(name: string | null | undefined): string {
  if (!name || name.length === 0) return '***';
  
  // Handle member ID format (ABC-2026-XXXX)
  if (name.includes('-')) {
    const parts = name.split('-');
    if (parts.length >= 1) {
      const prefix = parts[0].slice(0, 3).toUpperCase();
      return `${prefix}*`;
    }
  }
  
  // Regular name: take first 3 chars + asterisk
  const firstThree = name.slice(0, 3).toUpperCase();
  return `${firstThree}*`;
}

/**
 * Generate a cryptic alias from member ID
 * Preserves some traceability while maintaining privacy
 * Examples:
 * - "ABC-2026-0001" -> "A***1"
 * - "ABC-2026-5432" -> "A***2"
 */
export function generateCrypticAlias(memberId: string | null | undefined): string {
  if (!memberId) return 'A***?';
  
  const parts = memberId.split('-');
  if (parts.length >= 3) {
    const firstChar = parts[0][0];
    const lastChar = parts[2].slice(-1);
    return `${firstChar}***${lastChar}`;
  }
  
  // Fallback for non-standard IDs
  if (memberId.length > 2) {
    return `${memberId[0]}***${memberId[memberId.length - 1]}`;
  }
  
  return 'A***?';
}

/**
 * Get initials from a display name
 * For avatar fallbacks
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  
  return name.slice(0, 2).toUpperCase();
}
