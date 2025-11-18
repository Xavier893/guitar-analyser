"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  TrendingUp,
} from "lucide-react";

interface LLMFeedback {
  summary?: string | string[];
  timing_analysis?: string | string[];
  pitch_analysis?: string | string[];
  sustain_analysis?: string | string[];
  suggestions?: string[];
  score?: number;
}

interface AnalysisData {
  bpm?: number;
  timing_accuracy?: number;
  timing_stability?: number;
  pitch_stability?: number;
  pitch_deviation_cents?: number;
  sustain?: number;
  note_count?: number;
  technique?: string;
  feedback?: string[];
  rawFeatures?: Record<string, any>;
  llmFeedback?: LLMFeedback | string;
}

export default function AnalysisResults({ data }: { data: AnalysisData }) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Parse LLM feedback if it's a string
  let llmData: LLMFeedback | null = null;
  if (data.llmFeedback) {
    if (typeof data.llmFeedback === "string") {
      try {
        llmData = JSON.parse(data.llmFeedback);
      } catch {
        llmData = null;
      }
    } else {
      llmData = data.llmFeedback;
    }
  }

  const MetricCard = ({
    label,
    value,
    displayValue,
    unit = "",
    max = 100,
    showProgressBar = true,
  }: any) => {
    const numericValue = typeof value === "number" ? value : 0;
    let percentage = 0;
    if (numericValue && max) {
      percentage = Math.min((numericValue / max) * 100, 100);
    }

    const isGood = percentage > 75;
    const isWarning = percentage > 50;
    const displayText =
      displayValue !== undefined
        ? displayValue
        : typeof value === "number"
        ? value.toFixed(1)
        : value;

    return (
      <div className="p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors">
        <p className="text-xs font-medium text-muted-foreground uppercase mb-3">
          {label}
        </p>
        <div className="flex items-end gap-2 mb-3">
          <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {displayText}
          </span>
          {unit && (
            <span className="text-sm text-muted-foreground mb-1">{unit}</span>
          )}
        </div>
        {numericValue && max && showProgressBar && (
          <div className="w-full bg-border rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: `${percentage}%`,
                backgroundColor: isGood
                  ? "#22c55e"
                  : isWarning
                  ? "#f59e0b"
                  : "#ef4444",
              }}
            />
          </div>
        )}
      </div>
    );
  };

  const renderFeedbackList = (items: string | string[] | undefined) => {
    if (!items) return null;
    const list = Array.isArray(items) ? items : [items];
    return (
      <ul className="space-y-3">
        {list.map((item, idx) => (
          <li key={idx} className="flex gap-3 text-sm">
            <span className="text-primary font-bold flex-shrink-0 mt-0.5">
              •
            </span>
            <span className="text-muted-foreground">{item}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      {llmData?.score !== undefined && (
        <Card className="border-border bg-gradient-to-br from-primary/10 via-card to-card overflow-hidden">
          <CardContent className="pt-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                  Performance Score
                </p>
                <p className="text-5xl font-bold text-primary">
                  {llmData.score}
                </p>
                <p className="text-sm text-muted-foreground mt-2">/100</p>
              </div>
              <div className="text-4xl opacity-20">
                <TrendingUp className="w-16 h-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {llmData?.summary && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-accent" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed">
              {Array.isArray(llmData.summary)
                ? llmData.summary.join(" ")
                : llmData.summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Header */}
      <div className="grid grid-cols-3 gap-3">
        {data.bpm !== undefined && (
          <div className="p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
              BPM
            </p>
            <p className="text-2xl font-bold text-primary">
              {data.bpm.toFixed(1)}
            </p>
          </div>
        )}
        {data.note_count !== undefined && (
          <div className="p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
              Notes Played
            </p>
            <p className="text-2xl font-bold text-primary">{data.note_count}</p>
          </div>
        )}
        {data.pitch_deviation_cents !== undefined && (
          <div className="p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
              Pitch Deviation
            </p>
            <p className="text-2xl font-bold text-primary">
              {Math.abs(data.pitch_deviation_cents).toFixed(1)}¢
            </p>
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>
            Detailed breakdown of your guitar performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {data.timing_accuracy !== undefined && (
              <MetricCard
                label="Timing Accuracy"
                value={data.timing_accuracy * 100}
                displayValue={(data.timing_accuracy * 100).toFixed(2)}
                unit="%"
                max={100}
              />
            )}
            {data.timing_stability !== undefined && (
              <MetricCard
                label="Timing Stability"
                value={data.timing_stability * 100}
                displayValue={(data.timing_stability * 100).toFixed(2)}
                unit="%"
                max={100}
              />
            )}
            {data.pitch_stability !== undefined && (
              <MetricCard
                label="Pitch Stability"
                value={data.pitch_stability * 100}
                displayValue={(data.pitch_stability * 100).toFixed(2)}
                unit="%"
                max={100}
              />
            )}
            {data.sustain !== undefined && (
              <MetricCard
                label="Sustain"
                value={data.sustain * 100}
                displayValue={(data.sustain * 100).toFixed(2)}
                unit="%"
                max={100}
                showProgressBar={true}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis */}
      {(llmData?.timing_analysis ||
        llmData?.pitch_analysis ||
        llmData?.sustain_analysis) && (
        <div className="space-y-4">
          {llmData?.timing_analysis && (
            <Card className="border-border bg-card">
              <button
                onClick={() =>
                  setExpandedSection(
                    expandedSection === "timing" ? null : "timing"
                  )
                }
                className="w-full p-6 flex items-center justify-between"
              >
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">
                    Timing Analysis
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Rhythmic accuracy and consistency insights
                  </p>
                </div>
                {expandedSection === "timing" ? (
                  <ChevronUp className="w-5 h-5 text-primary" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
              {expandedSection === "timing" && (
                <CardContent className="border-t border-border pt-4">
                  {renderFeedbackList(llmData.timing_analysis)}
                </CardContent>
              )}
            </Card>
          )}

          {llmData?.pitch_analysis && (
            <Card className="border-border bg-card">
              <button
                onClick={() =>
                  setExpandedSection(
                    expandedSection === "pitch" ? null : "pitch"
                  )
                }
                className="w-full p-6 flex items-center justify-between"
              >
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">
                    Pitch Analysis
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Intonation and tuning feedback
                  </p>
                </div>
                {expandedSection === "pitch" ? (
                  <ChevronUp className="w-5 h-5 text-primary" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
              {expandedSection === "pitch" && (
                <CardContent className="border-t border-border pt-4">
                  {renderFeedbackList(llmData.pitch_analysis)}
                </CardContent>
              )}
            </Card>
          )}

          {llmData?.sustain_analysis && (
            <Card className="border-border bg-card">
              <button
                onClick={() =>
                  setExpandedSection(
                    expandedSection === "sustain" ? null : "sustain"
                  )
                }
                className="w-full p-6 flex items-center justify-between"
              >
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">
                    Sustain Analysis
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Note duration and decay insights
                  </p>
                </div>
                {expandedSection === "sustain" ? (
                  <ChevronUp className="w-5 h-5 text-primary" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
              {expandedSection === "sustain" && (
                <CardContent className="border-t border-border pt-4">
                  {renderFeedbackList(llmData.sustain_analysis)}
                </CardContent>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Suggestions */}
      {llmData?.suggestions &&
        Array.isArray(llmData.suggestions) &&
        llmData.suggestions.length > 0 && (
          <Card className="border-border bg-gradient-to-br from-green-500/10 via-card to-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Recommendations
              </CardTitle>
              <CardDescription>
                Follow these steps to improve your performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {llmData.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="flex gap-3 text-sm">
                    <span className="font-bold text-primary flex-shrink-0">
                      {idx + 1}.
                    </span>
                    <span className="text-foreground">{suggestion}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

      {/* Original Feedback */}
      {data.feedback && data.feedback.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Additional Feedback</CardTitle>
          </CardHeader>
          <CardContent>{renderFeedbackList(data.feedback)}</CardContent>
        </Card>
      )}
    </div>
  );
}
