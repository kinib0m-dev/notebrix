import { useCallback, useState } from "react";
import { useFiles } from "./useFiles";
import { toast } from "sonner";

export interface FileUploadProgress {
  fileName: string;
  progress: number;
  stage: "preparing" | "uploading" | "processing" | "completed" | "error";
  message?: string;
  error?: string;
}

export const useFileActions = () => {
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress | null>(null);
  const [dragOver, setDragOver] = useState(false);
  
  const {
    uploadFileComplete,
    handleFileDelete,
    validateFile,
    isUploading,
    isDeleting
  } = useFiles();

  // Handle file upload with progress tracking
  const uploadWithProgress = useCallback(async (file: File, subjectId: string) => {
    try {
      // Reset any previous progress
      setUploadProgress({
        fileName: file.name,
        progress: 0,
        stage: "preparing",
        message: "Preparing file for upload..."
      });

      // Validate file first
      validateFile(file);

      // Update progress to uploading
      setUploadProgress(prev => prev ? ({
        ...prev,
        progress: 10,
        stage: "uploading",
        message: "Uploading file..."
      }) : null);

      // Start upload
      const result = await uploadFileComplete(file, subjectId);

      // Update progress through processing stages
      setUploadProgress(prev => prev ? ({
        ...prev,
        progress: 50,
        stage: "processing",
        message: "Processing file content..."
      }) : null);

      // Simulate processing progress (since actual progress comes from server)
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUploadProgress(prev => prev ? ({
        ...prev,
        progress: 90,
        stage: "processing",
        message: "Generating chunks and processing images..."
      }) : null);

      await new Promise(resolve => setTimeout(resolve, 500));

      // Complete
      setUploadProgress(prev => prev ? ({
        ...prev,
        progress: 100,
        stage: "completed",
        message: "File uploaded successfully!"
      }) : null);

      // Clear progress after delay
      setTimeout(() => setUploadProgress(null), 2000);

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      
      setUploadProgress(prev => prev ? ({
        ...prev,
        progress: 0,
        stage: "error",
        error: errorMessage
      }) : null);

      // Clear error after delay
      setTimeout(() => setUploadProgress(null), 5000);
      
      throw error;
    }
  }, [uploadFileComplete, validateFile]);

  // Handle multiple file uploads
  const uploadMultipleFiles = useCallback(async (files: File[], subjectId: string) => {
    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        const result = await uploadWithProgress(file, subjectId);
        results.push({ file: file.name, result });
      } catch (error) {
        errors.push({ 
          file: file.name, 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    }

    // Show summary toast
    if (results.length > 0) {
      toast.success(`Successfully uploaded ${results.length} file${results.length > 1 ? 's' : ''}`);
    }

    if (errors.length > 0) {
      toast.error(`Failed to upload ${errors.length} file${errors.length > 1 ? 's' : ''}`);
    }

    return { results, errors };
  }, [uploadWithProgress]);

  // Handle file delete with confirmation
  const deleteWithConfirmation = useCallback(async (
    fileId: string, 
    fileName: string,
    onConfirm?: () => boolean | Promise<boolean>
  ) => {
    try {
      // If confirmation callback provided, call it
      if (onConfirm) {
        const confirmed = await onConfirm();
        if (!confirmed) {
          return { cancelled: true };
        }
      }

      await handleFileDelete({ fileId });
      
      return { success: true };
    } catch (error) {
      console.error("Delete file error:", error);
      throw error;
    }
  }, [handleFileDelete]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set dragOver to false if we're leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, subjectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    
    if (droppedFiles.length === 0) {
      toast.error("No files detected in drop");
      return;
    }

    // Upload files
    uploadMultipleFiles(droppedFiles, subjectId).catch(console.error);
  }, [uploadMultipleFiles]);

  // File input handler
  const handleFileInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement>, 
    subjectId: string
  ) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (selectedFiles.length === 0) return;

    // Upload files
    uploadMultipleFiles(selectedFiles, subjectId).catch(console.error);

    // Clear input
    e.target.value = '';
  }, [uploadMultipleFiles]);

  // Format file size for display
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Get file type display name
  const getFileTypeDisplay = useCallback((mimeType: string): string => {
    const typeMap: Record<string, string> = {
      "application/pdf": "PDF",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word Document",
      "application/msword": "Word Document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PowerPoint",
      "application/vnd.ms-powerpoint": "PowerPoint",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel",
      "application/vnd.ms-excel": "Excel",
      "text/csv": "CSV",
      "text/plain": "Text",
      "text/markdown": "Markdown",
      "application/rtf": "RTF"
    };

    return typeMap[mimeType] || "Unknown";
  }, []);

  // Get file icon based on type
  const getFileIcon = useCallback((mimeType: string): string => {
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
    if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "📊";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "📈";
    if (mimeType.includes("csv")) return "📋";
    if (mimeType.includes("text")) return "📃";
    return "📁";
  }, []);

  return {
    // Upload functions
    uploadWithProgress,
    uploadMultipleFiles,
    
    // Delete functions
    deleteWithConfirmation,
    
    // Drag and drop
    dragOver,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    
    // File input
    handleFileInputChange,
    
    // Utilities
    formatFileSize,
    getFileTypeDisplay,
    getFileIcon,
    
    // Progress tracking
    uploadProgress,
    
    // States
    isUploading,
    isDeleting,
    
    // Clear progress manually if needed
    clearProgress: () => setUploadProgress(null)
  };
};