"use client";

import { FileUploadProgress } from "@/lib/files/hooks/useFileActions";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileText, 
  Image, 
  Database, 
  CheckCircle, 
  XCircle,
  Loader2
} from "lucide-react";

interface UploadProgressProps {
  progress: FileUploadProgress;
}

export function UploadProgress({ progress }: UploadProgressProps) {
  const getStageIcon = () => {
    switch (progress.stage) {
      case "preparing":
        return <Upload className="w-5 h-5" />;
      case "uploading":
        return <Loader2 className="w-5 h-5 animate-spin" />;
      case "processing":
        return <FileText className="w-5 h-5" />;
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Upload className="w-5 h-5" />;
    }
  };

  const getStageColor = () => {
    switch (progress.stage) {
      case "completed":
        return "text-green-600";
      case "error":
        return "text-red-600";
      default:
        return "text-blue-600";
    }
  };


  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`${getStageColor()}`}>
            {getStageIcon()}
          </div>
          <div>
            <h4 className="font-semibold">{progress.fileName}</h4>
            <p className="text-sm text-muted-foreground">
              {progress.message || "Processing file..."}
            </p>
          </div>
        </div>
        <div className={`text-2xl font-bold ${getStageColor()}`}>
          {progress.progress}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress 
          value={progress.progress} 
          className="h-3 glass-progress"
          aria-label={`Upload progress: ${progress.progress}%`}
        />
        
        {/* Stage Indicators */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <div className={`flex items-center space-x-1 ${
            ["preparing", "uploading", "processing", "completed"].includes(progress.stage) 
              ? "text-blue-600 font-medium" 
              : ""
          }`}>
            <Upload className="w-3 h-3" />
            <span>Upload</span>
          </div>
          
          <div className={`flex items-center space-x-1 ${
            ["processing", "completed"].includes(progress.stage) 
              ? "text-blue-600 font-medium" 
              : ""
          }`}>
            <FileText className="w-3 h-3" />
            <span>Extract</span>
          </div>
          
          <div className={`flex items-center space-x-1 ${
            ["processing", "completed"].includes(progress.stage) && progress.progress > 50
              ? "text-blue-600 font-medium" 
              : ""
          }`}>
            <Image className="w-3 h-3" />
            <span>Process</span>
          </div>
          
          <div className={`flex items-center space-x-1 ${
            progress.stage === "completed" 
              ? "text-green-600 font-medium" 
              : ""
          }`}>
            <Database className="w-3 h-3" />
            <span>Store</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {progress.stage === "error" && progress.error && (
        <div className="glass-card-error rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-red-600 mb-1">Upload Failed</p>
              <p className="text-red-700 dark:text-red-300">{progress.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {progress.stage === "completed" && (
        <div className="glass-card-success rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              File uploaded and processed successfully!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}