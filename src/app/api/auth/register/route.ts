import { UserController } from "@/modules/controllers/UserController";

const userController=new UserController()

export async function POST (request:Request){
    return await userController.RegisterUser(request)
}