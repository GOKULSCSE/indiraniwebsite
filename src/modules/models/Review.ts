export interface IReview {
  id?: string;
  productId: string;
  userId: string;
  rating: number;
  reviewText?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Review implements IReview {
  id?: string;
  productId: string;
  userId: string;
  rating: number;
  reviewText?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: IReview) {
    const { id, productId, userId, rating, reviewText, createdAt, updatedAt } =
      data;

    this.id = id;
    this.productId = productId;
    this.userId = userId;
    this.rating = rating;
    this.reviewText = reviewText;
  }
}
