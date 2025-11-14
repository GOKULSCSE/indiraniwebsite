"use client";

import type React from "react";
import Image from "next/image";
import SignupForm from "./component/SignupForm";

export default function SignUp() {

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-7xl grid md:grid-cols-2 bg-white rounded-xl shadow-[0px_2px_8.9px_0px_rgba(0,0,0,0.25)] overflow-hidden">
        <SignupForm/>

        <div className="hidden md:block bg-[#f0f0f0] p-12 relative rounded-l-xl">
          <div className="h-full w-full flex items-center justify-center">
            <Image
              src="/assets/images/signup.svg"
              width={715}
              height={693}
              alt="Login illustration"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
