import db from "../../lib/db";
import { Seller, ISeller } from "../models/Seller";
import { IBankInfo } from "../models/BankInfo";
import { v4 as uuidv4 } from "uuid";
import _ from "lodash";

export class SellerService {
  async registerSeller(data: {
    userId: string;
    storeName: string;
    storeDescription?: string;
    upiId?: string;
    // Address fields
    address: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
    mobileNumber: string;
    alternateMobileNumber?: string;
    latitude?: number;
    longitude?: number;
    // Bank details
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    branchName?: string;
    accountType?: string;
    gstNumber?: string;
  }) {
    try {
      const bankUuid = uuidv4();
      const sellerProfile = await db.sellerProfile.create({
        data: {
          userId: data.userId,
          storeName: data.storeName,
          storeDescription: data.storeDescription || undefined,
          upiId: data.upiId || undefined,
          // Address fields
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          country: data.country || "India",
          mobileNumber: data.mobileNumber,
          alternateMobileNumber: data.alternateMobileNumber || undefined,
          latitude: data.latitude || undefined,
          longitude: data.longitude || undefined,
          isApproved: false,
          gstNumber: data.gstNumber || undefined,
          bankAccountId: bankUuid,
          bankAccount: {
            create: {
              id: bankUuid,
              accountHolderName: data.accountHolderName,
              accountNumber: data.accountNumber,
              bankName: data.bankName,
              ifscCode: data.ifscCode,
              branchName: data.branchName || undefined,
              accountType: data.accountType || undefined,
              isVerified: false,
            },
          },
        },
        include: {
          bankAccount: true,
          user: true,
        },
      });

      if (!sellerProfile.bankAccount) {
        throw new Error("Failed to create bank account");
      }

      const sellerData: ISeller & IBankInfo = {
        id: sellerProfile.id,
        userId: sellerProfile.userId,
        storeName: sellerProfile.storeName,
        storeDescription: sellerProfile.storeDescription || undefined,
        bankAccountId: sellerProfile.bankAccountId || undefined,
        upiId: sellerProfile.upiId || undefined,
        isApproved: sellerProfile.isApproved,
        createdAt: sellerProfile.createdAt,
        updatedAt: sellerProfile.updatedAt,
        accountHolderName: sellerProfile.bankAccount.accountHolderName,
        accountNumber: sellerProfile.bankAccount.accountNumber,
        bankName: sellerProfile.bankAccount.bankName,
        ifscCode: sellerProfile.bankAccount.ifscCode,
        branchName: sellerProfile.bankAccount.branchName || undefined,
        accountType: sellerProfile.bankAccount.accountType || undefined,
        isVerified: sellerProfile.bankAccount.isVerified,
        verificationDate:
          sellerProfile.bankAccount.verificationDate || undefined,
      };

      return new Seller(sellerData);
    } catch (error: any) {
      if (error.code === "P2002") {
        throw {
          message: "A seller profile already exists for this user",
          status: 400,
        };
      }
      throw {
        message: error.message || "Failed to register seller",
        status: 500,
      };
    }
  }

  async getSellerProfile({ id }: { id: string }) {
    const seller = await db.sellerProfile.findUnique({
      where: { id },
      include: {
        bankAccount: true,
        user: { omit: { password: true, hasedPassword: true } },
      },
    });

    if (_.isEmpty(seller)) throw new Error("User Not Found");

    return seller;
  }

  async updateSellerProfile({
    id,
    data,
  }: {
    id: string;
    data: Partial<ISeller> & {
      user?: {
        firstName?: string;
        lastName?: string;
        name?: string;
        profile?: string;
      };
      // Address fields
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
      country?: string;
      mobileNumber?: string;
      alternateMobileNumber?: string;
      latitude?: number;
      longitude?: number;
      gstNumber?: string;
    };
  }) {
    try {
      const seller = await db.sellerProfile.findUnique({
        where: { id },
        include: {
          user: true,
          bankAccount: true,
        },
      });

      if (!seller) throw new Error("Seller profile not found");

      // Update seller profile
      const updatedSeller = await db.sellerProfile.update({
        where: { id },
        data: {
          storeName: data.storeName,
          storeDescription: data.storeDescription,
          upiId: data.upiId,
          gstNumber: data.gstNumber,
          // Address fields
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          country: data.country,
          mobileNumber: data.mobileNumber,
          alternateMobileNumber: data.alternateMobileNumber,
          latitude: data.latitude,
          longitude: data.longitude,
        },
        include: {
          bankAccount: true,
          user: { omit: { password: true, hasedPassword: true } },
        },
      });

      // Update user details if provided
      if (data.user && seller.user) {
        await db.user.update({
          where: { id: seller.user.id },
          data: {
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            name: data.user.name,
            profile: data.user.profile,
          },
        });
      }

      // Fetch the updated seller profile with user details
      const finalSeller = await db.sellerProfile.findUnique({
        where: { id },
        include: {
          bankAccount: true,
          user: { omit: { password: true, hasedPassword: true } },
        },
      });

      if (!finalSeller)
        throw new Error("Failed to fetch updated seller profile");

      return finalSeller;
    } catch (error: any) {
      throw {
        message: error.message || "Failed to update seller profile",
        status: 500,
      };
    }
  }

  async updateBankInfo({ id, data }: { id: string; data: Partial<IBankInfo> }) {
    try {
      const seller = await db.sellerProfile.findUnique({
        where: { id },
        include: { bankAccount: true },
      });

      if (!seller) throw new Error("Seller profile not found");
      if (!seller.bankAccount) throw new Error("Bank account not found");

      const updatedBankAccount = await db.bankAccountDetails.update({
        where: { id: seller.bankAccount.id },
        data: {
          accountHolderName: data.accountHolderName,
          accountNumber: data.accountNumber,
          bankName: data.bankName,
          ifscCode: data.ifscCode,
          branchName: data.branchName,
          accountType: data.accountType,
          isVerified: false, // Reset verification when bank details are updated
          verificationDate: null,
        },
      });

      return updatedBankAccount;
    } catch (error: any) {
      throw {
        message: error.message || "Failed to update bank info",
        status: 500,
      };
    }
  }

  async createGST({
    sellerId,
    data,
  }: {
    sellerId: string;
    data: { type: string; percentage: number };
  }) {
    try {
      const seller = await db.sellerProfile.findUnique({
        where: { id: sellerId },
        include: { gst: true },
      });

      if (!seller) throw new Error("Seller profile not found");
      if (seller.gst)
        throw new Error("GST record already exists for this seller");

      const gst = await db.gST.create({
        data: {
          type: data.type,
          percentage: data.percentage,
          sellerProfileId: sellerId,
        },
      });

      return gst;
    } catch (error: any) {
      throw {
        message: error.message || "Failed to create GST record",
        status: 500,
      };
    }
  }

  async getGST({ sellerId }: { sellerId: string }) {
    const seller = await db.sellerProfile.findUnique({
      where: { id: sellerId },
      include: { gst: true },
    });

    if (!seller) throw new Error("Seller profile not found");
    if (!seller.gst) throw new Error("GST record not found");

    return seller.gst;
  }

  async updateGST({
    sellerId,
    data,
  }: {
    sellerId: string;
    data: { type?: string; percentage?: number };
  }) {
    try {
      const seller = await db.sellerProfile.findUnique({
        where: { id: sellerId },
        include: { gst: true },
      });

      if (!seller) throw new Error("Seller profile not found");
      if (!seller.gst) throw new Error("GST record not found");

      const updatedGST = await db.gST.update({
        where: { id: seller.gst.id },
        data: {
          type: data.type,
          percentage: data.percentage,
        },
      });

      return updatedGST;
    } catch (error: any) {
      throw {
        message: error.message || "Failed to update GST record",
        status: 500,
      };
    }
  }

  
}
