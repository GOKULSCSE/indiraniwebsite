import { mail } from "@/lib/mail";
import { AccountVerificationTemplate } from "@/lib/mail/templates";
import { UserController } from "@/modules/controllers/UserController";
import { ResponseGenerator } from "@/utils/responseGenerator";
import { NextResponse } from "next/server";

const userController=new UserController()

export async function POST(req: Request) {
  try {
    const body: { email: string } = await req.json();
  
    const token=await userController.getVerificationToken({email:body.email})

    // const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const baseUrl = process.env.NEXTAUTH_URL

    const template = AccountVerificationTemplate({ link: `${baseUrl}/api/auth/verification?token=${token}` });
    await mail.sendMail({
      subject: "Verification Mail",
      template,
      to: body.email,
    });

    return NextResponse.json(
      ...ResponseGenerator.generate(200, null, "Mail Sent Successfully")
    );
  } catch (error: Error | unknown) {
    let errorMessage;
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(...ResponseGenerator.generate(400, null, errorMessage));
  }
}
