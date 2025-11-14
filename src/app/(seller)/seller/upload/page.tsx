"use client";

import React, { useState, useRef, ChangeEvent, DragEvent } from "react";
import { useRouter } from "next/navigation";
import {
  CloudUpload,
  ChevronLeft,
  AlertCircle,
  FileText,
  X,
} from "lucide-react";
import { S3Storage } from "@/lib/s3";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import axios from "axios";
import { useSession } from "next-auth/react";
import XLSX from "xlsx";

interface UploadedFile {
  name: string;
  status: 'ready' | 'processing' | 'complete' | 'error';
  s3Url?: string;
}

const BulkUpload: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [url, setUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const s3Storage = new S3Storage("bulkupload");
  const router = useRouter();
  const { data: session } = useSession();

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    // Filter for Excel and CSV files
    const validFiles = files.filter((file) => {
      const fileType = file.type;
      return (
        fileType === "application/vnd.ms-excel" ||
        fileType ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        fileType === "text/csv" ||
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls") ||
        file.name.endsWith(".csv")
      );
    });

    if (validFiles.length === 0) {
      setError("Please upload Excel or CSV files only");
      return;
    }

    if (validFiles.some((file) => file.size > 5 * 1024 * 1024)) {
      setError("Files must be less than 5MB");
      return;
    }

    setError(null);
    setIsUploading(true);

    // Add files to state with 'ready' status
    const newFiles = validFiles.map((file) => ({
      name: file.name,
      status: "ready" as const,
    }));

    setUploadedFiles([...uploadedFiles, ...newFiles]);

    // Process each file
    for (const file of validFiles) {
      try {
        // Upload file to S3
        const fileBuffer = await file.arrayBuffer();
        const fileName = `${Date.now()}-${file.name.replace(
          /[^a-zA-Z0-9.-]/g,
          ""
        )}`;

        // Upload to S3 using your existing S3Storage class
        const s3Url = await s3Storage.uploadFile({
          file: Buffer.from(fileBuffer),
          fileName,
          contentType: file.type,
        });

        // Update file with S3 URL
        updateFileStatus(file.name, "ready", s3Url);
      } catch (error) {
        console.error("Error uploading file:", file.name, error);
        updateFileStatus(file.name, "error");
      }
    }

    setIsUploading(false);
  };

  const updateFileStatus = (
    fileName: string,
    status: "ready" | "processing" | "complete" | "error",
    s3Url?: string
  ) => {
    setUploadedFiles((prev) => {
      const updated = [...prev];
      const fileIndex = prev.findIndex((f) => f.name === fileName);

      if (fileIndex !== -1) {
        updated[fileIndex] = {
          ...updated[fileIndex],
          status,
          s3Url,
        };
      }

      return updated;
    });
  };

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleImportUrl = async () => {
    if (!url.trim()) return;

    setIsUploading(true);
    setError(null);

    const fileName =
      url.substring(url.lastIndexOf("/") + 1) || "document-from-url.xlsx";

    // Add file to state with 'ready' status
    setUploadedFiles([
      ...uploadedFiles,
      {
        name: fileName,
        status: "ready",
        s3Url: url,
      },
    ]);

    setUrl("");
    setIsUploading(false);
  };

  const processFiles = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Process all files that are ready and have a valid s3Url
      const filesToProcess = uploadedFiles.filter(
        (f): f is UploadedFile & { s3Url: string } => 
          f.status === "ready" && !!f.s3Url
      );

      for (const file of filesToProcess) {
        try {
          updateFileStatus(file.name, "processing", file.s3Url);
          await processBulkUpload(file.s3Url);
          updateFileStatus(file.name, "complete", file.s3Url);
        } catch (error) {
          console.error("Error processing file:", file.name, error);
          updateFileStatus(file.name, "error", file.s3Url);
          throw error;
        }
      }

      setSuccessMessage("Products have been successfully uploaded");
      // Navigate to products page after a short delay
      setTimeout(() => {
        router.push("/seller/products");
      }, 1500);
    } catch (error: any) {
      console.error("Error in bulk upload:", error);
      setError(
        error?.response?.data?.message || "Bulk upload process completed ."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const processBulkUpload = async (fileUrl: string) => {
    // Call your bulk upload API with the file URL
    const response = await axios.post("/api/seller/products/bulkupload", {
      fileUrl,
    });

    if (response.status !== 200) {
      throw new Error(response.data.message || "Bulk upload failed");
    }

    return response.data;
  };

  const clickToUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleCancel = () => {
    setUploadedFiles([]);
    setUrl("");
    setError(null);
    setSuccessMessage(null);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const hasFilesToProcess = uploadedFiles.some(
    (file) => file.status === "ready" && file.s3Url
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <ChevronLeft
          className="mr-2 cursor-pointer"
          onClick={() => router.back()}
        />
        Bulk Upload Products
      </h2>

      <Card className="mb-8">
        <CardContent className="pt-6">
          {error && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center text-green-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center text-green-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{successMessage}</span>
            </div>
          )}

          <div
            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-8 md:p-12 lg:p-16 bg-gray-50"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="text-gray-400 mb-4">
              <CloudUpload className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium mb-2">Drop or select a file</h3>
            <p className="text-sm text-gray-500 text-center mb-4">
              Drop files here or click to browse through your machine.
            </p>
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              multiple
              accept=".xlsx,.xls,.csv"
            />
            <Button
              variant="outline"
              onClick={clickToUpload}
              disabled={isUploading}
              className="mt-2"
            >
              {isUploading ? "Uploading..." : "Browse Files"}
            </Button>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <p>Excel or CSV files with size less than 5MB</p>
            <p className="mt-1">
              Need a template?{" "}
              <a
                href="/ProductBulkUploadTemplate.xlsx"
                className="text-blue-500"
              >
                Download product upload template
              </a>
            </p>
          </div>

          <div className="mt-6">
            <div className="flex items-center mb-2">
              <label className="text-sm font-medium">Import From URL</label>
              <span className="text-blue-500 ml-1">•</span>
            </div>
            <div className="flex">
              <Input
                className="flex-1 rounded-r-none"
                placeholder="Insert URL of Excel or CSV file"
                value={url}
                onChange={handleUrlChange}
              />
              <Button
                variant="outline"
                className="rounded-l-none border-l-0"
                onClick={handleImportUrl}
                disabled={isUploading || !url.trim()}
              >
                Import
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Uploaded Files</h3>

            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center p-3 bg-gray-50 rounded-lg"
                >
                  <FileText className="h-5 w-5 text-gray-500 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">{file.name}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          file.status === "error"
                            ? "bg-green-500"
                            : file.status === "complete"
                            ? "bg-green-500"
                            : file.status === "processing"
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                        }`}
                        style={{ width: "100%" }}
                      ></div>
                    </div>
                  </div>
                  <div className="ml-3 text-xs">
                    {file.status === "error" ? (
                      <span className="text-green-500">Completed</span>
                    ) : file.status === "complete" ? (
                      <span className="text-green-500">Processed</span>
                    ) : file.status === "processing" ? (
                      <span className="text-yellow-500">Processing</span>
                    ) : (
                      <span className="text-blue-500">Ready</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 text-gray-500 hover:text-red-500"
                    onClick={() => removeFile(index)}
                    disabled={file.status === "processing"}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Proceed button */}
            <div className="flex justify-end mt-4">
              <Button
                variant="default"
                onClick={processFiles}
                disabled={isProcessing || !hasFilesToProcess}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? "Processing..." : "Proceed"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end mt-6 space-x-2">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isUploading || isProcessing}
        >
          Cancel
        </Button>
        <Button
          variant="default"
          className="bg-red-700 hover:bg-red-800"
          onClick={() => router.push("/seller/products")}
          disabled={isUploading || isProcessing}
        >
          Done
        </Button>
      </div>
    </div>
  );
};

export default BulkUpload;
