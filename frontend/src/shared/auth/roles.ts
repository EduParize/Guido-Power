export type Role = 'admin' | 'atendente'

export function getAdminEmails(): string[] {
  return (import.meta.env.VITE_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function roleForEmail(email: string): Role {
  return getAdminEmails().includes(email.trim().toLowerCase()) ? 'admin' : 'atendente'
}
