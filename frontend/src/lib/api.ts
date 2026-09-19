const API_BASE = import.meta.env.VITE_API_URL || '/api'

let token = localStorage.getItem('ucl_local_token')

export function setApiToken(nextToken: string | null) {
  token = nextToken
  if (nextToken) localStorage.setItem('ucl_local_token', nextToken)
  else localStorage.removeItem('ucl_local_token')
}

export function getApiToken() { return token }

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } })
  if (!response.ok) { const body = await response.json().catch(() => ({ message: 'Request failed.' })); throw new Error(body.message || 'Request failed.') }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

type CollectionResponse<T> = { items: T[] }
type ItemResponse<T> = { item: T }

export function getCollection<T>(collection: string, query = '') { return apiRequest<CollectionResponse<T>>(`/collections/${collection}${query}`).then((result) => result.items) }
export function createCollectionItem<T>(collection: string, input: unknown) { return apiRequest<ItemResponse<T>>(`/collections/${collection}`, { method: 'POST', body: JSON.stringify(input) }).then((result) => result.item) }
export function updateCollectionItem<T>(collection: string, id: string, input: unknown) { return apiRequest<ItemResponse<T>>(`/collections/${collection}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }).then((result) => result.item) }
export function deleteCollectionItem(collection: string, id: string) { return apiRequest<void>(`/collections/${collection}/${id}`, { method: 'DELETE' }) }
