import { ProductController } from "@/modules/controllers/ProductController";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const productController = new ProductController();

export async function GET(request: Request) {
    const url = new URL(request.url);
    const page = url.searchParams.get("page");
    const limit = url.searchParams.get("limit");
    
    // If pagination parameters are provided, handle pagination here
    if (page !== null && limit !== null) {
        try {
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;
            
            // Get other filter parameters
            const categoryId = url.searchParams.get("categoryId");
            const categoryIdsParam = url.searchParams.get("categoryIds");
            const includeSubCategories = url.searchParams.get("includeSubCategories") === "true";
            const search = url.searchParams.get("search");
            const fromPrice = url.searchParams.get("fromPrice") ? parseFloat(url.searchParams.get("fromPrice") || "0") : undefined;
            const toPrice = url.searchParams.get("toPrice") ? parseFloat(url.searchParams.get("toPrice") || "500000") : undefined;
            const wholesale = url.searchParams.get("wholesale") === "true";
            const brands = url.searchParams.getAll("brand").filter(Boolean);
            
            // Build filter conditions
            const whereConditions: any = {};
            
            // Resolve category filtering (single, multiple, or include subcategories)
            if (categoryIdsParam) {
                const categoryIds = categoryIdsParam.split(',').map(id => id.trim()).filter(Boolean);
                if (categoryIds.length > 0) {
                    whereConditions.categoryId = { in: categoryIds };
                }
            } else if (categoryId) {
                if (includeSubCategories) {
                    // Find direct subcategories of the parent and include parent itself
                    const subCats = await prisma.category.findMany({
                        where: { parentCategoryId: categoryId },
                        select: { id: true }
                    });
                    const categoryIds = [categoryId, ...subCats.map(c => c.id)];
                    whereConditions.categoryId = { in: categoryIds };
                } else {
                    whereConditions.categoryId = categoryId;
                }
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

            if (wholesale) {
                whereConditions.wholesale = true;
            }

            // Brand filtering (support multiple brands)
            if (brands.length > 0) {
                whereConditions.brand = {
                    in: brands
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
                            discounts: {
                                where: {
                                    endDate: {
                                        gte: new Date()
                                    }
                                }
                            }
                        }
                    },
                    reviews: true
                },
                skip,
                take: limitNum,
                orderBy: {
                    createdAt: 'desc'
                }
            });

            return NextResponse.json({
                status: "success",
                data: products,
                pagination: {
                    total: totalCount,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(totalCount / limitNum),
                    hasMore: skip + limitNum < totalCount
                }
            });
        } catch (error: any) {
            console.error("Error fetching paginated products:", error);
            return NextResponse.json({
                status: "error",
                message: error.message || "Failed to fetch products"
            }, { status: 500 });
        }
    }
    
    // Otherwise, use the original implementation
    return await productController.GetAllProducts(request);
}

export async function POST(request: Request) {
    return await productController.CreateProduct(request);
}

// Product variant image endpoints
export async function PUT(request: Request) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    switch (action) {
        case "add-variant-image":
            return await productController.AddProductVariantImage(request);
        case "delete-variant-image":
            return await productController.DeleteProductVariantImage(request);
        case "add-variant-discount":
            return await productController.AddProductVariantDiscount(request);
        case "update-variant-discount":
            return await productController.UpdateProductVariantDiscount(request);
        case "delete-variant-discount":
            return await productController.DeleteProductVariantDiscount(request);
        case "update-product":
            return await productController.UpdateProduct(request);
        case "update-variant":
            return await productController.UpdateProductVariant(request);
        default:
            return new Response("Invalid action", { status: 400 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    switch (action) {
        case "product":
            return await productController.DeleteProduct(request);
        case "variant":
            return await productController.DeleteProductVariant(request);
        default:
            return new Response("Invalid action", { status: 400 });
    }
}   
