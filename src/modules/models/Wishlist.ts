export interface IWishlist {
  id?: string;
  userId: string;
  items: IWishlistItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IWishlistItem {
  id?: string;
  wishlistId?: string;
  productVariantId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Wishlist implements IWishlist {
  id?: string;
  userId: string;
  items: IWishlistItem[];
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: IWishlist) {
    const {
      id,
      userId,
      items,
      createdAt,
      updatedAt,
    } = data;

    this.id = id;
    this.userId = userId;
    this.items = items;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
} 