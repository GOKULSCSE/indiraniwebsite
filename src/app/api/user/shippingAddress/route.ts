import { ShippingAddressController } from "@/modules/controllers/shippingAddressController";
const shippingAddressController = new ShippingAddressController();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    return shippingAddressController.GetShippingAddressById(request);
  }
  return shippingAddressController.GetAllShippingAddresses(request);
}

export async function POST(request: Request) {
  return shippingAddressController.CreateShippingAddress(request);
}

export async function PUT(request: Request) {
  return shippingAddressController.UpdateShippingAddress(request);
} 