import { UserController } from "@/modules/controllers/UserController";

const userController=new UserController()

export async function GET (request:Request){
    return await userController.verifyUserAccount(request)
}