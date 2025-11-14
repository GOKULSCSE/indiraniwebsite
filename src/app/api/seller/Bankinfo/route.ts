import {SellerController} from "@/modules/controllers/SellerController"

const sellerController=new SellerController()

export function PATCH(request:Request){
    return sellerController.updateBankInfo(request)
}