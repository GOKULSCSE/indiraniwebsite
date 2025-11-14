"use client";

import {
  useState,
  useEffect,
  useRef,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, X, Upload } from "lucide-react";
import { S3Storage } from "@/lib/s3";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import ProductEditor from "@/components/common/ProductEditor";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";

// Dynamically import RichTextEditor with SSR disabled
const RichTextEditor = dynamic(
  () =>
    import("@/components/RichText/rich-text-editor").then(
      (mod) => mod.RichTextEditor
    ),
  { ssr: false }
);

// Client-side only wrapper component for RichTextEditor
const RichTextEditorSection = ({
  content,
  setContent,
  isEditMode,
}: {
  content: string;
  setContent: (content: string) => void;
  isEditMode: boolean;
}) => {
  if (!isEditMode) {
    return (
      <div className="p-6">
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    );
  }

  return <RichTextEditor initialValue={content} onChange={setContent} />;
};

// Type definitions
interface SubCategory {
  id: string;
  name: string;
  description: string;
  parentCategoryId: string;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  parentCategoryId: string | null;
  createdAt: string;
  updatedAt: string;
  subCategories: SubCategory[];
  parentCategory: Category | null;
}

interface ProductFormProps {
  initialProductData?: {
    id?: string;
    name: string;
    brand: string; 
    description: string;
    aboutProduct: string;
    price: string;
    stockQuantity: string;
    isApproved: boolean;
    sellerId: string;
    categoryId: string;
    hsnCode?: string;
    linkName?: string;
    relatedProducts?: Array<{
      linkName: string;
      url: string;
    }>;
    GST?: {
      percentage: number;
    };
    wholesale?: boolean;
    images: { imageUrl: string; isPrimary: boolean }[];
    variants: {
      variantType: string;
      variantValue: string;
      additionalPrice: number;
    }[];
    discounts: {
      discountType: string;
      discountValue: number;
      startDate: string;
      endDate: string;
    }[];
    onClose?: () => void;
  };
}

interface InputFieldProps {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  className?: string;
}

interface FileUploadProps {
  onFilesUploaded: (urls: string[]) => void;
  existingFiles?: string[];
  onFileRemoved?: (url: string) => void;
}

// Input Field Component
const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  placeholder,
  type = "text",
  value,
  onChange,
  className = "",
}) => (
  <div className={`relative w-full ${className}`}>
    <label className="text-sm text-gray-600 mb-1 block">{label}</label>
    {type === "textarea" ? (
      <Textarea
        name={name}
        className="w-full"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    ) : (
      <Input
        type={type}
        name={name}
        className="w-full"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    )}
  </div>
);

// File Upload Component
const FileUpload: React.FC<FileUploadProps> = ({
  onFilesUploaded,
  existingFiles = [],
  onFileRemoved,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const s3Storage = new S3Storage("products");

  useEffect(() => {
    // Initialize previews with existing files
    if (existingFiles.length > 0) {
      setPreviews(existingFiles);
    }

    // Clean up object URLs on unmount
    return () => {
      previews.forEach((preview) => {
        if (preview.startsWith("blob:")) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [existingFiles]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (selectedFiles: File[]) => {
    // Filter for image files only
    const imageFiles = selectedFiles.filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFiles.length === 0) return;

    // Create object URLs for previews
    const newPreviews = imageFiles.map((file) => URL.createObjectURL(file));

    // Update state
    setFiles((prev) => [...prev, ...imageFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);

    // Upload files to S3
    await uploadFiles(imageFiles);
  };

  const uploadFiles = async (filesToUpload: File[]) => {
    setIsUploading(true);

    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        const fileBuffer = await file.arrayBuffer();
        const fileName = `${Date.now()}-${file.name.replace(
          /[^a-zA-Z0-9.-]/g,
          ""
        )}`;

        const imageUrl = await s3Storage.uploadFile({
          file: Buffer.from(fileBuffer),
          fileName,
          contentType: file.type,
        });

        return imageUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      onFilesUploaded(uploadedUrls);
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    // Get the preview URL to remove
    const previewToRemove = previews[index];

    // If it's a blob URL, revoke it
    if (previewToRemove.startsWith("blob:")) {
      URL.revokeObjectURL(previewToRemove);
    } else if (onFileRemoved) {
      // If it's an existing file URL, call the removal callback
      onFileRemoved(previewToRemove);
    }

    // Update state
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      <div
        className={`border-dashed border-2 ${
          isDragging ? "border-red-500 bg-red-50" : "border-gray-300"
        } 
        p-6 rounded-lg text-center flex flex-col items-center justify-center transition-colors`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex justify-center items-center mb-4">
          <Image
            src="/assets/images/drag-and-drop.png"
            alt="Upload files"
            width={150}
            height={150}
          />
        </div>

        <h4 className="text-lg font-medium mb-2">Drop or select a file</h4>
        <p className="text-gray-500 mb-4">
          Drop files here or click to browse through your machine.
        </p>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept="image/*"
          multiple
          className="hidden"
        />

        <Button
          type="button"
          onClick={handleBrowseClick}
          variant="outline"
          className="mt-2"
          disabled={isUploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? "Uploading..." : "Browse Files"}
        </Button>
      </div>

      {/* File Previews */}
      {previews.length > 0 && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <div className="relative h-24 w-full rounded-lg overflow-hidden">
                <Image
                  src={preview || "/placeholder.svg"}
                  alt={`Preview ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Main ProductForm Component
const ProductForm: React.FC<ProductFormProps> = ({
  initialProductData,
  onClose,
}) => {
  const [content, setContent] = useState("");
  const [formData, setFormData] = useState({
    id: "",
    sellerId: "",
    categoryId: "",
    name: "",
    brand: "", 
    description: "",
    aboutProduct: "",
    isApproved: false,
    wholesale: false,
    GST: {
      percentage: 0
    },
    images: [] as { imageUrl: string; isPrimary: boolean }[],
    discounts: [] as {
      discountType: string;
      discountValue: number;
      startDate: string;
      endDate: string;
    }[],
    hsnCode: "",
    linkName: "",
    relatedProducts: [{ linkName: "", url: "" }],
  });

  const { data: sessionData } = useSession();
  const [isPublished, setIsPublished] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState<
    SubCategory[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const [isEditMode, setIsEditMode] = useState(true);

  // Initialize form data from initialProductData
  useEffect(() => {
    console.log("initialProductData :", initialProductData);
    if (initialProductData) {
      setContent(initialProductData.aboutProduct || "");
      setFormData((prev) => ({
        ...prev,
        id: initialProductData.id || "",
        name: initialProductData.name || "",
        description: initialProductData.description || "",
        brand: initialProductData.brand || "",
        aboutProduct: content || "",
        categoryId: initialProductData.categoryId || "",
        isApproved: initialProductData.isApproved || false,
        wholesale: initialProductData.wholesale || false,
        sellerId: initialProductData.sellerId || prev.sellerId,
        GST: initialProductData.GST || { percentage: 0 },
        images: initialProductData.images || [],
        discounts: initialProductData.discounts || [],
        hsnCode: initialProductData.hsnCode || "",
        linkName: initialProductData.linkName || "",
        relatedProducts: initialProductData.relatedProducts && initialProductData.relatedProducts.length > 0 
          ? initialProductData.relatedProducts 
          : [{ linkName: "", url: "" }],
      }));

      // Filter subcategories if needed
      if (initialProductData.categoryId) {
        const selectedCategory = categories.find(
          (cat) => cat.id === initialProductData.categoryId
        );
        if (selectedCategory) {
          setFilteredSubCategories(selectedCategory.subCategories || []);
        }
      }
    }

    return () => {
      setContent("");
      setFormData((prev) => ({
        ...prev,
        id: "",
        sellerId: "",
        categoryId: "",
        name: "",
        brand: "",
        description: "",
        aboutProduct: "",
        isApproved: false,
        images: [],
        discounts: [],
        hsnCode: "",
      }));
    };
  }, [initialProductData, categories]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("/api/category");
        setCategories(response.data.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  // Form input handlers
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "categoryId") {
      setFormData((prev) => ({
        ...prev,
        subCategoryId: "",
      }));

      const selectedCategory = categories.find(
        (category) => category.id === value
      );

      if (selectedCategory && selectedCategory.subCategories) {
        setFilteredSubCategories(selectedCategory.subCategories);
      } else {
        setFilteredSubCategories([]);
      }
    }
  };

  const handleRelatedProductChange = (index: number, field: 'linkName' | 'url', value: string) => {
    setFormData((prev) => ({
      ...prev,
      relatedProducts: prev.relatedProducts.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addRelatedProduct = () => {
    setFormData((prev) => ({
      ...prev,
      relatedProducts: [...prev.relatedProducts, { linkName: "", url: "" }],
    }));
  };

  const removeRelatedProduct = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      relatedProducts: prev.relatedProducts.filter((_, i) => i !== index),
    }));
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    // Process related products - filter out empty entries
    const relatedProductsArray = formData.relatedProducts
      .filter(item => item.linkName.trim() && item.url.trim())
      .map(item => ({
        linkName: item.linkName.trim(),
        url: item.url.trim()
      }));

    const payload = {
      name: formData.name,
      brand: formData.brand,
      description: formData.description,
      categoryId: formData.categoryId,
      aboutProduct: content, // Pass the object directly
      isApproved: formData.isApproved,
      wholesale: formData.wholesale,
      sellerId: formData.sellerId,
      GST: formData.GST,
      hsnCode: formData.hsnCode,
      linkName: formData.linkName,
      relatedProducts: relatedProductsArray.length > 0 ? relatedProductsArray : null,
    };

    try {
      const response = await axios.put(
        `/api/seller/products?id=${formData.id}`,
        payload
      );
      console.log("Product updated successfully:", response.data);
      setSuccessMessage("Product updated successfully!");

      // You might want to redirect or reload data here
      // router.push('/seller/products');
      onClose?.();
    } catch (err: any) {
      console.error("Error updating product:", err);
      setErrorMessage(
        err.response?.data?.message || "Failed to update product"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <ChevronLeft
          className="mr-2 cursor-pointer"
          onClick={() => router.back()}
        />
        Update Product
      </h2>

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="mb-8">
          <CardContent className="pt-6 w-full">
            <div className="flex w-full justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">Product Details</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="publish"
                    checked={formData.isApproved}
                    onCheckedChange={(value) =>
                      handleChange({
                        target: { name: "isApproved", value: value },
                      } as any)
                    }
                  />
                  <Label htmlFor="publish">Publish</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="wholesale"
                    checked={formData.wholesale}
                    onCheckedChange={(value) =>
                      setFormData(prev => ({ ...prev, wholesale: value }))
                    }
                  />
                  <Label htmlFor="wholesale">Wholesale</Label>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <InputField
                name="name"
                label="Enter Product name"
                placeholder="Product Name"
                value={formData.name}
                onChange={handleChange}
              />
              <InputField
                name="brand"
                label="Product Brand"
                placeholder="Product Brand"
                value={formData.brand}
                onChange={handleChange}
              />
              <InputField
                name="description"
                label="Product Description"
                placeholder="Product Description"
                value={formData.description}
                onChange={handleChange}
              />
              <div className="w-full">
                <label className="text-sm text-gray-600 mb-1 block">
                  Category
                </label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value: string) =>
                    handleSelectChange("categoryId", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category">
                      {formData.categoryId
                        ? categories.find((c) => c.id === formData.categoryId)
                            ?.name
                        : "Select a category"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="w-full">
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="GST Percentage"
                name="GST.percentage"
                placeholder="Enter GST percentage"
                type="number"
                value={formData.GST.percentage.toString()}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    GST: {
                      ...prev.GST,
                      percentage: parseFloat(e.target.value) || 0
                    }
                  }));
                }}
              />
              <InputField
                label="HSN Code"
                name="hsnCode"
                placeholder="Enter HSN code"
                value={formData.hsnCode || ""}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    hsnCode: e.target.value
                  }));
                }}
              />
            </div>

            {/* Link Name Field */}
           

            {/* Related Products Section */}
            <div className="mt-6">
              <Label className="text-sm font-medium">Related Products</Label>
              <div className="space-y-4 mt-2">
                {formData.relatedProducts.map((item, index) => (
                  <div key={index} className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Label className="text-xs text-gray-600">Link Name</Label>
                      <Input
                        placeholder="Enter link name"
                        value={item.linkName}
                        onChange={(e) => handleRelatedProductChange(index, 'linkName', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-gray-600">URL</Label>
                      <Input
                        placeholder="Enter URL"
                        value={item.url}
                        onChange={(e) => handleRelatedProductChange(index, 'url', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeRelatedProduct(index)}
                      disabled={formData.relatedProducts.length === 1}
                      className="mb-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addRelatedProduct}
                  className="w-full"
                >
                  Add Related Product
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">About Product</h3>
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-mode"
                  checked={isEditMode}
                  onCheckedChange={setIsEditMode}
                />
                <label
                  htmlFor="edit-mode"
                  className="text-sm text-gray-600 select-none cursor-pointer"
                >
                  {isEditMode ? "Edit Mode" : "View Mode"}
                </label>
              </div>
            </div>
            <div className="mb-6">
              <RichTextEditorSection
                content={content}
                setContent={setContent}
                isEditMode={isEditMode}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end mt-6">
          <Button
            type="submit"
            className="bg-red-700 hover:bg-red-800 w-full md:w-auto"
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Update Product"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
