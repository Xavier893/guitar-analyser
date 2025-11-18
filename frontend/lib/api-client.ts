const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export async function apiCall(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    console.log(`🔗 API Call: ${BACKEND_API_URL}${endpoint}`)
    const response = await fetch(`${BACKEND_API_URL}${endpoint}`, {
      ...options,
      headers,
    })

    console.log(`📊 Response Status: ${response.status}`)

    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }

    const data = await response.json()
    console.log(`✅ Response Data:`, data)

    if (!response.ok) {
      throw new Error(data.message || `API request failed with status ${response.status}`)
    }

    return data
  } catch (error) {
    console.error(`❌ API Error:`, error)
    throw error
  }
}

export async function uploadAudioFile(
  file: File,
  sessionName: string,
  sessionDate: string,
  sessionNotes?: string
) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('session_name', sessionName)
  formData.append('session_date', sessionDate)
  if (sessionNotes) {
    formData.append('session_notes', sessionNotes)
  }

  const response = await fetch(`${BACKEND_API_URL}/analyze`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Upload failed')
  }

  return await response.json()
}

export async function fetchSessions() {
  return apiCall('/sessions')
}

export async function fetchSessionById(sessionId: string) {
  return apiCall(`/sessions/${sessionId}`)
}
