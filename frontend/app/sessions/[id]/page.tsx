"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Header from "@/components/header";
import FileUpload from "@/components/file-upload";
import AnalysisResults from "@/components/analysis-results";
import { ArrowLeft, Music, Clock, Calendar, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { uploadAudioFile, fetchSessions } from "@/lib/api-client";

interface AnalysisData {
  bpm?: number;
  timing_accuracy?: number;
  timing_stability?: number;
  pitch_stability?: number;
  pitch_deviation_cents?: number;
  sustain?: number;
  note_count?: number;
  llmFeedback?: any;
}

interface Session {
  id: string;
  name: string;
  date: string;
  notes: string;
  createdAt: string;
  status: "pending" | "processing" | "complete";
  uploadStatus: "pending" | "uploaded" | "analyzing";
  analysisData?: AnalysisData;
}

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const [session, setSession] = useState<Session | null>(null);
  const [uploading, setUploading] = useState(false);
  const [waitingForAnalysis, setWaitingForAnalysis] = useState(false);
  const [error, setError] = useState("");
  const [loadingSession, setLoadingSession] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadSessionDetails = async () => {
      setLoadingSession(true);
      try {
        // First try to fetch from API
        const allSessions = await fetchSessions();
        const sessionsArray = Array.isArray(allSessions)
          ? allSessions
          : allSessions.sessions || [];

        // Find session by row_number (which corresponds to the ID)
        const foundSession = sessionsArray.find(
          (s: any) =>
            s.id === sessionId ||
            `session_${s.row_number}` === sessionId ||
            s.row_number?.toString() === sessionId
        );

        if (foundSession) {
          // Parse analysis data from the API response
          let analysisData: AnalysisData | undefined;
          const analysisDataStr = foundSession["Analysis Data"];
          if (analysisDataStr) {
            try {
              analysisData = JSON.parse(
                typeof analysisDataStr === "string"
                  ? analysisDataStr
                  : JSON.stringify(analysisDataStr)
              );
            } catch {
              analysisData = undefined;
            }
          }

          // Extract LLM feedback
          let llmFeedback: any;
          const llmFeedbackStr = foundSession["LLM Feedback"];
          if (llmFeedbackStr) {
            try {
              let feedbackStr = llmFeedbackStr;
              if (typeof feedbackStr === "string") {
                // Remove markdown code block if present (```json ... ```)
                feedbackStr = feedbackStr
                  .replace(/^```json\s*\n?/, "")
                  .replace(/\n?```\s*$/, "");
              }
              llmFeedback = JSON.parse(
                typeof feedbackStr === "string"
                  ? feedbackStr
                  : JSON.stringify(feedbackStr)
              );
            } catch (e) {
              console.warn("Failed to parse LLM Feedback:", e);
              llmFeedback = llmFeedbackStr;
            }
          }

          // Add analysis data and LLM feedback to the data object
          const analysisDataWithFeedback: AnalysisData = {
            ...analysisData,
            llmFeedback: llmFeedback,
          };

          const mappedSession: Session = {
            id: foundSession.id || `session_${foundSession.row_number}`,
            name: foundSession["Session Name"] || foundSession.name || "",
            date:
              foundSession["Session Date"] ||
              foundSession.date ||
              new Date().toISOString().split("T")[0],
            notes:
              foundSession["Session Notes"] ||
              foundSession.notes ||
              foundSession.session_notes ||
              "",
            createdAt:
              foundSession.Date ||
              foundSession.createdAt ||
              new Date().toISOString(),
            status: foundSession.status || "complete",
            uploadStatus: foundSession.uploadStatus || "uploaded",
            analysisData: analysisDataWithFeedback,
          };
          setSession(mappedSession);
        } else {
          // Fallback: check sessionStorage for newly created sessions
          const storedSession = sessionStorage.getItem(`session_${sessionId}`);
          if (storedSession) {
            setSession(JSON.parse(storedSession));
          } else {
            // Create default session if nothing found
            setSession({
              id: sessionId,
              name: "New Session",
              date: new Date().toISOString().split("T")[0],
              notes: "",
              createdAt: new Date().toISOString(),
              status: "pending",
              uploadStatus: "pending",
            });
          }
        }
      } catch (err) {
        console.error("Failed to load session:", err);
        // Fallback: check sessionStorage
        const storedSession = sessionStorage.getItem(`session_${sessionId}`);
        if (storedSession) {
          setSession(JSON.parse(storedSession));
        } else {
          setSession({
            id: sessionId,
            name: "New Session",
            date: new Date().toISOString().split("T")[0],
            notes: "",
            createdAt: new Date().toISOString(),
            status: "pending",
            uploadStatus: "pending",
          });
        }
      } finally {
        setLoadingSession(false);
      }
    };

    loadSessionDetails();
  }, [sessionId]);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setWaitingForAnalysis(false);
    setError("");

    try {
      if (!session) {
        setError("Session not found");
        return;
      }

      // Upload file to backend API
      const response = await uploadAudioFile(
        file,
        session.name,
        session.date,
        session.notes
      );

      console.log("📤 Upload Response:", response);
      console.log("📤 Response Type:", typeof response);
      console.log("📤 Is Array:", Array.isArray(response));

      // Show waiting state while backend completes analysis
      setWaitingForAnalysis(true);

      // Extract session data from response
      // Response is an array with the newly analyzed session
      let analysisSessionData = null;
      if (Array.isArray(response) && response.length > 0) {
        analysisSessionData = response[0];
      } else if (
        response &&
        typeof response === "object" &&
        !Array.isArray(response)
      ) {
        analysisSessionData = response;
      }

      console.log("📊 Extracted Session Data:", analysisSessionData);

      if (!analysisSessionData) {
        setError("No analysis data received from server");
        return;
      }

      // Parse analysis data and LLM feedback similar to loadSessionDetails
      let analysisData: any = {};
      const analysisDataStr = analysisSessionData["Analysis Data"];
      if (analysisDataStr) {
        try {
          analysisData = JSON.parse(
            typeof analysisDataStr === "string"
              ? analysisDataStr
              : JSON.stringify(analysisDataStr)
          );
          console.log("✅ Parsed Analysis Data:", analysisData);
        } catch (e) {
          console.error("❌ Failed to parse Analysis Data:", e);
        }
      }

      // Extract LLM feedback
      let llmFeedback: any = null;
      const llmFeedbackStr = analysisSessionData["LLM Feedback"];
      if (llmFeedbackStr) {
        try {
          let feedbackStr = llmFeedbackStr;
          if (typeof feedbackStr === "string") {
            // Remove markdown code block if present (```json ... ```)
            feedbackStr = feedbackStr
              .replace(/^```json\s*\n?/, "")
              .replace(/\n?```\s*$/, "");
          }
          llmFeedback = JSON.parse(
            typeof feedbackStr === "string"
              ? feedbackStr
              : JSON.stringify(feedbackStr)
          );
          console.log("✅ Parsed LLM Feedback:", llmFeedback);
        } catch (e) {
          console.error("❌ Failed to parse LLM Feedback:", e);
        }
      }

      // Combine analysis data with LLM feedback
      const completeAnalysisData = {
        ...analysisData,
        llmFeedback: llmFeedback,
      };

      console.log("🎯 Complete Analysis Data:", completeAnalysisData);

      // Update session with analysis data
      const updatedSession: Session = {
        ...session,
        uploadStatus: "uploaded",
        status: "complete",
        analysisData: completeAnalysisData,
      };

      console.log("💾 Updated Session:", updatedSession);

      setSession(updatedSession);
      sessionStorage.setItem(
        `session_${sessionId}`,
        JSON.stringify(updatedSession)
      );

      console.log("✨ Session updated and stored. Ready to display analysis!");
    } catch (err) {
      console.error("🚨 Error during upload:", err);
      setError(
        err instanceof Error ? err.message : "An error occurred during upload"
      );
    } finally {
      setUploading(false);
      setWaitingForAnalysis(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            Loading session...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => router.push("/")}
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
                    <span>
                      {new Date(session.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>
                      Created{" "}
                      {formatDistanceToNow(new Date(session.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {session.notes && (
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                      Notes
                    </p>
                    <p className="text-sm text-foreground">{session.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Only show file upload for pending/incomplete sessions */}
        {session.status !== "complete" && (
          <div className="mb-8">
            <FileUpload
              onUpload={handleFileUpload}
              uploading={uploading}
              uploadStatus={session.uploadStatus}
              analysisStatus={session.status}
              error={error}
              onErrorDismiss={() => setError("")}
              waitingForAnalysis={waitingForAnalysis}
            />
          </div>
        )}

        {/* Show analysis results for completed sessions */}
        {session.status === "complete" ? (
          <div className="space-y-6">
            {session.analysisData && (
              <AnalysisResults data={session.analysisData} />
            )}
          </div>
        ) : (
          /* Show both for pending sessions */
          session.analysisData && (
            <div className="mt-8">
              <AnalysisResults data={session.analysisData} />
            </div>
          )
        )}
      </div>
    </div>
  );
}
