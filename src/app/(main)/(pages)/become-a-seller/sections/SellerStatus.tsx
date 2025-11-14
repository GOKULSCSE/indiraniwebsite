import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface SellerStatusProps {
  isSeller: boolean;
  isSellerApproved: boolean;
}

export function SellerStatus({ isSeller, isSellerApproved }: SellerStatusProps) {
  if (!isSeller) {
    return null;
  }

  if (!isSellerApproved) {
    return (
    
        <div className="flex flex-col items-center gap-4  w-full min-h-[35rem] justify-center">
          <div className="p-4 bg-yellow-100 rounded-full">
            <Clock className="w-12 h-12 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">
            Account Under Review
          </h2>
          <p className="text-gray-600 max-w-md">
            Your seller account is currently under review. Our team is verifying your details. 
            This process usually takes 24-48 hours. We'll notify you once your account is approved.
          </p>
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Status: Pending Approval</span>
          </div>
        </div>
    );
  }

  return (
      <div className="flex flex-col items-center gap-4  w-full min-h-[35rem] justify-center">
        <div className="p-4 bg-green-100 rounded-full">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800">
          Account Approved!
        </h2>
        <p className="text-gray-600 max-w-md">
          Congratulations! Your seller account has been approved. You can now start managing your store and selling products.
        </p>
        <Link href="/seller">
          <Button size="lg" className="mt-4">
            Go to Seller Dashboard
          </Button>
        </Link>
      </div>
  );
} 