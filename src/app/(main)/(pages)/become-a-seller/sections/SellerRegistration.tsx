"use client";

import type React from "react";
import { z } from "zod";
import { Fragment, useEffect, useState, type ChangeEvent } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  StepperForm,
  Tabs,
  Tab,
  TabContent,
  FormField,
  Actions,
  type StepperFormState,
  useStepperForm,
} from "@/components/common/stepper-form";
import { CustomInput } from "@/components/common/stepper-form/form-input";
import { useSellerRegistrationStore } from "@/store/sellerRegistrationStore";
import { useSession } from "next-auth/react";
import PaymentButton from "@/components/common/Payment/PaymentButton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";
import { SignInForm } from "../../auth/signin/component/SignInForm";
import { SellerStatus } from "./SellerStatus";

const isLoginedSchema = z.object({
  loginStatus: z.boolean().refine((val) => val === true, {
    message: "You must Login or Create a New Account",
  }),
});

const accountInfoSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  gstNumber: z.string().min(15, "GST number must be 15 characters"),
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  storeDescription: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(6, "Pincode must be 6 digits"),
  country: z.string().default("India"),
  mobileNumber: z.string().min(10, "Mobile number must be 10 digits"),
  alternateMobileNumber: z.string().min(10, "Alternate mobile must be 10 digits").optional(),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
});

const bankDetailsSchema = z.object({
  accountHolderName: z
    .string()
    .min(2, "Account holder name must be at least 2 characters"),
  accountNumber: z
    .string()
    .min(9, "Account number must be at least 9 characters"),
  bankName: z.string().min(2, "Bank name must be at least 2 characters"),
  ifscCode: z.string().min(11, "IFSC code must be 11 characters"),
  branchName: z.string().optional(),
  accountType: z.string().optional(),
  upiId: z.string().optional(),

});



const formSchema = z.object({
  ...accountInfoSchema.shape,
  ...bankDetailsSchema.shape,
});

const tabSchemas = [isLoginedSchema, accountInfoSchema, bankDetailsSchema];

export default function SellerRegistration() {
  const {
    formState,
    isSubmitted,
    currentTab,
    setFormState,
    onFormChange,
    setIsSubmitted,
    setCurrentTab,
    resetForm,
  } = useSellerRegistrationStore();

  const { data, status, update } = useSession();

  const handleSubmit = async (formData: any) => {
    try {
      if (!data?.user?.id) {
        toast.error("Please authenticate before submit");
      }
      console.log(formData);
      console.log(data);

      await axios.post("/api/seller/register", {
        ...formData,
        userId: data?.user?.id,
      });

      toast.success("Seller Regstration Completed Successfully");
      resetForm();
    } catch (error) {
      console.log(error);
    }
    setIsSubmitted(true);
  };

  useEffect(() => {
    if (status == "authenticated") {
      onFormChange({
        tabIndex: 0,
        fieldName: "loginStatus",
        value: true,
      });
      onFormChange({
        tabIndex: 1,
        fieldName: "fullName",
        value: data?.user?.name ?? "",
      });

      onFormChange({
        tabIndex: 1,
        fieldName: "email",
        value: data?.user?.email ?? "",
      });

      if (currentTab == 0) {
        setCurrentTab(1);
      }
    } else {
      status !== "loading" && resetForm();
    }
  }, [status]);

  return (
    <div className="w-full max-w-7xl mx-2 overflow-hidden rounded-xl bg-white shadow-[0px_2px_8.9px_0px_rgba(0,0,0,0.25)] mb-[3rem]">
      <div className="flex flex-col lg:flex-row">
        <div className="w-full lg:w-1/2 relative">
          {!(data?.user.isSeller) ? (
            <StepperForm
              formState={formState}
              schema={formSchema}
              tabSchemas={tabSchemas}
              onSubmit={handleSubmit}
              className="relative"
              onFormStateChange={setFormState}
              currentTab={currentTab}
              onTabChange={setCurrentTab}
            >
              <div className="sticky top-0 z-10 bg-white">
                <div className="p-2 pb-0">
                  <Tabs className="mb-0">
                    <Tab
                      clickDisabled={status == "authenticated" ? true : false}
                      index={0}
                    >
                      Login
                    </Tab>
                    <Tab index={1}>Account Information</Tab>
                    <Tab index={2}>Bank Details</Tab>
                    <Tab index={3}>Review & Submit</Tab>
                  </Tabs>
                </div>
              </div>

              <div className="max-h-[calc(100vh-20rem)] min-h-[calc(100vh-30rem)] overflow-y-auto p-[2rem]">
                <TabContent index={0}>
                  <SignInForm redirectTo="/become-a-seller" />
                </TabContent>

                <TabContent index={1}>
                  {({ index }) => (
                    <Fragment>
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="mb-6"
                      >
                        <CustomInput
                          disabled={true}
                          tabIndex={index}
                          fieldName="fullName"
                          label="Full Name"
                          placeholder="Enter Full name"
                          type="text"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mb-6"
                      >
                        <CustomInput
                          disabled={true}
                          tabIndex={index}
                          fieldName="email"
                          label="Email"
                          placeholder="Enter Mail id"
                          type="email"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mb-6"
                      >
                        <CustomInput
                          tabIndex={index}
                          fieldName="storeName"
                          label="Store Name"
                          placeholder="Enter Store Name"
                          type="text"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mb-6"
                      >
                        <CustomInput
                          tabIndex={index}
                          fieldName="storeDescription"
                          label="Store Description"
                          placeholder="Enter Store Description"
                          type="text"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mb-6"
                      >
                        <CustomInput
                          tabIndex={index}
                          fieldName="gstNumber"
                          label="GST Number"
                          placeholder="Enter GST Number"
                          type="text"
                        />
                      </motion.div>

                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mb-6 text-sm text-gray-700"
                      >
                        GSTIN is required to sell products
                      </motion.p>

                      <motion.div initial={{ y: 20, opacity: 0 }}
                       animate={{ y: 0, opacity: 1 }} 
                       transition={{ delay: 0.1 }} 
                       className="mb-6">
                        <CustomInput
                          tabIndex={index}
                          fieldName="address"
                          label="Full Address"
                          placeholder="Enter your full address"
                          type="text"
                        />
                      </motion.div>

                      <motion.div initial={{ y: 20, opacity: 0 }} 
                      animate={{ y: 0, opacity: 1 }} 
                      transition={{ delay: 0.2 }}
                       className="mb-6">
                        <CustomInput
                          tabIndex={index}
                          fieldName="city"
                          label="City"
                          placeholder="Enter your city"
                          type="text"
                        />
                      </motion.div>

                      <motion.div initial={{ y: 20, opacity: 0 }}
                       animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                         className="mb-6">
                        <CustomInput
                          tabIndex={index}
                          fieldName="state"
                          label="State"
                          placeholder="Enter your state"
                          type="text"
                        />
                      </motion.div>

                      <motion.div initial={{ y: 20, opacity: 0 }}
                       animate={{ y: 0, opacity: 1 }} 
                       transition={{ delay: 0.4 }}
                        className="mb-6">
                        <CustomInput
                          tabIndex={index}
                          fieldName="pincode"
                          label="Pincode"
                          placeholder="Enter pincode"
                          type="text"
                        />
                      </motion.div>

                      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="mb-6">
                        <CustomInput
                          tabIndex={index}
                          fieldName="mobileNumber"
                          label="Mobile Number"
                          placeholder="Enter mobile number"
                          type="tel"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="mb-8 flex items-start"
                      >
                        <CustomInput
                          tabIndex={index}
                          fieldName="agreeTerms"
                          type="checkbox"
                        />
                        <label
                          htmlFor="agreeTerms"
                          className="ml-2 text-sm text-gray-700"
                        >
                          By clicking, I agree to make you buy{" "}
                          <Link
                            href="/terms-and-conditions"
                            className="text-red-600 hover:underline"
                          >
                            terms of use & privacy policy
                          </Link>
                        </label>
                      </motion.div>
                    </Fragment>
                  )}
                </TabContent>

                <TabContent index={2}>
                  {({ index }) => (
                    <Fragment>
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="mb-6"
                      >
                        <CustomInput
                          tabIndex={index}
                          fieldName="accountHolderName"
                          label="Account Holder Name"
                          placeholder="Enter Account Holder Name"
                          type="text"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mb-6"
                      >
                        <CustomInput
                          tabIndex={index}
                          fieldName="accountNumber"
                          label="Account Number"
                          placeholder="Enter Account Number"
                          type="text"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mb-6"
                      >
                        <CustomInput
                          tabIndex={index}
                          fieldName="bankName"
                          label="Bank Name"
                          placeholder="Enter Bank Name"
                          type="text"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mb-6"
                      >
                        <CustomInput
                          tabIndex={index}
                          fieldName="ifscCode"
                          label="IFSC Code"
                          placeholder="Enter IFSC Code"
                          type="text"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mb-6"
                      >
                        <CustomInput
                          tabIndex={index}
                          fieldName="branchName"
                          label="Branch Name"
                          placeholder="Enter Branch Name"
                          type="text"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mb-6"
                      >
                        <CustomInput
                          tabIndex={index}
                          fieldName="accountType"
                          label="Account Type"
                          placeholder="Enter Account Type (Savings/Current)"
                          type="text"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="mb-6"
                      >
                        <CustomInput
                          tabIndex={index}
                          fieldName="upiId"
                          label="UPI ID"
                          placeholder="Enter UPI ID"
                          type="text"
                        />
                      </motion.div>

                      
                    </Fragment>
                  )}
                </TabContent>

           

                <TabContent index={3}>
                  <div className="space-y-6">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
                    >
                      <h3 className="text-lg font-semibold mb-3 text-gray-800">
                        Account Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500">
                            Full Name
                          </span>
                          <span className="font-medium">
                            {formState[1].fields.fullName || "Not provided"}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500">Email</span>
                          <span className="font-medium">
                            {formState[1].fields.email || "Not provided"}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500">GSTN</span>
                          <span className="font-medium">
                            {formState[1].fields.gstNumber || "Not provided"}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500">
                            Store Name
                          </span>
                          <span className="font-medium">
                            {formState[1].fields.storeName || "Not provided"}
                          </span>
                        </div>
                      </div>
                      {formState[1].fields.storeDescription && (
                        <div className="mt-3">
                          <span className="text-sm text-gray-500">
                            Store Description
                          </span>
                          <p className="text-sm">
                            {formState[1].fields.storeDescription}
                          </p>
                        </div>
                      )}
                    </motion.div>

                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
                    >
                      <h3 className="text-lg font-semibold mb-3 text-gray-800">
                        Bank Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500">
                            Account Holder
                          </span>
                          <span className="font-medium">
                            {formState[2].fields.accountHolderName ||
                              "Not provided"}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500">
                            Account Number
                          </span>
                          <span className="font-medium">
                            {formState[2].fields.accountNumber ||
                              "Not provided"}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500">
                            Bank Name
                          </span>
                          <span className="font-medium">
                            {formState[2].fields.bankName || "Not provided"}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500">
                            IFSC Code
                          </span>
                          <span className="font-medium">
                            {formState[2].fields.ifscCode || "Not provided"}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500">
                            Branch Name
                          </span>
                          <span className="font-medium">
                            {formState[2].fields.branchName || "Not provided"}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500">
                            Account Type
                          </span>
                          <span className="font-medium">
                            {formState[2].fields.accountType || "Not provided"}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500">UPI ID</span>
                          <span className="font-medium">
                            {formState[2].fields.upiId || "Not provided"}
                          </span>
                        </div>
                      </div>
                    </motion.div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Address</span>
                        <span className="font-medium">
                          {formState[1]?.fields?.address || "Not provided"}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">City</span>
                        <span className="font-medium">
                          {formState[1]?.fields?.city || "Not provided"}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">State</span>
                        <span className="font-medium">
                          {formState[1]?.fields?.state || "Not provided"}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Pincode</span>
                        <span className="font-medium">
                          {formState[1]?.fields?.pincode || "Not provided"}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Mobile Number</span>
                        <span className="font-medium">
                          {formState[1]?.fields?.mobileNumber || "Not provided"}
                        </span>
                      </div>
                    </div>
                    <div className="flex w-full ">
                      <Button type="submit" className="w-full">
                        Register
                      </Button>
                    </div>
                  </div>
                </TabContent>
              </div>

              {currentTab !== 0 && (
                <div className="sticky bottom-0 z-10 border-t py-[1rem]">
                  <Actions
                    showIcons={true}
                    nextLabel="Next"
                    submitLabel="Register"
                    className="rounded-lg px-6 py-0 transition-colors"
                  />
                </div>
              )}
            </StepperForm>
          ) : (
            <SellerStatus
              isSeller={data?.user?.isSeller ?? false}
              isSellerApproved={data?.user?.isSellerApproved ?? false}
            />
          )}
        </div>

        <div className="hidden bg-gray-100 lg:block lg:w-1/2 rounded-2xl">
          <div className="relative h-full w-full">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="h-full w-full flex items-center justify-center"
            >
              <Image
                src="/assets/images/become-a-seller/sellerRegstration.png"
                alt="Seller dashboard illustration"
                width={600}
                height={600}
                className="h-auto w-[70%] object-cover"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
