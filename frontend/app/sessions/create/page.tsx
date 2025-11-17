'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Header from '@/components/header'
import { ArrowLeft } from 'lucide-react'

export default function CreateSessionPage() {
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Session name is required')
      return
    }

    setLoading(true)

    try {
      const newSession = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        notes,
        createdAt: new Date().toISOString(),
        status: 'pending' as const,
        uploadStatus: 'pending' as const,
      }

      router.push(`/sessions/${newSession.id}`)
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="max-w-2xl mx-auto">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Create New Session</CardTitle>
              <CardDescription>Set up a new guitar analysis session</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                    {error}
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Session Name*
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Jazz Solo - Take 3"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="bg-input border-input"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Give your session a descriptive name</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Notes (Optional)
                  </label>
                  <textarea
                    placeholder="Add any notes about this recording..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={loading}
                    rows={4}
                    className="w-full px-3 py-2 bg-input border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
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
        </div>
      </div>
    </div>
  )
}
