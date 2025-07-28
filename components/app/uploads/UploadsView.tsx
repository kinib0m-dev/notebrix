"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useSubjectStore } from "@/lib/subjects/store/useSubjectStore";
import { useFiles } from "@/lib/files/hooks/useFiles";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NotebookLayout } from "../NotebookLayout";
import {
  Upload,
  FileText,
  BookOpen,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  File,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FileProgressBar } from "./FileProgressBar";
import { DeleteFileDialog } from "./DeleteFileDialog";

export function UploadsView() {
  const { currentSubject } = useSubjectStore();
  const {
    useFilesBySubject,
    useFileStats,
    handleFileUpload,
    handleFileDelete,
    getFileTypeDisplay,
    getFileIcon,
    formatFileSize,
    isUploading,
    isDeleting,
    fileProgress,
    clearProgress,
    clearAllProgress,
  } = useFiles();

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [fileTitles, setFileTitles] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"upload" | "files">("upload");
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    fileId: string;
    fileName: string;
  }>({ isOpen: false, fileId: "", fileName: "" });

  // Get files and stats for current subject
  const {
    data: files,
    isLoading: filesLoading,
    refetch: refetchFiles,
  } = useFilesBySubject(currentSubject?.id || "");

  const { isLoading: statsLoading, refetch: refetchStats } = useFileStats(
    currentSubject?.id || ""
  );

  // Drag and drop configuration
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const supportedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "text/plain",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.ms-powerpoint",
        "text/csv",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/markdown",
        "application/rtf",
      ];

      const newFiles = acceptedFiles.filter((file) => {
        if (file.size > maxSize) {
          toast.error(
            `File "${file.name}" is too large. Maximum size is ${formatFileSize(maxSize)}.`
          );
          return false;
        }

        if (!supportedTypes.includes(file.type)) {
          toast.error(`File type "${file.type}" is not supported.`);
          return false;
        }

        return true;
      });

      setPendingFiles((prev) => [...prev, ...newFiles]);

      // Set default titles
      newFiles.forEach((file) => {
        setFileTitles((prev) => ({
          ...prev,
          [file.name]: file.name.replace(/\.[^/.]+$/, ""),
        }));
      });
    },
    [formatFileSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/msword": [".doc"],
      "text/plain": [".txt"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        [".pptx"],
      "application/vnd.ms-powerpoint": [".ppt"],
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
      "text/markdown": [".md"],
      "application/rtf": [".rtf"],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: true,
  });

  const removePendingFile = (fileToRemove: File) => {
    setPendingFiles((prev) => prev.filter((file) => file !== fileToRemove));
    setFileTitles((prev) => {
      const newTitles = { ...prev };
      delete newTitles[fileToRemove.name];
      return newTitles;
    });
    clearProgress(fileToRemove.name);
  };

  const processFile = async (file: File) => {
    if (!currentSubject) return;

    try {
      const title = fileTitles[file.name] || file.name.replace(/\.[^/.]+$/, "");
      await handleFileUpload(file, currentSubject.id, title);

      // Remove from pending files
      setPendingFiles((prev) => prev.filter((f) => f.name !== file.name));
      setFileTitles((prev) => {
        const newTitles = { ...prev };
        delete newTitles[file.name];
        return newTitles;
      });

      // Refresh data
      await refetchFiles();
      await refetchStats();
    } catch (error) {
      console.error("Error processing file:", error);
    }
  };

  const processAllFiles = async () => {
    for (const file of pendingFiles) {
      await processFile(file);
    }
  };

  const handleDelete = (fileId: string, fileName: string) => {
    setDeleteDialog({
      isOpen: true,
      fileId,
      fileName,
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await handleFileDelete(deleteDialog.fileId);
      await refetchFiles();
      await refetchStats();
    } catch (error) {
      console.error("Failed to delete file:", error);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, fileId: "", fileName: "" });
  };

  const getFileIconComponent = (fileType: string) => {
    if (fileType.includes("pdf"))
      return <FileText className="h-8 w-8 text-red-500" />;
    if (fileType.includes("word"))
      return <FileText className="h-8 w-8 text-blue-500" />;
    if (fileType.includes("presentation"))
      return <FileText className="h-8 w-8 text-orange-500" />;
    if (fileType.includes("spreadsheet"))
      return <FileText className="h-8 w-8 text-green-500" />;
    if (fileType.includes("text"))
      return <FileText className="h-8 w-8 text-gray-500" />;
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const isFileProcessing = (fileName: string) => {
    const progress = fileProgress[fileName];
    return (
      progress &&
      ["reading", "uploading", "processing"].includes(progress.status)
    );
  };

  if (!currentSubject) {
    return (
      <NotebookLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">No Subject Selected</h2>
          <p className="text-muted-foreground mb-6">
            Please select a subject to upload files to.
          </p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </NotebookLayout>
    );
  }

  const hasCompletedFiles = Object.values(fileProgress).some(
    (p) => p.status === "completed"
  );
  const hasErrorFiles = Object.values(fileProgress).some(
    (p) => p.status === "error"
  );
  const processingCount = Object.values(fileProgress).filter((p) =>
    ["reading", "uploading", "processing"].includes(p.status)
  ).length;

  return (
    <NotebookLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              File Management
            </h1>
            <p className="text-muted-foreground">
              Upload and manage learning materials for {currentSubject.name}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              refetchFiles();
              refetchStats();
            }}
            disabled={filesLoading || statsLoading}
          >
            <RefreshCw
              className={cn(
                "h-4 w-4 mr-2",
                (filesLoading || statsLoading) && "animate-spin"
              )}
            />
            Refresh
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4">
          <Button
            variant={activeTab === "upload" ? "default" : "ghost"}
            onClick={() => setActiveTab("upload")}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Files
          </Button>
          <Button
            variant={activeTab === "files" ? "default" : "ghost"}
            onClick={() => setActiveTab("files")}
          >
            <FileText className="w-4 h-4 mr-2" />
            Manage Files ({files?.length || 0})
          </Button>
        </div>

        {/* Content based on active tab */}
        {activeTab === "upload" ? (
          <div className="space-y-6">
            {/* Upload Zone */}
            <div className="border-2 border-dashed transition-colors hover:border-primary/50 p-4 rounded-md">
              <div
                {...getRootProps()}
                className={cn(
                  "cursor-pointer text-center transition-colors",
                  isDragActive && "text-primary"
                )}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {isDragActive ? "Drop files here" : "Upload Documents"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop files here, or click to select files
                </p>
                <p className="text-xs text-muted-foreground">
                  Supported formats: PDF, Word, PowerPoint, Text, CSV, Excel
                </p>
                <p className="text-xs text-muted-foreground">
                  Maximum file size: 10MB
                </p>
              </div>
            </div>

            {/* Processing Progress */}
            {Object.keys(fileProgress).length > 0 && (
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2
                      className={cn(
                        "h-5 w-5",
                        processingCount > 0
                          ? "animate-spin text-blue-500"
                          : "text-green-500"
                      )}
                    />
                    File Processing
                    {processingCount > 0 && (
                      <span className="text-sm font-normal text-muted-foreground">
                        ({processingCount} in progress)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    {hasCompletedFiles && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm">Files ready</span>
                      </div>
                    )}
                    {hasErrorFiles && (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">Some failed</span>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllProgress}
                      className="text-xs"
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {Object.values(fileProgress).map((progress) => (
                    <FileProgressBar
                      key={progress.fileName}
                      fileName={progress.fileName}
                      progress={progress.progress}
                      status={progress.status}
                      message={progress.message}
                      onClear={() => clearProgress(progress.fileName)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Pending Files List */}
            {pendingFiles.length > 0 && (
              <div>
                <div className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle>Files to Process</CardTitle>
                    <Button
                      onClick={processAllFiles}
                      disabled={isUploading || pendingFiles.length === 0}
                      className="bg-gradient-to-r from-primary to-primary/90"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Process All Files ({pendingFiles.length})
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-4">
                  {pendingFiles.map((file) => {
                    const isProcessing = isFileProcessing(file.name);

                    return (
                      <div
                        key={file.name}
                        className={
                          "flex items-center gap-4 p-4 rounded-lg transition-colors"
                        }
                      >
                        {getFileIconComponent(file.type)}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium truncate">{file.name}</p>
                            <span className="text-xs text-muted-foreground px-2 py-1 rounded">
                              {formatFileSize(file.size)}
                            </span>
                            {isProcessing && (
                              <span className="text-xs text-blue-600 bg-blue-900/30 px-2 py-1 rounded">
                                Processing...
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isProcessing ? (
                            <div className="flex items-center gap-2 text-blue-600">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">Processing...</span>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => processFile(file)}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Process
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePendingFile(file)}
                            disabled={isProcessing}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Supported File Types */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Supported File Types
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {[
                  {
                    type: "application/pdf",
                    name: "PDF Document",
                    extension: ".pdf",
                  },
                  {
                    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    name: "Word Document",
                    extension: ".docx",
                  },
                  {
                    type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                    name: "PowerPoint",
                    extension: ".pptx",
                  },
                  {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    name: "Excel",
                    extension: ".xlsx",
                  },
                  {
                    type: "text/plain",
                    name: "Text File",
                    extension: ".txt",
                  },
                  { type: "text/csv", name: "CSV File", extension: ".csv" },
                  {
                    type: "text/markdown",
                    name: "Markdown",
                    extension: ".md",
                  },
                  {
                    type: "application/rtf",
                    name: "RTF Document",
                    extension: ".rtf",
                  },
                ].map((fileType) => (
                  <div
                    key={fileType.type}
                    className="flex items-center gap-2 p-2 rounded-lg"
                  >
                    {getFileIconComponent(fileType.type)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {fileType.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fileType.extension}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Files List */}
            {filesLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="animate-pulse p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : files && files.length > 0 ? (
              <div className="space-y-4">
                {files.map((file) => (
                  <div key={file.id} className="transition-colors p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">
                          {getFileIcon(file.fileType)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground mb-2">
                            {file.fileName}
                          </h4>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>
                              {getFileTypeDisplay(file.fileType)} •{" "}
                              {formatFileSize(file.fileSize)}
                            </p>
                            <p>
                              {file.totalChunks} chunks • {file.totalTokens}{" "}
                              tokens • {file.wordCount} words
                            </p>
                            <p>
                              Uploaded:{" "}
                              {new Date(file.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          {file.status === "completed" ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <Badge
                            variant={
                              file.status === "completed"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {file.status}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(file.id, file.fileName)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    {file.status === "failed" && file.processingError && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                        <strong>Error:</strong> {file.processingError}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">
                  No files uploaded yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Upload some learning materials to get started.
                </p>
                <Button onClick={() => setActiveTab("upload")}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Files
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete File Dialog */}
      <DeleteFileDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        fileName={deleteDialog.fileName}
        isDeleting={isDeleting}
      />
    </NotebookLayout>
  );
}
