import { WishlistController } from "@/modules/controllers/WishlistController";
const wishlistController = new WishlistController();

export async function GET(request: Request) {
  return wishlistController.UserWishlist(request);
}

export async function POST(request: Request) {
  return wishlistController.AddToWishlist(request);
}

export async function DELETE(request: Request) {
  return wishlistController.RemoveWishlistItems(request);
}
