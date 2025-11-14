"use client";
import React, { useState, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Upload, X, Check } from "lucide-react";
import { S3Storage } from "@/lib/s3";
import dynamic from 'next/dynamic';

// Dynamically import RichTextEditor with SSR disabled
const RichTextEditor = dynamic(
  () => import('@/components/RichText/rich-text-editor').then(mod => mod.RichTextEditor),
  { ssr: false }
);

export default function TabbedUploader() {
    const [imageURLs, setImageURLs] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [copiedImage, setCopiedImage] = useState<number | null>(null);
    const [copiedText, setCopiedText] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [content, setContent] = useState<string>(
        "<p>Hello world! This is a <strong>rich text editor</strong> built with <em>HeroUI</em>.</p>"
    );

    // Initialize S3 storage
    const s3Storage = new S3Storage("uploads");

    const uploadToS3 = async (file: File) => {
        try {
            const fileBuffer = await file.arrayBuffer();
            const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;

            const imageUrl = await s3Storage.uploadFile({
                file: Buffer.from(fileBuffer),
                fileName,
                contentType: file.type,
            });

            return imageUrl;
        } catch (error) {
            console.error("Error uploading file to S3:", error);
            alert("Failed to upload image. Please try again.");
            return null;
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setIsUploading(true);
        try {
            const uploadPromises = files.map(async (file) => {
                const localUrl = URL.createObjectURL(file);
                const s3Url = await uploadToS3(file);
                if (s3Url) {
                    URL.revokeObjectURL(localUrl);
                    return s3Url;
                }
                return null;
            });

            const uploadedUrls = await Promise.all(uploadPromises);
            const validUrls = uploadedUrls.filter(Boolean) as string[];

            setImageURLs((prev) => [...prev, ...validUrls]);
        } catch (err) {
            console.error("Upload failed:", err);
        } finally {
            setIsUploading(false);
        }
    };

    const copyToClipboard = (text: string, index: number | null = null) => {
        navigator.clipboard.writeText(text);
        if (index !== null) {
            setCopiedImage(index);
            setTimeout(() => setCopiedImage(null), 2000);
        } else {
            setCopiedText(true);
            setTimeout(() => setCopiedText(false), 2000);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files).filter((file) =>
            file.type.startsWith("image/")
        );

        if (files.length === 0) return;

        setIsUploading(true);
        try {
            const uploadedUrls = await Promise.all(
                files.map(async (file) => {
                    const s3Url = await uploadToS3(file);
                    return s3Url;
                })
            );
            const validUrls = uploadedUrls.filter(Boolean) as string[];
            setImageURLs((prev) => [...prev, ...validUrls]);
        } finally {
            setIsUploading(false);
        }
    };

    const removeImage = (indexToRemove: number) => {
        setImageURLs(prevURLs => prevURLs.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div className="w-full p-10 mt-10">
            <Tabs defaultValue="image" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="image">Image Upload</TabsTrigger>
                    <TabsTrigger value="about">About Product</TabsTrigger>
                </TabsList>

                <TabsContent value="image">
                    <Card className="mt-4">
                        <CardContent className="pt-6">
                            <div
                                className="border-dashed border-2 border-gray-300 p-6 rounded-lg text-center flex flex-col items-center justify-center transition-colors hover:border-gray-400"
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />

                                <div className="flex justify-center items-center mb-4">
                                    <Upload className="h-12 w-12 text-gray-400" />
                                </div>

                                <h4 className="text-lg font-medium mb-2">Drop or select an image</h4>
                                <p className="text-gray-500 mb-4">
                                    Drop an image here or click to browse through your machine.
                                </p>

                                <Button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    variant="outline"
                                    className="mt-2"
                                    disabled={isUploading}
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    {isUploading ? "Uploading..." : "Browse Files"}
                                </Button>
                            </div>

                            {imageURLs.length > 0 && (
                                <div className="mt-6">
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    <th className="text-left p-3 border border-gray-200 w-1/3">Image</th>
                                                    <th className="text-left p-3 border border-gray-200 w-2/3">URL</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {imageURLs.map((url, idx) => (
                                                    <tr key={url} className="border-b border-gray-200">
                                                        <td className="p-3 border border-gray-200">
                                                            <div className="relative h-32 w-full rounded-lg overflow-hidden">
                                                                <img
                                                                    src={url}
                                                                    alt={`Uploaded ${idx + 1}`}
                                                                    className="w-full h-full object-contain"
                                                                />
                                                                <Button 
                                                                    variant="destructive" 
                                                                    size="sm"
                                                                    className="absolute top-1 right-1 h-6 w-6 p-1 rounded-full"
                                                                    onClick={() => removeImage(idx)}
                                                                >
                                                                    <X size={14} />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                        <td className="p-3 border border-gray-200">
                                                            <div className="flex items-center gap-2">
                                                                <Input value={url} readOnly className="flex-1" />
                                                                <Button
                                                                    onClick={() => copyToClipboard(url, idx)}
                                                                    variant="outline"
                                                                    className="min-w-[40px]"
                                                                >
                                                                    {copiedImage === idx ? (
                                                                        <Check size={16} className="text-green-500" />
                                                                    ) : (
                                                                        <Copy size={16} />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="about">
                    <Card className="mt-4">
                        <CardContent className="pt-6">
                            <h3 className="text-2xl font-bold mb-6">About Product</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Left: Rich Text Editor */}
                                <div className="mb-6">
                                    <h4 className="text-lg font-medium mb-2">Rich Text Editor</h4>
                                    <div className="border rounded-md overflow-hidden">
                                        <RichTextEditor 
                                            initialValue={content} 
                                            onChange={setContent} 
                                        />
                                    </div>
                                </div>

                                {/* Right: HTML Code */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-lg font-medium">HTML Code</h4>
                                        <Button
                                            onClick={() => {
                                                copyToClipboard(content);
                                            }}
                                            variant="outline"
                                            size="sm"
                                        >
                                            {copiedText ? (
                                                <Check className="mr-2 h-4 w-4" />
                                            ) : (
                                                <Copy className="mr-2 h-4 w-4" />
                                            )}
                                            Copy HTML
                                        </Button>
                                    </div>
                                    <pre className="border rounded-md p-4 min-h-[400px] bg-gray-50 overflow-auto whitespace-pre-wrap font-mono text-sm">
                                        {content}
                                    </pre>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}