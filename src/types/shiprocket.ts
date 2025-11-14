export interface ShiprocketAuthResponse {
  token: string;
  expires_in: number;
  message?: string;
}

export interface ShiprocketResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ShiprocketLocation {
  id: number;
  pickup_location: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  address_2?: string;
  city: string;
  state: string;
  country: string;
  pin_code: string;
}

export interface ShiprocketPickupLocationPayload {
  pickup_location: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  address_2?: string;
  city: string;
  state: string;
  country: string;
  pin_code: string;
}

export interface ShiprocketAssignAwbPayload {
  shipment_id: number;
  courier_id?: number;
  status?: string;
}

export interface ShiprocketGeneratePickupPayload {
  shipment_id: number[];
}

export interface ShiprocketManifestPayload {
  shipment_id: number[];
}

export interface ShiprocketPrintPayload {
  order_ids: number[];
}

export interface ShiprocketLabelPayload {
  shipment_id: number[];
}

export interface ShiprocketInvoicePayload {
  ids: number[];
}

export interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: number;
  hsn?: string;
}

export interface ShiprocketOrderPayload {
  order_id: string;
  order_date: string;
  pickup_location: string;
  comment?: string;
  billing_customer_name: string;
  billing_last_name: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing?: boolean;
  shipping_customer_name?: string;
  shipping_last_name?: string;
  shipping_address?: string;
  shipping_address_2?: string;
  shipping_city?: string;
  shipping_pincode?: string;
  shipping_country?: string;
  shipping_state?: string;
  shipping_email?: string;
  shipping_phone?: string;
  order_items: ShiprocketOrderItem[];
  payment_method: string;
  shipping_charges?: number;
  giftwrap_charges?: number;
  transaction_charges?: number;
  total_discount?: number;
  sub_total: number;
  length?: number;
  breadth?: number;
  height?: number;
  weight: number;
} 