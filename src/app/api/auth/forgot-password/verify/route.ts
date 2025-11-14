import {AuthController} from "@/modules/controllers/AuthController"

const authController=new AuthController()

export async function POST (request:Request){
    return authController.ForgotPasswordTokenVerify(request)
}