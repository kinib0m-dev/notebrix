"use client";

import { useState } from "react";
import { useSubjectStore } from "@/lib/subjects/store/useSubjectStore";
import { NotebookLayout } from "./NotebookLayout";
import { UploadArea } from "./UploadArea";
import { FilesList } from "./FilesList";
import { UploadProgress } from "./UploadProgress";
import { useFiles } from "@/lib/files/hooks/useFiles";
import { useFileActions } from "@/lib/files/hooks/useFileActions";
import { Button } from "@/components/ui/button";
import { Upload, BookOpen, FileText } from "lucide-react";

export function UploadsView() {
  const { currentSubject } = useSubjectStore();
  const { useFilesBySubject, useFileStats } = useFiles();
  const { uploadProgress } = useFileActions();
  const [activeTab, setActiveTab] = useState<"upload" | "files">("upload");

  // Get files and stats for current subject
  const { data: files, isLoading: filesLoading } = useFilesBySubject(
    { subjectId: currentSubject?.id || "" },
    { enabled: !!currentSubject?.id }
  );

  const { data: stats, isLoading: statsLoading } = useFileStats(
    { subjectId: currentSubject?.id || "" },
    { enabled: !!currentSubject?.id }
  );

  if (!currentSubject) {
    return (
      <NotebookLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="glass-card rounded-2xl p-8 text-center max-w-md">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">No Subject Selected</h2>
            <p className="text-muted-foreground mb-6">
              Please select a subject to upload files to.
            </p>
            <Button 
              onClick={() => window.history.back()}
              className="glass-button"
            >
              Go Back
            </Button>
          </div>
        </div>
      </NotebookLayout>
    );
  }

  return (
    <NotebookLayout>
      {/* Header with subject info */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold text-lg"
              style={{ backgroundColor: currentSubject.color }}
            >
              {currentSubject.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{currentSubject.name}</h1>
              <p className="text-muted-foreground">
                {currentSubject.description || "No description"}
              </p>
            </div>
          </div>
          
          {stats && !statsLoading && (
            <div className="flex space-x-6 text-sm">
              <div className="text-center">
                <div className="font-semibold text-lg">{stats.totalFiles}</div>
                <div className="text-muted-foreground">Files</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg">{stats.totalChunks}</div>
                <div className="text-muted-foreground">Chunks</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg">{stats.totalImages}</div>
                <div className="text-muted-foreground">Images</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="glass-card rounded-2xl p-2 mb-6">
        <div className="flex space-x-1">
          <Button
            variant={activeTab === "upload" ? "default" : "ghost"}
            onClick={() => setActiveTab("upload")}
            className={`flex-1 glass-button ${
              activeTab === "upload" ? "glass-button-active" : ""
            }`}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Files
          </Button>
          <Button
            variant={activeTab === "files" ? "default" : "ghost"}
            onClick={() => setActiveTab("files")}
            className={`flex-1 glass-button ${
              activeTab === "files" ? "glass-button-active" : ""
            }`}
          >
            <FileText className="w-4 h-4 mr-2" />
            Manage Files ({files?.length || 0})
          </Button>
        </div>
      </div>

      {/* Upload Progress (if active) */}
      {uploadProgress && (
        <div className="mb-6">
          <UploadProgress progress={uploadProgress} />
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === "upload" ? (
        <UploadArea subjectId={currentSubject.id} />
      ) : (
        <FilesList 
          files={files || []} 
          isLoading={filesLoading}
        />
      )}
    </NotebookLayout>
  );
}