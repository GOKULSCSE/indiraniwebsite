import { NextResponse } from "next/server";
import { IProduct, IProductImage, IProductVariant, IProductDiscount, IProductVariantImage, IProductVariantDiscount } from "../models/Product";
import { ResponseGenerator } from "@/utils/responseGenerator";
import { ProductService } from "../services/ProductService";
import { ProductValidation } from "../validations/ProductValidation";
import db from "@/lib/db";
import { z } from "zod";
import _ from "lodash";
import { fromError } from "zod-validation-error"
import * as XLSX from 'xlsx';
import axios from 'axios';
import { log } from "console";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  async CreateProduct(request: Request) {
    try {
      const body = await request.json();
      const validatedData = ProductValidation.CreateProduct().parse(body);

      const product = await this.productService.CreateProduct(validatedData);

      return NextResponse.json(
        ...ResponseGenerator.generate(201, product, "Product created successfully")
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async GetProductById(id: string, withDiscounts: boolean, includeUnapproved: boolean = false) {

    try {
      if (!id) throw new Error("Product ID is required");
      console.log("withDiscounts : ",withDiscounts)
      
      const product = await this.productService.GetProductById(id, withDiscounts, includeUnapproved);
      if (!product) throw new Error("Product not found");

      return NextResponse.json(
        ...ResponseGenerator.generate(200, product, "Product retrieved successfully")
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async UpdateProduct(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");

      console.log("id : ",id)

      if (!id) throw new Error("Product ID is required");

      const body = await request.json();
      const validatedData = ProductValidation.UpdateProduct().parse(body);

      const product = await this.productService.UpdateProduct(id, validatedData);

      return NextResponse.json(
        ...ResponseGenerator.generate(200, product, "Product updated successfully")
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async DeleteProduct(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");

      if (!id) throw new Error("Product ID is required");

      await this.productService.DeleteProduct(id);

      return NextResponse.json(
        ...ResponseGenerator.generate(200, null, "Product deleted successfully")
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async GetProductVariantById(request: Request) {
    try {

      const body = await request.json()
      const id = body.id
      if (!id) throw new Error("Product variant ID is required");

      const product = await this.productService.GetProductVariantById(id);
      if (!product) throw new Error("Product variant not found");

      return NextResponse.json(
        ...ResponseGenerator.generate(200, product, "Product variant retrieved successfully")
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async GetAllProducts(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const categoryId = searchParams.get("categoryId") || undefined;
      const fromPrice = searchParams.get("fromPrice") ? Number(searchParams.get("fromPrice")) : undefined;
      const toPrice = searchParams.get("toPrice") ? Number(searchParams.get("toPrice")) : undefined;
      const search = searchParams.get("search") || undefined;
      const onlyDiscounted = searchParams.get("onlyDiscounted") === "true";

      const products = await this.productService.GetAllProducts({ 
        categoryId, 
        fromPrice, 
        toPrice, 
        search,
        onlyDiscounted 
      });

      return NextResponse.json(
        ...ResponseGenerator.generate(200, products, "Products retrieved successfully")
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async GetProductsBySeller(request: Request) {
    try {
      const userData = request.headers.get("x-user");
      const user: { id: string | null } = userData ? JSON.parse(userData) : null;

      const { searchParams } = new URL(request.url);
      let sellerId: string | null = searchParams.get("sellerid");
      const search: string | null = searchParams.get("search");

      if (!sellerId && user?.id) {
        const seller = await db.sellerProfile.findUnique({ where: { userId: user.id } });
        sellerId = seller?.id || null;
      }

      if (!sellerId) throw new Error("Seller ID is required");

      const products = await this.productService.GetProductsBySeller(
        sellerId,
        search && search.trim() !== "" ? search : undefined
      );

      return NextResponse.json(
        ...ResponseGenerator.generate(200, products, "Seller products retrieved successfully")
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async AddProductVariantImage(request: Request) {
    try {
      const body = await request.json();
      const validatedData = ProductValidation.AddProductVariantImage().parse(body);

      const image = await this.productService.AddProductVariantImage(validatedData);

      return NextResponse.json(
        ...ResponseGenerator.generate(201, image, "Product variant image added successfully")
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async DeleteProductVariantImage(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");

      if (!id) throw new Error("Image ID is required");

      await this.productService.DeleteProductVariantImage(id);

      return NextResponse.json(
        ...ResponseGenerator.generate(200, null, "Product variant image deleted successfully")
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async AddProductVariantDiscount(request: Request) {
    try {
      const body = await request.json();
      const validatedData = ProductValidation.AddProductVariantDiscount().parse(body);

      const discount = await this.productService.AddProductVariantDiscount(validatedData);

      return NextResponse.json(
        ...ResponseGenerator.generate(201, discount, "Product variant discount added successfully")
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async UpdateProductVariantDiscount(request: Request) {
    try {
      const body = await request.json();
      const validatedData = ProductValidation.UpdateProductVariantDiscount().parse(body);

      const discount = await this.productService.UpdateProductVariantDiscount(validatedData);

      return NextResponse.json(
        ...ResponseGenerator.generate(201, discount, "Product variant discount updated successfully")
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async DeleteProductVariantDiscount(request: Request) {
    try {
      const body = await request.json();
      const id = body.id;
      if (!id) throw new Error("Discount ID is required");

      await this.productService.DeleteProductVariantDiscount(id);

      return NextResponse.json(
        ...ResponseGenerator.generate(200, null, "Product variant discount deleted successfully")
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async AddProductVariant(request: Request) {
    try {
      const body = await request.json();
      
      // Validate the base variant data first
      const validatedData = ProductValidation.AddProductVariant().parse(body);

      // Add ProductVariantImage and ProductDiscount to the validated data if they exist
      const variantData: IProductVariant = {
        ...validatedData,
        ProductVariantImage: body.ProductVariantImage,
        ProductDiscount: body.ProductDiscount
      };

      const variant = await this.productService.AddProductVariant(variantData);

      return NextResponse.json(
        ...ResponseGenerator.generate(201, variant, "Product variant added successfully")
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async UpdateProductVariant(request: Request) {
    try {

      const body = await request.json()

      const validatedData = ProductValidation.UpdateProductVariant().parse(body)
      const updatedVariant = await this.productService.UpdateProductVariant(validatedData)

      return NextResponse.json(
        ...ResponseGenerator.generate(201, updatedVariant, "Product variant Updated successfully")
      );


    } catch (error) {
      return this.handleError(error)
    }
  }

  async DeleteProductVariant(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");

      if (!id) throw new Error("Variant ID is required");

      await this.productService.DeleteProductVariant(id);

      return NextResponse.json(
        ...ResponseGenerator.generate(200, null, "Product variant deleted successfully")
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async BulkUploadProducts(fileUrl: string, request: Request) {
    try {
      // Get seller ID from headers
      const userData = request.headers.get("x-user");
      const user: { id: string | null } = userData ? JSON.parse(userData) : null;

      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // Get seller profile
      const seller = await db.sellerProfile.findUnique({
        where: { userId: user.id }
      });

      if (!seller) {
        throw new Error("Seller profile not found");
      }

      // Download the Excel file
      const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      const workbook = XLSX.read(response.data);

      // Get all sheets
      const productSheet = workbook.Sheets['Product'];
      const variantSheet = workbook.Sheets['ProductVariant'];
      const variantImageSheet = workbook.Sheets['ProductImage'];
      const variantDiscountSheet = workbook.Sheets['ProductDiscount'];

      if (!productSheet || !variantSheet) {
        throw new Error('Required sheets (Product and ProductVariant) are missing');
      }

      // Convert sheets to array format and transform data
      const rawProducts = XLSX.utils.sheet_to_json(productSheet);
      console.log('Raw Excel product data:', rawProducts);
      console.log('Available columns in Excel:', rawProducts.length > 0 ? Object.keys(rawProducts[0] as object) : 'No data');
      
      // Check if subcategory column exists in any form
      const hasSubcategoryColumn = rawProducts.length > 0 && Object.keys(rawProducts[0] as object).some(key => 
        key.toLowerCase().includes('subcategory') || 
        key.toLowerCase().includes('sub-category') ||
        key.toLowerCase().includes('sub category')
      );
      
      if (!hasSubcategoryColumn) {
        console.log('⚠️  No subcategory column found in Excel. Available columns:', Object.keys(rawProducts[0] as object || {}));
        console.log('💡 To use subcategories, add a column named "subcategory", "Subcategory", "Sub Category", or "sub-category"');
      }
      
      const products = rawProducts.map((product: any) => {
        // Try different possible column names for subcategory
        const subcategoryValue = product.subcategory || 
                                product.Subcategory || 
                                product['Sub Category'] || 
                                product['sub-category'] ||
                                product['Sub-Category'] ||
                                undefined;
        
        // Process related products - handle different possible column names
        const relatedProductsValue = product.relatedProducts || 
                                   product.related_products || 
                                   product['Related Products'] || 
                                   product['related-products'] ||
                                   product['Related-Products'] ||
                                   undefined;
        
        // Process link name
        const linkNameValue = product.linkName || 
                             product.link_name || 
                             product['Link Name'] || 
                             product['link-name'] ||
                             product['Link-Name'] ||
                             undefined;
        
        // Convert related products to new structure
        let relatedProductsArray: Array<{linkName: string; url: string}> = [];
        if (relatedProductsValue) {
          if (typeof relatedProductsValue === 'string') {
            // Split by comma, newline, or semicolon and clean up
            const urls = relatedProductsValue
              .split(/[,;\n]/)
              .map(url => url.trim())
              .filter(url => url.length > 0);
            
            // Create objects with linkName and url
            relatedProductsArray = urls.map(url => ({
              linkName: linkNameValue || `Related Product ${urls.indexOf(url) + 1}`,
              url: url
            }));
          } else if (Array.isArray(relatedProductsValue)) {
            relatedProductsArray = relatedProductsValue
              .filter(item => typeof item === 'string' && item.trim().length > 0)
              .map((url, index) => ({
                linkName: linkNameValue || `Related Product ${index + 1}`,
                url: url.trim()
              }));
          }
        }
        
        console.log(`Product ${product.productSKU} subcategory mapping:`, {
          original: product.subcategory,
          Subcategory: product.Subcategory,
          'Sub Category': product['Sub Category'],
          'sub-category': product['sub-category'],
          'Sub-Category': product['Sub-Category'],
          final: subcategoryValue
        });
        
        console.log(`Product ${product.productSKU} related products mapping:`, {
          original: relatedProductsValue,
          processed: relatedProductsArray
        });
        
        return {
          ...product,
          subcategory: subcategoryValue,
          linkName: linkNameValue,
          relatedProducts: relatedProductsArray.length > 0 ? relatedProductsArray : undefined
        };
      });
      
      console.log('Processed products with subcategory:', products);
      const variants = XLSX.utils.sheet_to_json(variantSheet);
      
      interface ExcelVariantImage {
        productVariantSKU: string;
        imageUrl: string;
        isPrimary?: boolean;
      }

      interface ExcelVariantDiscount {
        productVariantSKU: string;
        discountType: string;
        discountValue: number;
        startDate: string;
        endDate: string;
      }

      const variantImages: ExcelVariantImage[] = variantImageSheet ? 
        XLSX.utils.sheet_to_json(variantImageSheet).map((img: any) => ({
          productVariantSKU: String(img.productVariantSKU),
          imageUrl: String(img.imageUrl),
          isPrimary: Boolean(img.isPrimary)
        })) : [];

      const variantDiscounts: ExcelVariantDiscount[] = variantDiscountSheet ? 
        XLSX.utils.sheet_to_json(variantDiscountSheet).map((disc: any) => ({
          productVariantSKU: String(disc.productVariantSKU),
          discountType: String(disc.discountType) as 'percentage' | 'amount',
          discountValue: Number(disc.discountValue),
          startDate: disc.startDate,
          endDate: disc.endDate
        })) : [];

      // Validate variants
      const variantSKUs = new Set<string>();
      const productSKUs = new Set<string>();
      const errors: Record<string, string[]> = {};

      // Validate products
      products.forEach((product: any, index: number) => {
        if (!product.productSKU) {
          errors[`product_${index}`] = ["Product SKU is required"];
        } else if (productSKUs.has(product.productSKU)) {
          errors[`product_${index}`] = ["Duplicate Product SKU"];
        } else {
          productSKUs.add(product.productSKU);
        }

        if (!product.category) {
          errors[`product_${index}`] = ["Category is required"];
        }

        if (!product.name) {
          errors[`product_${index}`] = ["Product name is required"];
        }

        // Validate brand if provided
        if (product.brand !== undefined && product.brand !== null && typeof product.brand !== 'string') {
          errors[`product_${index}`] = ["Brand must be a string"];
        }

        // Validate subcategory if provided
        if (product.subcategory !== undefined && product.subcategory !== null && typeof product.subcategory !== 'string') {
          errors[`product_${index}`] = ["Subcategory must be a string"];
        }

        // Validate related products if provided
        if (product.relatedProducts !== undefined && product.relatedProducts !== null) {
          if (Array.isArray(product.relatedProducts)) {
            // Validate each related product object in the array
            product.relatedProducts.forEach((item: any, itemIndex: number) => {
              if (typeof item !== 'object' || !item.linkName || !item.url) {
                errors[`product_${index}`] = [`Related product at index ${itemIndex} must have both linkName and url`];
              } else {
                if (typeof item.linkName !== 'string' || !item.linkName.trim()) {
                  errors[`product_${index}`] = [`Related product linkName at index ${itemIndex} must be a non-empty string`];
                }
                if (typeof item.url !== 'string' || !item.url.trim()) {
                  errors[`product_${index}`] = [`Related product URL at index ${itemIndex} must be a non-empty string`];
                } else {
                  // Basic URL validation
                  try {
                    new URL(item.url.trim());
                  } catch {
                    errors[`product_${index}`] = [`Related product URL at index ${itemIndex} is not a valid URL`];
                  }
                }
              }
            });
          } else {
            errors[`product_${index}`] = ["Related products must be an array of objects with linkName and url"];
          }
        }
      });

      // Validate variants
      variants.forEach((variant: any, index: number) => {
        if (!variant.productVariantSKU) {
          errors[`variant_${index}`] = ["Variant SKU is required"];
        } else if (variantSKUs.has(variant.productVariantSKU)) {
          errors[`variant_${index}`] = ["Duplicate Variant SKU"];
        } else {
          variantSKUs.add(variant.productVariantSKU);
        }

        if (!variant.productSKU) {
          errors[`variant_${index}`] = ["Product SKU is required for variant"];
        } else if (!productSKUs.has(variant.productSKU)) {
          errors[`variant_${index}`] = ["Product SKU does not exist"];
        }

        if (!variant.title) {
          errors[`variant_${index}`] = ["Variant title is required"];
        }

        if (!variant.price || isNaN(Number(variant.price)) || Number(variant.price) <= 0) {
          errors[`variant_${index}`] = ["Valid price is required"];
        }

        if (!variant.stockQuantity || isNaN(Number(variant.stockQuantity)) || Number(variant.stockQuantity) < 0) {
          errors[`variant_${index}`] = ["Valid stock quantity is required"];
        }

        if (!variant.variantType) {
          errors[`variant_${index}`] = ["Variant type is required"];
        }

        if (!variant.variantValue) {
          errors[`variant_${index}`] = ["Variant value is required"];
        }

        // Validate HSN code format if provided
        if (variant.hsnCode && !/^\d{6,8}$/.test(String(variant.hsnCode))) {
          errors[`variant_${index}`] = ["HSN code must be 6-8 digits"];
        }

        // Validate product weight if provided
        if (variant.productWeight !== undefined && variant.productWeight !== null) {
          const weight = Number(variant.productWeight);
          if (isNaN(weight) || weight <= 0) {
            errors[`variant_${index}`] = ["Product weight must be a positive number"];
          }
        }
      });

      // Validate variant images
      variantImages.forEach((image: any, index: number) => {
        if (!image.productVariantSKU) {
          errors[`variant_image_${index}`] = ["Variant SKU is required for image"];
        } else if (!variantSKUs.has(image.productVariantSKU)) {
          errors[`variant_image_${index}`] = ["Variant SKU does not exist"];
        }

        if (!image.imageUrl) {
          errors[`variant_image_${index}`] = ["Image URL is required"];
        }
      });

      // Validate variant discounts
      variantDiscounts.forEach((discount: any, index: number) => {
        if (!discount.productVariantSKU) {
          errors[`variant_discount_${index}`] = ["Variant SKU is required for discount"];
        } else if (!variantSKUs.has(discount.productVariantSKU)) {
          errors[`variant_discount_${index}`] = ["Variant SKU does not exist"];
        }

        if (!discount.discountType || !['percentage', 'amount'].includes(discount.discountType)) {
          errors[`variant_discount_${index}`] = ["Valid discount type (percentage/amount) is required"];
        }

        if (!discount.discountValue || isNaN(Number(discount.discountValue)) || Number(discount.discountValue) <= 0) {
          errors[`variant_discount_${index}`] = ["Valid discount value is required"];
        }

        if (!discount.startDate || !discount.endDate) {
          errors[`variant_discount_${index}`] = ["Start date and end date are required"];
        }

        try {
          new Date(discount.startDate);
          new Date(discount.endDate);
        } catch {
          errors[`variant_discount_${index}`] = ["Invalid date format"];
        }
      });

      // If there are validation errors, throw them
      if (Object.keys(errors).length > 0) {
        throw {
          name: "ValidationError",
          message: "Validation failed",
          errors,
        };
      }

      // Process the data
      const result = await this.productService.BulkUploadProducts({
        products,
        variants,
        variantImages: variantImages as IProductVariantImage[],
        variantDiscounts: variantDiscounts as IProductVariantDiscount[],
        sellerId: seller.id
      });

      return NextResponse.json(
        ...ResponseGenerator.generate(201, result, "Products uploaded successfully")
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async GetPaginatedProducts(req: Request): Promise<Response> {
    try {
        const { searchParams } = new URL(req.url);

        // Get pagination parameters
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        // Get other filter parameters
        const categoryId = searchParams.get("categoryId");
        const search = searchParams.get("search");
        const fromPrice = searchParams.get("fromPrice") ? parseFloat(searchParams.get("fromPrice") || "0") : undefined;
        const toPrice = searchParams.get("toPrice") ? parseFloat(searchParams.get("toPrice") || "500000") : undefined;
        
        // Build filter conditions
        const whereConditions: any = {};
        
        if (categoryId) {
            whereConditions.categoryId = categoryId;
        }
        
        if (search) {
            whereConditions.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }
        
        if (fromPrice !== undefined || toPrice !== undefined) {
            whereConditions.variants = {
                some: {
                    price: {
                        ...(fromPrice !== undefined && { gte: fromPrice }),
                        ...(toPrice !== undefined && { lte: toPrice })
                    }
                }
            };
        }

        // Get total count for pagination info
        const totalCount = await prisma.product.count({
            where: whereConditions
        });

        // Get paginated products
        const products = await prisma.product.findMany({
            where: whereConditions,
            include: {
                images: true,
                variants: {
                    include: {
                        ProductVariantImage: true,
                        discounts: true
                    }
                },
                reviews: true,
                discounts: true
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            }
        });

        return new Response(JSON.stringify({
            status: "success",
            data: products,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit),
                hasMore: skip + limit < totalCount
            }
        }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (error: any) {
        console.error("Error fetching paginated products:", error);
        return new Response(JSON.stringify({
            status: "error",
            message: error.message || "Failed to fetch products"
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
  }

  private handleError(error: unknown): NextResponse {
    console.error(error);
    let errorMessage = "An unknown error occurred";
    let validationError = {}

    if (error instanceof z.ZodError) {
      errorMessage = "Validation Error"
      validationError = fromError(error).details
    } else if (error instanceof Error) {
      errorMessage = error.message;

    }

    return NextResponse.json(
      ...ResponseGenerator.generate(500, null, errorMessage, validationError)
    );
  }
}
