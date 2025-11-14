import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type StepperFormState } from "@/components/common/stepper-form";

interface SellerRegistrationState {
  formState: StepperFormState;
  currentTab: number;
  isSubmitted: boolean;
  setFormState: (state: StepperFormState) => void;
  onFormChange: ({
    tabIndex,
    fieldName,
    value,
  }: {
    tabIndex: number;
    fieldName: string;
    value: string | number | boolean | null;
  }) => void;
  setCurrentTab: (tab: number) => void;
  setIsSubmitted: (submitted: boolean) => void;
  resetForm: () => void;
}

const initialFormState: StepperFormState = [
  {
    tabName: "Login",
    fields: {
      loginStatus: false,
    },
  },
  {
    tabName: "Account Information",
    fields: {
      fullName: "",
      email: "",
      gstn: "",
      storeName: "",
      storeDescription: "",
      agreeTerms: false,

        address: "",
      city: "",
      state: "",
      pincode: "",
      mobileNumber: "",
    },
  },
  {
    tabName: "Bank Details",
    fields: {
      accountHolderName: "",
      accountNumber: "",
      bankName: "",
      ifscCode: "",
      branchName: "",
      accountType: "",
      upiId: "",
    },
  },
  // {
  //   tabName: "Address",
  //   fields: {
  //     address: "",
  //     city: "",
  //     state: "",
  //     pincode: "",
  //     mobileNumber: "",
      
  //   },
  // }
];

export const useSellerRegistrationStore = create<SellerRegistrationState>()(
  persist(
    (set) => ({
      formState: initialFormState,
      currentTab: 1,
      isSubmitted: true,
      setFormState: (state) => set({ formState: state }),
      onFormChange: ({ tabIndex, fieldName, value }) =>
        set((state) => {
          const updatedState = state.formState.map((tab, index) =>
            index === tabIndex
              ? {
                  ...tab,
                  fields: {
                    ...tab.fields,
                    [fieldName]: value,
                  },
                }
              : tab
          );

          return { formState: updatedState };
        }),
      setCurrentTab: (tab) => set({ currentTab: tab }),
      setIsSubmitted: (submitted) => set({ isSubmitted: submitted }),
      resetForm: () =>
        set({
          formState: initialFormState,
          currentTab: 0,
          isSubmitted: false,
        }),
    }),
    {
      name: "seller-registration-storage",
    }
  )
);
