import { ShippingAddress, IShippingAddress } from "../models/shippingAddress";
import db from "../../lib/db";
import _ from "lodash";

export class ShippingAddressService {
  async CreateShippingAddress(addressData: IShippingAddress) {
    const address = new ShippingAddress(addressData);

    const newAddress = await db.address.create({
      data: {
        userId: address.userId,
        fullName: address.fullName || null,
        email: address.email || null,
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country,
        phone: address.phone || null,
        landmark: address.landmark || null,
      },
    });

    return newAddress;
  }

  async UpdateShippingAddress(addressData: IShippingAddress) {
    const address = new ShippingAddress(addressData);

    if (_.isEmpty(address.id)) throw Error("Address ID is required");

    const existingAddress = await db.address.findUnique({
      where: { id: address.id },
    });

    if (!existingAddress) {
      throw new Error("Shipping address not found");
    }

    const updatedAddress = await db.address.update({
      where: { id: address.id },
      data: {
        fullName: address.fullName || null,
        email: address.email || null,
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country,
        phone: address.phone || null,
        landmark: address.landmark || null,
      },
    });

    return updatedAddress;
  }

  async GetAllShippingAddresses({ userId }: { userId: string | undefined }) {
    const addresses = await db.address.findMany({
      where: {
        ...(userId && { userId }),
      },
    });
    return addresses;
  }

  async GetShippingAddressById(id: string) {
    if (_.isEmpty(id)) throw Error("Address ID is required");

    const address = await db.address.findUnique({
      where: { id },
    });

    if (!address) {
      throw new Error("Shipping address not found");
    }

    return address;
  }
}
