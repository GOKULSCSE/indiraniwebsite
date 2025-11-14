import { Category, ICategory } from "../models/Category";
import db from "../../lib/db";
import _ from "lodash";

export class CategoryService {
  async CreateCategory(categoryData: ICategory) {
    const category = new Category(categoryData);

    if (_.isEmpty(category.name)) throw Error("Category name is required");

    if (category.parentCategoryId) {
      const parentCategory = await db.category.findUnique({
        where: { id: category.parentCategoryId },
      });

      if (!parentCategory) {
        throw new Error("Parent category not found");
      }
    }

    const newCategory = await db.category.create({
      data: {
        name: category.name,
        description: category.description,
        parentCategoryId: category.parentCategoryId,
        imageUrl: category.imageUrl,
      },
    });

    return newCategory;
  }

  async UpdateCategory(categoryData: ICategory) {
    const category = new Category(categoryData);

    if (_.isEmpty(category.id)) throw Error("Category ID is required");

    const existingCategory = await db.category.findUnique({
      where: { id: category.id },
    });

    if (!existingCategory) {
      throw new Error("Category not found");
    }

    if (category.parentCategoryId) {
      const parentCategory = await db.category.findUnique({
        where: { id: category.parentCategoryId },
      });

      if (!parentCategory) {
        throw new Error("Parent category not found");
      }
    }

    const updatedCategory = await db.category.update({
      where: { id: category.id },
      data: {
        name: category.name,
        description: category.description,
        parentCategoryId: category.parentCategoryId,
        imageUrl: category.imageUrl,
      },
    });

    return updatedCategory;
  }

  async GetAllCategories() {
    const categories = await db.category.findMany({
      include: {
        subCategories: true,
        parentCategory: true,
      },
    });
    return categories;
  }

  async GetCategoryById(id: string) {
    if (_.isEmpty(id)) throw Error("Category ID is required");

    const category = await db.category.findUnique({
      where: { id },
      include: {
        subCategories: true,
        parentCategory: true,
      },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    return category;
  }
}
