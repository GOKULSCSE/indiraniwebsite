import db from "@/lib/db";
import { IReview, Review } from "../models/Review";
import _ from "lodash";

export class ReviewService {
  async createReview(review: IReview) {
    const reviewData = {
      userId: review.userId,
      productId: review.productId,
      rating: review.rating,
      reviewText: review.reviewText, 
    };
    

    const isExisting = await db.product.findUnique({
      where: {
        id: reviewData.productId,
      },
      include: {
        reviews: { where: { userId: reviewData.userId } },
      },
    });

    if (_.isEmpty(isExisting)) throw new Error("Product Not Found");

    if (!_.isEmpty(isExisting.reviews))
      throw new Error("User has already submitted a review for this product");

    return await db.review.create({ data: { ...reviewData } });
  }

  async getAllReviews(productId: string) {
    return await db.review.findMany({ where: { productId },include:{
      user:{omit:{password:true,hasedPassword:true}}
    } });
  }
}
