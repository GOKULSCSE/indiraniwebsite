import { ReviewController } from "@/modules/controllers/ReviewController"

const reviewController=new ReviewController()

export async function POST(request:Request,{params}:{params:{id:string}}){
    return reviewController.createReview(request,params)
}
export async function GET(request:Request,{params}:{params:{id:string}}){
    return reviewController.getAllReviews(request,params)
}