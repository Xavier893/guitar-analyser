import { NextRequest, NextResponse } from 'next/server'

let sessions: Record<string, any> = {
  '1': {
    id: '1',
    userId: '1',
    name: 'Jazz Improvisation',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'complete',
    uploadStatus: 'uploaded',
    notes: 'Clean technique on the solo',
    analysisData: {
      technique: 'Legato with sweeping arpeggios',
      timing: { bpm: 120, accuracy: 94.5 },
      pitch: { stability: 91.2, cents: 8.5 },
      tone: { brightness: 78.3, sustain: 2500 },
      feedback: [
        'Excellent timing consistency throughout the piece',
        'Consider adding more dynamic range to brighten the tone',
        'Strong pitch stability indicates good control',
        'Legato technique is clean with minimal noise',
      ],
      rawFeatures: {
        frequencyContent: [100, 200, 300, 400, 500],
        timelineMetrics: { attack: 45, decay: 120, sustain: 800, release: 200 },
      },
    },
  },
  '2': {
    id: '2',
    userId: '1',
    name: 'Blues Scale Practice',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: 'complete',
    uploadStatus: 'uploaded',
    notes: 'Great timing and tone',
    analysisData: {
      technique: 'Pentatonic scales with bends',
      timing: { bpm: 95, accuracy: 96.8 },
      pitch: { stability: 88.9, cents: -12.3 },
      tone: { brightness: 72.1, sustain: 2100 },
      feedback: [
        'Outstanding timing accuracy',
        'Pitch bends are well-controlled',
        'Consider working on sustain length',
        'Nice tone warmth - great for blues style',
      ],
      rawFeatures: {
        frequencyContent: [80, 160, 240, 320, 400],
        timelineMetrics: { attack: 60, decay: 150, sustain: 650, release: 180 },
      },
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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = getUserIdFromToken(request)

  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const session = sessions[params.id]

  if (!session || session.userId !== userId) {
    return NextResponse.json({ message: 'Session not found' }, { status: 404 })
  }

  return NextResponse.json({ session })
}
