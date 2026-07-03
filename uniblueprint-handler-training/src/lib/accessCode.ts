const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateAccessCode(length = 8): string {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return code
}
