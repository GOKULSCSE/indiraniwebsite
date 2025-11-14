"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function VerificationPage() {
  const params = useParams();
  const router = useRouter();
  const status = params.status as "success" | "expired";

  const isSuccess = status === "success";
  const isExpired = status === "expired";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md overflow-hidden">
        <div
          className={cn(
            "h-2",
            isSuccess
              ? "bg-green-500"
              : isExpired
              ? "bg-amber-500"
              : "bg-red-500"
          )}
        />
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            {isSuccess ? (
              <CheckCircle className="h-12 w-12 text-green-500" />
            ) : isExpired ? (
              <AlertTriangle className="h-12 w-12 text-amber-500" />
            ) : (
              <XCircle className="h-12 w-12 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {isSuccess
              ? "Email Verified!"
              : isExpired
              ? "Verification Link Expired"
              : "Verification Failed"}
          </CardTitle>
          <CardDescription>
            {isSuccess
              ? "Your email has been successfully verified. You can now access all features of your account."
              : isExpired
              ? "Your verification link has expired. Please request a new verification email."
              : "We couldn't verify your email. The link may be invalid or has already been used."}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6">
          <div
            className={cn(
              "p-4 rounded-lg text-sm",
              isSuccess
                ? "bg-green-50 text-green-700"
                : isExpired
                ? "bg-amber-50 text-amber-700"
                : "bg-red-50 text-red-700"
            )}
          >
            {isSuccess
              ? "Thank you for verifying your email address. Your account is now fully activated."
              : isExpired
              ? "Verification links are valid for a limited time. Please request a new verification email to complete the process."
              : "If you continue to experience issues, please contact our support team for assistance."}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3">
          {isSuccess ? (
            <>
              <Button
                className="w-full sm:w-auto cursor-pointer"
                onClick={() => router.push("/auth/signin")}
              >
                Go to Login <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto cursor-pointer"
                onClick={() => router.push("/")}
              >
                Back to Home
              </Button>
            </>
          ) : (
            <>
              <Button
                className="w-full sm:w-auto cursor-pointer"
                onClick={() => router.push("/auth/signup")}
              >
                {isExpired ? "Resend Verification" : "Try Again"}{" "}
                <RefreshCw className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto cursor-pointer"
                // onClick={() => router.push("/support")}
              >
                Contact Support
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
