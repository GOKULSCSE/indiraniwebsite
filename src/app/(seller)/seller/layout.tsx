"use client";
import "@/styles/globals.css";
import { Search, ShoppingBag, Bell, Plus, User, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import Image from "next/image";
import { AppSidebar } from "@/components/layout/seller/sidebar/app-sidebar";
import { Button, LinkButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import Link from "next/link";
import { useSession } from "next-auth/react"
import { SessionProvider } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Pending Approval Component
function PendingApprovalPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-yellow-100 rounded-full">
            <Clock className="w-12 h-12 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 text-center">
            Account Under Review
          </h2>
          <p className="text-gray-600 text-center">
            Your seller account is currently under review. Our team is verifying your details. 
            This process usually takes 24-48 hours. We'll notify you once your account is approved.
          </p>
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Status: Pending Approval</span>
          </div>
          <Link href="/" className="mt-4">
            <Button variant="outline" className="w-full">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Create a separate component for the authenticated content
function AuthenticatedContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const username = session?.user?.name;
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Don't redirect while loading

    if (status === "unauthenticated") {
      // User is not authenticated, redirect to login
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated" && session?.user) {
      const { isSeller, isSellerApproved, sellerId } = session.user;

      // If user is not a seller at all, redirect to become-a-seller
      if (!isSeller) {
        router.push("/become-a-seller");
        return;
      }

      // If user is a seller but not approved or doesn't have sellerId, show pending page
      if (isSeller && (!isSellerApproved || !sellerId)) {
        // Don't redirect, just show pending approval component
        return;
      }

      // If we reach here, user is an approved seller with sellerId - allow access
    }
  }, [status, session, router]);

  const handleProfileClick = () => {
    router.push("/seller/settings");
  };

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show pending approval page for sellers who aren't approved
  if (session?.user?.isSeller && (!session.user.isSellerApproved || !session.user.sellerId)) {
    return <PendingApprovalPage />;
  }

  // If not authenticated or not a seller, the useEffect will handle redirects
  // This is a fallback for the brief moment before redirect
  if (!session?.user?.isSeller || !session.user.isSellerApproved || !session.user.sellerId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      {/* Sidebar - Fixed */}
      <AppSidebar />

      {/* Main Content Wrapper */}
      <SidebarInset className="bg-white flex flex-col h-screen w-full">
        {/* Top Bar - Fixed */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 px-4 w-full">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 text-gray-500 hover:bg-gray-50 hover:text-gray-700" />
            {/* <div className="relative w-64">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search" className="pl-8 w-full border-gray-200 focus-visible:ring-red-500" />
            </div> */}
          </div>
          <div className="flex items-center gap-4">
            <LinkButton href="/seller/productForm" variant="default" className="bg-red-600 hover:bg-red-700 text-white">
              <Plus className="h-4 w-4" /> Add Product
            </LinkButton>
            <div onClick={handleProfileClick}
              className="flex items-center gap-2 cursor-pointer">
              <div className="relative h-9 w-9 overflow-hidden rounded-full border border-gray-200 flex items-center justify-center bg-gray-100">
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={36}
                    height={36}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-gray-800" />
                )}
              </div>

              <span className="text-sm font-medium text-gray-800">{username || "User"}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="h-screen overflow-hidden">
        <SessionProvider>
          <AuthenticatedContent>
            {children}
          </AuthenticatedContent>
        </SessionProvider>
      </body>
    </html>
  );
}