import { IBankInfo } from "./BankInfo";

export interface ISeller {
  id?: string;
  userId: string;
  storeName: string;
  storeDescription?: string;
  bankAccountId?: string;
  upiId?: string;
  isApproved: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Seller implements ISeller, IBankInfo {
  id?: string;
  userId: string;
  storeName: string;
  storeDescription?: string;
  bankAccountId?: string;
  upiId?: string;
  isApproved: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  branchName?: string;
  accountType?: string;
  isVerified: boolean;
  verificationDate?: Date;

  constructor(data: ISeller & IBankInfo) {
    const {
      id,
      userId,
      storeName,
      storeDescription,
      bankAccountId,
      upiId,
      isApproved,
      createdAt,
      updatedAt,
      accountHolderName,
      accountNumber,
      bankName,
      ifscCode,
      branchName,
      accountType,
      isVerified,
      verificationDate
    } = data;

    this.id = id;
    this.userId = userId;
    this.storeName = storeName;
    this.storeDescription = storeDescription;
    this.bankAccountId = bankAccountId;
    this.upiId = upiId;
    this.isApproved = isApproved;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.accountHolderName = accountHolderName;
    this.accountNumber = accountNumber;
    this.bankName = bankName;
    this.ifscCode = ifscCode;
    this.branchName = branchName;
    this.accountType = accountType;
    this.isVerified = isVerified;
    this.verificationDate = verificationDate;
  }
}
