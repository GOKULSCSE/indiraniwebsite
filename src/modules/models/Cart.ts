export interface IShoppingCart {
  id?: string;
  userId: string;
  items: ICartItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICartItem {
  id?: string;
  cartId?: string;
  productVariantId: string;
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Cart implements IShoppingCart {
  id?: string;
  userId: string;
  items: ICartItem[];
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: IShoppingCart) {
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