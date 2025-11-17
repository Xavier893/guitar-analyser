'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { Music, Clock, CheckCircle, AlertCircle, Upload, Calendar, FileText } from 'lucide-react'

interface Session {
  id: string
  name: string
  date: string
  notes: string
  createdAt: string
  status: 'pending' | 'processing' | 'complete'
  uploadStatus: 'pending' | 'uploaded' | 'analyzing'
  score?: number
}

export default function SessionsList({ sessions, onRefresh }: { sessions: Session[], onRefresh: () => void }) {
  const router = useRouter()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'processing':
        return <AlertCircle className="w-4 h-4 text-yellow-500 animate-pulse" />
      default:
        return <Upload className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'complete':
        return 'Complete'
      case 'processing':
        return 'Processing'
      default:
        return 'Pending'
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sessions.map((session) => (
        <Card 
          key={session.id}
          className="border-border bg-card hover:bg-card/80 transition-colors cursor-pointer group"
          onClick={() => router.push(`/sessions/${session.id}`)}
        >
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2 w-full">
                <Music className="w-5 h-5 text-primary flex-shrink-0" />
                <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {session.name}
                </h3>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{new Date(session.date).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                {getStatusIcon(session.status)}
                <span className="text-muted-foreground">{getStatusLabel(session.status)}</span>
              </div>

              {session.notes && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-1">{session.notes}</span>
                </div>
              )}

              {session.score !== undefined && (
                <div className="text-sm font-medium text-foreground">
                  Score: <span className="text-primary">{session.score.toFixed(1)}/100</span>
                </div>
              )}
            </div>

            <Button 
              variant="outline"
              className="w-full border-border text-foreground hover:bg-primary/10"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/sessions/${session.id}`)
              }}
            >
              View Session
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
