/**
 * Generates a secure random token for patient sessions
 */
export function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

/**
 * Validates an Identification Card Number (ICN)
 * Rules:
 * - Must be alphanumeric
 * - Must be between 8-15 characters
 * - Cannot contain special characters
 */
export function validateICN(icn: string): boolean {
  // Check if ICN is exactly 16 digits
  return /^\d{16}$/.test(icn);
}

/**
 * Masks a patient's Identification Card Number for display
 * Shows only the last 4 characters, masks the rest with asterisks
 */
export function maskICN(icn: string): string {
  if (!icn || icn.length <= 4) return icn

  const visiblePart = icn.slice(-4)
  const maskedPart = "*".repeat(icn.length - 4)

  return maskedPart + visiblePart
}

/**
 * Validates a patient login code
 * Must be exactly 7 digits
 */
export function validateLoginCode(code: string): boolean {
  return /^\d{7}$/.test(code)
}
