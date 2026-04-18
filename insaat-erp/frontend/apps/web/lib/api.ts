import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// Request interceptor — JWT token ekleme
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — 401 durumunda token sil ve otomatik login dene
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      // Eski geçersiz token'ı sil, yeniden login zorla
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
      try {
        const ok = await ensureAuth()
        if (ok) {
          const token = localStorage.getItem('access_token')
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }
      } catch {
        // login failed
      }
    }
    return Promise.reject(error)
  }
)

// ── Otomatik login — seed kullanıcısıyla ──
let authPromise: Promise<boolean> | null = null

export async function ensureAuth(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  const token = localStorage.getItem('access_token')
  if (token) return true

  // Aynı anda birden fazla login isteği göndermemek için
  if (authPromise) return authPromise

  authPromise = (async () => {
    try {
      console.log('[ensureAuth] Login deneniyor...', API_BASE_URL + '/auth/login')
      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'mehmet@acgrup.com',
        password: 'Sifre123!',
      })
      console.log('[ensureAuth] Login yanıtı:', res.status, res.data?.access_token ? 'TOKEN OK' : 'TOKEN YOK')
      if (res.data.access_token) {
        localStorage.setItem('access_token', res.data.access_token)
        if (res.data.refresh_token) {
          localStorage.setItem('refresh_token', res.data.refresh_token)
        }
        return true
      }
      return false
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message || 'Bilinmeyen hata'
      const status = err?.response?.status || 'N/A'
      console.error(`[ensureAuth] Login başarısız — HTTP ${status}: ${detail}`)
      console.error('[ensureAuth] API_BASE_URL:', API_BASE_URL)
      return false
    } finally {
      authPromise = null
    }
  })()

  return authPromise
}

export default api

// ── Yardımcı Fonksiyonlar ──

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
  }).format(n)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
