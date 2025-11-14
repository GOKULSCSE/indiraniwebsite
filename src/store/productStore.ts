import { create } from 'zustand';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
}

export interface ProductState {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  addProduct: (newProduct: Omit<Product, 'id'>) => Promise<void>;
}

class ProductApiService {
  async fetchProducts(): Promise<Product[]> {
    const response = await fetch('/api/products');
    const data = await response.json();
    // Check HTTP status code rather than relying solely on data.success.
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch products');
    }
    return data.data;
  }

  async createProduct(newProduct: Omit<Product, 'id'>): Promise<Product> {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create product');
    }
    return data.data;
  }
}

const productApiService = new ProductApiService();

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  loading: false,
  error: null,

  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const products = await productApiService.fetchProducts();
      set({ products, loading: false });
    } catch (error: unknown) {
      if (error instanceof Error)
        set({ error: error.message, loading: false });

      else
        set({ error: 'unknown error', loading: false });
    }
  },

  addProduct: async (newProduct: Omit<Product, 'id'>) => {
    set({ loading: true, error: null });
    try {
      const createdProduct = await productApiService.createProduct(newProduct);
      set((state) => ({
        products: [...state.products, createdProduct],
        loading: false,
      }));
    } catch (error: unknown) {
      if (error instanceof Error)
        set({ error: error.message, loading: false });

      else
        set({ error: 'unknown error', loading: false });
    }
  }
}))