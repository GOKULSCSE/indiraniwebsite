import { SellerController } from "@/modules/controllers/SellerController";

const sellerController = new SellerController();

export async function POST(request: Request) {
    return await sellerController.RegisterSeller(request);
} 