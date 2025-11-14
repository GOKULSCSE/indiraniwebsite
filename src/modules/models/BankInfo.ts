export interface IBankInfo {
    id?: string;
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    branchName?: string;
    accountType?: string;
    isVerified: boolean;
    verificationDate?: Date;
    createdAt?: Date;
    updatedAt?: Date;
  }