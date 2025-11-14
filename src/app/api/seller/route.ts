import {SellerController} from "@/modules/controllers/SellerController"

const sellerController=new SellerController()

export function GET(request:Request){
    return sellerController.getSellerProfile(request)
}

//update seller profile only
export function PATCH(request:Request){
    return sellerController.updateSellerProfile(request)
}

