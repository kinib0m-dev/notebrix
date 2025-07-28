import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useCallback, useState } from "react";

interface FileProgress {
  fileName: string;
  progress: number;
  status: "reading" | "uploading" | "processing" | "completed" | "error";
  message?: string;
}

export const useFiles = () => {
  const utils = trpc.useUtils();
  const [fileProgress, setFileProgress] = useState<
    Record<string, FileProgress>
  >({});

  // Upload file mutation
  const uploadFile = trpc.files.upload.useMutation({
    onSuccess: (data, variables) => {
      // Update progress to completed
      setFileProgress((prev) => ({
        ...prev,
        [variables.fileName || data.file.fileName]: {
          fileName: variables.fileName || data.file.fileName,
          progress: 100,
          status: "completed",
          message: `Upload completed successfully!`,
        },
      }));

      toast.success(
        `File "${data.file.fileName}" uploaded and processed successfully!`
      );

      // Invalidate and refetch files for the subject
      utils.files.getBySubject.invalidate({ subjectId: variables.subjectId! });
      utils.files.getStats.invalidate({ subjectId: variables.subjectId! });

      // Clear progress after a delay
      setTimeout(() => {
        clearProgress(variables.fileName || data.file.fileName);
      }, 3000);
    },
    onError: (error, variables) => {
      const fileName = variables.fileName || "unknown";

      // Update progress to error
      setFileProgress((prev) => ({
        ...prev,
        [fileName]: {
          fileName,
          progress: 0,
          status: "error",
          message: error.message,
        },
      }));

      console.error("File upload error:", error);
      toast.error(error.message || "Failed to upload file. Please try again.");

      // Clear error after a delay
      setTimeout(() => {
        clearProgress(fileName);
      }, 5000);
    },
  });

  // Delete file mutation (unchanged)
  const deleteFile = trpc.files.delete.useMutation({
    onSuccess: (data, variables) => {
      toast.success("File deleted successfully!");

      utils.files.getBySubject.invalidate();
      utils.files.getStats.invalidate();
      utils.files.getById.invalidate({ fileId: variables.fileId });
    },
    onError: (error) => {
      console.error("File delete error:", error);
      toast.error(error.message || "Failed to delete file. Please try again.");
    },
  });

  // Helper function to convert File to base64 with progress
  const fileToBase64WithProgress = useCallback(
    (file: File, onProgress?: (progress: number) => void): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadstart = () => {
          onProgress?.(0);
        };

        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 50); // 50% for reading
            onProgress?.(progress);
          }
        };

        reader.onload = () => {
          if (typeof reader.result === "string") {
            onProgress?.(75); // 75% for conversion
            resolve(reader.result);
          } else {
            reject(new Error("Failed to read file as base64"));
          }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });
    },
    []
  );

  // Upload file with progress tracking
  const handleFileUpload = useCallback(
    async (file: File, subjectId: string, title?: string) => {
      try {
        // Initialize progress
        setFileProgress((prev) => ({
          ...prev,
          [file.name]: {
            fileName: file.name,
            progress: 0,
            status: "reading",
            message: "Reading file...",
          },
        }));

        // Convert to base64 with progress
        const fileData = await fileToBase64WithProgress(file, (progress) => {
          setFileProgress((prev) => ({
            ...prev,
            [file.name]: {
              ...prev[file.name],
              progress,
              status: progress < 50 ? "reading" : "uploading",
              message:
                progress < 50 ? "Reading file..." : "Preparing upload...",
            },
          }));
        });

        // Update progress to uploading
        setFileProgress((prev) => ({
          ...prev,
          [file.name]: {
            ...prev[file.name],
            progress: 80,
            status: "uploading",
            message: "Uploading to server...",
          },
        }));

        // Upload file
        const result = await uploadFile.mutateAsync({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileData,
          subjectId,
          title,
        });

        // Update progress to processing
        setFileProgress((prev) => ({
          ...prev,
          [file.name]: {
            ...prev[file.name],
            progress: 90,
            status: "processing",
            message: "Processing with AI...",
          },
        }));

        return result;
      } catch (error) {
        console.error("File upload failed:", error);
        throw error;
      }
    },
    [uploadFile, fileToBase64WithProgress]
  );

  // Clear progress functions
  const clearProgress = useCallback((fileName: string) => {
    setFileProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
  }, []);

  const clearAllProgress = useCallback(() => {
    setFileProgress({});
  }, []);

  // Get files by subject query
  const useFilesBySubject = (subjectId: string) => {
    return trpc.files.getBySubject.useQuery(
      { subjectId },
      {
        enabled: !!subjectId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
      }
    );
  };

  // Get file by ID query
  const useFileById = (fileId: string) => {
    return trpc.files.getById.useQuery(
      { fileId },
      {
        enabled: !!fileId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
      }
    );
  };

  // Get file statistics query
  const useFileStats = (subjectId: string) => {
    return trpc.files.getStats.useQuery(
      { subjectId },
      {
        enabled: !!subjectId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
      }
    );
  };

  // Validate client-side file
  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
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

      if (file.size > maxSize) {
        return { valid: false, error: "File size cannot exceed 10MB" };
      }

      if (!supportedTypes.includes(file.type)) {
        return { valid: false, error: "File type not supported" };
      }

      return { valid: true };
    },
    []
  );

  // Format file size for display
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }, []);

  // Get file type display name
  const getFileTypeDisplay = useCallback((fileType: string): string => {
    const typeMap: Record<string, string> = {
      "application/pdf": "PDF Document",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "Word Document",
      "application/msword": "Word Document",
      "text/plain": "Text File",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        "PowerPoint Presentation",
      "application/vnd.ms-powerpoint": "PowerPoint Presentation",
      "text/csv": "CSV File",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        "Excel Spreadsheet",
      "application/vnd.ms-excel": "Excel Spreadsheet",
      "text/markdown": "Markdown File",
      "application/rtf": "RTF Document",
    };
    return typeMap[fileType] || "Unknown";
  }, []);

  // Get file type icon
  const getFileIcon = useCallback((fileType: string): string => {
    const iconMap: Record<string, string> = {
      "application/pdf": "📄",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "📝",
      "application/msword": "📝",
      "text/plain": "📃",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        "📊",
      "application/vnd.ms-powerpoint": "📊",
      "text/csv": "📋",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "📈",
      "application/vnd.ms-excel": "📈",
      "text/markdown": "📃",
      "application/rtf": "📃",
    };
    return iconMap[fileType] || "📄";
  }, []);

  return {
    // Mutations
    uploadFile: uploadFile.mutate,
    uploadFileAsync: uploadFile.mutateAsync,
    deleteFile: deleteFile.mutate,
    deleteFileAsync: deleteFile.mutateAsync,

    // Helpers
    handleFileUpload,
    handleFileDelete: useCallback(
      async (fileId: string) => {
        try {
          const result = await deleteFile.mutateAsync({ fileId });
          return result;
        } catch (error) {
          console.error("File deletion failed:", error);
          throw error;
        }
      },
      [deleteFile]
    ),
    validateFile,
    formatFileSize,
    getFileTypeDisplay,
    getFileIcon,

    // Query hooks
    useFilesBySubject,
    useFileById,
    useFileStats,

    // Progress tracking
    fileProgress,
    clearProgress,
    clearAllProgress,

    // Loading states
    isUploading: uploadFile.isPending,
    isDeleting: deleteFile.isPending,

    // Error states
    uploadError: uploadFile.error,
    deleteError: deleteFile.error,

    // Reset functions
    resetUpload: uploadFile.reset,
    resetDelete: deleteFile.reset,
  };
};
