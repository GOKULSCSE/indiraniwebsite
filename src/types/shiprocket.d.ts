export interface ShiprocketAuthResponse {
  token: string
  expires_in: number
  message?: string
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

export interface ShiprocketAssignAwbPayload {
  shipment_id: number
}

export interface ShiprocketGeneratePickupPayload {
  shipment_id: number[]
}

export interface ShiprocketManifestPayload {
  shipment_id: number[]
}

export interface ShiprocketPrintPayload {
  order_ids: number[]
}

export interface ShiprocketLabelPayload {
  shipment_id: number[]
}

export interface ShiprocketInvoicePayload {
  ids: number[]
}

export interface ShiprocketManifestResponse {
  manifest_url: string
  status: number
}

export interface ShiprocketLocation {
  id: number
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

export interface ShiprocketResponse<T> {
  data: T
  message?: string
  status: number
  success: boolean
} 