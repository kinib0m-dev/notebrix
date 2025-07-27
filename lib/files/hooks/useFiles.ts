import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useCallback } from "react";
import type { 
  FileUploadInput, 
  FileDeleteInput, 
  GetFilesInput, 
  GetFileByIdInput 
} from "../validation/schemas";

export const useFiles = () => {
  const utils = trpc.useUtils();

  // Upload file mutation
  const uploadFile = trpc.files.upload.useMutation({
    onSuccess: (data, variables) => {
      toast.success(`File "${data.file.fileName}" uploaded successfully!`);
      
      // Invalidate and refetch files for the subject
      utils.files.getBySubject.invalidate({ subjectId: variables.subjectId });
      utils.files.getStats.invalidate({ subjectId: variables.subjectId });
    },
    onError: (error) => {
      console.error("File upload error:", error);
      toast.error(error.message || "Failed to upload file. Please try again.");
    },
  });

  // Delete file mutation
  const deleteFile = trpc.files.delete.useMutation({
    onSuccess: (data, variables) => {
      toast.success("File deleted successfully!");
      
      // Invalidate queries that might be affected
      utils.files.getBySubject.invalidate();
      utils.files.getStats.invalidate();
      utils.files.getById.invalidate({ fileId: variables.fileId });
    },
    onError: (error) => {
      console.error("File delete error:", error);
      toast.error(error.message || "Failed to delete file. Please try again.");
    },
  });

  // Get files by subject query
  const useFilesBySubject = (input: GetFilesInput) => {
    return trpc.files.getBySubject.useQuery(input, {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    });
  };

  // Get file by ID query
  const useFileById = (input: GetFileByIdInput) => {
    return trpc.files.getById.useQuery(input, {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    });
  };

  // Get file statistics query
  const useFileStats = (input: GetFilesInput) => {
    return trpc.files.getStats.useQuery(input, {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    });
  };

  // Upload file with progress tracking
  const handleFileUpload = useCallback(async (input: FileUploadInput) => {
    try {
      const result = await uploadFile.mutateAsync(input);
      return result;
    } catch (error) {
      throw error;
    }
  }, [uploadFile]);

  // Delete file with confirmation
  const handleFileDelete = useCallback(async (input: FileDeleteInput) => {
    try {
      const result = await deleteFile.mutateAsync(input);
      return result;
    } catch (error) {
      throw error;
    }
  }, [deleteFile]);

  // Helper function to convert File to base64
  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }, []);

  // Helper function to validate file before upload
  const validateFile = useCallback((file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const supportedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
      "text/plain",
      "text/markdown",
      "application/rtf"
    ];

    if (file.size > maxSize) {
      throw new Error("File size cannot exceed 10MB");
    }

    if (!supportedTypes.includes(file.type)) {
      throw new Error("Unsupported file type");
    }

    return true;
  }, []);

  // Complete file upload process (validation + conversion + upload)
  const uploadFileComplete = useCallback(async (file: File, subjectId: string) => {
    try {
      // Validate file
      validateFile(file);

      // Convert to base64
      const fileContent = await fileToBase64(file);

      // Upload file
      const result = await handleFileUpload({
        subjectId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileContent
      });

      return result;
    } catch (error) {
      console.error("Complete file upload error:", error);
      throw error;
    }
  }, [validateFile, fileToBase64, handleFileUpload]);

  return {
    // Mutations
    uploadFile: uploadFile.mutate,
    uploadFileAsync: uploadFile.mutateAsync,
    deleteFile: deleteFile.mutate,
    deleteFileAsync: deleteFile.mutateAsync,

    // Helpers
    handleFileUpload,
    handleFileDelete,
    fileToBase64,
    validateFile,
    uploadFileComplete,

    // Query hooks (to be used in components)
    useFilesBySubject,
    useFileById,
    useFileStats,

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