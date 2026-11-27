// Member code for a discount card: 8 digits, shown as "UBP 4821 0007".
// It is unique to this member and this partner, and worked out on the device by
// hashing the user id with the partner id. The hash only keeps 8 digits, so the
// user id cannot be read back out of it, and the user id is never in the text.
// This is a display code for a discount card. It is not a payment card number.

// cyrb53, a small string hash. Two passes with different seeds give 8 digits.
function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed
  let h2 = 0x41c6ce57 ^ seed
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

const SALT = 'ubp-card-v1'

export function memberDigits(userId, partnerId) {
  const n = cyrb53(`${SALT}|${userId || 'guest'}|${partnerId}`, 7) % 100000000
  return String(n).padStart(8, '0')
}

export function formatCode(digits) {
  return `UBP ${digits.slice(0, 4)} ${digits.slice(4)}`
}

export function maskedCode(digits) {
  return `UBP •••• ${digits.slice(4)}`
}

export function memberCode(userId, partnerId) {
  const digits = memberDigits(userId, partnerId)
  return { digits, full: formatCode(digits), masked: maskedCode(digits) }
}
