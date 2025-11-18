'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface AnalysisData {
  bpm?: number
  timing_accuracy?: number
  timing_stability?: number
  pitch_stability?: number
  pitch_deviation_cents?: number
  sustain?: number
  note_count?: number
  technique?: string
  feedback?: string[]
  rawFeatures?: Record<string, any>
}

export default function AnalysisResults({ data }: { data: AnalysisData }) {
  const [expanded, setExpanded] = useState(false)

  const MetricCard = ({ label, value, unit = '', max = 100, color = 'primary' }: any) => (
    <div className="p-4 bg-muted/50 rounded-lg">
      <p className="text-xs font-medium text-muted-foreground uppercase mb-2">{label}</p>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-foreground">
          {typeof value === 'number' ? value.toFixed(1) : value}
        </span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {typeof value === 'number' && max && (
        <div className="mt-2 w-full bg-border rounded-full h-2">
          <div
            className={`bg-${color} h-2 rounded-full transition-all duration-500`}
            style={{
              width: `${Math.min((value / max) * 100, 100)}%`,
              backgroundColor: '#3b82f6',
            }}
          />
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Analysis Results</CardTitle>
          <CardDescription>Detailed breakdown of your guitar performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {data.bpm !== undefined && <MetricCard label="BPM" value={data.bpm} max={200} />}
            {data.timing_accuracy !== undefined && <MetricCard label="Timing Accuracy" value={Math.round(data.timing_accuracy * 100)} unit="%" max={100} />}
            {data.timing_stability !== undefined && <MetricCard label="Timing Stability" value={Math.round(data.timing_stability * 100)} unit="%" max={100} />}
            {data.pitch_stability !== undefined && <MetricCard label="Pitch Stability" value={Math.round(data.pitch_stability * 100)} unit="%" max={100} />}
            {data.pitch_deviation_cents !== undefined && <MetricCard label="Pitch Deviation" value={Math.abs(data.pitch_deviation_cents)} unit="¢" max={100} />}
            {data.sustain !== undefined && <MetricCard label="Sustain" value={data.sustain.toFixed(4)} unit="" max={0.1} />}
            {data.note_count !== undefined && <MetricCard label="Note Count" value={data.note_count} unit="" />}
          </div>
        </CardContent>
      </Card>

      {data.feedback && data.feedback.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Feedback</CardTitle>
            <CardDescription>Actionable insights for improvement</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.feedback.map((item, idx) => (
                <li key={idx} className="flex gap-3 text-sm">
                  <span className="text-primary font-bold">•</span>
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className="border-border bg-card">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="text-left">
            <h3 className="font-medium text-foreground">Raw Features</h3>
            <p className="text-xs text-muted-foreground">Technical feature data</p>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        {expanded && data.rawFeatures && (
          <CardContent className="border-t border-border">
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96 text-foreground">
              {JSON.stringify(data.rawFeatures, null, 2)}
            </pre>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
