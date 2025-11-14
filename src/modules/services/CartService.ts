import { Cart, ICartItem, IShoppingCart } from "../models/Cart";
import db from "../../lib/db";
import _ from "lodash";

export class CartService {
  async AddToCart(cartData: IShoppingCart) {
    const cart = new Cart(cartData);

    if (_.isEmpty(cart.items)) throw Error("Items are empty");

    const user = await db.user.findUnique({
      where: { id: cart.userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    let userCart = await db.shoppingCart.findUnique({
      where: { userId: cart.userId },
    });

    if (!userCart) {
      userCart = await db.shoppingCart.create({
        data: {
          userId: cart.userId,
          items: {
            createMany: {
              data: cart.items,
            },
          },
        },
      });
    } else {
      await db.cartItem.createMany({
        data: cart.items.map((item) => ({ ...item, cartId: userCart!.id })),
      });
    }

    return userCart;
  }

  async UserCart({ userId }: Pick<IShoppingCart, "userId">) {
    if (_.isEmpty(userId)) throw Error("User Id is Required");

    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    let userCart = await db.shoppingCart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: {
                  include: {
                    images: true,
                    reviews: true,
                    GST: true,
                    variants: {
                      include: { ProductVariantImage: true, discounts: true },
                    },
                    seller: {
                      include: {
                        Pickuplocation: { where: { isDefault: true }, take: 1 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return userCart;
  }

  async RemoveCartItems({ ids }: { ids: string[] }) {
    await db.cartItem.deleteMany({
      where: {
        id: { in: ids },
      },
    });
  }

  async UpdateCartItem(cartItem: ICartItem) {
    const db_cartItem = await db.cartItem.findUnique({
      where: {
        id: cartItem.id,
      },
    });

    if (_.isEmpty(db_cartItem)) throw Error("Item Not Found");

    return await db.cartItem.update({
      where: {
        id: db_cartItem.id,
      },
      data: {
        ...cartItem,
      },
    });
  }
}
