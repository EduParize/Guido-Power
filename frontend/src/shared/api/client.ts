interface ApiErrorResponse {
  error?: string
  // as validações de /usuarios respondem com { message }
  message?: string
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: object
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers = new Headers({ Accept: 'application/json' })

  if (options.body) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (response.status === 204) {
    return undefined as T
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiErrorResponse | null
    throw new ApiError(
      payload?.error ?? payload?.message ?? response.statusText,
      response.status,
    )
  }

  return (await response.json()) as T
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  return 'Não foi possível falar com o servidor'
}
