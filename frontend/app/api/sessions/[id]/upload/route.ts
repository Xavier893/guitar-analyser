import { NextRequest, NextResponse } from 'next/server'

let sessions: Record<string, any> = {
  '1': {
    id: '1',
    userId: '1',
    name: 'Jazz Improvisation',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'complete',
    uploadStatus: 'uploaded',
    analysisData: {
      technique: 'Legato with sweeping arpeggios',
      timing: { bpm: 120, accuracy: 94.5 },
      pitch: { stability: 91.2, cents: 8.5 },
      tone: { brightness: 78.3, sustain: 2500 },
      feedback: [
        'Excellent timing consistency',
        'Consider dynamic range improvements',
        'Strong pitch stability',
        'Clean legato technique',
      ],
      rawFeatures: { test: 'data' },
    },
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

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = getUserIdFromToken(request)

  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const session = sessions[params.id]

  if (!session || session.userId !== userId) {
    return NextResponse.json({ message: 'Session not found' }, { status: 404 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      )
    }

    // Update session with mock analysis data
    sessions[params.id].uploadStatus = 'uploaded'
    sessions[params.id].status = 'complete'
    sessions[params.id].analysisData = {
      technique: 'Professional technique detected',
      timing: { bpm: 120 + Math.random() * 20, accuracy: 85 + Math.random() * 15 },
      pitch: { stability: 80 + Math.random() * 20, cents: Math.random() * 20 - 10 },
      tone: { brightness: 60 + Math.random() * 40, sustain: 2000 + Math.random() * 1000 },
      feedback: [
        'Great overall performance',
        'Work on timing consistency',
        'Excellent pitch control',
        'Nice tone quality',
      ],
      rawFeatures: {
        frequencyContent: Array.from({ length: 5 }, () => Math.random() * 500),
        timelineMetrics: {
          attack: 40 + Math.random() * 40,
          decay: 100 + Math.random() * 100,
          sustain: 600 + Math.random() * 400,
          release: 150 + Math.random() * 150,
        },
      },
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
