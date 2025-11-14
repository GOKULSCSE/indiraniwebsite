"use client";

import type React from "react";

import {
  useState,
  type ChangeEvent,
  useEffect,
  useRef,
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ProductEditor from "@/components/common/ProductEditor";
import { useSession } from "next-auth/react";
import dynamic from 'next/dynamic';

// Dynamically import RichTextEditor with SSR disabled
const RichTextEditor = dynamic(
  () => import('@/components/RichText/rich-text-editor').then(mod => mod.RichTextEditor),
  { ssr: false }
);

// Client-side only wrapper component for RichTextEditor
const RichTextEditorSection = ({ content, setContent, isEditMode }: { 
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

// Custom File Upload Component
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

const ProductForm: React.FC = () => {
  const [formData, setFormData] = useState({
    sellerId: "",
    categoryId: "",
    subCategoryId: "",
    name: "",
    productSKU: "",
    description: "",
    brand: "",
    aboutProduct: "",
    isApproved: false,
    wholesale: false,
    hsnCode: "",
    linkName: "",
    relatedProducts: [{ linkName: "", url: "" }],
    GST: {
      percentage: 0
    },
    variants: [] as {
      productVariantSKU: string;
      title: string;
      variantType: string;
      variantValue: string;
      productWeight: number;
      additionalPrice: number;
      description: string;
      stockQuantity: number;
      price: number;
      height?: number;
      width?: number;
      breadth?: number;
      images: { imageUrl: string; isPrimary: boolean }[];
      discounts: {
        discountType: string;
        discountValue: number;
        startDate: string;
        endDate: string;
      }[];
    }[],
  });

  const [content, setContent] = useState<string>(
    "<p>Hello world! This is a <strong>rich text editor</strong> built with <em>HeroUI</em>.</p>"
  );

  const { data, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && data?.user?.sellerId) {
      setFormData((prev) => ({
        ...prev,
        sellerId: data.user.sellerId,
      }));
    }
  }, [data, status]);

  const [newVariant, setNewVariant] = useState({
    title: "",
    productVariantSKU: "",
    description: "",
    price: 0,
    stockQuantity: 0,
    variantType: "",
    variantValue: "",
    productWeight: 0,
    additionalPrice: 0,
    height: 0,
    width: 0,
    breadth: 0,
    images: [] as { imageUrl: string; isPrimary: boolean }[],
    discounts: [] as {
      discountType: string;
      discountValue: number;
      startDate: string;
      endDate: string;
    }[],
  });

  const [isPublished, setIsPublished] = useState(false);
  const [isWholesale, setIsWholesale] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState<
    SubCategory[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newDiscount, setNewDiscount] = useState({
    discountType: "",
    discountValue: 0,
    startDate: "",
    endDate: "",
  });

  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("/api/category");
        const allCategories = response.data.data;
        setCategories(allCategories);
        
        // Filter main categories and include their subcategories
        const mainCats = allCategories
          .filter((category: any) => !category.parentCategoryId)
          .map((category: any) => ({
            ...category,
            subCategories: allCategories.filter((sub: any) => sub.parentCategoryId === category.id)
          }));
        setMainCategories(mainCats);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([]);
        setMainCategories([]);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
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

      const selectedCategory = mainCategories.find(
        (category) => category.id === value
      );

      if (selectedCategory && selectedCategory.subCategories) {
        setFilteredSubCategories(selectedCategory.subCategories);
      } else {
        setFilteredSubCategories([]);
      }
    }
  };

  // Variant image handling
  const handleVariantFilesUploaded = (urls: string[]) => {
    const isFirstImages = newVariant.images.length === 0;
    const newImages = urls.map((url, index) => ({
      imageUrl: url,
      isPrimary: isFirstImages && index === 0,
    }));

    setNewVariant((prev) => ({
      ...prev,
      images: [...prev.images, ...newImages],
    }));
  };

  const handleVariantFileRemoved = (url: string) => {
    setNewVariant((prev) => {
      const remainingImages = prev.images.filter((img) => img.imageUrl !== url);

      if (
        remainingImages.length > 0 &&
        prev.images.find((img) => img.imageUrl === url)?.isPrimary
      ) {
        remainingImages[0].isPrimary = true;
      }

      return {
        ...prev,
        images: remainingImages,
      };
    });
  };

  const handleVariantSetPrimaryImage = (imageUrl: string) => {
    setNewVariant((prev) => ({
      ...prev,
      images: prev.images.map((img) => ({
        ...img,
        isPrimary: img.imageUrl === imageUrl,
      })),
    }));
  };

  const handleAboutProductChange = (content: any) => {
    setFormData((prev) => ({
      ...prev,
      aboutProduct: JSON.stringify(content),
    }));
  };

  const handleAddVariant = () => {
    if (
      newVariant.variantType &&
      newVariant.variantValue &&
      newVariant.price > 0 &&
      newVariant.stockQuantity > 0 &&
      newVariant.title
    ) {
      setFormData((prev) => ({
        ...prev,
        variants: [
          ...prev.variants,
          {
            productVariantSKU: newVariant.productVariantSKU,
            title: newVariant.title,
            description: newVariant.description,
            price: newVariant.price,
            stockQuantity: newVariant.stockQuantity,
            variantType: newVariant.variantType,
            variantValue: newVariant.variantValue,
            productWeight: newVariant.productWeight,
            additionalPrice: newVariant.additionalPrice,
            height: newVariant.height || undefined,
            width: newVariant.width || undefined,
            breadth: newVariant.breadth || undefined,
            images: newVariant.images,
            discounts: newVariant.discounts,
          },
        ],
      }));
    } else {
      alert("Please fill in all required variant fields correctly.");
    }
  };

  const handleRemoveVariant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const handleAddDiscount = () => {
    if (newDiscount.discountType && newDiscount.discountValue > 0) {
      const startDate = newDiscount.startDate
        ? new Date(newDiscount.startDate).toISOString()
        : new Date().toISOString();

      const endDate = newDiscount.endDate
        ? new Date(newDiscount.endDate).toISOString()
        : new Date(new Date().setDate(new Date().getDate() + 7)).toISOString();

      setNewVariant((prev) => ({
        ...prev,
        discounts: [
          ...prev.discounts,
          {
            discountType: newDiscount.discountType,
            discountValue: newDiscount.discountValue,
            startDate: startDate,
            endDate: endDate,
          },
        ],
      }));

      setNewDiscount({
        discountType: "",
        discountValue: 0,
        startDate: "",
        endDate: "",
      });
    } else {
      alert("Please fill in all required discount fields correctly.");
    }
  };

  const handleRemoveDiscount = (index: number) => {
    setNewVariant((prev) => ({
      ...prev,
      discounts: prev.discounts.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      if (!formData.name || !formData.categoryId) {
        alert("Please fill in all required fields including main category.");
        setIsLoading(false);
        return;
      }

      // Check if selected category has subcategories and subcategory is required
      const selectedMainCategory = mainCategories.find(cat => cat.id === formData.categoryId);
      if (selectedMainCategory && selectedMainCategory.subCategories && selectedMainCategory.subCategories.length > 0) {
        if (!formData.subCategoryId) {
          alert("This category has subcategories. Please select a subcategory to continue.");
          setIsLoading(false);
          return;
        }
      }

      if (formData.variants.length === 0) {
        alert("Please add at least one variant.");
        setIsLoading(false);
        return;
      }

      // Process related products - filter out empty entries
      const relatedProductsArray = formData.relatedProducts
        .filter(item => item.linkName.trim() && item.url.trim())
        .map(item => ({
          linkName: item.linkName.trim(),
          url: item.url.trim()
        }));

      const productData = {
        sellerId: formData.sellerId,
        categoryId: formData.subCategoryId || formData.categoryId, // Use subcategory if selected, otherwise use main category
        name: formData.name,
        productSKU: formData.productSKU,
        description: formData.description,
        brand: formData.brand,
        aboutProduct: content,
        isApproved: isPublished,
        wholesale: isWholesale,
        hsnCode: formData.hsnCode,
        relatedProducts: relatedProductsArray.length > 0 ? relatedProductsArray : null,
        GST:  formData.GST.percentage ? {
          
          percentage: formData.GST.percentage
        } : undefined,
        variants: formData.variants.map((variant) => ({
          title: variant.title,
          productVariantSKU: variant.productVariantSKU,
          description: variant.description || "",
          price: variant.price || 0,
          stockQuantity: variant.stockQuantity || 0,
          variantType: variant.variantType,
          variantValue: variant.variantValue,
          productWeight: variant.productWeight,
          additionalPrice: variant.additionalPrice || 0,
          height: variant.height,
          width: variant.width,
          breadth: variant.breadth,
          images: variant.images,
          discounts: variant.discounts,
        })),
      };

      const response = await axios.post("/api/seller/products", productData);
      console.log("Product Created:", response.data);
      router.push("/seller/products");

      setFormData({
        sellerId: "",
        categoryId: "",
        subCategoryId: "",
        name: "",
        productSKU: "",
        description: "",
        brand: "",
        aboutProduct: "{}",
        isApproved: false,
        wholesale: false,
        hsnCode: "",
        linkName: "",
        relatedProducts: [{ linkName: "", url: "" }],
        GST: {
          
          percentage: 0,
        },
        variants: [],
      });
      setNewVariant({
        title: "",
        productVariantSKU: "",
        description: "",
        price: 0,
        stockQuantity: 0,
        variantType: "",
        variantValue: "",
        productWeight: 0,
        additionalPrice: 0,
        height: 0,
        width: 0,
        breadth: 0,
        images: [],
        discounts: [],
      });
    } catch (error: any) {
      console.error(
        "Error creating product:",
        error.response ? error.response.data : error
      );
      alert(
        "There was an error creating the product. Please check the details."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const [isEditMode, setIsEditMode] = useState(true);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <ChevronLeft
          className="mr-2 cursor-pointer"
          onClick={() => router.back()}
        />
        Add New Product
      </h2>

      <div onSubmit={handleSubmit} className="w-full ">
        <Card className="mb-8">
          <CardContent className="pt-2 w-full">
            <div className="flex w-full justify-between items-center mb-4">
              <h3 className="text-2xl font-bold mb-6">Product Details</h3>
              <div className="flex items-center space-x-4 my-[2rem]">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="publish"
                    checked={isPublished}
                    onCheckedChange={(val) => {
                      setIsPublished(val);
                    }}
                  />
                  <Label htmlFor="publish">Publish</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="wholesale"
                    checked={isWholesale}
                    onCheckedChange={(val) => {
                      setIsWholesale(val);
                      setFormData(prev => ({ ...prev, wholesale: val }));
                    }}
                  />
                  <Label htmlFor="wholesale">Wholesale</Label>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 md:grid-cols-2">
              <InputField
                name="productSKU"
                label="Enter Product SKU"
                placeholder="Product SKU"
                value={formData.productSKU}
                onChange={handleChange}
              />
              <InputField
                name="name"
                label="Enter Product name"
                placeholder="Product Name"
                value={formData.name}
                onChange={handleChange}
              />
              <InputField
                name="description"
                label="Product Description"
                placeholder="Product Description"
                value={formData.description}
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
                name="hsnCode"
                label="HSN Code"
                placeholder="Enter HSN Code"
                value={formData.hsnCode}
                onChange={handleChange}
              />
              <div className="md:col-span-2">
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
              <div className="grid grid-cols-2 gap-4">
                
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">
                    GST Percentage
                  </label>
                  <Input
                    type="number"
                    value={formData.GST.percentage}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        GST: {
                          ...prev.GST,
                          percentage: parseFloat(e.target.value) || 0
                        }
                      }))
                    }
                    placeholder="Enter GST %"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="w-full">
                <label className="text-sm text-gray-600 mb-1 block">
                  Main Category <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value: string) =>
                    handleSelectChange("categoryId", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a main category" />
                  </SelectTrigger>
                  <SelectContent className="w-full">
                    {mainCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <span>{category.name}</span>
                          {category.subCategories && category.subCategories.length > 0 ? (
                            <span className="text-xs text-blue-600">
                              ({category.subCategories.length} subcategor{category.subCategories.length === 1 ? 'y' : 'ies'})
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">
                              (no subcategories)
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {filteredSubCategories.length > 0 && (
                <div className="w-full">
                  <label className="text-sm text-gray-600 mb-1 block">
                    Sub Category <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.subCategoryId || ""}
                    onValueChange={(value: string) =>
                      handleSelectChange("subCategoryId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a sub category" />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      {filteredSubCategories.map((subCategory) => (
                        <SelectItem key={subCategory.id} value={subCategory.id}>
                          {subCategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    This category has subcategories. Please select a subcategory to continue.
                  </p>
                </div>
              )}

              {formData.categoryId && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✅ Product will be assigned to: <strong>
                      {filteredSubCategories.length > 0 
                        ? (formData.subCategoryId 
                            ? filteredSubCategories.find(sub => sub.id === formData.subCategoryId)?.name || 'Selected subcategory'
                            : 'Please select a subcategory')
                        : mainCategories.find(cat => cat.id === formData.categoryId)?.name || 'Selected main category'
                      }
                    </strong>
                  </p>
                  {filteredSubCategories.length > 0 && !formData.subCategoryId && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ This category has subcategories. You must select a subcategory to continue.
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardContent className="pt-2">
            <h3 className="text-2xl font-bold mb-6">Product Variants</h3>

            {/* Variant Basic Info */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">
                    Product Variant SKU
                  </label>
                  <Input
                    value={newVariant.productVariantSKU}
                    onChange={(e) =>
                      setNewVariant({
                        ...newVariant,
                        productVariantSKU: e.target.value,
                      })
                    }
                    placeholder="e.g., VAR001"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">
                    Variant Title
                  </label>
                  <Input
                    value={newVariant.title}
                    onChange={(e) =>
                      setNewVariant({ ...newVariant, title: e.target.value })
                    }
                    placeholder="e.g., Black Keyboard"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">
                    Variant Description
                  </label>
                  <Input
                    value={newVariant.description}
                    onChange={(e) =>
                      setNewVariant((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="e.g., Wireless mechanical keyboard"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">
                    Variant Type
                  </label>
                  <Input
                    value={newVariant.variantType}
                    onChange={(e) =>
                      setNewVariant((prev) => ({
                        ...prev,
                        variantType: e.target.value,
                      }))
                    }
                    placeholder="e.g., color"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">
                    Variant Value
                  </label>
                  <Input
                    value={newVariant.variantValue}
                    onChange={(e) =>
                      setNewVariant((prev) => ({
                        ...prev,
                        variantValue: e.target.value,
                      }))
                    }
                    placeholder="e.g., black"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">
                    Price
                  </label>
                  <Input
                    type="number"
                    value={newVariant.price}
                    onChange={(e) =>
                      setNewVariant((prev) => ({
                        ...prev,
                        price: Number(e.target.value),
                      }))
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">
                    Stock Quantity
                  </label>
                  <Input
                    type="number"
                    value={newVariant.stockQuantity}
                    onChange={(e) =>
                      setNewVariant((prev) => ({
                        ...prev,
                        stockQuantity: Number(e.target.value),
                      }))
                    }
                    placeholder="e.g., 100"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">
                    Product Weight (kg)
                  </label>
                  <Input
                    type="number"
                    value={newVariant.productWeight}
                    onChange={(e) =>
                      setNewVariant((prev) => ({
                        ...prev,
                        productWeight: Number(e.target.value),
                      }))
                    }
                    placeholder="e.g., 15"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">
                    Height
                  </label>
                  <Input
                    type="number"
                    value={newVariant.height}
                    onChange={(e) =>
                      setNewVariant((prev) => ({
                        ...prev,
                        height: Number(e.target.value),
                      }))
                    }
                    placeholder="e.g., 10"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">
                    Width
                  </label>
                  <Input
                    type="number"
                    value={newVariant.width}
                    onChange={(e) =>
                      setNewVariant((prev) => ({
                        ...prev,
                        width: Number(e.target.value),
                      }))
                    }
                    placeholder="e.g., 5"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">
                    Breadth
                  </label>
                  <Input
                    type="number"
                    value={newVariant.breadth}
                    onChange={(e) =>
                      setNewVariant((prev) => ({
                        ...prev,
                        breadth: Number(e.target.value),
                      }))
                    }
                    placeholder="e.g., 3"
                  />
                </div>
                
              </div>
            </div>

            {/* Variant Images */}
            <div className="mb-6">
              <h4 className="text-lg font-medium mb-4">Variant Images</h4>
              <FileUpload
                onFilesUploaded={handleVariantFilesUploaded}
                existingFiles={newVariant.images.map((img) => img.imageUrl)}
                onFileRemoved={handleVariantFileRemoved}
              />

              {newVariant.images.length > 0 && (
                <div className="mt-6">
                  <h5 className="text-md font-medium mb-4">
                    Select Primary Image
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {newVariant.images.map((img, index) => (
                      <div
                        key={index}
                        className="relative group cursor-pointer"
                      >
                        <div
                          className={`relative h-24 w-full rounded-lg overflow-hidden border-2 ${
                            img.isPrimary
                              ? "border-blue-500"
                              : "border-gray-200"
                          }`}
                        >
                          <Image
                            src={img.imageUrl}
                            alt={`Variant Image ${index + 1}`}
                            fill
                            className="object-cover"
                            onClick={() =>
                              handleVariantSetPrimaryImage(img.imageUrl)
                            }
                          />
                          {img.isPrimary && (
                            <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                              Primary
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          className={`mt-2 w-full text-center text-sm ${
                            img.isPrimary
                              ? "text-blue-600"
                              : "text-blue-600 hover:text-blue-800"
                          }`}
                          onClick={() =>
                            handleVariantSetPrimaryImage(img.imageUrl)
                          }
                        >
                          {img.isPrimary ? "Primary Image" : "Set as Primary"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Variant Discounts */}
            <div className="mb-6">
              <h4 className="text-lg font-medium mb-4">Variant Discounts</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">
                    Discount Type
                  </label>
                  <Select
                    value={newDiscount.discountType}
                    onValueChange={(value) =>
                      setNewDiscount((prev) => ({
                        ...prev,
                        discountType: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="amount">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">
                    Discount Value
                  </label>
                  <Input
                    type="number"
                    value={newDiscount.discountValue}
                    onChange={(e) =>
                      setNewDiscount((prev) => ({
                        ...prev,
                        discountValue: Number(e.target.value),
                      }))
                    }
                    placeholder="Enter value"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={newDiscount.startDate}
                    onChange={(e) =>
                      setNewDiscount((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={newDiscount.endDate}
                    onChange={(e) =>
                      setNewDiscount((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={handleAddDiscount}
                disabled={
                  !newDiscount.discountType || newDiscount.discountValue <= 0
                }
              >
                Add Discount
              </Button>

              {newVariant.discounts.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-md font-medium mb-2">Added Discounts</h5>
                  <div className="space-y-2">
                    {newVariant.discounts.map((discount, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <span className="font-medium">
                            {discount.discountType}:
                          </span>{" "}
                          {discount.discountValue}
                          {discount.discountType === "percentage" ? "%" : "$"}
                          <span className="ml-2 text-gray-600">
                            {new Date(discount.startDate).toLocaleDateString()}{" "}
                            -{new Date(discount.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDiscount(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button
              type="button"
              onClick={handleAddVariant}
              disabled={!newVariant.variantType || !newVariant.variantValue}
              className="w-full"
            >
              Add Variant
            </Button>

            {formData.variants.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-medium mb-4">Added Variants</h4>
                <div className="space-y-4">
                  {formData.variants.map((variant, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-medium">{variant.title}</span>
                          <span className="text-gray-600 ml-2">
                            {variant.variantType}: {variant.variantValue}
                          </span>
                          <span className="text-green-600 ml-2">
                            ${variant.price}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveVariant(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </Button>
                      </div>

                      <div className="text-xs text-gray-600 mb-2">
                        {variant.height ? `H:${variant.height} ` : ''}
                        {variant.width ? `W:${variant.width} ` : ''}
                        {variant.breadth ? `B:${variant.breadth}` : ''}
                      </div>

                      {variant.images.length > 0 && (
                        <div className="flex gap-2 mb-2">
                          {variant.images.slice(0, 3).map((img, imgIndex) => (
                            <div
                              key={imgIndex}
                              className="relative h-12 w-12 rounded overflow-hidden"
                            >
                              <Image
                                src={img.imageUrl}
                                alt={`Variant ${imgIndex + 1}`}
                                fill
                                className="object-cover"
                              />
                              {img.isPrimary && (
                                <div className="absolute inset-0 border-2 border-blue-500"></div>
                              )}
                            </div>
                          ))}
                          {variant.images.length > 3 && (
                            <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center text-xs">
                              +{variant.images.length - 3}
                            </div>
                          )}
                        </div>
                      )}

                      {variant.discounts.length > 0 && (
                        <div className="text-sm text-gray-600">
                          Discounts: {variant.discounts.length} applied
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardContent className="pt-2">
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

        <div className="flex justify-between mt-6 flex-col">
          <Button
            onClick={handleSubmit}
            className="bg-red-700 hover:bg-red-800 flex-1"
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create Product"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;
