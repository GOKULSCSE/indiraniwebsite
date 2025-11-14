import { Wishlist, IWishlistItem, IWishlist } from "../models/Wishlist";
import db from "../../lib/db";
import _ from "lodash";

interface PaginationParams {
  page?: number;
  limit?: number;
}

export class WishlistService {
  async AddToWishlist(wishlistData: IWishlist) {
    const wishlist = new Wishlist(wishlistData);

    if (_.isEmpty(wishlist.items)) throw Error("Items are empty");

    const user = await db.user.findUnique({
      where: { id: wishlist.userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    let userWishlist = await db.wishlist.findUnique({
      where: { userId: wishlist.userId },
    });

    if (!userWishlist) {
      userWishlist = await db.wishlist.create({
        data: {
          userId: wishlist.userId,
          items: {
            createMany: {
              data: wishlist.items,
            },
          },
        },
      });
    } else {
      await db.wishlistItem.createMany({
        data: wishlist.items.map((item: IWishlistItem) => ({ ...item, wishlistId: userWishlist!.id })),
      });
    }

    return userWishlist;
  }

  async UserWishlist({ userId, page, limit }: Pick<IWishlist, "userId"> & PaginationParams) {
    if (_.isEmpty(userId)) throw Error("User Id is Required");

    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Find the wishlist
    const wishlist = await db.wishlist.findUnique({
      where: { userId },
    });

    if (!wishlist) {
      return { items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0, hasMore: false } };
    }

    // Handle pagination
    const pageNumber = page || 1;
    const itemsPerPage = limit || 10;
    const skip = (pageNumber - 1) * itemsPerPage;

    // Get total count
    const totalCount = await db.wishlistItem.count({
      where: { wishlistId: wishlist.id },
    });

    // Get paginated items
    const items = await db.wishlistItem.findMany({
      where: { wishlistId: wishlist.id },
      include: {
        productVariant: {
          include: {
            product: {
              include: {
                images: true,
                reviews: true,
              },
            },
            ProductVariantImage: true,
            discounts: true,
          },
        },
      },
      skip: page ? skip : undefined,
      take: limit ? itemsPerPage : undefined,
      orderBy: { createdAt: 'desc' },
    });

    // Create pagination info
    const pagination = {
      total: totalCount,
      page: pageNumber,
      limit: itemsPerPage,
      totalPages: Math.ceil(totalCount / itemsPerPage),
      hasMore: skip + itemsPerPage < totalCount
    };

    return {
      id: wishlist.id,
      userId: wishlist.userId,
      items,
      pagination
    };
  }

  async RemoveWishlistItems({ ids }: { ids: string[] }) {
    await db.wishlistItem.deleteMany({
      where: {
        id: { in: ids },
      },
    });
  }
} 