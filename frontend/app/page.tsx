'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import SessionsList from '@/components/sessions-list'
import Header from '@/components/header'
import { ChevronDown } from 'lucide-react'
import { fetchSessions } from '@/lib/api-client'

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

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    setIsLoadingSessions(true)
    try {
      const data = await fetchSessions()
      // Map API response to session format
      const sessionsList = (data.sessions || []).map((session: any) => ({
        id: session.id,
        name: session.name,
        date: session.date || new Date().toISOString().split('T')[0],
        notes: session.notes || session.session_notes || '',
        createdAt: session.createdAt || new Date().toISOString(),
        status: session.status || 'pending',
        uploadStatus: session.uploadStatus || 'pending',
        score: session.score,
      }))
      setSessions(sessionsList)
    } catch (err) {
      console.error('Failed to load sessions:', err)
      // Fallback to empty sessions or cached data
      setSessions([])
    } finally {
      setIsLoadingSessions(false)
    }
  }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formName.trim()) {
      setError('Session name is required')
      return
    }

    setLoading(true)

    try {
      const newSession: Session = {
        id: Math.random().toString(36).substr(2, 9),
        name: formName,
        date: formDate,
        notes: formNotes,
        createdAt: new Date().toISOString(),
        status: 'pending',
        uploadStatus: 'pending',
      }

      setSessions([newSession, ...sessions])
      sessionStorage.setItem(`session_${newSession.id}`, JSON.stringify(newSession))
      setFormName('')
      setFormNotes('')
      setFormDate(new Date().toISOString().split('T')[0])
      setShowCreateForm(false)
      
      // Redirect to session detail after creation
      router.push(`/sessions/${newSession.id}`)
    } catch (err) {
      setError('An error occurred while creating the session')
    } finally {
      setLoading(false)
    }
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
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
          >
            {showCreateForm ? 'Cancel' : 'New Session'}
            {showCreateForm && <ChevronDown className="w-4 h-4 rotate-180" />}
          </Button>
        </div>

        {showCreateForm && (
          <Card className="mb-8 border-border bg-card">
            <CardHeader>
              <CardTitle>Create New Session</CardTitle>
              <CardDescription>Set up a new guitar analysis session</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSession} className="space-y-6">
                {error && (
                  <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Session Name*
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., Jazz Solo - Take 3"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      disabled={loading}
                      className="bg-input border-input"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Session Date*
                    </label>
                    <Input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      disabled={loading}
                      className="bg-input border-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Notes (Optional)
                  </label>
                  <textarea
                    placeholder="Add any notes about this recording..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    disabled={loading}
                    rows={4}
                    className="w-full px-3 py-2 bg-input border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    disabled={loading}
                    className="flex-1 border-border"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {loading ? 'Creating...' : 'Create Session'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {sessions.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-muted-foreground mb-4">{isLoadingSessions ? 'Loading sessions...' : 'No sessions yet'}</p>
              {!isLoadingSessions && (
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  variant="outline"
                  className="border-border"
                >
                  Create your first session
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <SessionsList sessions={sessions} onRefresh={loadSessions} />
        )}
      </div>
    </div>
  )
}
