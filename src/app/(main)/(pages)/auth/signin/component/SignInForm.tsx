"use client";
export const dynamic = "force-dynamic";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { type FormEvent, useState, Suspense } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle } from "@/components/ui/alert";
import axios from "axios";
import Image from "next/image";

export function SignInForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const errorParam = searchParams.get("error") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadings, setIsLoadings] = useState(false);
  const [error, setError] = useState(errorParam);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      console.log(res, " res");
      if (res?.ok == false) {
        setError(res.error!);
      } else {
        router.push(redirectTo || callbackUrl);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = (provider: string) => {
    setIsLoading(true);
    signIn(provider, { callbackUrl: redirectTo || "/" });
  };

  const handleResendVerificationMail = async () => {
    try {
      setError("");
      toast.promise(axios.post("/api/auth/mail/verification", { email }), {
        loading: "Sending verification email...",
        success: ({ data }) => {
          return data?.message || "Verification email sent!";
        },
        error: () => {
          return "Failed to send verification email";
        },
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setForgotError("Please enter your email address first.");
      return;
    }
    setIsLoadings(true);

    try {
      const res = await axios.post("/api/auth/forgot-password/request", {
        email,
      });

      setForgotMessage("Password reset link has been sent to your email.");
      setForgotError('');
      toast.success("Password reset link sent!");
    } catch (err: any) {
      setForgotMessage('');
      setForgotError(err.response?.data?.message || "Failed to send reset email.");
      toast.error(forgotError || "Failed to send reset email.");
    }
    finally {
      setIsLoadings(false);
    }
  };

  return (
    <div className="p-8 md:p-12 flex flex-col">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Login to your account
      </h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle className="flex justify-between items-center">
            {error ? error : "An error occurred during sign in"}{" "}
            {error == "Please verify your email" && (
              <Button
                className="text-blue-800 cursor-pointer"
                variant={"link"}
                onClick={handleResendVerificationMail}
              >
                Resent Mail
              </Button>
            )}
          </AlertTitle>
        </Alert>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6 w-[12rem]  mx-auto ">
        <Button
          variant="outline"
          onClick={() => handleSocialSignIn("google")}
          disabled={isLoading}
          className="py-6 aspect-square rounded-full border-gray-300 hover:bg-gray-50"
        >
          <Image
            src={"/assets/icons/google.png"}
            width={20}
            height={20}
            alt="google-icon"
            className="rounded-full"
          />
          <span className="hidden ">Login with google</span>
        </Button>

        {/* <Button
          variant="outline"
          onClick={() => handleSocialSignIn("apple")}
          disabled={isLoading}
          className="py-6 aspect-square rounded-full border-gray-300 hover:bg-gray-50"
        >
          <Image
            src={"/assets/icons/apple.png"}
            width={20}
            height={20}
            alt="apple-icon"
            className="rounded-full"
          />
          <span className="hidden ">Login with Apple</span>
        </Button> */}
        <Button
          variant="outline"
          onClick={() => handleSocialSignIn("linkedin")}
          disabled={isLoading}
          className="py-6 aspect-square rounded-full border-gray-300 hover:bg-gray-50"
        >
          <Image
            src={"/assets/icons/linkedin.png"}
            width={20}
            height={20}
            alt="linkedin-icon"
            className="rounded-full"
          />
          <span className="hidden ">Login with Linkedin</span>
        </Button>
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">
            or login with Email
          </span>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="john.doe@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="py-6 px-4 rounded-full"
          />
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-sm text-gray-700"
            >
              Remember me
            </label>
          </div>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm font-medium text-red-600 hover:text-red-500 cursor-pointer"
            disabled={isLoadings}  
          >
            {isLoadings ? (
              
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Forgot Password?"
            )}
          </button>

        </div>

        <Button
          onClick={() => {
            handleSubmit();
          }}
          className="w-full py-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Login"
          )}
        </Button>
      </div>

      <p className="mt-8 text-center text-sm text-gray-600">
        Don't have an account?{" "}
        <Link
          href="/auth/signup"
          className="font-medium text-red-600 hover:text-red-500"
        >
          create an account
        </Link>
      </p>
    </div>
  );
}