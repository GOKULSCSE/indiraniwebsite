"use client"

import type React from "react"
import axios from "axios"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { ChevronLeft, Plus, X } from "lucide-react"

interface AddressFormProps {
  onSubmit?: (formData: FormData) => void
  onClose?: () => void;
}

interface ShippingAddress {
  fullName: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  landmark: string;
}

interface Address {
  id: string;
  fullName: string | null;
  email: string | null;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  landmark: string | null;
}

export default function AddressForm({ onSubmit, onClose }: AddressFormProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [address, setAddress] = useState<ShippingAddress | null>(null)
  const [editing, setEditing] = useState(false)
  const [addressId, setAddressId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false);
  const [addressList, setAddressList] = useState<Address[]>([]);

  useEffect(() => {
    const fetchAddress = async () => {
      if (!session?.user?.id) return

      try {
        const response = await axios.get(`/api/user/shippingAddress`, {
          params: { userId: session.user.id }
        })
        setAddressList(response.data.data);
      } catch (error) {
        console.error("Failed to fetch address:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAddress()
  }, [session])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!session?.user?.id) {
      alert("User not logged in.")
      return
    }

    const formData = new FormData(event.currentTarget)

    const payload = {
      userId: session.user.id,
      fullName: formData.get("fullName") ||session.user.name || "",
      email: formData.get("email") || session.user.email || "",
      street: formData.get("street") || "",
      city: formData.get("city") || "",
      state: formData.get("state") || "",
      zipCode: formData.get("zipCode") || "",
      country: formData.get("country") || "",
      phone: formData.get("phone") || "",
      landmark: formData.get("landmark") || ""
    }

    try {
      const response = await axios.post("/api/user/shippingAddress", payload)
      console.log("Success:", response.data)
      alert("Address submitted successfully!")
      setShowForm(false)
      // Refresh address list
      const updated = await axios.get(`/api/user/shippingAddress`, {
        params: { userId: session.user.id }
      });
      setAddressList(updated.data.data);
    } catch (error: any) {
      console.error("Submission failed:", error)
      alert("Failed to submit address.")
    }
  }

  const handleEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session?.user?.id || !addressId) {
      alert("User not logged in or address ID missing.");
      return;
    }

    const formData = new FormData(event.currentTarget);

    const payload = {
      id: addressId,
      userId: session.user.id,
      fullName:  formData.get("fullName") ||session.user.name || "",
      email: formData.get("email") ||session.user.email ||  "",
      street: formData.get("street") || "",
      city: formData.get("city") || "",
      state: formData.get("state") || "",
      zipCode: formData.get("zipCode") || "",
      country: formData.get("country") || "",
      phone: formData.get("phone") || "",
      landmark: formData.get("landmark") || ""
    };

    try {
      const response = await axios.put(`/api/user/shippingAddress?id=${addressId}`, payload);
      console.log("Address updated:", response.data);
      alert("Address updated successfully!");
      setEditing(false);
      setShowForm(false);

      const updated = await axios.get(`/api/user/shippingAddress`, {
        params: { userId: session.user.id }
      });
      setAddressList(updated.data.data);
    } catch (error: any) {
      console.error("Update failed:", error);
      alert("Failed to update address.");
    }
  };

  return (
    <div className="w-full pl-2">
      <div className="flex items-center mb-6">
        {onClose && (
          <button
            onClick={onClose}
            className="mr-2 p-2 rounded-full hover:bg-gray-100"
            aria-label="Close profile"
          >
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </button>
        )}
        <h1 className="text-2xl font-bold">Address</h1>
      </div>
      <div className="flex items-center justify-end w-full">
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            <Plus />
          </button>
        )}
      </div>

      {showForm ? (
        <div className="border-t border-gray-200 pt-6">
          <form onSubmit={editing ? handleEdit : handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  placeholder="Enter Your Full Name"
                  defaultValue={address?.fullName || session?.user?.name || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter Your Email"
                  defaultValue={address?.email || session?.user?.email || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder="Enter Your Phone"
                  defaultValue={address?.phone || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                  Zip Code <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="zipCode"
                  name="zipCode"
                  placeholder="Enter Your Zip Code"
                  defaultValue={address?.zipCode || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                  Door No/Area/Building No <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="street"
                  name="street" 
                  placeholder="Enter Your Door No/Area/Building No"
                  defaultValue={address?.street || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="landmark" className="block text-sm font-medium text-gray-700">
                  Nearby Landmark <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="landmark"
                  name="landmark"
                  placeholder="Enter Your Nearby Landmark"
                  defaultValue={address?.landmark || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  placeholder="Enter Your City"
                  defaultValue={address?.city || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  placeholder="Enter Your State"
                  defaultValue={address?.state || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                  Country <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  placeholder="Enter Your Country"
                  defaultValue={address?.country || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      ) : (
        !loading && (
          <>
            {addressList.length === 0 ? (
              <p className="text-gray-500">No addresses found.</p>
            ) : (
              <div className="space-y-4">
                {addressList.map((address, idx) => (
                  <div
                    key={idx}
                    className="p-4 border rounded-lg shadow-sm bg-white flex justify-between items-start"
                  >
                    <div>
                      <p className="font-bold text-red-600">{address.fullName || session?.user?.name || "Unnamed"}</p>
                      <p className="text-sm text-gray-600">{address.email || session?.user?.email}</p>
                      <p>{address.street},</p>
                      {address.landmark && <p>Near {address.landmark},</p>}
                      <p>
                        {address.city}, {address.state} - {address.zipCode}
                      </p>
                      <p>{address.country}</p>
                      <p>{address.phone}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setShowForm(true);
                          setEditing(true);
                          setAddressId(address.id);
                          setAddress({
                            fullName: address.fullName || session?.user?.name || "",
                            email: address.email || session?.user?.email || "",
                            street: address.street,
                            city: address.city,
                            state: address.state,
                            zipCode: address.zipCode,
                            country: address.country,
                            phone: address.phone,
                            landmark: address.landmark || ""
                          });
                        }}
                        className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )
      )}
    </div>
  )
}
