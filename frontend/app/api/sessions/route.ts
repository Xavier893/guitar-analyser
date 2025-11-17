import { NextRequest, NextResponse } from 'next/server'

// Mock sessions storage
let sessions: Record<string, any> = {
  '1': {
    id: '1',
    userId: '1',
    name: 'Jazz Improvisation',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'complete',
    uploadStatus: 'uploaded',
    score: 87.5,
    notes: 'Clean technique on the solo',
  },
  '2': {
    id: '2',
    userId: '1',
    name: 'Blues Scale Practice',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: 'complete',
    uploadStatus: 'uploaded',
    score: 92.3,
    notes: 'Great timing and tone',
  },
}

function getUserIdFromToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  try {
    const token = authHeader.substring(7)
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
    return decoded.id
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const userId = getUserIdFromToken(request)

  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const userSessions = Object.values(sessions)
    .filter((s) => s.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json({ sessions: userSessions })
}

export async function POST(request: NextRequest) {
  const userId = getUserIdFromToken(request)

  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, notes } = await request.json()

    const sessionId = (Object.keys(sessions).length + 1).toString()
    const newSession = {
      id: sessionId,
      userId,
      name,
      notes: notes || '',
      createdAt: new Date().toISOString(),
      status: 'pending',
      uploadStatus: 'pending',
    }

    sessions[sessionId] = newSession

    return NextResponse.json({ session: newSession }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
