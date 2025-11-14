"use client";

import React, { useState, useRef } from "react";
import { S3Storage } from "@/lib/s3";

interface FileUploaderProps {
  onUploadSuccess?: (url: string, fileName: string) => void;
  onUploadError?: (error: Error) => void;
  folder?: string;
  acceptedFileTypes?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onUploadSuccess,
  onUploadError,
  folder = "products",
  acceptedFileTypes = "image/*",
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setProgress(10);

      // Create unique filename
      const uniqueFileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      
      // Create a buffer from the file
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      setProgress(40);
      
      // Upload to S3
      const s3 = new S3Storage(folder);
      const url = await s3.uploadFile({
        file: buffer,
        fileName: uniqueFileName,
        contentType: file.type,
      });

      setProgress(100);
      setUploadedFile({ url, name: uniqueFileName });
      onUploadSuccess?.(url, uniqueFileName);
      
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload failed:", error);
      onUploadError?.(error as Error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!uploadedFile) return;

    try {
      setIsUploading(true);
      const s3 = new S3Storage(folder);
      await s3.deleteFile(uploadedFile.name);
      setUploadedFile(null);
    } catch (error) {
      console.error("Delete failed:", error);
      onUploadError?.(error as Error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          id="file-upload"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept={acceptedFileTypes}
          disabled={isUploading}
        />
        
        {!isUploading && !uploadedFile && (
          <label
            htmlFor="file-upload"
            className="cursor-pointer block py-2 px-4 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Choose File
          </label>
        )}

        {isUploading && (
          <div className="w-full mt-2">
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="mt-2 text-sm text-gray-500">Uploading... {progress}%</p>
          </div>
        )}

        {uploadedFile && (
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center">
                  <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 truncate" style={{ maxWidth: "200px" }}>
                    {uploadedFile.name.split("-").slice(1).join("-")}
                  </p>
                  <p className="text-xs text-gray-500">
                    Uploaded successfully
                  </p>
                </div>
              </div>
              <button
                onClick={handleDelete}
                className="ml-2 text-sm font-medium text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
            
            {uploadedFile.url.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp)$/) && (
              <div className="mt-3">
                <img
                  src={uploadedFile.url}
                  alt="Uploaded file preview"
                  className="h-32 w-auto mx-auto object-contain rounded-md"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader;