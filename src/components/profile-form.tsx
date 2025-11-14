"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { ChevronLeft, User } from "lucide-react"
import { useSession } from "next-auth/react"
import axios from "axios"
import { toast } from "sonner"

interface Address {
  id: string;
  userId: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

interface UserData {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  name: string;
  profile: string;
  isEmailVerified: boolean;
  emailVerifiedAt: string;
  addresses: Address[];
  companyName: string | null;
  gstid: string | null;
}

interface ProfileFormProps {
  onSubmit: (formData: FormData) => void;
  onClose?: () => void;
}

export default function ProfileForm({ onSubmit, onClose }: ProfileFormProps) {
  const { data: session, update: updateSession } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    country: "",
    companyName: "",
    gstid: ""
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user');
        const data = await response.json();
        if (data.status === 'success') {
          setUserData(data.data);
          // Initialize form data with user data
          setFormData({
            name: data.data.name || "",
            email: data.data.email || "",
            phoneNumber: data.data.addresses?.[0]?.phone || "",
            country: data.data.addresses?.[0]?.country || "",
            companyName: data.data.companyName || "",
            gstid: data.data.gstid || ""
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      // Update user profile
      const response = await axios.patch('/api/user', {
        name: formData.name,
        email: formData.email,
        companyName: formData.companyName || null,
        gstid: formData.gstid || null
      });

      // Update session data
      await updateSession();
      
      // Refresh user data
      const updatedUserResponse = await fetch('/api/user');
      const updatedUserData = await updatedUserResponse.json();
      if (updatedUserData.status === 'success') {
        setUserData(updatedUserData.data);
        setFormData(prev => ({
          ...prev,
          name: updatedUserData.data.name || "",
          email: updatedUserData.data.email || "",
          companyName: updatedUserData.data.companyName || "",
          gstid: updatedUserData.data.gstid || ""
        }));
      }

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl pl-2 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl pl-2">
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
        <h1 className="text-2xl font-bold">Profile</h1>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
            {userData?.profile ? (
              <Image
                src={userData.profile}
                alt="Profile"
                width={56}
                height={56}
                className="object-cover w-full h-full"
              />
            ) : (
              <User className="w-8 h-8 text-gray-500" />
            )}
          </div>
          <div>
            <h2 className="font-bold text-lg">{formData.name}</h2>
            <p className="text-gray-600 text-sm">{formData.email}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <form onSubmit={handleUpdate}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

       

            <div className="space-y-2">
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                Company Name
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Company Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="gstid" className="block text-sm font-medium text-gray-700">
                GST ID
              </label>
              <input
                type="text"
                id="gstid"
                name="gstid"
                value={formData.gstid}
                onChange={handleChange}
                placeholder="GST ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={updating}
              className={`px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ${
                updating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {updating ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}