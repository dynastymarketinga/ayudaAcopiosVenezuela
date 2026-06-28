const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^[\d\s+()-]{7,20}$/
const URL_REGEX = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/i

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value)
}

export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return PHONE_REGEX.test(value) && digits.length >= 7
}

export function normalizeWebsite(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function isValidWebsite(value: string): boolean {
  return URL_REGEX.test(normalizeWebsite(value))
}

export function sanitizeStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function validatePhones(phones: string[]): string | null {
  for (const phone of phones) {
    if (!isValidPhone(phone)) {
      return `Teléfono inválido: ${phone}`
    }
  }
  return null
}

export function validateContactEmails(emails: string[]): string | null {
  for (const email of emails) {
    if (!isValidEmail(email)) {
      return `Correo inválido: ${email}`
    }
  }
  return null
}

export function validateWebsites(websites: string[]): string | null {
  for (const site of websites) {
    if (!isValidWebsite(site)) {
      return `Sitio web inválido: ${site}`
    }
  }
  return null
}

export function normalizeWebsites(websites: string[]): string[] {
  return websites.map(normalizeWebsite)
}
