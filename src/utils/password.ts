import bcrypt from "bcrypt";

export class Password {
  Salt:number

  constructor() {
    this.Salt=parseInt(process.env.NEXT_PUBLIC_BCRYPT_SALT!)
  }

   async genarateHashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.Salt);
  }

   async validatePassword({password, hashedPassword}: {password: string, hashedPassword: string}): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
