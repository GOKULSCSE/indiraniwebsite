import { z } from "zod";

export class ProductValidation {
  static CreateProduct() {
    return z.object({
      productSKU: z.string().min(1, "Product SKU is required"),
      sellerId: z.string().min(1, "Seller ID is required"),
      categoryId: z.string().min(1, "Category ID is required"),
      name: z.string().min(1, "Product name is required"),
      description: z.string().optional(),
      brand: z.string().optional(),
      aboutProduct: z.string().optional(),
      isApproved: z.boolean().optional(),
      wholesale: z.boolean().optional(),
      hsnCode: z.string().regex(/^\d{6,8}$/, "HSN code must be 6-8 digits").optional(),
      linkName: z.string().optional(),
      relatedProducts: z.array(z.object({
        linkName: z.string().min(1, "Link name is required"),
        url: z.string().url("Each related product must be a valid URL")
      })).optional().nullable(),
      GST: z.object({
        percentage: z.number().positive("GST percentage must be positive")
      }).optional(),
      variants: z.array(
        z.object({
          productVariantSKU: z.string().min(1, "Variant SKU is required"),
          title: z.string().min(1, "Variant title is required"),
          description: z.string().optional(),
          price: z.number().positive("Price must be positive"),
          stockQuantity: z.number().int().min(0, "Stock quantity cannot be negative"),
          productWeight: z.number().optional(),
          variantType: z.string().min(1, "Variant type is required"),
          variantValue: z.string().min(1, "Variant value is required"),
          height: z.number().optional(),
          width: z.number().optional(),
          breadth: z.number().optional(),
          images: z.array(
            z.object({
              imageUrl: z.string().min(1, "Image URL is required"),
              isPrimary: z.boolean().optional().default(false),
            })
          ).optional(),
          discounts: z.array(
            z.object({
              discountType: z.enum(["percentage", "amount"]),
              discountValue: z.number().positive("Discount value must be positive"),
              startDate: z.string().datetime(),
              endDate: z.string().datetime(),
            })
          ).optional(),
        })
      ).min(1, "At least one variant is required"),
    });
  }
 
  static UpdateProduct() {
    return z.object({
      categoryId: z.string().min(1, "Category ID is required"),
      name: z.string().min(1, "Product name is required").optional(),
      description: z.string().optional(),
      brand: z.string().optional(),
      aboutProduct: z.string().optional(),
      isApproved: z.boolean().optional(),
      wholesale: z.boolean().optional(),
      hsnCode: z.string().regex(/^\d{6,8}$/, "HSN code must be 6-8 digits").optional(),
      linkName: z.string().optional(),
      relatedProducts: z.array(z.object({
        linkName: z.string().min(1, "Link name is required"),
        url: z.string().url("Each related product must be a valid URL")
      })).optional().nullable(),
      GST: z.object({
        percentage: z.coerce.number().min(0, "GST percentage must be non-negative").max(100, "GST percentage cannot exceed 100")
      }).optional(),
    });
  }

  static AddProductVariantImage() {
    return z.object({
      productVariantId: z.string().min(1, "Product variant ID is required"),
      imageUrl: z.string().min(1, "Image URL is required"),
      isPrimary: z.boolean().optional().default(false),
    });
  }

  static AddProductVariant() {
    return z.object({
      productId: z.string().min(1, "Product ID is required"),
      productVariantSKU: z.string().min(1, "Variant SKU is required"),
      title: z.string().min(1, "Variant title is required"),
      description: z.string().optional(),
      price: z.number().positive("Price must be positive"),
      stockQuantity: z.number().int().min(0, "Stock quantity cannot be negative"),
      productWeight: z.number().optional(),
      variantType: z.string().min(1, "Variant type is required"),
      variantValue: z.string().min(1, "Variant value is required"),
      height: z.number().optional(),
      width: z.number().optional(),
      breadth: z.number().optional(),
      images: z.array(
        z.object({
          imageUrl: z.string().min(1, "Image URL is required"),
          isPrimary: z.boolean().optional().default(false),
        })
      ).optional(),
      discounts: z.array(
        z.object({
          discountType: z.enum(["percentage", "amount"]),
          discountValue: z.number().positive("Discount value must be positive"),
          startDate: z.string().datetime(),
          endDate: z.string().datetime(),
        })
      ).optional(),
    });
  }

  static UpdateProductVariant() {
    return z.object({
      id: z.string(),
      productId: z.string(),
      productVariantSKU: z.string(),
      title: z.string(),
      description: z.string().optional(),
      price: z.number(),
      stockQuantity: z.number(),
      productWeight: z.number().optional(),
      variantType: z.string(),
      variantValue: z.string(),
      height: z.number().optional(),
      width: z.number().optional(),
      breadth: z.number().optional(),
      images: z.array(
        z.object({
          imageUrl: z.string().min(1, "Image URL is required"),
          isPrimary: z.boolean().optional().default(false),
        })
      ).optional(),
      discounts: z.array(
        z.object({
          discountType: z.enum(["percentage", "amount"]),
          discountValue: z.number().positive("Discount value must be positive"),
          startDate: z.string().datetime(),
          endDate: z.string().datetime(),
        })
      ).optional(),
    });
  }

  static AddProductVariantDiscount() {
    return z.object({
      productVariantId: z.string().min(1, "Product variant ID is required"),
      discountType: z.enum(["percentage", "amount"]),
      discountValue: z.number().positive("Discount value must be positive"),
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
    });
  }

  static UpdateProductVariantDiscount() {
    return z.object({
      id: z.string().min(1, "Discount ID is required"),
      discountType: z.enum(["percentage", "amount"]),
      discountValue: z.number().positive("Discount value must be positive"),
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
    });
  }

  static BulkUploadProduct() {
    return z.object({
      products: z.array(
        z.object({
          productSKU: z.string().min(1, "Product SKU is required"),
          category: z.string().min(1, "Category is required"),
          name: z.string().min(1, "Product name is required"),
          description: z.string().optional(),
          isApproved: z.boolean().optional(),
          aboutProduct: z.string().optional(),
          brand: z.string().min(1, "Brand is required"),
          hsnCode: z.union([
            z.string().regex(/^\d{6,8}$/, "HSN code must be 6-8 digits"),
            z.number().transform(val => String(val))
          ])
            .transform(val => val.toString().padStart(8, '0'))
            .optional(),
          linkName: z.string().optional(),
          relatedProducts: z.array(z.object({
            linkName: z.string().min(1, "Link name is required"),
            url: z.string().url("Each related product must be a valid URL")
          })).optional(),
          GST: z.object({
            percentage: z.number().positive("GST percentage must be positive")
          }).optional(),
        })
      ),
      variants: z.array(
        z.object({
          productSKU: z.string().min(1, "Product SKU is required"),
          productVariantSKU: z.string().min(1, "Variant SKU is required"),
          title: z.string().min(1, "Variant title is required"),
          description: z.string().optional(),
          price: z.number().positive("Price must be positive"),
          stockQuantity: z.number().int().min(0, "Stock quantity cannot be negative"),
          variantType: z.string().min(1, "Variant type is required"),
          variantValue: z.string().min(1, "Variant value is required"),
          productWeight: z.number().min(0, "Product weight cannot be negative").optional(),
        })
      ),
      variantImages: z.array(
        z.object({
          productVariantSKU: z.string().min(1, "Variant SKU is required"),
          imageUrl: z.string().min(1, "Image URL is required"),
          isPrimary: z.boolean().optional(),
        })
      ).optional(),
      variantDiscounts: z.array(
        z.object({
          productVariantSKU: z.string().min(1, "Variant SKU is required"),
          discountType: z.enum(["percentage", "amount"]),
          discountValue: z.number().positive("Discount value must be positive"),
          startDate: z.union([z.string(), z.number()]).transform(val => 
            typeof val === 'number' 
              ? new Date(Math.round((val - 25569) * 86400 * 1000)).toISOString() 
              : String(val)
          ),
          endDate: z.union([z.string(), z.number()]).transform(val => 
            typeof val === 'number' 
              ? new Date(Math.round((val - 25569) * 86400 * 1000)).toISOString() 
              : String(val)
          ),
        })
      ).optional(),
      sellerId: z.string().min(1, "Seller ID is required"),
    });
  }
}
