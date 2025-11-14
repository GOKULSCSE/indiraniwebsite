export interface IProductImage {
  id?: string;
  productId?: string;
  imageUrl: string;
  isPrimary?: boolean;
  createdAt?: Date;
}

export interface IProductVariantImage {
  id?: string;
  productVariantSKU?: string;
  productVariantId?: string;
  imageUrl: string;
  isPrimary?: boolean;
  createdAt?: Date;
}

export interface IProductDiscount {
  id?: string;
  productId?: string;
  discountType: 'percentage' | 'amount';
  discountValue: number;
  startDate: string | Date;
  endDate: string | Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProductVariantDiscount {
  id?: string;
  productVariantSKU?: string;
  productVariantId?: string;
  discountType: 'percentage' | 'amount';
  discountValue: number;
  startDate: string | Date;
  endDate: string | Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IGST {
  id?: string;
  percentage: number;
  productId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProductVariant {
  id?: string;
  productVariantSKU: string;
  productId?: string;
  title: string;
  description?: string;
  price: number;
  stockQuantity: number;
  productWeight?: number; // in grams
  variantType: string;
  variantValue: string;
  additionalPrice?: number;
  createdAt?: Date;
  updatedAt?: Date;
  ProductVariantImage?: IProductVariantImage[];
  discounts?: IProductVariantDiscount[];
  images?: { imageUrl: string; isPrimary?: boolean }[];
  ProductDiscount?: IProductVariantDiscount[];
  // dimensions
  height?: number;
  width?: number;
  breadth?: number;
}

export interface IRelatedProduct {
  linkName: string;
  url: string;
}

export interface IProduct {
  id?: string;
  productSKU: string;
  sellerId: string;
  categoryId: string;
  name: string;
  description?: string;
  brand?: string;
  isApproved?: boolean;
  aboutProduct?: string;
  hsnCode?: string;
  linkName?: string;
  relatedProducts?: IRelatedProduct[] | null;
  GST?: IGST;
  createdAt?: Date;
  updatedAt?: Date;
  images?: IProductImage[];
  variants?: IProductVariant[];
  discounts?: IProductDiscount[];
  wholesale?: boolean;
}

export class Product implements IProduct {
  id?: string;
  productSKU: string;
  sellerId: string;
  categoryId: string;
  name: string;
  description?: string;
  brand?: string;
  isApproved?: boolean;
  aboutProduct?: string;
  hsnCode?: string;
  linkName?: string;
  relatedProducts?: IRelatedProduct[] | null;
  GST?: IGST;
  createdAt?: Date;
  updatedAt?: Date;
  images?: IProductImage[];
  variants?: IProductVariant[];
  discounts?: IProductDiscount[];
  wholesale?: boolean;

  constructor(data: IProduct) {
    const {
      id,
      productSKU,
      sellerId,
      categoryId,
      name,
      description,
      brand,
      isApproved,
      createdAt,
      updatedAt,
      images,
      variants,
      discounts,
      aboutProduct,
      hsnCode,
      linkName,
      relatedProducts,
      GST,
      wholesale
    } = data;
    this.id = id;
    this.productSKU = productSKU;
    this.sellerId = sellerId;
    this.categoryId = categoryId;
    this.name = name;
    this.description = description;
    this.brand = brand;
    this.aboutProduct = aboutProduct;
    this.isApproved = isApproved ?? false;
    this.hsnCode = hsnCode;
    this.linkName = linkName;
    this.relatedProducts = relatedProducts;
    this.GST = GST;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.images = images;
    this.variants = variants;
    this.discounts = discounts;
    this.wholesale = wholesale ?? false;
  }
}
