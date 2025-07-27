"use client";

import { useRef } from "react";
import { useFileActions } from "@/lib/files/hooks/useFileActions";
import { Button } from "@/components/ui/button";
import { Upload, FileText, ImageIcon, Database, Sparkles } from "lucide-react";
import { SUPPORTED_FILE_TYPES } from "@/lib/files/types";

interface UploadAreaProps {
  subjectId: string;
}

export function UploadArea({ subjectId }: UploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    dragOver,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileInputChange,
    isUploading,
  } = useFileActions();

  const handleSelectFiles = () => {
    fileInputRef.current?.click();
  };

  const supportedTypesDisplay = [
    "PDF Documents",
    "Word Documents",
    "PowerPoint Presentations", 
    "Excel Spreadsheets",
    "CSV Files",
    "Text Files"
  ];

  return (
    <div className="space-y-6">
      {/* Main Upload Area */}
      <div
        className={`glass-card rounded-3xl p-12 border-2 border-dashed transition-all duration-300 cursor-pointer group ${
          dragOver 
            ? "border-blue-400 bg-blue-50/50 dark:bg-blue-900/20 shadow-lg scale-[1.02]" 
            : "border-slate-300 dark:border-slate-600 hover:border-blue-300 hover:bg-blue-50/30 dark:hover:bg-blue-900/10"
        } ${isUploading ? "pointer-events-none opacity-50" : ""}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, subjectId)}
        onClick={handleSelectFiles}
      >
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Upload Icon with Animation */}
          <div className={`relative transition-transform duration-300 ${
            dragOver ? "scale-110" : "group-hover:scale-105"
          }`}>
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Upload className={`w-10 h-10 text-white transition-transform duration-300 ${
                dragOver ? "translate-y-[-2px]" : ""
              }`} />
            </div>
            {/* Floating particles effect */}
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="w-3 h-3 text-yellow-800" />
            </div>
          </div>

          {/* Upload Text */}
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold">
              {dragOver ? "Drop your files here!" : "Upload Learning Materials"}
            </h3>
            <p className="text-lg text-muted-foreground max-w-md">
              {dragOver 
                ? "Release to upload your files" 
                : "Drag & drop files here, or click to browse"
              }
            </p>
          </div>

          {/* File Constraints */}
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4" />
              <span>Max 10MB per file</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Multiple files supported</span>
            </div>
            <div className="flex items-center space-x-2">
              <ImageIcon className="w-4 h-4" />
              <span>AI image processing</span>
            </div>
          </div>

          {/* Browse Button */}
          <Button 
            size="lg" 
            className="glass-button px-8 py-3 text-lg"
            disabled={isUploading}
          >
            <Upload className="w-5 h-5 mr-2" />
            Browse Files
          </Button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={SUPPORTED_FILE_TYPES.join(",")}
          onChange={(e) => handleFileInputChange(e, subjectId)}
          className="hidden"
        />
      </div>

      {/* Supported File Types */}
      <div className="glass-card rounded-2xl p-6">
        <h4 className="font-semibold mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-blue-600" />
          Supported File Types
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {supportedTypesDisplay.map((type, index) => (
            <div 
              key={index}
              className="glass-card-subtle rounded-lg p-3 text-sm font-medium text-center hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors"
            >
              {type}
            </div>
          ))}
        </div>
      </div>

      {/* Processing Features */}
      <div className="glass-card rounded-2xl p-6">
        <h4 className="font-semibold mb-4 flex items-center">
          <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
          AI-Powered Processing
        </h4>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h5 className="font-medium">Smart Text Extraction</h5>
            <p className="text-sm text-muted-foreground">
              Advanced content extraction from all supported formats
            </p>
          </div>
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto">
              <ImageIcon className="w-6 h-6 text-white" />
            </div>
            <h5 className="font-medium">Image Understanding</h5>
            <p className="text-sm text-muted-foreground">
              AI-generated descriptions for diagrams and figures
            </p>
          </div>
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mx-auto">
              <Database className="w-6 h-6 text-white" />
            </div>
            <h5 className="font-medium">Smart Chunking</h5>
            <p className="text-sm text-muted-foreground">
              Intelligent content segmentation for optimal learning
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}