"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "next-auth/react";
import Image from "next/image";


function SignupForm() {

    const router = useRouter();
    const [formData, setFormData] = useState({
      name: "",
      email: "",
      password: "",
    });
    const [errors, setErrors] = useState<Record<string, { _errors: string[] }>>(
      {}
    );
    const [isLoading, setIsLoading] = useState(false);
  
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [e.target.id]: e.target.value });
    };
  
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsLoading(true);
      setErrors({});
  
      try {
        const res = await axios.post("/api/auth/register", formData);
        if (res.data.status === "error") {
          console.log(res.data.validationErrors);
          setErrors(res.data.validationErrors);
        } else {
          toast.success("Check your email to verify your account");
          router.push("/auth/signin");
        }
      } catch (err: unknown | AxiosError) {
        if (err instanceof AxiosError) {
          setErrors(err?.response?.data?.validationErrors || {});
          return toast.error(
            err?.response?.data?.message ?? "An error occurred during sign-up"
          );
        }
        toast.error("An error occurred during sign-up");
      } finally {
        setIsLoading(false);
      }
    };
  
    const handleSocialSignIn = (provider: string) => {
      setIsLoading(true);
  
      signIn(provider, { callbackUrl: "/user" });
    };
  



  return (
    <div className="p-8 md:p-12 flex flex-col ">
      <h1 className="text-3xl font-bold mb-8 text-center">Create an account</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-gray-700">
            Name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            disabled={isLoading}
            className="py-6 px-4 rounded-full"
          />
          {errors.name &&
            errors.name?._errors?.map((e, i) => (
              <p key={i} className="text-sm text-red-500">
                {e}
              </p>
            ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="john.doe@gmail.com"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
            className="py-6 px-4 rounded-full"
          />
          {errors.email &&
            errors.email?._errors?.map((e, i) => (
              <p key={i} className="text-sm text-red-500">
                {e}
              </p>
            ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-700">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type="password"
              placeholder="••••••••••••••••••••••"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              className="py-6 px-4 rounded-full"
            />
            <Button
              type="button"
              variant="ghost"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => {
                const passwordInput = document.getElementById(
                  "password"
                ) as HTMLInputElement;
                if (passwordInput) {
                  passwordInput.type =
                    passwordInput.type === "password" ? "text" : "password";
                }
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </Button>
          </div>
          {errors.password &&
            errors.password?._errors?.map((e, i) => (
              <p key={i} className="text-sm text-red-500">
                {e}
              </p>
            ))}
        </div>

        <Button
          type="submit"
          className="w-full py-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing up...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">or sign up with</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6 w-[12rem]  mx-auto md:w-full">
        <Button
          variant="outline"
          onClick={() => handleSocialSignIn("google")}
          disabled={isLoading}
          className="py-6 aspect-square md:aspect-auto rounded-full border-gray-300 hover:bg-gray-50"
        >
          <Image
            src={"/assets/icons/google.png"}
            width={20}
            height={20}
            alt="google-icon"
            className="rounded-full"
          />
          <span className="hidden md:inline">Login with google</span>
        </Button>

        {/* <Button
          variant="outline"
          onClick={() => handleSocialSignIn("apple")}
          disabled={isLoading}
          className="py-6 aspect-square md:aspect-auto rounded-full border-gray-300 hover:bg-gray-50"
        >
          <Image
            src={"/assets/icons/apple.png"}
            width={20}
            height={20}
            alt="apple-icon"
            className="rounded-full"
          />
          <span className="hidden md:inline">Login with Apple</span>
        </Button> */}
        <Button
          variant="outline"
          onClick={() => handleSocialSignIn("linkedin")}
          disabled={isLoading}
          className="py-6 aspect-square md:aspect-auto rounded-full border-gray-300 hover:bg-gray-50"
        >
          <Image
            src={"/assets/icons/linkedin.png"}
            width={20}
            height={20}
            alt="linkedin-icon"
            className="rounded-full"
          />
          <span className="hidden md:inline">Login with Linkedin</span>
        </Button>
      </div>

      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link
          href="/auth/signin"
          className="font-medium text-red-600 hover:text-red-500"
        >
          login to your account
        </Link>
      </p>
    </div>
  );
}

export default SignupForm;
