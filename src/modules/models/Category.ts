export interface ICategory {
  id?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  parentCategoryId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  subCategories?: ICategory[];
  parentCategory?: ICategory | null;
}

export class Category implements ICategory {
  id?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  parentCategoryId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  subCategories?: ICategory[];
  parentCategory?: ICategory | null;

  constructor(data: ICategory) {
    const {
      id,
      name,
      description,
      imageUrl,
      parentCategoryId,
      createdAt,
      updatedAt,
      subCategories,
      parentCategory,
    } = data;

    this.id = id;
    this.name = name;
    this.description = description;
    this.imageUrl = imageUrl;
    this.parentCategoryId = parentCategoryId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.subCategories = subCategories;
    this.parentCategory = parentCategory;
  }
}
