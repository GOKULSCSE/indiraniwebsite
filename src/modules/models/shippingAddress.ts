export interface IShippingAddress {
  id?: string;
  userId: string;
  fullName?: string | null;
  email?: string | null;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string | null;
  landmark?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ShippingAddress implements IShippingAddress {
  id?: string;
  userId: string;
  fullName?: string | null;
  email?: string | null;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string | null;
  landmark?: string | null;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: IShippingAddress) {
    const {
      id,
      userId,
      fullName,
      email,
      street,
      city,
      state,
      zipCode,
      country,
      phone,
      landmark,
      createdAt,
      updatedAt,
    } = data;

    this.id = id;
    this.userId = userId;
    this.fullName = fullName;
    this.email = email;
    this.street = street;
    this.city = city;
    this.state = state;
    this.zipCode = zipCode;
    this.country = country;
    this.phone = phone;
    this.landmark = landmark;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
