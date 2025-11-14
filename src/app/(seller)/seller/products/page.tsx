"use client";
import React from "react";
import { Filter, Search, ChevronDown, MoreVertical, Eye, Edit2, Trash2, Package, Image, DollarSign, BarChart3, ChevronRight, Pencil, Plus, X } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import ProductForm from "@/components/productFormComponent";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "next-auth/react";
import axios from "axios";
import { S3Storage } from "@/lib/s3";

type SellerProduct = {
  id: string;
  name: string;
  description?: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  productSKU: string;
  hsnCode: string;
  brand: string;
  linkName?: string;
  relatedProducts?: Array<{
    linkName: string;
    url: string;
  }>;
  variants: {
    id: string;
    price: string;
    stockQuantity: number;
    productVariantSKU?: string;
    productWeight?: string;
    variantType?: string;
    variantValue?: string;
    title?: string;
    description?: string;
    additionalPrice?: string;
    ProductVariantImage: { 
      id?: string;
      imageUrl: string; 
      isPrimary?: boolean 
    }[];
    discounts?: {
      id?: string;
      discountType: string;
      discountValue: number;
      startDate: string;
      endDate: string;
    }[];
  }[];
  order?: number;
  GST?: {
    percentage: string;
  };
  seller?: {
    storeName: string;
  };
};

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

// Custom debounce hook
const useDebounce = <T,>(value: T, delay: number = 500): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

const ProductsPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sellerProducts, setSellerProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<SellerProduct[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  // Variant editing states
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [editingVariant, setEditingVariant] = useState<any>(null);
  const [activeEditTab, setActiveEditTab] = useState("details");
  const [isLoading, setIsLoading] = useState(false);

  // Image-related states
  const s3Storage = new S3Storage("products");
  const [previewImage, setPreviewImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Discount states
  const [editingDiscount, setEditingDiscount] = useState<any>(null);
  const [newDiscount, setNewDiscount] = useState({
    discountType: "percentage",
    discountValue: "",
    startDate: "",
    endDate: "",
  });
  const [showNewDiscountDialog, setShowNewDiscountDialog] = useState(false);

  // Product editing states
  const [showProductEditDialog, setShowProductEditDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Debounce the search term
  const debouncedSearchTerm = useDebounce(searchTerm);

  const fetchProducts = useCallback(async () => {
    if (status === "loading") return;
    
    if (status !== "authenticated" || !session?.user?.sellerId) {
      setError("Please login as a seller to view products");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/seller/products`, {
        params: {
          sellerid: session.user.sellerId,
          search: debouncedSearchTerm || undefined
        }
      });

      if (response.data.status === 'success') {
        setSellerProducts(response.data.data);
        setFilteredProducts(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch products');
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching products');
    } finally {
      setLoading(false);
    }
  }, [session, status, debouncedSearchTerm]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Calculate pagination values
  const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(Number(value));
    setCurrentPage(1);
  };

  const handleProductAction = (action: string, productId: string) => {
    switch (action) {
      case 'view':
        router.push(`/seller/sellerproductdetails/${productId}`);
        break;
      case 'edit':
        const product = sellerProducts.find(p => p.id === productId);
        if (product) {
          setEditingProduct({
            ...product,
            aboutProduct: product.description || "",
            GST: product.GST ? {
              percentage: product.GST.percentage
            } : undefined,
            linkName: product.linkName || "",
            relatedProducts: product.relatedProducts && product.relatedProducts.length > 0 
              ? product.relatedProducts 
              : [{ linkName: "", url: "" }]
          });
          setShowProductEditDialog(true);
        }
        break;
    }
  };

  const formatPrice = (price: string) => {
    return `₹${parseFloat(price).toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDiscountInfo = (variant: any) => {
    if (variant.discounts && variant.discounts.length > 0) {
      const discount = variant.discounts[0];
      return `${discount.discountValue}% off`;
    }
    return null;
  };

  const getVariantDisplayName = (variant: any) => {
    if (variant.variantType && variant.variantValue) {
      return `${variant.variantType}: ${variant.variantValue}`;
    }
    return variant.title || 'Default';
  };

  const handleEditVariant = (variantId: string, productId: string) => {
    const product = sellerProducts.find(p => p.id === productId);
    const variant = product?.variants.find((v) => v.id === variantId);
    if (variant) {
      setEditingVariant({
        ...variant,
        variantType: variant.variantType || "",
        variantValue: variant.variantValue || "",
        productVariantSKU: variant.productVariantSKU || "",
        title: variant.title || "",
        description: variant.description || "",
        stockQuantity: variant.stockQuantity || 0,
        productWeight: variant.productWeight || 0,
        price: Number.parseFloat(variant.price.toString()) || 0,
        additionalPrice: Number.parseFloat(variant.additionalPrice?.toString() || "0") || 0,
        productId: productId,
      });
      setEditingVariantId(variantId);
      setShowEditDialog(true);
      setActiveEditTab("details");
    }
  };

  const handleVariantSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = {
        id: editingVariant.id,
        productId: editingVariant.productId,
        productVariantSKU: editingVariant.productVariantSKU,
        title: editingVariant.title,
        description: editingVariant.description,
        price: editingVariant.price,
        stockQuantity: editingVariant.stockQuantity,
        productWeight: Number(editingVariant.productWeight) || 0,
        variantType: editingVariant.variantType,
        variantValue: editingVariant.variantValue,
        additionalPrice: editingVariant.additionalPrice,
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
      await fetchProducts();

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
      await fetchProducts();
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
      await fetchProducts();
    } catch (error: any) {
      console.error("Delete image failed:", error);
      alert("Failed to delete image");
    }
  };

  // Get images for editing variant
  const getEditingVariantImages = () => {
    if (!editingVariantId) return [];
    const product = sellerProducts.find(p => p.id === editingVariant?.productId);
    const editingVariantData = product?.variants.find(
      (v) => v.id === editingVariantId
    );
    return editingVariantData?.ProductVariantImage || [];
  };

  const handleEditDiscount = (discount: any) => {
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
      await fetchProducts();

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
      await fetchProducts();

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

  const LoadingSkeleton = () => (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
      <TableCell><Skeleton className="h-12 w-12 rounded-lg" /></TableCell>
      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
      <TableCell><Skeleton className="h-6 w-[60px]" /></TableCell>
      <TableCell><Skeleton className="h-4 w-[40px]" /></TableCell>
      <TableCell><Skeleton className="h-6 w-[80px]" /></TableCell>
      <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
      <TableCell><Skeleton className="h-8 w-16 rounded" /></TableCell>
    </TableRow>
  );

  // Show authentication error or loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[150px] mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">Please login as a seller to view products</p>
          <Button onClick={() => router.push('/login')}>
            Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground" aria-label="breadcrumb">
          <ol className="flex space-x-2">
            <li>
              <a href="/" className="text-primary hover:underline">
                Home
              </a>
            </li>
            <li>/</li>
            <li className="text-foreground font-medium">Products</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Products</h1>
            <p className="text-muted-foreground mt-1">
              Manage your product inventory and listings
            </p>
          </div>

        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
            <p className="font-medium">Error loading products</p>
            <p className="text-sm">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-card p-4 rounded-lg border shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 ">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search products, brands, or SKU..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page when searching
                  }}
                  className="pl-10"
                  disabled={loading || status !== "authenticated"}
                />
              </div>
            </div>
            {/* <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={loading}>
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={loading}>
                    Sort by
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Name A-Z</DropdownMenuItem>
                  <DropdownMenuItem>Name Z-A</DropdownMenuItem>
                  <DropdownMenuItem>Price Low to High</DropdownMenuItem>
                  <DropdownMenuItem>Price High to Low</DropdownMenuItem>
                  <DropdownMenuItem>Recently Added</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div> */}
          </div>
        </div>
        {/* Summary Stats */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card p-4 rounded-lg border">
              <div className="text-2xl font-bold text-foreground">{filteredProducts.length}</div>
              <div className="text-sm text-muted-foreground">Total Products</div>
            </div>
            <div className="bg-card p-4 rounded-lg border">
              <div className="text-2xl font-bold text-green-600">
                {filteredProducts.filter(p => p.isApproved).length}
              </div>
              <div className="text-sm text-muted-foreground">Published</div>
            </div>
            <div className="bg-card p-4 rounded-lg border">
              <div className="text-2xl font-bold text-orange-600">
                {filteredProducts.filter(p => !p.isApproved).length}
              </div>
              <div className="text-sm text-muted-foreground">Draft</div>
            </div>
            <div className="bg-card p-4 rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">
                {filteredProducts.reduce((sum, p) => sum + (p.variants[0]?.stockQuantity || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Stock</div>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-card rounded-lg border shadow-sm">
          <div className="w-full">
          <Table>
              <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
              <TableRow className="bg-muted/50">
              <TableHead>SKU</TableHead>
                <TableHead className="w-16"></TableHead>
                <TableHead className="min-w-[200px]">Product</TableHead>
                <TableHead>HSN Code</TableHead>             
                <TableHead>Brand</TableHead>
                {/* <TableHead>Price</TableHead>
                <TableHead className="text-center">Stock</TableHead> */}
                <TableHead className="text-center">Orders</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Variants</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Show loading skeletons
                Array.from({ length: 5 }).map((_, index) => (
                  <LoadingSkeleton key={index} />
                ))
              ) : (
                  currentProducts.map((product) => {
                  const primaryVariant = product.variants[0];
                  const primaryImage = primaryVariant?.ProductVariantImage?.find(img => img.isPrimary)?.imageUrl 
                    || primaryVariant?.ProductVariantImage?.[0]?.imageUrl;
                  const discountInfo = getDiscountInfo(primaryVariant);

                  return (
                    <React.Fragment key={product.id}>
                      <TableRow className="hover:bg-muted/30 transition-colors">
                       <TableCell>
                        <span className="font-mono text-sm text-muted-foreground">
                          {product.productSKU}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                          {primaryImage ? (
                            <img
                              src={primaryImage}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs ${primaryImage ? 'hidden' : ''}`}>
                            No Image
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                            <div className="font-medium text-foreground line-clamp-1">
                            {product.name}
                          </div>
                          {product.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1 max-w-[300px] overflow-hidden text-ellipsis">
                              {product.description}
                            </div>
                          )}
                          {discountInfo && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                              {discountInfo}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{product.hsnCode}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{product.brand}</span>
                      </TableCell>
                      {/* <TableCell>
                        <div className="font-semibold text-foreground">
                          {formatPrice(primaryVariant?.price || "0")}
                        </div>
                      </TableCell> */}
                      {/* <TableCell className="text-center">
                        <Badge 
                          variant={primaryVariant?.stockQuantity > 10 ? "default" : primaryVariant?.stockQuantity > 0 ? "secondary" : "destructive"}
                          className="font-mono"
                        >
                          {primaryVariant?.stockQuantity || 0}
                        </Badge>
                      </TableCell> */}
                      <TableCell className="text-center">
                        <span className="font-medium">{product.order || 0}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={product.isApproved ? "default" : "secondary"}>
                          {product.isApproved ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() =>
                            setExpandedProduct((prev) =>
                              prev === product.id ? null : product.id
                            )
                          }
                          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          <ChevronDown
                            className={`h-5 w-5 text-gray-600 transition-transform ${
                              expandedProduct === product.id ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleProductAction('view', product.id)}
                            title="View Product"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                      
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Variants Row */}
                    {expandedProduct === product.id && (
                      <TableRow>
                        <TableCell colSpan={11} className="p-0">
                          <div className="p-4 bg-gray-50 border-t">
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  Product Variants ({product.variants.length})
                                </h3>
                               
                              </div>
                              
                              <div className="grid gap-4">
                                {product.variants.map((variant, index) => {
                                  const variantImage = variant.ProductVariantImage?.find(img => img.isPrimary)?.imageUrl 
                                    || variant.ProductVariantImage?.[0]?.imageUrl;
                                  const discountInfo = getDiscountInfo(variant);
                                  
                                  return (
                                    <div key={variant.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                      <div className="flex items-center space-x-4 flex-1">
                                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                                          {variantImage ? (
                                            <img
                                              src={variantImage}
                                              alt={getVariantDisplayName(variant)}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <Image className="h-8 w-8 text-muted-foreground" />
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="font-medium text-base mb-1">
                                            {getVariantDisplayName(variant)}
                                          </div>
                                          {discountInfo && (
                                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 mb-2">
                                              {discountInfo}
                                            </Badge>
                                          )}
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                              <p className="text-gray-500 text-xs">Price</p>
                                              <p className="font-semibold text-green-700">
                                                {formatPrice(variant.price)}
                                              </p>
                                            </div>
                                            <div>
                                              <p className="text-gray-500 text-xs">Stock</p>
                                              <Badge 
                                                variant={variant.stockQuantity > 10 ? "default" : variant.stockQuantity > 0 ? "secondary" : "destructive"}
                                                className="font-mono"
                                              >
                                                {variant.stockQuantity}
                                              </Badge>
                                            </div>
                                            <div>
                                              <p className="text-gray-500 text-xs">Variant SKU</p>
                                              <p className="font-mono text-sm">
                                                {variant.productVariantSKU || 'N/A'}
                                              </p>
                                            </div>
                                            <div>
                                              <p className="text-gray-500 text-xs">Weight</p>
                                              <p className="text-sm">
                                                {variant.productWeight ? `${variant.productWeight} kg` : 'N/A'}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8 px-3"
                                          onClick={() => handleEditVariant(variant.id, product.id)}
                                        >
                                          <Pencil className="h-3 w-3 mr-1" />
                                          Edit
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>

          {!loading && filteredProducts.length === 0 && !error && (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-2">No products found</div>
              <div className="text-sm text-muted-foreground">
                {searchTerm ? 'Try adjusting your search terms' : 'Start by adding your first product'}
              </div>
            </div>
          )}
        </div>

          {/* Pagination Controls */}
          {!loading && filteredProducts.length > 0 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Rows per page:</p>
                <Select
                  value={rowsPerPage.toString()}
                  onValueChange={handleRowsPerPageChange}
                >
                  <SelectTrigger className="w-[70px]">
                    <SelectValue placeholder={rowsPerPage} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length}
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                    <Button
                      key={pageNumber}
                      variant={pageNumber === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
            </div>
              </div>
            </div>
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

            {/* Images Tab */}
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

              {/* Images Grid */}
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
                            img.isPrimary || false
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

            {/* Discounts Tab */}
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
                    const product = sellerProducts.find(p => p.id === editingVariant?.productId);
                    const currentVariant = product?.variants.find((v) => v.id === editingVariantId);
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
                    fetchProducts();
                  }
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ProductsPage;
