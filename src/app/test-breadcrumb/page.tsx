"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Breadcrumb from "@/components/common/Breadcrumb";

interface Category {
  id: string;
  name: string;
  description?: string;
  parentCategoryId?: string;
  parentCategory?: {
    id: string;
    name: string;
    description?: string;
  } | null;
}

interface Product {
  id: string;
  name: string;
  categoryId: string;
  category?: Category;
}

const TestBreadcrumbPage = () => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Use the product ID from your example
        const response = await axios.get(`/api/products/4d37df01-9900-4fbc-ac47-e8233232628d`);
        if (response.data.status === "success") {
          setProduct(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, []);

  const generateBreadcrumbItems = () => {
    if (!product?.category) return [];
    
    const items = [];
    
    // Add parent category if it exists
    if (product.category.parentCategory) {
      items.push({
        label: product.category.parentCategory.name,
        href: `/filter?categoryId=${product.category.parentCategory.id}`
      });
    }
    
    // Add current category
    items.push({
      label: product.category.name,
      href: `/filter?categoryId=${product.category.id}`
    });
    
    // Add product name (no link for current page)
    items.push({
      label: product.name
    });
    
    return items;
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Breadcrumb Test</h1>
      
      {product && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Product Information:</h2>
            <p><strong>Name:</strong> {product.name}</p>
            <p><strong>Category ID:</strong> {product.categoryId}</p>
            {product.category && (
              <div>
                <p><strong>Category:</strong> {product.category.name}</p>
                {product.category.parentCategory && (
                  <p><strong>Parent Category:</strong> {product.category.parentCategory.name}</p>
                )}
              </div>
            )}
          </div>
          
          <div>
            <h2 className="text-lg font-semibold">Breadcrumb:</h2>
            <Breadcrumb items={generateBreadcrumbItems()} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TestBreadcrumbPage;
