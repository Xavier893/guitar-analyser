"use client";

import { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Music, AlertCircle, CheckCircle, Loader } from "lucide-react";

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
  uploadStatus: string;
  analysisStatus: string;
  error?: string;
  onErrorDismiss?: () => void;
  waitingForAnalysis?: boolean;
}

export default function FileUpload({
  onUpload,
  uploading,
  uploadStatus,
  analysisStatus,
  error,
  onErrorDismiss,
  waitingForAnalysis,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = async (file: File) => {
    const validTypes = ["audio/wav", "audio/mpeg", "audio/mp3"];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a WAV or MP3 file");
      return;
    }

    // Simulate upload progress
    setProgress(0);
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 30;
      });
    }, 200);

    await onUpload(file);

    clearInterval(progressInterval);
    setProgress(100);
    setTimeout(() => setProgress(0), 1000);
  };

  const isComplete =
    uploadStatus === "uploaded" && analysisStatus === "complete";

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Upload Audio File</CardTitle>
        <CardDescription>
          Drag and drop your WAV or MP3 file here
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-start justify-between">
            <span>{error}</span>
            {onErrorDismiss && (
              <button
                onClick={onErrorDismiss}
                className="font-medium hover:underline"
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          } ${uploading || isComplete ? "opacity-75" : ""}`}
        >
          {isComplete ? (
            <div className="space-y-3">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <p className="font-medium text-foreground">Analysis Complete</p>
              <p className="text-sm text-muted-foreground">
                Your results are ready below
              </p>
            </div>
          ) : uploading ? (
            <div className="space-y-3">
              <Loader className="w-12 h-12 text-primary mx-auto animate-spin flex-shrink-0" />
              <p className="font-medium text-foreground">
                {waitingForAnalysis
                  ? "Waiting for analysis summary..."
                  : analysisStatus === "processing"
                  ? "Analyzing..."
                  : "Uploading..."}
              </p>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${waitingForAnalysis ? 100 : progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Music className="w-12 h-12 text-muted-foreground mx-auto" />
              <div>
                <p className="font-medium text-foreground">
                  Drop your audio file here
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="border-border"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Select File
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/wav,audio/mpeg,.wav,.mp3"
            onChange={handleChange}
            disabled={uploading}
            className="hidden"
          />
        </div>

        <div className="text-xs text-muted-foreground">
          Supported formats: WAV, MP3 | Maximum file size: 50 MB
        </div>
      </CardContent>
    </Card>
  );
}
