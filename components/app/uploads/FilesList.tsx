"use client";

import { useState } from "react";
import { FileRecord } from "@/lib/files/types";
import { useFileActions } from "@/lib/files/hooks/useFileActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FileText,
  Search,
  MoreVertical,
  Trash2,
  Calendar,
  ImageIcon,
  Database,
  Clock,
  CheckCircle,
  XCircle,
  Eye
} from "lucide-react";
import { format } from "date-fns";

interface FilesListProps {
  files: FileRecord[];
  isLoading: boolean;
}

export function FilesList({ files, isLoading }: FilesListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteFile, setDeleteFile] = useState<FileRecord | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const { 
    deleteWithConfirmation, 
    formatFileSize, 
    getFileTypeDisplay, 
    getFileIcon,
    isDeleting 
  } = useFileActions();

  // Filter files based on search query
  const filteredFiles = files.filter(file =>
    file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteClick = (file: FileRecord) => {
    setDeleteFile(file);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteFile) return;

    try {
      await deleteWithConfirmation(deleteFile.id, deleteFile.fileName);
      setShowDeleteDialog(false);
      setDeleteFile(null);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="glass-card rounded-2xl p-6">
            <div className="animate-pulse flex space-x-4">
              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Controls */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 glass-input"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredFiles.length} of {files.length} files
          </div>
        </div>
      </div>

      {/* Files Grid */}
      {filteredFiles.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">
            {searchQuery ? "No files match your search" : "No files uploaded yet"}
          </h3>
          <p className="text-muted-foreground">
            {searchQuery 
              ? "Try adjusting your search terms"
              : "Upload some learning materials to get started"
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="glass-card rounded-2xl p-6 hover:shadow-lg transition-all duration-200 group"
            >
              <div className="flex items-start space-x-4">
                {/* File Icon */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl flex-shrink-0">
                  {getFileIcon(file.fileType)}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold truncate text-lg mb-1">
                        {file.fileName}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {getFileTypeDisplay(file.fileType)} • {formatFileSize(file.fileSize)}
                      </p>
                      
                      {/* File Stats */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {format(new Date(file.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                        
                        {file.totalChunks && (
                          <div className="flex items-center space-x-1">
                            <Database className="w-3 h-3" />
                            <span>{file.totalChunks} chunks</span>
                          </div>
                        )}
                        
                        {file.hasImages && (
                          <div className="flex items-center space-x-1">
                            <ImageIcon className="w-3 h-3" />
                            <span>{file.imageCount} images</span>
                          </div>
                        )}
                        
                        {file.wordCount && (
                          <div className="flex items-center space-x-1">
                            <FileText className="w-3 h-3" />
                            <span>{file.wordCount.toLocaleString()} words</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="flex items-center space-x-3 ml-4">
                      {/* Status Badge */}
                      <Badge
                        variant={file.status === "completed" ? "default" : "destructive"}
                        className="flex items-center space-x-1"
                      >
                        {file.status === "completed" ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        <span className="capitalize">{file.status}</span>
                      </Badge>

                      {/* Actions Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-dropdown">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(file)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete File
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Processing Error */}
                  {file.status === "failed" && file.processingError && (
                    <div className="mt-3 glass-card-error rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-red-600 mb-1">Processing Failed</p>
                          <p className="text-red-700 dark:text-red-300">{file.processingError}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="glass-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteFile?.fileName}&quot;? 
              This will permanently remove the file and all its processed chunks. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass-button">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="glass-button-destructive"
            >
              {isDeleting ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete File
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}