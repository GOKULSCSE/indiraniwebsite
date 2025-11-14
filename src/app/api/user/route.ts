import { UserController } from "@/modules/controllers/UserController";

const userController = new UserController();

export function GET(request: Request) {
    return userController.getUserProfile(request);
}

export function PATCH(request: Request) {
    return userController.updateUserProfile(request);
}
