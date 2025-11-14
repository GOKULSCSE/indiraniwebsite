"use client";
import React from 'react'
import { useState } from 'react';
import axios from "axios";
import { useRouter } from 'next/navigation';



function ForgotPasswordPage({ token }: { token: string }) {

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
  
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
  
    try {
      await axios.post("/api/auth/forgot-password", {
        token,
        password: newPassword,
      });
  
      setSuccess(true);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset password");
    }
  };
  



  return (

    <>
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">
          <h2 className="text-2xl font-semibold text-center mb-6">Reset Your Password</h2>

          {success ? (
              <div className="space-y-4 text-center">
              <div className="p-4 bg-green-100 text-green-700 rounded-md">
                Your password has been reset successfully!
              </div>
              <button
                onClick={() => router.push('/auth/signin')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded-md text-center">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200"
              >
                Reset Password
              </button>
            </form>
          )}
        </div>
      </div>
    </>

  )
}

export default ForgotPasswordPage