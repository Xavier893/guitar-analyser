'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Header from '@/components/header'
import FileUpload from '@/components/file-upload'
import AnalysisResults from '@/components/analysis-results'
import { ArrowLeft, Music, Clock, Calendar, FileText } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Session {
  id: string
  name: string
  date: string
  notes: string
  createdAt: string
  status: 'pending' | 'processing' | 'complete'
  uploadStatus: 'pending' | 'uploaded' | 'analyzing'
  analysisData?: {
    technique: string
    timing: {
      bpm: number
      accuracy: number
    }
    pitch: {
      stability: number
      cents: number
    }
    tone: {
      brightness: number
      sustain: number
    }
    feedback: string[]
    rawFeatures: Record<string, any>
  }
}

export default function SessionDetailPage() {
  const params = useParams()
  const sessionId = params.id as string
  const [session, setSession] = useState<Session | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const storedSession = sessionStorage.getItem(`session_${sessionId}`)
    if (storedSession) {
      setSession(JSON.parse(storedSession))
    } else {
      // Fallback default session
      setSession({
        id: sessionId,
        name: 'New Session',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        createdAt: new Date().toISOString(),
        status: 'pending',
        uploadStatus: 'pending',
      })
    }
  }, [sessionId])

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    setError('')

    try {
      // Simulate analysis delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Update session with mock analysis data
      if (session) {
        const updatedSession = {
          ...session,
          uploadStatus: 'uploaded',
          status: 'complete',
          analysisData: {
            technique: 'Fingerstyle',
            timing: { bpm: 120, accuracy: 94 },
            pitch: { stability: 88, cents: 2 },
            tone: { brightness: 75, sustain: 82 },
            feedback: [
              'Great timing consistency',
              'Excellent pitch stability',
              'Good tone control',
              'Consider working on sustain length',
            ],
            rawFeatures: {
              frequency_content: { mean: 450, std: 120 },
              rms_energy: 0.65,
              spectral_centroid: 2400,
            },
          },
        }
        setSession(updatedSession)
        sessionStorage.setItem(`session_${sessionId}`, JSON.stringify(updatedSession))
      }
    } catch (err) {
      setError('An error occurred during upload')
    } finally {
      setUploading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">Loading session...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-primary hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sessions
        </button>

        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <div className="flex items-start gap-4">
              <Music className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1">
                <CardTitle className="text-2xl">{session.name}</CardTitle>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(session.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Created {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            </div>
            {session.notes && (
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Notes</p>
                    <p className="text-sm text-foreground">{session.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </CardHeader>
        </Card>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <FileUpload 
              onUpload={handleFileUpload}
              uploading={uploading}
              uploadStatus={session.uploadStatus}
              analysisStatus={session.status}
              error={error}
              onErrorDismiss={() => setError('')}
            />

            {session.analysisData && (
              <AnalysisResults data={session.analysisData} />
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="border-border bg-card sticky top-24">
              <CardHeader>
                <CardTitle>Session Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Status</p>
                  <p className="text-sm text-foreground mt-1 capitalize">{session.status}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Upload Status</p>
                  <p className="text-sm text-foreground mt-1 capitalize">{session.uploadStatus}</p>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-border mt-4"
                  onClick={() => router.push('/')}
                >
                  Back to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
