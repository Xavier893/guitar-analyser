'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import SessionsList from '@/components/sessions-list'
import Header from '@/components/header'

interface Session {
  id: string
  name: string
  createdAt: string
  status: 'pending' | 'processing' | 'complete'
  uploadStatus: 'pending' | 'uploaded' | 'analyzing'
  score?: number
}

export default function DashboardPage() {
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: '1',
      name: 'Blues Improvisation',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'complete',
      uploadStatus: 'analyzing',
      score: 87,
    },
    {
      id: '2',
      name: 'Jazz Standards',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'complete',
      uploadStatus: 'analyzing',
      score: 92,
    },
  ])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCreateSession = () => {
    router.push('/sessions/create')
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Your Sessions</h1>
            <p className="text-muted-foreground mt-2">Manage and analyze your guitar recordings</p>
          </div>
          <Button 
            onClick={handleCreateSession}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            New Session
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-muted-foreground">Loading sessions...</div>
          </div>
        ) : sessions.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-muted-foreground mb-4">No sessions yet</p>
              <Button 
                onClick={handleCreateSession}
                variant="outline"
                className="border-border"
              >
                Create your first session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <SessionsList sessions={sessions} onRefresh={() => {}} />
        )}
      </div>
    </div>
  )
}
