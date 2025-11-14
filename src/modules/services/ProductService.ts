import {
  IProduct,
  IProductImage,
  IProductVariant,
  IProductDiscount,
  IProductVariantDiscount,
  IProductVariantImage,
} from "../models/Product";
import db from "../../lib/db";
import _ from "lodash";
import { DiscountType, Prisma } from "@prisma/client";
import { log } from "node:console";

interface BulkUploadData {
  products: Array<{
    productSKU: string;
    category: string;
    subcategory?: string;
    name: string;
    description?: string;
    brand?: string;
    isApproved?: boolean;
    aboutProduct?: string;
    hsnCode?: string;
    linkName?: string;
    relatedProducts?: Array<{linkName: string; url: string}>;
    gstPercentage?: number;
  }>;
  variants: Array<{
    productSKU: string;
    productVariantSKU: string;
    title: string;
    description?: string;
    price: number;
    stockQuantity: number;
    variantType: string;
    variantValue: string;
    productWeight?: number;
    additionalPrice?: number;
  }>;
  variantImages: Array<IProductVariantImage>;
  variantDiscounts: Array<IProductVariantDiscount>;
  sellerId: string;
}

interface ValidationError {
  name: "ValidationError";
  message: string;
  errors: { [key: string]: string[] };
}

interface UniqueConstraintError {
  name: "UniqueConstraintError";
  message: string;
  details: any;
}

interface PrismaError extends Error {
  code?: string;
  meta?: {
    target?: string[];
  };
}

export class ProductService {
  async CreateProduct(
    productData: Omit<IProduct, "id" | "createdAt" | "updatedAt">
  ) {
    try {
      const { variants, GST, ...productInfo } = productData;

      if (!variants || variants.length === 0) {
        throw new Error("At least one variant is required");
      }

      console.log("Creating product with data:", productInfo);

      if (!productInfo.categoryId) {
        throw new Error("categoryId is required");
      }

      // First get the seller profile to get the sellerProfileId for GST
      const sellerProfile = await db.sellerProfile.findUnique({
        where: { id: productInfo.sellerId },
      });

      if (!sellerProfile) {
        throw new Error("Seller profile not found");
      }

      const product = await db.$transaction(async (prisma) => {
        // First create the product
        const newProduct = await prisma.product.create({
          data: {
            categoryId: productInfo.categoryId,
            name: productInfo.name,
            description: productInfo.description,
            productSKU: productInfo.productSKU,
            sellerId: productInfo.sellerId,
            brand: productInfo.brand,
            hsnCode: productInfo.hsnCode || null,
            isApproved: productInfo.isApproved || false,
        aboutProduct: productInfo.aboutProduct || null,
        linkName: productInfo.linkName || null,
        relatedProducts: productInfo.relatedProducts ? productInfo.relatedProducts as any : null,
        wholesale: productInfo.wholesale ?? false,
          },
        });

        // If GST is provided, create it
        if (GST && GST.percentage) {
          await prisma.gST.create({
            data: {
              productId: newProduct.id,
              percentage: new Prisma.Decimal(GST.percentage)
            }
          });
        }

        // Create all variants first
        const createdVariants = await prisma.productVariant.createMany({
          data: variants.map(variant => ({
            productId: newProduct.id,
            productVariantSKU: variant.productVariantSKU,
            title: variant.title,
            description: variant.description,
            price: new Prisma.Decimal(variant.price),
            stockQuantity: variant.stockQuantity,
            variantType: variant.variantType,
            variantValue: variant.variantValue,
            productWeight: variant.productWeight ? new Prisma.Decimal(variant.productWeight) : null,
            additionalPrice: new Prisma.Decimal(variant.additionalPrice || 0),
            height: variant.height !== undefined ? new Prisma.Decimal(variant.height) : null,
            width: variant.width !== undefined ? new Prisma.Decimal(variant.width) : null,
            breadth: variant.breadth !== undefined ? new Prisma.Decimal(variant.breadth) : null,
          })),
        });

        // Get the created variants with their IDs
        const variantsWithIds = await prisma.productVariant.findMany({
          where: { productId: newProduct.id },
          select: { id: true, productVariantSKU: true }
        });

        // Prepare all images and discounts data
        const allImages: any[] = [];
        const allDiscounts: any[] = [];

        for (const variant of variants) {
          const variantWithId = variantsWithIds.find(v => v.productVariantSKU === variant.productVariantSKU);
          if (!variantWithId) continue;

          // Collect images
          if (variant.images && variant.images.length > 0) {
            allImages.push(...variant.images.map(image => ({
              productVariantId: variantWithId.id,
              imageUrl: image.imageUrl,
              isPrimary: image.isPrimary || false,
            })));
          }

          // Collect discounts
          if (variant.discounts && variant.discounts.length > 0) {
            allDiscounts.push(...variant.discounts.map(discount => ({
              productVariantId: variantWithId.id,
              discountType: discount.discountType,
              discountValue: new Prisma.Decimal(discount.discountValue),
              startDate: new Date(discount.startDate),
              endDate: new Date(discount.endDate),
            })));
          }
        }

        // Create all images and discounts in bulk
        if (allImages.length > 0) {
          await prisma.productVariantImage.createMany({
            data: allImages,
          });
        }

        if (allDiscounts.length > 0) {
          await prisma.productDiscount.createMany({
            data: allDiscounts,
          });
        }

        // Return the complete product with all relations
        return await prisma.product.findUnique({
          where: { id: newProduct.id },
          include: {
            variants: {
              include: {
                discounts: true,
                ProductVariantImage: true,
              },
            },
            GST: true,
          },
        });
      }, {
        maxWait: 10000, // 10 seconds
        timeout: 30000, // 30 seconds
      });

      return product;
    } catch (error) {
      console.error(`CreateProduct error:`, error);
      
      // Handle specific Prisma transaction errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2028':
            throw new Error('Transaction timeout: The operation took too long to complete. Please try again with fewer variants or images.');
          case 'P2002':
            throw new Error('A product with this SKU already exists. Please use a different SKU.');
          case 'P2003':
            throw new Error('Invalid category or seller reference. Please check your selections.');
          case 'P2024':
            throw new Error('Transaction failed due to a database constraint. Please check your data.');
          default:
            throw new Error(`Database error: ${error.message}`);
        }
      }
      
      // Handle other known errors
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('An unexpected error occurred while creating the product.');
    }
  }

  async GetProductById(id: string, withDiscounts: boolean, includeUnapproved: boolean = false) {
    try {
      const whereClause: any = { id };
      
      // Only filter by approval status if we don't want to include unapproved products
      if (!includeUnapproved) {
        whereClause.isApproved = true;
      }

      const product = await db.product.findUnique({
        where: whereClause,
        include: {
          variants: {
            include: {
              ProductVariantImage: true,
              discounts: true  // Always include discounts
            },
          },
          seller: true,
          GST: true,
          images: true,
          category: {
            include: {
              parentCategory: true
            }
          },
        },
      });
      
      if (!product) {
        throw new Error("Product not found");
      }
      
      return product;
    } catch (error) {
      console.error("GetProductById error:", error);
      if (error instanceof Error && error.message === "Product not found") {
        throw error;
      }
      throw new Error("Failed to get product");
    }
  }

  async GetProductVariantById(id: string) {
    try {
      const productVariant = await db.productVariant.findUnique({
        where: { id },
        include: {
          product: {
            include: {
              images: true,
              reviews: true,
              variants: {
                include: { ProductVariantImage: true, discounts: true },
              },
              GST: true,
              seller: {
                include: {
                  Pickuplocation: { where: { isDefault: true }, take: 1 },
                },
              },
            },
          },
        },
      });
      
      // Check if variant exists and product is approved
      if (_.isEmpty(productVariant) || !productVariant.product || !productVariant.product.isApproved) {
        throw new Error("Product variant not found");
      }
      
      return productVariant;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to get product variant");
    }
  }

  async UpdateProduct(
    id: string,
    productData: Partial<
      Omit<IProduct, "id" | "createdAt" | "updatedAt" | "sellerId">
    >
  ) {
    try {
      const { GST, variants, discounts, images, ...productInfo } = productData;

      // First check if product exists
      const existingProduct = await db.product.findUnique({
        where: { id },
        include: { GST: true },
      });

      if (!existingProduct) {
        throw new Error("Product not found");
      }

      // Handle GST update separately to avoid transaction timeout
      if (GST) {
        await db.gST.upsert({
          where: { productId: id },
          create: {
            percentage: new Prisma.Decimal(GST.percentage),
            productId: id,
          },
          update: {
            percentage: new Prisma.Decimal(GST.percentage),
          },
        });
      }

      // Only update basic product fields, excluding relational data
      const allowedFields = {
        ...(productInfo.productSKU && { productSKU: productInfo.productSKU }),
        ...(productInfo.categoryId && { categoryId: productInfo.categoryId }),
        ...(productInfo.name && { name: productInfo.name }),
        ...(productInfo.description !== undefined && { description: productInfo.description }),
        ...(productInfo.brand !== undefined && { brand: productInfo.brand }),
        ...(productInfo.isApproved !== undefined && { isApproved: productInfo.isApproved }),
        ...(productInfo.aboutProduct !== undefined && { aboutProduct: productInfo.aboutProduct }),
      ...(productInfo.hsnCode !== undefined && { hsnCode: productInfo.hsnCode }),
      ...(productInfo.linkName !== undefined && { linkName: productInfo.linkName }),
      ...(productInfo.relatedProducts !== undefined && { relatedProducts: productInfo.relatedProducts as any }),
      ...(productInfo.wholesale !== undefined && { wholesale: productInfo.wholesale }),
      } as any;

      // Update product
      const updatedProduct = await db.product.update({
        where: { id },
        data: allowedFields,
        include: {
          variants: {
            include: {
              ProductVariantImage: true,
              discounts: true,
            },
          },
          GST: true,
          images: true,
        },
      });

      return updatedProduct;
    } catch (error) {
      console.error("UpdateProduct error:", error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new Error("Product not found");
        }
        if (error.code === "P2002") {
          throw new Error("Duplicate value found for a unique field");
        }
      }
      throw new Error("Failed to update product");
    }
  }

  async DeleteProduct(id: string) {
    try {
      await db.$transaction(async (prisma) => {
        await prisma.productImage.deleteMany({
          where: { productId: id },
        });

        await prisma.productVariant.deleteMany({
          where: { productId: id },
        });

        await prisma.productDiscount.deleteMany({
          where: { productVariantId: id },
        });

        await prisma.product.delete({
          where: { id },
        });
      });

      return true;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to delete product");
    }
  }

  async GetAllProducts({
    categoryId,
    fromPrice,
    toPrice,
    search,
    onlyDiscounted = false
  }: {
    categoryId?: string;
    fromPrice?: number;
    toPrice?: number;
    search?: string;
    onlyDiscounted?: boolean;
  }) {
    try {
      const currentDate = new Date();
      
      const filters = {
        isApproved: true, // Only show approved products to public
        ...(categoryId && { categoryId }),
      };

      const products = await db.product.findMany({
        where: {
          ...filters,
          ...(search && {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              {
                description: { contains: search, mode: "insensitive" as const },
              },
              {
                category: {
                  name: { contains: search, mode: "insensitive" as const },
                },
              },
            ],
          }),
          ...(onlyDiscounted && {
            variants: {
              some: {
                discounts: {
                  some: {
                    AND: [
                      { startDate: { lte: currentDate } },
                      { endDate: { gte: currentDate } }
                    ]
                  }
                }
              }
            }
          })
        },
        include: {
          variants: {
            where: onlyDiscounted ? {
              discounts: {
                some: {
                  AND: [
                    { startDate: { lte: currentDate } },
                    { endDate: { gte: currentDate } }
                  ]
                }
              }
            } : undefined,
            include: {
              ProductVariantImage: true,
              discounts: {
                where: {
                  AND: [
                    { startDate: { lte: currentDate } },
                    { endDate: { gte: currentDate } }
                  ]
                },
                orderBy: {
                  discountValue: 'desc'
                }
              },
            },
          },
          seller: true,
          GST: true,
          images: true,
          reviews: true,
        }
      });

      // Filter out products that have no variants with discounts
      if (onlyDiscounted) {
        return products.filter(product => 
          product.variants.some(variant => variant.discounts.length > 0)
        );
      }

      return products;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to get products");
    }
  }

  async GetProductsBySeller(sellerId: string, search?: string) {
    try {
      const products = await db.product.findMany({
        where: {
          sellerId,
          ...(search && {
            OR: [
              { productSKU: { contains: search, mode: "insensitive" } },
              { name: { contains: search, mode: "insensitive" } },
              { hsnCode: { contains: search, mode: "insensitive" } },
              { brand: { contains: search, mode: "insensitive" } },
              {
                variants: {
                  some: {
                    productVariantSKU: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
              },
            ],
          }),
        },
        include: {
          variants: {
            include: {
              ProductVariantImage: true,
              discounts: true,
            },
          },
          GST: true,
          seller: true,
          images: true,
          reviews: true,
        },
      });
      return products;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to get products by seller");
    }
  }

  async AddProductImage(imageData: IProductImage) {
    try {
      const product = await db.product.findUnique({
        where: { id: imageData.productId },
      });

      if (!product) throw new Error("Product not found");

      if (imageData.isPrimary) {
        await db.productImage.updateMany({
          where: {
            productId: imageData.productId,
            isPrimary: true,
          },
          data: { isPrimary: false },
        });
      }

      const newImage = await db.productImage.create({
        data: {
          productId: imageData.productId!,
          imageUrl: imageData.imageUrl,
          isPrimary: imageData.isPrimary || false,
        },
      });

      return newImage;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to add product image");
    }
  }

  async DeleteProductImage(imageId: string) {
    try {
      const image = await db.productImage.findUnique({
        where: { id: imageId },
      });

      if (!image) throw new Error("Image not found");

      await db.productImage.delete({
        where: { id: imageId },
      });

      return true;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to delete product image");
    }
  }

  async AddProductVariant(variantData: IProductVariant) {
    try {
      const product = await db.product.findUnique({
        where: { id: variantData.productId },
      });

      if (!product) throw new Error("Product not found");

      const newVariant = await db.productVariant.create({
        data: {
          productVariantSKU: variantData.productVariantSKU,
          productId: variantData.productId!,
          title: variantData.title,
          description: variantData.description,
          price: new Prisma.Decimal(variantData.price),
          stockQuantity: variantData.stockQuantity,
          variantType: variantData.variantType,
          variantValue: variantData.variantValue,
          productWeight: new Prisma.Decimal(variantData.productWeight || 0),
          additionalPrice: new Prisma.Decimal(variantData.additionalPrice || 0),
          height: variantData.height !== undefined ? new Prisma.Decimal(variantData.height) : null,
          width: variantData.width !== undefined ? new Prisma.Decimal(variantData.width) : null,
          breadth: variantData.breadth !== undefined ? new Prisma.Decimal(variantData.breadth) : null,
          ...(variantData.ProductVariantImage && {
            ProductVariantImage: {
              createMany: {
                data: variantData.ProductVariantImage.map((image) => ({
                  imageUrl: image.imageUrl,
                  isPrimary: image.isPrimary || false,
                })),
              },
            },
          }),
          ...(variantData.ProductDiscount && {
            discounts: {
              createMany: {
                data: variantData.ProductDiscount.map((discount) => ({
                  discountType: discount.discountType as DiscountType,
                  discountValue: new Prisma.Decimal(discount.discountValue),
                  startDate: new Date(discount.startDate),
                  endDate: new Date(discount.endDate),
                })),
              },
            },
          }),
        },
        include: {
          ProductVariantImage: true,
          discounts: true,
        },
      });

      return newVariant;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to add product variant");
    }
  }

  async UpdateProductVariant(variantData: IProductVariant) {
    try {
      const variant = await db.productVariant.findUnique({
        where: { id: variantData.id },
      });

      if (!variant) throw new Error("Variant not found");

      const updatedVariant = await db.productVariant.update({
        where: { id: variantData.id },
        data: {
          title: variantData.title,
          description: variantData.description,
          price: new Prisma.Decimal(variantData.price),
          stockQuantity: variantData.stockQuantity,
          variantType: variantData.variantType,
          variantValue: variantData.variantValue,
          productWeight: new Prisma.Decimal(variantData.productWeight || 0),
          additionalPrice: new Prisma.Decimal(variantData.additionalPrice || 0),
          height: variantData.height !== undefined ? new Prisma.Decimal(variantData.height) : undefined,
          width: variantData.width !== undefined ? new Prisma.Decimal(variantData.width) : undefined,
          breadth: variantData.breadth !== undefined ? new Prisma.Decimal(variantData.breadth) : undefined,
        },
      });

      return updatedVariant;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to update product variant");
    }
  }

  async DeleteProductVariant(variantId: string) {
    try {
      const variant = await db.productVariant.findUnique({
        where: { id: variantId },
      });

      if (!variant) throw new Error("Variant not found");

      await db.productVariant.delete({
        where: { id: variantId },
      });

      return true;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to delete product variant");
    }
  }

  async UpdateProductDiscount(discountData: IProductDiscount) {
    try {
      const discount = await db.productDiscount.findUnique({
        where: { id: discountData.id },
      });

      if (!discount) throw new Error("Discount not found");

      const updatedDiscount = await db.productDiscount.update({
        where: { id: discountData.id },
        data: {
          discountType: discountData.discountType,
          discountValue: new Prisma.Decimal(discountData.discountValue),
          startDate: new Date(discountData.startDate),
          endDate: new Date(discountData.endDate),
        },
      });

      return updatedDiscount;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to update product discount");
    }
  }

  async DeleteProductDiscount(discountId: string) {
    try {
      const discount = await db.productDiscount.findUnique({
        where: { id: discountId },
      });

      if (!discount) throw new Error("Discount not found");

      await db.productDiscount.delete({
        where: { id: discountId },
      });

      return true;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to delete product variant discount");
    }
  }

  async AddProductVariantImage(imageData: {
    productVariantId: string;
    imageUrl: string;
    isPrimary?: boolean;
  }) {
    try {
      const variant = await db.productVariant.findUnique({
        where: { id: imageData.productVariantId },
      });

      if (!variant) throw new Error("Product variant not found");

      if (imageData.isPrimary) {
        await db.productVariantImage.updateMany({
          where: {
            productVariantId: imageData.productVariantId,
            isPrimary: true,
          },
          data: { isPrimary: false },
        });
      }

      const newImage = await db.productVariantImage.create({
        data: {
          productVariantId: imageData.productVariantId,
          imageUrl: imageData.imageUrl,
          isPrimary: imageData.isPrimary || false,
        },
      });

      return newImage;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to add product variant image");
    }
  }

  async DeleteProductVariantImage(imageId: string) {
    try {
      const image = await db.productVariantImage.findUnique({
        where: { id: imageId },
      });

      if (!image) throw new Error("Image not found");

      await db.productVariantImage.delete({
        where: { id: imageId },
      });

      return true;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to delete product variant image");
    }
  }

  async AddProductVariantDiscount(discountData: {
    productVariantId: string;
    discountType: string;
    discountValue: number;
    startDate: string;
    endDate: string;
  }) {
    try {
      const variant = await db.productVariant.findUnique({
        where: { id: discountData.productVariantId },
      });

      if (!variant) throw new Error("Product variant not found");

      const newDiscount = await db.productDiscount.create({
        data: {
          productVariantId: discountData.productVariantId,
          discountType: discountData.discountType as DiscountType,
          discountValue: new Prisma.Decimal(discountData.discountValue),
          startDate: new Date(discountData.startDate),
          endDate: new Date(discountData.endDate),
        },
      });

      return newDiscount;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to add product variant discount");
    }
  }

  async UpdateProductVariantDiscount(discountData: {
    id: string;
    discountType: string;
    discountValue: number;
    startDate: string;
    endDate: string;
  }) {
    try {
      const discount = await db.productDiscount.findUnique({
        where: { id: discountData.id },
      });

      if (!discount) throw new Error("Discount not found");

      const updatedDiscount = await db.productDiscount.update({
        where: { id: discountData.id },
        data: {
          discountType: discountData.discountType as DiscountType,
          discountValue: new Prisma.Decimal(discountData.discountValue),
          startDate: new Date(discountData.startDate),
          endDate: new Date(discountData.endDate),
        },
      });

      return updatedDiscount;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to update product variant discount");
    }
  }

  async DeleteProductVariantDiscount(discountId: string) {
    try {
      const discount = await db.productDiscount.findUnique({
        where: { id: discountId },
      });

      if (!discount) throw new Error("Discount not found");

      await db.productDiscount.delete({
        where: { id: discountId },
      });

      return true;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to delete product variant discount");
    }
  }

  async BulkUploadProducts(data: BulkUploadData) {
    try {
      const { products, variants, variantImages, variantDiscounts, sellerId } =
        data;

      // Validate required data
      if (!products.length || !variants.length) {
        throw new Error("Products and variants are required");
      }

      if (!sellerId) {
        throw new Error("Seller ID is required");
      }

      // Verify seller exists
      const seller = await db.sellerProfile.findUnique({
        where: { id: sellerId },
      });

      if (!seller) {
        throw new Error("Seller not found");
      }

      // Process in a transaction
      const result = await db.$transaction(
        async (prisma) => {
          const createdProducts = [];

          // Process each product with its related data
          for (const productData of products) {
            const {
              productSKU,
              category,
              subcategory,
              name,
              description,
              brand,
              isApproved,
              aboutProduct,
              hsnCode,
              linkName,
              relatedProducts,
              gstPercentage,
            } = productData;

            // Debug logging
            console.log(`Processing product ${productSKU}:`, {
              category,
              subcategory,
              hasSubcategory: !!subcategory,
              subcategoryType: typeof subcategory
            });

            // Determine the final category to use for the product
            // If subcategory exists, use subcategory; otherwise use main category
            const finalCategoryName = subcategory || category;

            // Get or create the main category first (case-insensitive lookup)
            let mainCategory = await prisma.category.findFirst({
              where: { 
                name: {
                  equals: category,
                  mode: 'insensitive'
                }
              },
            });

            if (!mainCategory) {
              // Normalize the category name (capitalize first letter)
              const normalizedCategoryName = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
              
              // Check again with normalized name
              mainCategory = await prisma.category.findFirst({
                where: { 
                  name: {
                    equals: normalizedCategoryName,
                    mode: 'insensitive'
                  }
                },
              });

              if (!mainCategory) {
                mainCategory = await prisma.category.create({
                  data: {
                    name: normalizedCategoryName,
                    description: `Category created during bulk upload for product ${productSKU}`,
                  },
                });
              }
            }

            let categoryId: string;

            // If subcategory is provided and different from main category
            if (subcategory && subcategory.trim() !== '' && subcategory !== category) {
              console.log(`Creating/finding subcategory "${subcategory}" under main category "${category}"`);
              
              // Check if subcategory exists under the main category (case-insensitive)
              let subcategoryRecord = await prisma.category.findFirst({
                where: { 
                  name: {
                    equals: subcategory,
                    mode: 'insensitive'
                  },
                  parentCategoryId: mainCategory.id
                },
              });

              if (!subcategoryRecord) {
                // Normalize the subcategory name
                const normalizedSubcategoryName = subcategory.charAt(0).toUpperCase() + subcategory.slice(1).toLowerCase();
                
                // Check again with normalized name
                subcategoryRecord = await prisma.category.findFirst({
                  where: { 
                    name: {
                      equals: normalizedSubcategoryName,
                      mode: 'insensitive'
                    },
                    parentCategoryId: mainCategory.id
                  },
                });

                if (!subcategoryRecord) {
                  console.log(`Creating new subcategory "${normalizedSubcategoryName}" under main category "${category}"`);
                  // Create subcategory under the main category
                  subcategoryRecord = await prisma.category.create({
                    data: {
                      name: normalizedSubcategoryName,
                      description: `Subcategory created during bulk upload for product ${productSKU}`,
                      parentCategoryId: mainCategory.id,
                    },
                  });
                } else {
                  console.log(`Found existing subcategory "${normalizedSubcategoryName}" under main category "${category}"`);
                }
              } else {
                console.log(`Found existing subcategory "${subcategory}" under main category "${category}"`);
              }
              categoryId = subcategoryRecord.id;
              console.log(`Using subcategory ID: ${categoryId}`);
            } else {
              // Use main category as the product category
              categoryId = mainCategory.id;
              console.log(`Using main category ID: ${categoryId} (no subcategory or subcategory same as main category)`);
            }

            // Get product variants for this product
            const productVariants = variants.filter(
              (v) => v.productSKU === productSKU
            );

            try {
              // Create product with all related data in a single operation
              const product = await prisma.product.create({
                data: {
                  productSKU,
                  categoryId,
                  name,
                  description,
                  isApproved: isApproved || false,
                  aboutProduct: aboutProduct ? aboutProduct : null,
                  brand: brand || null,
                  hsnCode: hsnCode || null,
                  linkName: linkName || null,
                  relatedProducts: relatedProducts ? relatedProducts as any : null,
                  sellerId,
                  variants: {
                    create: productVariants.map((variant) => ({
                      productVariantSKU: variant.productVariantSKU,
                      title: variant.title,
                      description: variant.description,
                      price: new Prisma.Decimal(variant.price),
                      stockQuantity: variant.stockQuantity,
                      variantType: variant.variantType,
                      variantValue: String(variant.variantValue),
                      additionalPrice: new Prisma.Decimal(variant.additionalPrice || 0),
                      productWeight: variant.productWeight ? new Prisma.Decimal(variant.productWeight) : null,
                    })),
                  },
                },
                include: {
                  variants: true,
                },
              });

              // Create GST if provided
              if (gstPercentage) {
                await prisma.gST.create({
                  data: {
                    productId: product.id,
                    percentage: new Prisma.Decimal(gstPercentage)
                  }
                });
              }

              // After creating the product and variants, create the images and discounts
              
              for (const variant of product.variants) {
                const variantImagesForVariant = variantImages.filter(
                  (img) => img.productVariantSKU === variant.productVariantSKU
                );

                if (variantImagesForVariant.length > 0) {
                  const imageData = variantImagesForVariant.map((image) => ({
                    productVariantId: variant.id,
                    imageUrl: image.imageUrl,
                    isPrimary: image.isPrimary || false,
                  }));
                  
                  await prisma.productVariantImage.createMany({
                    data: imageData,
                  });
                }

                const variantDiscountsForVariant = variantDiscounts.filter(
                  (disc) => disc.productVariantSKU === variant.productVariantSKU
                );

                if (variantDiscountsForVariant.length > 0) {
                  await prisma.productDiscount.createMany({
                    data: variantDiscountsForVariant.map((discount) => ({
                      productVariantId: variant.id,
                      discountType: discount.discountType,
                      discountValue: new Prisma.Decimal(discount.discountValue),
                      startDate: new Date(discount.startDate),
                      endDate: new Date(discount.endDate),
                    })),
                  });
                }
              }

              // Fetch the complete product with all relations
              const completeProduct = await prisma.product.findUnique({
                where: { id: product.id },
                include: {
                  variants: {
                    include: {
                      discounts: true,
                      ProductVariantImage: true,
                    },
                  },
                  GST: true
                },
              });

              if (completeProduct) {
                createdProducts.push(completeProduct);
              }

            } catch (error: unknown) {
              const prismaError = error as PrismaError;
              if (prismaError.code === "P2002") {
                throw {
                  name: "UniqueConstraintError",
                  message: "A product with this SKU already exists",
                  details: prismaError,
                };
              }
              throw error;
            }
          }

          return createdProducts;
        },
        {
          maxWait: 10000,
          timeout: 30000,
        }
      );

      return result;
    } catch (error: unknown) {
      console.error("Bulk upload error:", error);

      // Handle different types of errors
      if ((error as ValidationError).name === "ValidationError") {
        return {
          success: false,
          error: "Validation Error",
          details: (error as ValidationError).errors,
        };
      }

      if ((error as UniqueConstraintError).name === "UniqueConstraintError") {
        return {
          success: false,
          error: "Duplicate Entry Error",
          details: (error as UniqueConstraintError).message,
        };
      }

      throw error;
    }
  }
}
