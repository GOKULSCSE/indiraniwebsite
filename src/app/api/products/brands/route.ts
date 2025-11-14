import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const categoryId = url.searchParams.get("categoryId");
        const includeSubCategories = url.searchParams.get("includeSubCategories") === "true";
        
        // Build where conditions
        const whereConditions: any = {
            isApproved: true,
            brand: {
                not: null,
                not: ""
            }
        };
        
        // If category is specified, filter brands by category
        if (categoryId) {
            if (includeSubCategories) {
                // Find subcategories
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
        
        // Get distinct brands
        const products = await prisma.product.findMany({
            where: whereConditions,
            select: {
                brand: true
            },
            distinct: ['brand']
        });
        
        // Extract and sort brands
        const brands = products
            .map(p => p.brand)
            .filter((brand): brand is string => Boolean(brand && brand.trim()))
            .sort();
        
        return NextResponse.json({
            status: "success",
            data: brands
        });
    } catch (error: any) {
        console.error("Error fetching brands:", error);
        return NextResponse.json({
            status: "error",
            message: error.message || "Failed to fetch brands"
        }, { status: 500 });
    }
}

