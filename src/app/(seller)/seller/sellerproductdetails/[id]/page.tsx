"use client";

import { useState, useEffect } from "react";
import { Pencil, Plus,X } from "lucide-react";
import axios from "axios";
import ProductEditor from "@/components/common/ProductEditor";
import { useSession } from "next-auth/react";
import ProductDetailPageLoader from "@/components/ProductDetailPageLoader";
import { useParams, useRouter } from "next/navigation";
import { S3Storage } from "@/lib/s3";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductForm from "@/components/productFormComponent";

type FileWithId = File & { id: string };

interface VariantImage {
  id?: string;
  imageUrl: string;
  isPrimary: boolean;
}

interface VariantDiscount {
  id?: string;
  discountType: string;
  discountValue: number;
  startDate: string;
  endDate: string;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  aboutProduct: any;
  price: string;
  stockQuantity: number;
  isApproved: boolean;
  sellerId: string;
  categoryId: any;
  hsnCode?: string;
  linkName?: string;
  relatedProducts?: Array<{
    linkName: string;
    url: string;
  }>;
  GST?: {
    id: string;
    percentage: number;
    createdAt: string;
    updatedAt: string;
  };
  wholesale?: boolean;
  variants: {
    id: string;
    productId?: string;
    productVariantSKU?: string;
    title?: string;
    description?: string;
    price: number;
    stockQuantity: number;
    productWeight?: number | string;
    variantType: string;
    variantValue: string;
    additionalPrice?: number | string;
    height?: number | string | null;
    width?: number | string | null;
    breadth?: number | string | null;
    ProductVariantImage?: VariantImage[];
    discounts?: VariantDiscount[];
  }[];
  images: {
    id: string;
    imageUrl: string;
    isPrimary: boolean;
  }[];
  discounts: VariantDiscount[];
}

interface NewVariant {
  title: string;
  productVariantSKU: string;
  description: string;
  price: number;
  stockQuantity: number;
  variantType: string;
  variantValue: string;
  productWeight: number;
  additionalPrice: number;
  height?: number;
  width?: number;
  breadth?: number;
  ProductVariantImage: VariantImage[];
  ProductDiscount?: VariantDiscount[];
}

const ProductPage = () => {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mainImage, setMainImage] = useState<string>("");
  const [selectedVariantTab, setSelectedVariantTab] = useState<string | null>(
    null
  );
  const [cartitems, setCartItems] = useState<
    Array<{
      id: string;
      productId: string;
      name: string;
      quantity: number;
      price: number;
      image?: string;
    }>
  >([]);

  // Edit dialog states
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [activeEditTab, setActiveEditTab] = useState("details");

  // Product editing states
  const [showProductEditDialog, setShowProductEditDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Image-related states
  const s3Storage = new S3Storage("products");
  const [previewImage, setPreviewImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Variant editing states
  const [editingVariant, setEditingVariant] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("details");

  // Discount states
  const [editingDiscount, setEditingDiscount] = useState<any>(null);
  const [newDiscount, setNewDiscount] = useState({
    discountType: "percentage",
    discountValue: "",
    startDate: "",
    endDate: "",
  });
  const [showNewDiscountDialog, setShowNewDiscountDialog] = useState(false);
    const [showAddVariantDialog, setShowAddVariantDialog] = useState(false);
  const [newVariant, setNewVariant] = useState<NewVariant>({
    title: "",
    productVariantSKU: "",
    description: "",
    price: 0,
    stockQuantity: 0,
    variantType: "",
    variantValue: "",
    productWeight: 0,
    additionalPrice: 0,
    height: undefined,
    width: undefined,
    breadth: undefined,
    ProductVariantImage: [],
    ProductDiscount: [],
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!params?.id) return;

    const fetchProduct = async () => {
      try {
        const response = await axios.get(`/api/seller/products/${params.id}?`);
        if (response.data.status === "success") {
          const data = response.data.data;
          setProduct(data);

          // Set first variant as default selected tab
          if (data.variants?.length > 0) {
            setSelectedVariantTab(data.variants[0].id);

            // Set main image from first variant
            const firstVariant = data.variants[0];
            if (firstVariant.ProductVariantImage?.length > 0) {
              const primaryImage = firstVariant.ProductVariantImage.find(
                (img: any) => img.isPrimary
              );
              setMainImage(
                primaryImage?.imageUrl ||
                  firstVariant.ProductVariantImage[0].imageUrl
              );
            }
          }
        }
      } catch (err) {
        setError("Failed to fetch product details");
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params?.id]);

  useEffect(() => {
    const fetchCartData = async () => {
      try {
        const response = await axios.get("/api/products");
        const cartData =
          response.data?.data?.map((item: any) => ({
            id: item.id,
            productId: item.id,
            name: item.name,
            price: Number(item.price),
            image:
              item.images?.[0]?.imageUrl || "https://via.placeholder.com/150",
            quantity: 1,
          })) || [];
        setCartItems(cartData);
      } catch (error) {
        console.error("Failed to fetch cart data:", error);
      }
    };

    fetchCartData();
  }, []);

  // Update main image when variant tab changes
  useEffect(() => {
    if (selectedVariantTab && product) {
      const selectedVariant = product.variants.find(
        (v) => v.id === selectedVariantTab
      );
      if (selectedVariant && selectedVariant.ProductVariantImage && selectedVariant.ProductVariantImage.length > 0) {
        const primaryImage = selectedVariant.ProductVariantImage.find(
          (img) => img.isPrimary
        );
        setMainImage(
          primaryImage?.imageUrl ||
            selectedVariant.ProductVariantImage[0].imageUrl
        );
      }
    }
  }, [selectedVariantTab, product]);

  if (loading) {
    return <ProductDetailPageLoader />;
  }

  if (error || !product) {
    return <div>Error: {error || "Product not found"}</div>;
  }

  const handleEditVariant = (variantId: string) => {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) {
      setEditingVariant({
        ...variant,
        variantType: variant.variantType || "",
        variantValue: variant.variantValue || "",
        productVariantSKU: variant.productVariantSKU || "",
        title: variant.title || "",
        description: variant.description || "",
        stockQuantity: variant.stockQuantity || 0,
        productWeight: (variant.productWeight ? Number(variant.productWeight) : 0),
        // hsnCode: variant.hsnCode || "",
        price: Number.parseFloat(variant.price.toString()) || 0,
        additionalPrice:
          Number.parseFloat(variant.additionalPrice?.toString() || "0") || 0,
        height: variant.height ? Number(variant.height) : undefined,
        width: variant.width ? Number(variant.width) : undefined,
        breadth: variant.breadth ? Number(variant.breadth) : undefined,
      });
      setEditingVariantId(variantId);
      setShowEditDialog(true);
      setActiveEditTab("details");
    }
  };

  const handleEditProduct = () => {
    console.log("Product data❤️❤️❤️:", product);
    setEditingProduct({
      ...product,
      aboutProduct: product.aboutProduct ? product.aboutProduct : "",
      GST: product.GST ? {
        percentage: product.GST.percentage
      } : undefined
    });
    setShowProductEditDialog(true);
  };

  const handleUploadImage = async (file: File) => {
    if (!editingVariantId) {
      alert("Please select a variant first");
      return;
    }

    try {
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

      await axios.post("/api/seller/products/productMedia", {
        productVariantId: editingVariantId,
        imageUrl,
        isPrimary: false,
      });

      // Refresh product data
      const response = await axios.get(`/api/seller/products/${product?.id}`);
      setProduct(response.data.data);
    } catch (error) {
      console.error("S3 Upload failed:", error);
      alert("Upload failed");
    }
  };

  const handleDeleteImage = async (
    imageId: string,
    imageUrl: string,
    isPrimary: boolean
  ) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    if (imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imageUrl);
    }

    try {
      await axios.delete(`/api/seller/products/productMedia?id=${imageId}`);

      const res = await axios.get(`/api/seller/products/${product?.id}`);
      const updatedProduct = res.data.data;
      setProduct(updatedProduct);

      if (isPrimary && updatedProduct.variants && updatedProduct.variants.length > 0) {
        const currentVariant = updatedProduct.variants.find(
          (v: any) => v.id === selectedVariantTab
        );
        if (currentVariant?.ProductVariantImage?.[0]) {
          setMainImage(currentVariant.ProductVariantImage[0].imageUrl);
        }
      }
    } catch (error: any) {
      console.error("Delete image failed:", error);
      alert("Failed to delete image");
    }
  };

  const handleVariantSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = {
        id: editingVariant.id,
        productId: editingVariant.productId || product.id,
        productVariantSKU: editingVariant.productVariantSKU,
        title: editingVariant.title,
        description: editingVariant.description,
        price: editingVariant.price,
        stockQuantity: editingVariant.stockQuantity,
        productWeight: Number(editingVariant.productWeight) || 0,
        // hsnCode: editingVariant.hsnCode,
        variantType: editingVariant.variantType,
        variantValue: editingVariant.variantValue,
        additionalPrice: editingVariant.additionalPrice,
        height: editingVariant.height !== undefined && editingVariant.height !== null ? Number(editingVariant.height) : undefined,
        width: editingVariant.width !== undefined && editingVariant.width !== null ? Number(editingVariant.width) : undefined,
        breadth: editingVariant.breadth !== undefined && editingVariant.breadth !== null ? Number(editingVariant.breadth) : undefined,
      };

      const response = await axios.put(
        "/api/seller/products/variant",
        formData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status !== 201 && response.status !== 200) {
        throw new Error("Failed to update variant");
      }

      // Refresh product data
      const productResponse = await axios.get(`/api/seller/products/${product.id}`);
      setProduct(productResponse.data.data);

      setEditingVariant(null);
      setEditingVariantId(null);
      setShowEditDialog(false);
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to update variant");
      console.error("Error updating variant:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDiscount = (discount: VariantDiscount) => {
    const formatDateForInput = (dateString: string) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    };

    setEditingDiscount({
      id: discount.id || "",
      discountType: discount.discountType || "percentage",
      discountValue: discount.discountValue || "",
      startDate: formatDateForInput(discount.startDate),
      endDate: formatDateForInput(discount.endDate),
    });
    setActiveEditTab("discounts");
  };

  const handleDiscountSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const formatDate = (dateString: string) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        date.setUTCHours(12, 0, 0, 0);
        return date.toISOString();
      };

      const formData = {
        id: editingDiscount.id,
        discountType: editingDiscount.discountType,
        discountValue: Number(editingDiscount.discountValue),
        startDate: formatDate(editingDiscount.startDate),
        endDate: formatDate(editingDiscount.endDate),
      };

      const response = await axios.put(
        "/api/seller/products/discount",
        formData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status !== 201 && response.status !== 200) {
        throw new Error("Failed to update discount");
      }

      // Refresh product data
      const productResponse = await axios.get(`/api/seller/products/${product.id}`);
      setProduct(productResponse.data.data);

      setEditingDiscount(null);
    } catch (error: any) {
      console.error("Error updating discount:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDiscount = async () => {
    if (!editingVariantId) {
      alert("Please select a variant first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formatDate = (dateString: string) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        date.setUTCHours(12, 0, 0, 0);
        return date.toISOString();
      };

      const formData = {
        productVariantId: editingVariantId,
        discountType: newDiscount.discountType,
        discountValue: Number(newDiscount.discountValue),
        startDate: formatDate(newDiscount.startDate),
        endDate: formatDate(newDiscount.endDate),
      };

      const response = await axios.post(
        "/api/seller/products/discount",
        formData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status !== 201) {
        throw new Error("Failed to create discount");
      }

      // Refresh product data to get the new discount
      const productResponse = await axios.get(`/api/seller/products/${product.id}`);
      setProduct(productResponse.data.data);

      setNewDiscount({
        discountType: "percentage",
        discountValue: "",
        startDate: "",
        endDate: "",
      });
      setShowNewDiscountDialog(false);
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to create discount");
      console.error("Error creating discount:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get images for currently selected variant
  const getCurrentVariantImages = () => {
    if (!selectedVariantTab) return [];
    const currentVariant = product.variants.find(
      (v) => v.id === selectedVariantTab
    );
    return currentVariant?.ProductVariantImage || [];
  };

  // Get images for editing variant
  const getEditingVariantImages = () => {
    if (!editingVariantId) return [];
    const editingVariantData = product.variants.find(
      (v) => v.id === editingVariantId
    );
    return editingVariantData?.ProductVariantImage || [];
  };

   const handleAddVariant = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(`/api/seller/products/${params.id}/variants`, {
        ...newVariant,
        productId: params.id,
      });

      if (response.data.status === "success") {
        // Update the product state with the new variant
        setProduct((prev) => ({
          ...prev!,
          variants: [...prev!.variants, response.data.data],
        }));
        
        // Reset form and close dialog
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
          height: undefined,
          width: undefined,
          breadth: undefined,
          ProductVariantImage: [],
          ProductDiscount: [],
        });
        setShowAddVariantDialog(false);
      }
    } catch (error) {
      console.error("Error adding variant:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-12 mx-auto p-4 md:p-10 gap-6 max-w-screen-2xl">
        {/* First Grid - Product Images (Sticky) - Shows only selected variant images */}
        <div className="col-span-12 md:col-span-5 lg:col-span-4">
          <div className="sticky top-[1rem] bg-transparent rounded-lg shadow flex flex-col h-auto md:h-[500px] w-full">
            <div className="relative h-full">
              {/* Main image */}
              <div className="h-[300px] md:h-[400px] w-full bg-transparent flex items-center justify-center">
                <img
                  src={mainImage || "/placeholder.svg"}
                  alt="Main Product"
                  className="h-full w-full object-contain rounded-lg"
                />
              </div>
            </div>

            {/* Thumbnail images - only from selected variant */}
            <div className="flex flex-wrap justify-center gap-2 bg-transparent p-2 rounded-lg">
              {getCurrentVariantImages()
                .filter((img) => img.imageUrl !== mainImage)
                .map((img) => (
                  <img
                    key={img.id}
                    src={img.imageUrl || "/placeholder.svg"}
                    alt={`Thumbnail`}
                    className={`w-12 h-12 bg-transparent object-cover border-2 rounded-lg cursor-pointer transition-all ${
                      mainImage === img.imageUrl
                        ? "border-red-600 scale-110"
                        : "border-black"
                    }`}
                    onClick={() => setMainImage(img.imageUrl)}
                  />
                ))}
            </div>
          </div>
        </div>

        {/* Second Grid - Product Details */}
        <div className="col-span-12 md:col-span-7 lg:col-span-8 relative">
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            {/* Add this pencil button */}
            <div className="absolute top-2 right-2 z-10">
              <button
                onClick={handleEditProduct}
                className="p-2 bg-orange-600 rounded-full text-white hover:bg-orange-700"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>

            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              {product.name} ({product.brand})
            </h1>

            <p className="text-xl md:text-2xl font-semibold text-red-900 mt-2">
              ₹
              {product.variants?.length
                ? Math.min(...product.variants.map((v) => v.price))
                : product.price}
            </p>

            {/* HSN Code */}
            <div className="mt-4">
              <span className="text-sm font-semibold text-gray-600">HSN Code:</span>
              <span className="ml-2 text-sm">{product.hsnCode || "Not specified"}</span>
            </div>

            {/* GST Details */}
            <div className="mt-2">
              <span className="text-sm font-semibold text-gray-600">GST:</span>
              <span className="ml-2 text-sm">{product.GST ? `${product.GST.percentage}%` : "Not specified"}</span>
            </div>
            <div className="mt-2">
              <span className="text-sm font-semibold text-gray-600">Wholesale:</span>
              <span className="ml-2 text-sm">{product.wholesale ? "Enabled" : "Disabled"}</span>
            </div>

            {/* General Link Name */}
            {/* {product.linkName && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                <p className="text-sm text-gray-600 mb-1">General Link Name:</p>
                <p className="text-base font-medium text-gray-800">{product.linkName}</p>
              </div>
            )} */}

            {/* Related Products */}
            {product.relatedProducts && product.relatedProducts.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-3">Related Products</h3>
                <div className="flex flex-wrap gap-2">
                  {product.relatedProducts.map((relatedProduct, index) => (
                    <button
                      key={index}
                      onClick={() => window.open(relatedProduct.url, '_blank')}
                      className="px-4 py-2 rounded-full border border-blue-300 bg-blue-50 text-blue-600 text-sm transition-all duration-200 cursor-pointer hover:bg-blue-100 hover:border-blue-400 hover:shadow-md"
                      title={`Click to visit: ${relatedProduct.url}`}
                    >
                      {relatedProduct.linkName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mt-4 md:mt-6">
              <h2 className="text-lg font-semibold text-gray-800">
                Description
              </h2>
              <p className="text-gray-600 mt-2 text-sm md:text-base">
                {product.description}
              </p>
            </div>

            {/* About Product */}
            <div className="mt-6 md:mt-8">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-2 md:mb-4">
                About this product
              </h2>
              <div className="mt-2 md:mt-4">
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.aboutProduct }}
                />
              </div>
            </div>
          </div>

          {/* Variant Tabs */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="font-bold">Product Variants</h1>
              <Button
                onClick={() => setShowAddVariantDialog(true)}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-800"
              >
                <Plus className="h-4 w-4 " />
                Add Variant
              </Button>
            </div>

            {product.variants && product.variants.length > 0 ? (
              <Tabs
                value={selectedVariantTab || ""}
                onValueChange={setSelectedVariantTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 h-auto bg-transparent">
                  {product.variants.map((variant) => (
                    <TabsTrigger
                      key={variant.id}
                      value={variant.id}
                      className="flex flex-col items-start p-4 h-auto data-[state=active]:bg-blue-50 data-[state=active]:border-blue-500 border-2 rounded-lg"
                    >
                      <div className="text-left w-full">
                        <div className="font-medium text-sm">
                          {variant.variantType}
                        </div>
                        <div className="text-sm text-gray-600">
                          {variant.variantValue}
                        </div>
                        <div className="text-sm font-semibold text-green-600">
                          ₹{variant.price}
                        </div>
                        <div className="text-xs text-gray-500">
                          Stock: {variant.stockQuantity}
                        </div>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {product.variants.map((variant) => (
                  <TabsContent
                    key={variant.id}
                    value={variant.id}
                    className="mt-4"
                  >
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {variant.variantType} - {variant.variantValue}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {variant.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {variant.description}
                          </p>
                        </div>
                        <button
                          onClick={() => handleEditVariant(variant.id)}
                          className="p-2 bg-orange-600 rounded-full text-white hover:bg-orange-700"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Price:</span> ₹
                          {variant.price}
                        </div>
                        <div>
                          <span className="font-medium">Stock:</span>{" "}
                          {variant.stockQuantity}
                        </div>
                        <div>
                          <span className="font-medium">SKU:</span>{" "}
                          {variant.productVariantSKU || "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Weight:</span>{" "}
                          {variant.productWeight || 0} kg
                        </div>
                        <div>
                          <span className="font-medium">Height:</span>{" "}
                          {variant.height ?? "-"}
                        </div>
                        <div>
                          <span className="font-medium">Width:</span>{" "}
                          {variant.width ?? "-"}
                        </div>
                        <div>
                          <span className="font-medium">Breadth:</span>{" "}
                          {variant.breadth ?? "-"}
                        </div>
                      </div>

                      {/* Variant Images */}
                      {variant.ProductVariantImage &&
                        variant.ProductVariantImage.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">
                              Images ({variant.ProductVariantImage.length})
                            </h4>
                            <div className="flex gap-2 flex-wrap">
                              {variant.ProductVariantImage.slice(0, 4).map(
                                (img) => (
                                  <img
                                    key={img.id}
                                    src={img.imageUrl || "/placeholder.svg"}
                                    alt="Variant"
                                    className="w-16 h-16 object-cover rounded border"
                                  />
                                )
                              )}
                              {variant.ProductVariantImage.length > 4 && (
                                <div className="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center text-xs">
                                  +{variant.ProductVariantImage.length - 4}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                      {/* Variant Discounts */}
                      {variant.discounts && variant.discounts.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Active Discounts</h4>
                          <div className="space-y-2">
                            {variant.discounts.map((discount) => (
                              <div
                                key={discount.id}
                                className="flex justify-between items-center p-2 bg-green-50 rounded"
                              >
                                <div className="text-sm">
                                  <span className="font-medium">
                                    {discount.discountType === "percentage"
                                      ? `${discount.discountValue}% off`
                                      : `₹${discount.discountValue} off`}
                                  </span>
                                  <div className="text-xs text-gray-500">
                                    {new Date(
                                      discount.startDate
                                    ).toLocaleDateString()}{" "}
                                    -{" "}
                                    {new Date(
                                      discount.endDate
                                    ).toLocaleDateString()}
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    handleEditVariant(variant.id);
                                    handleEditDiscount(discount);
                                  }}
                                  className="p-1 bg-orange-600 rounded text-white hover:bg-orange-700"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <p className="text-gray-500">No variants available</p>
            )}
          </div>
        </div>

        {/* Edit Variant Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-[95vw] md:max-w-[90vw] h-[90%] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-center text-xl">
                Edit Variant: {editingVariant?.variantType} -{" "}
                {editingVariant?.variantValue}
              </DialogTitle>
            </DialogHeader>

            <Tabs
              value={activeEditTab}
              onValueChange={setActiveEditTab}
              className="w-full h-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Variant Details</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
                <TabsTrigger value="discounts">Discounts</TabsTrigger>
              </TabsList>

              {/* Variant Details Tab */}
              <TabsContent
                value="details"
                className="max-h-[70vh] overflow-y-auto p-4"
              >
                {editingVariant && (
                  <>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="variantType" className="text-right">
                          Type
                        </Label>
                        <Input
                          id="variantType"
                          value={editingVariant.variantType}
                          onChange={(e) =>
                            setEditingVariant({
                              ...editingVariant,
                              variantType: e.target.value,
                            })
                          }
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="variantValue" className="text-right">
                          Value
                        </Label>
                        <Input
                          id="variantValue"
                          value={editingVariant.variantValue}
                          onChange={(e) =>
                            setEditingVariant({
                              ...editingVariant,
                              variantValue: e.target.value,
                            })
                          }
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="sku" className="text-right">
                          SKU
                        </Label>
                        <Input
                          id="sku"
                          value={editingVariant.productVariantSKU || ""}
                          onChange={(e) =>
                            setEditingVariant({
                              ...editingVariant,
                              productVariantSKU: e.target.value,
                            })
                          }
                          className="col-span-3"
                          required
                        />
                      </div>
                      {/* <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="hsnCode" className="text-right">
                          HSN Code
                        </Label>
                        <Input
                          id="hsnCode"
                          value={editingVariant.hsnCode || ""}
                          onChange={(e) =>
                            setEditingVariant({
                              ...editingVariant,
                              hsnCode: e.target.value,
                            })
                          }
                          className="col-span-3"
                        />
                      </div> */}
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="productWeight" className="text-right">
                          Weight (kg)
                        </Label>
                        <Input
                          id="productWeight"
                          type="number"
                          value={editingVariant.productWeight || ""}
                          onChange={(e) =>
                            setEditingVariant({
                              ...editingVariant,
                              productWeight: e.target.value,
                            })
                          }
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="height" className="text-right">
                          Height
                        </Label>
                        <Input
                          id="height"
                          type="number"
                          value={editingVariant.height || ""}
                          onChange={(e) =>
                            setEditingVariant({
                              ...editingVariant,
                              height: e.target.value,
                            })
                          }
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="width" className="text-right">
                          Width
                        </Label>
                        <Input
                          id="width"
                          type="number"
                          value={editingVariant.width || ""}
                          onChange={(e) =>
                            setEditingVariant({
                              ...editingVariant,
                              width: e.target.value,
                            })
                          }
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="breadth" className="text-right">
                          Breadth
                        </Label>
                        <Input
                          id="breadth"
                          type="number"
                          value={editingVariant.breadth || ""}
                          onChange={(e) =>
                            setEditingVariant({
                              ...editingVariant,
                              breadth: e.target.value,
                            })
                          }
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">
                          Title
                        </Label>
                        <Input
                          id="title"
                          value={editingVariant.title || ""}
                          onChange={(e) =>
                            setEditingVariant({
                              ...editingVariant,
                              title: e.target.value,
                            })
                          }
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                          Description
                        </Label>
                        <Input
                          id="description"
                          value={editingVariant.description || ""}
                          onChange={(e) =>
                            setEditingVariant({
                              ...editingVariant,
                              description: e.target.value,
                            })
                          }
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right">
                          Price
                        </Label>
                        <Input
                          id="price"
                          type="number"
                          value={editingVariant.price || ""}
                          onChange={(e) =>
                            setEditingVariant({
                              ...editingVariant,
                              price: Number.parseFloat(e.target.value) || 0,
                            })
                          }
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="stock" className="text-right">
                          Stock
                        </Label>
                        <Input
                          id="stock"
                          type="number"
                          value={editingVariant.stockQuantity || 0}
                          onChange={(e) =>
                            setEditingVariant({
                              ...editingVariant,
                              stockQuantity:
                                Number.parseInt(e.target.value) || 0,
                            })
                          }
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="additionalPrice" className="text-right">
                          Additional Price
                        </Label>
                        <Input
                          id="additionalPrice"
                          type="number"
                          value={editingVariant.additionalPrice || 0}
                          onChange={(e) =>
                            setEditingVariant({
                              ...editingVariant,
                              additionalPrice:
                                Number.parseFloat(e.target.value) || 0,
                            })
                          }
                          className="col-span-3"
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        type="submit"
                        onClick={handleVariantSubmit}
                        disabled={isLoading}
                      >
                        {isLoading ? "Saving..." : "Save changes"}
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </TabsContent>

              {/* Images Tab - Only for editing variant */}
              <TabsContent
                value="images"
                className="max-h-[70vh] overflow-y-auto p-4"
              >
                {/* Upload Section */}
                <div className="mb-4 md:mb-6 p-3 md:p-4 border rounded-lg">
                  <label className="block mb-2 text-sm font-medium">
                    Upload New Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPreviewImage(file);
                        setPreviewUrl(URL.createObjectURL(file));
                      }
                    }}
                    className="block w-full text-sm text-gray-500 border border-gray-300 rounded-lg cursor-pointer focus:outline-none"
                  />
                  {previewImage && previewUrl && (
                    <div className="mb-4 md:mb-6 mt-3 md:mt-4 p-3 md:p-4 border rounded-lg bg-gray-50">
                      <p className="mb-2 text-sm font-semibold">
                        Selected Image Preview:
                      </p>
                      <img
                        src={previewUrl || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-32 md:h-48 object-contain rounded border"
                      />

                      <div className="mt-3 md:mt-4 flex justify-end gap-2 md:gap-3">
                        <button
                          className="px-3 md:px-4 py-1 md:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm md:text-base"
                          onClick={() => {
                            handleUploadImage(previewImage);
                            setPreviewImage(null);
                            setPreviewUrl(null);
                          }}
                        >
                          Upload
                        </button>
                        <button
                          className="px-3 md:px-4 py-1 md:py-2 bg-gray-300 text-black rounded hover:bg-gray-400 text-sm md:text-base"
                          onClick={() => {
                            setPreviewImage(null);
                            setPreviewUrl(null);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    PNG, JPG, WEBP (MAX 5MB)
                  </p>
                </div>

                {/* Images Grid - Only for editing variant */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {getEditingVariantImages().map((img) => (
                    <div
                      key={img.id || Math.random().toString()}
                      className="border rounded-lg overflow-hidden relative group"
                    >
                      <img
                        src={img.imageUrl || "/placeholder.svg"}
                        alt="Product"
                        className="w-full h-24 md:h-32 object-cover"
                      />

                      {/* Image Actions (appear on hover) */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex flex-col items-center justify-center gap-1 md:gap-2 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() =>
                            img.id && handleDeleteImage(
                              img.id,
                              img.imageUrl,
                              img.isPrimary
                            )
                          }
                          className="px-2 md:px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                          disabled={!img.id}
                        >
                          Delete
                        </button>
                      </div>

                      {img.isPrimary && (
                        <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1 md:px-2 py-1 rounded">
                          Primary
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Discounts Tab - Only for editing variant */}
              <TabsContent
                value="discounts"
                className="max-h-[70vh] overflow-y-auto p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Manage Discounts</h3>
                  <button
                    onClick={() => setShowNewDiscountDialog(true)}
                    className="p-2 bg-green-600 rounded-lg text-white hover:bg-green-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Discount
                  </button>
                </div>

                {/* Display current variant info */}
                {editingVariantId && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800">
                      Managing discounts for: {editingVariant?.variantType} - {editingVariant?.variantValue}
                    </h4>
                  </div>
                )}

                {/* Existing Discounts for editing variant */}
                <div className="space-y-4">
                  {editingVariantId ? (
                    (() => {
                      const currentVariant = product.variants.find((v) => v.id === editingVariantId);
                      const discounts = currentVariant?.discounts || [];
                      
                      if (discounts.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <p>No discounts found for this variant.</p>
                            <p className="text-sm mt-1">Click "Add New Discount" to create one.</p>
                          </div>
                        );
                      }

                      return discounts.map((discount) => (
                        <div
                          key={discount.id}
                          className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">
                                  {discount.discountType === "percentage"
                                    ? "Percentage Discount"
                                    : "Fixed Amount Discount"}
                                </h4>
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  {discount.discountType === "percentage"
                                    ? `${discount.discountValue}% OFF`
                                    : `₹${discount.discountValue} OFF`}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">
                                <strong>Discount Value:</strong>{" "}
                                {discount.discountType === "percentage"
                                  ? `${discount.discountValue}%`
                                  : `₹${discount.discountValue}`}
                              </p>
                              <p className="text-sm text-gray-500">
                                <strong>Valid Period:</strong>{" "}
                                {new Date(discount.startDate).toLocaleDateString()} -{" "}
                                {new Date(discount.endDate).toLocaleDateString()}
                              </p>
                              <div className="mt-2">
                                {new Date(discount.endDate) < new Date() ? (
                                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                    Expired
                                  </span>
                                ) : new Date(discount.startDate) > new Date() ? (
                                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                    Scheduled
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                    Active
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleEditDiscount(discount)}
                              className="p-2 bg-orange-600 rounded-full text-white hover:bg-orange-700 transition-colors"
                              title="Edit discount"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ));
                    })()
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>Select a variant to manage its discounts.</p>
                    </div>
                  )}
                </div>

                {/* Edit Discount Form */}
                {editingDiscount && (
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <h4 className="font-medium mb-4">Edit Discount</h4>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="discountType" className="text-right">
                          Discount Type
                        </Label>
                        <select
                          id="discountType"
                          value={editingDiscount.discountType}
                          onChange={(e) =>
                            setEditingDiscount({
                              ...editingDiscount,
                              discountType: e.target.value,
                            })
                          }
                          className="col-span-3 w-full p-2 border rounded-md"
                        >
                          <option value="percentage">Percentage</option>
                          <option value="amount">Fixed Amount</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="discountValue" className="text-right">
                          Value
                        </Label>
                        <Input
                          id="discountValue"
                          type="number"
                          value={editingDiscount.discountValue}
                          onChange={(e) =>
                            setEditingDiscount({
                              ...editingDiscount,
                              discountValue: e.target.value,
                            })
                          }
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="startDate" className="text-right">
                          Start Date
                        </Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={editingDiscount.startDate}
                          onChange={(e) =>
                            setEditingDiscount({
                              ...editingDiscount,
                              startDate: e.target.value,
                            })
                          }
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="endDate" className="text-right">
                          End Date
                        </Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={editingDiscount.endDate}
                          onChange={(e) =>
                            setEditingDiscount({
                              ...editingDiscount,
                              endDate: e.target.value,
                            })
                          }
                          className="col-span-3"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={handleDiscountSubmit}
                        disabled={isLoading}
                      >
                        {isLoading ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingDiscount(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* New Discount Dialog */}
        <Dialog
          open={showNewDiscountDialog}
          onOpenChange={setShowNewDiscountDialog}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Discount</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="newDiscountType" className="text-right">
                  Discount Type
                </Label>
                <select
                  id="newDiscountType"
                  value={newDiscount.discountType}
                  onChange={(e) =>
                    setNewDiscount({
                      ...newDiscount,
                      discountType: e.target.value,
                    })
                  }
                  className="col-span-3 w-full p-2 border rounded-md"
                >
                  <option value="percentage">Percentage</option>
                  <option value="amount">Fixed Amount</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="newDiscountValue" className="text-right">
                  Value
                </Label>
                <Input
                  id="newDiscountValue"
                  type="number"
                  value={newDiscount.discountValue}
                  onChange={(e) =>
                    setNewDiscount({
                      ...newDiscount,
                      discountValue: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="newStartDate" className="text-right">
                  Start Date
                </Label>
                <Input
                  id="newStartDate"
                  type="date"
                  value={newDiscount.startDate}
                  onChange={(e) =>
                    setNewDiscount({
                      ...newDiscount,
                      startDate: e.target.value,
                    })
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="newEndDate" className="text-right">
                  End Date
                </Label>
                <Input
                  id="newEndDate"
                  type="date"
                  value={newDiscount.endDate}
                  onChange={(e) =>
                    setNewDiscount((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  className="col-span-3"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="submit"
                onClick={handleCreateDiscount}
                disabled={isLoading || !editingVariantId}
              >
                {isLoading ? "Creating..." : "Create Discount"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Product Edit Dialog */}
        {showProductEditDialog && (
          <Dialog
            open={showProductEditDialog}
            onOpenChange={setShowProductEditDialog}
            
          >
            <DialogContent className="bg-white max-w-[95vw] md:max-w-[90vw] h-[90%] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
              </DialogHeader>

              {editingProduct && (
                <ProductForm
                  initialProductData={{
                    ...editingProduct,
                    onClose: () => {
                      setShowProductEditDialog(false);
                      // Refresh product data after editing
                      const fetchUpdatedProduct = async () => {
                        try {
                          const response = await axios.get(
                            `/api/seller/products/${product.id}`
                          );
                          if (response.data.status === "success") {
                            setProduct(response.data.data);
                          }
                        } catch (error) {
                          console.error("Error fetching updated product:", error);
                        }
                      };
                      fetchUpdatedProduct();
                    }
                  }}
                />
              )}
            </DialogContent>
          </Dialog>
        )}



<Dialog open={showAddVariantDialog} onOpenChange={setShowAddVariantDialog}>
  <DialogContent className="max-w-[95vw] md:max-w-[90vw] h-[90%] flex flex-col">
    <DialogHeader>
      <DialogTitle>Add New Variant</DialogTitle>
    </DialogHeader>
    <Tabs defaultValue="details" className="w-full h-full" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="details">Variant Details</TabsTrigger>
        <TabsTrigger value="images">Images</TabsTrigger>
        <TabsTrigger value="discounts">Discounts</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="max-h-[70vh] overflow-y-auto p-4">
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="productVariantSKU" className="text-right">
              Product Variant SKU
            </Label>
            <Input
              id="productVariantSKU"
              placeholder="e.g., VAR001"
              value={newVariant.productVariantSKU}
              onChange={(e) =>
                setNewVariant((prev) => ({
                  ...prev,
                  productVariantSKU: e.target.value,
                }))
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="variantType" className="text-right">
              Variant Type
            </Label>
            <Input
              id="variantType"
              placeholder="e.g., color"
              value={newVariant.variantType}
              onChange={(e) =>
                setNewVariant((prev) => ({
                  ...prev,
                  variantType: e.target.value,
                }))
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="variantValue" className="text-right">
              Variant Value
            </Label>
            <Input
              id="variantValue"
              placeholder="e.g., black"
              value={newVariant.variantValue}
              onChange={(e) =>
                setNewVariant((prev) => ({
                  ...prev,
                  variantValue: e.target.value,
                }))
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              placeholder="Variant title"
              value={newVariant.title}
              onChange={(e) =>
                setNewVariant((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              placeholder="Variant description"
              value={newVariant.description}
              onChange={(e) =>
                setNewVariant((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Price
            </Label>
            <Input
              id="price"
              type="number"
              placeholder="0"
              value={newVariant.price}
              onChange={(e) =>
                setNewVariant((prev) => ({
                  ...prev,
                  price: parseFloat(e.target.value) || 0,
                }))
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stockQuantity" className="text-right">
              Stock Quantity
            </Label>
            <Input
              id="stockQuantity"
              type="number"
              placeholder="0"
              value={newVariant.stockQuantity}
              onChange={(e) =>
                setNewVariant((prev) => ({
                  ...prev,
                  stockQuantity: parseInt(e.target.value) || 0,
                }))
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="productWeight" className="text-right">
              Product Weight (kg)
            </Label>
            <Input
              id="productWeight"
              type="number"
              placeholder="0"
              value={newVariant.productWeight}
              onChange={(e) =>
                setNewVariant((prev) => ({
                  ...prev,
                  productWeight: parseFloat(e.target.value) || 0,
                }))
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="height" className="text-right">
              Height
            </Label>
            <Input
              id="height"
              type="number"
              placeholder="0"
              value={newVariant.height || 0}
              onChange={(e) =>
                setNewVariant((prev) => ({
                  ...prev,
                  height: parseFloat(e.target.value) || undefined,
                }))
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="width" className="text-right">
              Width
            </Label>
            <Input
              id="width"
              type="number"
              placeholder="0"
              value={newVariant.width || 0}
              onChange={(e) =>
                setNewVariant((prev) => ({
                  ...prev,
                  width: parseFloat(e.target.value) || undefined,
                }))
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="breadth" className="text-right">
              Breadth
            </Label>
            <Input
              id="breadth"
              type="number"
              placeholder="0"
              value={newVariant.breadth || 0}
              onChange={(e) =>
                setNewVariant((prev) => ({
                  ...prev,
                  breadth: parseFloat(e.target.value) || undefined,
                }))
              }
              className="col-span-3"
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="images">
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                Promise.all(
                  files.map(async (file) => {
                    const fileBuffer = await file.arrayBuffer();
                    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
                    return s3Storage.uploadFile({
                      file: Buffer.from(fileBuffer),
                      fileName,
                      contentType: file.type,
                    });
                  })
                ).then((urls) => {
                  setNewVariant((prev) => ({
                    ...prev,
                    ProductVariantImage: [
                      ...prev.ProductVariantImage,
                      ...urls.map((url) => ({
                        imageUrl: url,
                        isPrimary: prev.ProductVariantImage.length === 0,
                      })),
                    ],
                  }));
                });
              }}
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {newVariant.ProductVariantImage.map((img, index) => (
              <div key={index} className="relative">
                <img
                  src={img.imageUrl}
                  alt={`Variant ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={() => {
                    setNewVariant((prev) => ({
                      ...prev,
                      ProductVariantImage: prev.ProductVariantImage.filter(
                        (_, i) => i !== index
                      ),
                    }));
                  }}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setNewVariant((prev) => ({
                      ...prev,
                      ProductVariantImage: prev.ProductVariantImage.map(
                        (img, i) => ({
                          ...img,
                          isPrimary: i === index,
                        })
                      ),
                    }));
                  }}
                  className={`absolute bottom-1 left-1 px-2 py-1 rounded text-xs ${
                    img.isPrimary
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {img.isPrimary ? "Primary" : "Set as Primary"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="discounts">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discountType">Discount Type</Label>
              <select
                id="discountType"
                value={newDiscount.discountType}
                onChange={(e) =>
                  setNewDiscount((prev) => ({
                    ...prev,
                    discountType: e.target.value,
                  }))
                }
                className="w-full p-2 border rounded-md"
              >
                <option value="percentage">Percentage</option>
                <option value="amount">Fixed Amount</option>
              </select>
            </div>
            <div>
              <Label htmlFor="discountValue">Discount Value</Label>
              <Input
                id="discountValue"
                type="number"
                value={newDiscount.discountValue}
                onChange={(e) =>
                  setNewDiscount((prev) => ({
                    ...prev,
                    discountValue: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
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
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
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
          <Button className="bg-red-600 hover:bg-red-800"
            onClick={() => {
              if (newDiscount.discountValue && newDiscount.startDate && newDiscount.endDate) {
                setNewVariant((prev) => ({
                  ...prev,
                  ProductDiscount: [
                    ...(prev.ProductDiscount || []),
                    {
                      discountType: newDiscount.discountType,
                      discountValue: parseFloat(newDiscount.discountValue),
                      startDate: newDiscount.startDate,
                      endDate: newDiscount.endDate,
                    },
                  ],
                }));
                setNewDiscount({
                  discountType: "percentage",
                  discountValue: "",
                  startDate: "",
                  endDate: "",
                });
              }
            }}
          >
            Add Discount
          </Button>

          {/* List of added discounts */}
          <div className="mt-4 space-y-2">
            {newVariant.ProductDiscount?.map((discount, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-2 bg-gray-50 rounded"
              >
                <div>
                  <span className="font-medium">
                    {discount.discountType === "percentage"
                      ? `${discount.discountValue}%`
                      : `₹${discount.discountValue}`}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    {new Date(discount.startDate).toLocaleDateString()} -{" "}
                    {new Date(discount.endDate).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setNewVariant((prev) => ({
                      ...prev,
                      ProductDiscount: prev.ProductDiscount?.filter(
                        (_, i) => i !== index
                      ),
                    }));
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>
    </Tabs>

    <DialogFooter>
      {/* Variant Details Tab Footer */}
      {activeTab === "details" && (
        <>
          <Button variant="outline" onClick={() => setShowAddVariantDialog(false)}>
            Cancel
          </Button>
          <Button 
            className="bg-red-600 hover:bg-red-800"
            onClick={() => setActiveTab("images")}
          >
            Next
          </Button>
        </>
      )}

      {/* Images Tab Footer */}
      {activeTab === "images" && (
        <>
          <Button 
            variant="outline" 
            onClick={() => setActiveTab("details")}
          >
            Back
          </Button>
          <Button 
            className="bg-red-600 hover:bg-red-800"
            onClick={() => setActiveTab("discounts")}
          >
            Next
          </Button>
        </>
      )}

      {/* Discounts Tab Footer */}
      {activeTab === "discounts" && (
        <>
          <Button 
            variant="outline" 
            onClick={() => setActiveTab("images")}
          >
            Back
          </Button>
          <Button 
            className="bg-red-600 hover:bg-red-800"
            onClick={handleAddVariant} 
            disabled={isLoading}
          >
            {isLoading ? "Adding..." : "Add Variant"}
          </Button>
        </>
      )}
    </DialogFooter>
  </DialogContent>
</Dialog>
      </div>
    </>
  );
};

export default ProductPage;
