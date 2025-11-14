"use client";
export const dynamic = "force-dynamic";

import { Suspense } from "react";

import { Loader2 } from "lucide-react";

import Image from "next/image";
import { SignInForm } from "./component/SignInForm";



export default function SignIn() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-7xl grid md:grid-cols-2 bg-white rounded-xl shadow-[0px_2px_8.9px_0px_rgba(0,0,0,0.25)] overflow-hidden">
        <Suspense
          fallback={
            <div className="p-8 md:p-12 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          }
        >
          <SignInForm />
        </Suspense>

        <div className="hidden md:block bg-[#f0f0f0] p-12 relative rounded-l-xl">
          <div className="h-full w-full flex items-center justify-center">
            <Image
              src="/assets/images/signin.svg"
              width={657}
              height={490}
              alt="Login illustration"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
