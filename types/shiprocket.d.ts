export interface ShiprocketAuthResponse {
  token: string
  expires_in: number
  message?: string
}

export interface ShiprocketLocationPayload {
  pickup_postcode: string
  delivery_postcode: string
  weight: number
  cod: boolean
}

export interface ShiprocketLocationResponse {
  status: number
  message: string
  data: {
    available_courier_companies: Array<{
      id: number
      name: string
      freight_charge: number
      cod_charge: number
      other_charges: number
      total_charge: number
      estimated_delivery_days: string
    }>
  }
}

export interface ShiprocketLocationWithLocalId extends ShiprocketLocationPayload {
  id: string
}

export interface ShiprocketPickupLocationPayload {
  pickup_location: string
  name: string
  email: string
  phone: string
  address: string
  address_2?: string
  city: string
  state: string
  country: string
  pin_code: string
}

export interface ShiprocketPickupLocationResponse {
  message: string
  pickup_id: number
  address_id: number
}

export interface ShiprocketAssignAwbPayload {
  shipment_id: number
}

export interface ShiprocketAssignAwbResponse {
  awb_assign_status: number
  response: {
    data: {
      awb_code: string
      courier_company_id: number
      courier_name: string
      shipment_id: number
    }
  }
}

export interface ShiprocketGeneratePickupPayload {
  shipment_id: number[]
}

export interface ShiprocketGeneratePickupResponse {
  pickup_status: number
  response: {
    pickup_scheduled_date: string
    pickup_token_number: string
    status: string
    others: string
  }
}

export interface ShiprocketManifestPayload {
  shipment_id: number[]
}

export interface ShiprocketManifestResponse {
  manifest_url: string
  status: number
}

export interface ShiprocketPrintPayload {
  order_ids: number[]
}

export interface ShiprocketPrintResponse {
  file_url: string
  status: number
}

export interface ShiprocketLabelPayload {
  shipment_id: number[]
}

export interface ShiprocketLabelResponse {
  label_url: string
  status: number
}

export interface ShiprocketInvoicePayload {
  ids: number[]
}

export interface ShiprocketInvoiceResponse {
  invoice_url: string
  status: number
}

export interface ShiprocketOrderPayload {
  order_id: string
  order_date: string
  pickup_location: string
  comment?: string
  billing_customer_name: string
  billing_last_name: string
  billing_address: string
  billing_address_2?: string
  billing_city: string
  billing_pincode: string
  billing_state: string
  billing_country: string
  billing_email: string
  billing_phone: string
  shipping_is_billing: boolean
  shipping_customer_name?: string
  shipping_last_name?: string
  shipping_address?: string
  shipping_address_2?: string
  shipping_city?: string
  shipping_pincode?: string
  shipping_country?: string
  shipping_state?: string
  shipping_email?: string
  shipping_phone?: string
  order_items: Array<{
    name: string
    sku: string
    units: number
    selling_price: number
    discount: number
    tax: number
    hsn: number
  }>
  payment_method: "Prepaid" | "COD"
  shipping_charges: number
  giftwrap_charges?: number
  transaction_charges: number
  total_discount: number
  sub_total: number
  length: number
  breadth: number
  height: number
  weight: number
}

export interface ShiprocketOrderResponse {
  order_id: number
  shipment_id: number
  status: string
  status_code: number
  onboarding_completed_now: number
  awb_code: string | null
  courier_company_id: number | null
  courier_name: string | null
}


export interface ShiprocketTrackingPayload {
  awb: string
}

export interface ShiprocketTrackingResponse {
  tracking_data: {
    track_status: number
    shipment_status: string
    shipment_track: Array<{
      id: number
      awb_code: string
      courier_company_id: number
      shipment_id: number
      order_id: number
      pickup_date: string
      delivered_date: string
      weight: string
      packages: number
      current_status: string
      delivered_to: string
      destination: string
      consignee_name: string
      origin: string
      courier_agent_details: string
      edd: string
      shipment_track_activities: Array<{
        date: string
        status: string
        activity: string
        location: string
      }>
    }>
  }
}
