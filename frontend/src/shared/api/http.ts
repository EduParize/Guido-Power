const BASE_URL: string = import.meta.env.VITE_API_URL ?? '/api'

const STATUS_FALLBACK: Readonly<Record<number, string>> = {
  0: 'Não foi possível conectar ao servidor',
  400: 'Requisição inválida',
  404: 'Recurso não encontrado',
  409: 'Conflito: a operação não pôde ser concluída',
  // 502 de notificação traz { error } próprio; sem corpo, é gateway/servidor fora do ar
  502: 'Servidor indisponível no momento',
  500: 'Erro interno do servidor',
}

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export interface RequestInitLite {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

function messageFromBody(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null) return undefined
  const { error, message } = body as { error?: unknown; message?: unknown }
  if (typeof error === 'string' && error.trim()) return error
  if (typeof message === 'string' && message.trim()) return message
  return undefined
}

function fallbackMessage(status: number): string {
  return STATUS_FALLBACK[status] ?? (status >= 500 ? STATUS_FALLBACK[500] : `Erro inesperado (${status})`)
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return undefined
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

export async function apiRequest<T>(path: string, init: RequestInitLite = {}): Promise<T> {
  const { method = 'GET', body, signal } = init
  const hasBody = body !== undefined

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      signal,
      headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
      body: hasBody ? JSON.stringify(body) : undefined,
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    throw new ApiError(fallbackMessage(0), 0, undefined)
  }

  if (response.status === 204) return undefined as T
  const parsed = await readBody(response)

  if (!response.ok) {
    throw new ApiError(messageFromBody(parsed) ?? fallbackMessage(response.status), response.status, parsed)
  }
  return parsed as T
}

export function isAbortError(e: unknown): boolean {
  return e instanceof DOMException && e.name === 'AbortError'
}

export function getErrorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message
  if (e instanceof Error && e.message) return e.message
  return 'Ocorreu um erro inesperado'
}

export function getHealth(signal?: AbortSignal): Promise<{ status: 'ok' }> {
  return apiRequest('/health', { signal })
}
