// import { create } from "zustand";

// // Image Interface
// interface Image {
//   id: number;
//   image: string;
// }

// // Command Interface
// interface Command {
//   id: number;
//   quote: string;
//   name: string;
//   position: string;
//   image: string;
// }

// // Rating Interface
// interface Rating {
//   star: number;
//   percent: number;
// }

// // Product Interface
// interface Product {
//   id: number;
//   description: string;
//   price: number;
//   quantity: number;
//   image: string;
//   rating: number;
//   reviews: number;
// }

// // Store Interface
// interface ProductView {
//   mainImage: string;
//   setMainImage: (image: string) => void;
//   images: Image[];
//   commands: Command[];
//   ratings: Rating[];
//   productviewItem: Product[];
//   updateQuantity: (id: number, newQuantity: number) => void;
//   similartProductviewItem: Product[];
//   cartItems: Product[];
//   updateProduct: (id: number, newQuantity: number) => void;
//   addToCart: (product: Product) => void;
//   removeFromCart: (id: number) => void;
// }

// export const useProductStore = create<ProductView>((set, get) => ({
//   mainImage: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSItSK_QyN3xK0vAjr791DrE39-ZFMfi7XDg&s",
  
//   setMainImage: (image) => set({ mainImage: image }),

//   images: [
//     { id: 1, image: "https://example.com/image1.jpg" },
//     { id: 2, image: "https://example.com/image2.jpg" },
//     { id: 3, image: "https://example.com/image3.jpg" },
//   ],

//   commands: [
//     {
//       id: 1,
//       quote: "Lorem ipsum dolor sit amet...",
//       name: "SMITH",
//       position: "Manager of ABC Tech",
//       image: "https://example.com/smith.jpg",
//     },
//   ],

//   ratings: [
//     { star: 5, percent: 62 },
//     { star: 4, percent: 28 },
//     { star: 3, percent: 10 },
//     { star: 2, percent: 0 },
//     { star: 1, percent: 0 },
//   ],

//   productviewItem: [
//     {
//       id: 1,
//       description: "MC PRECISION SUPER ",
//       price: 1500,
//       quantity: 1,
//       image: "https://example.com/product1.jpg",
//       rating: 4.4,
//       reviews: 120,
//     },
//   ],

//   similartProductviewItem: [
//     {
//       id: 2,
//       description: "MC PRECISION ULTRA",
//       price: 1400,
//       quantity: 1,
//       image: "https://example.com/product2.jpg",
//       rating: 4.3,
//       reviews: 90,
//     },
//     {
//       id: 3,
//       description: "MC PRECISION PRO",
//       price: 1600,
//       quantity: 1,
//       image: "https://example.com/product3.jpg",
//       rating: 4.5,
//       reviews: 130,
//     },
//   ],

//   cartItems: [],

 
//   updateQuantity: (id: number, newQuantity: number) =>
//     set((state) => ({
//       productviewItem: state.productviewItem.map((item) =>
//         item.id === id ? { ...item, quantity: Math.max(1, newQuantity) } : item
//       ),
//     })),
  


//     amtQty: () =>
//       get().productviewItem.reduce((sum, item) => sum + item.price * item.quantity, 0),
  

//   updateProduct: (id, newQuantity) =>
//     set((state) => ({
//       productviewItem: state.productviewItem.map((item) =>
//         item.id === id ? { ...item, quantity: Math.max(1, newQuantity) } : item
//       ),
//       cartItems: state.cartItems.map((item) =>
//         item.id === id ? { ...item, quantity: Math.max(1, newQuantity) } : item
//       ),
//     })),

//     addToCart: () => {
//       set((state) => {
//         // Find the product associated with the mainImage
//         const productToAdd = state.productviewItem.find((product) => product.image === state.mainImage);
    
//         if (!productToAdd) return state; // If no product is found, return the state unchanged
    
//         return {
//           cartItems: [productToAdd, ...state.cartItems.filter((item) => item.id !== productToAdd.id)],
//         };
//       });
//     },
    

//   removeFromCart: (id) =>
//     set((state) => ({
//       cartItems: state.cartItems.filter((item) => item.id !== id),
//     })),

//     handlePayment: () => {
//       set((state) => {
//         const mainImageProduct = state.productviewItem[0]; // Assuming the main product is at index 0
//         if (!mainImageProduct) return {}; // If no product, do nothing
    
//         const existingItem = state.cartItems.find((item) => item.id === mainImageProduct.id);
    
//         return {
//           cartItems: existingItem
//             ? state.cartItems.map((item) =>
//                 item.id === mainImageProduct.id ? { ...item, quantity: item.quantity + 1 } : item
//               )
//             : [...state.cartItems, { ...mainImageProduct, quantity: 1 }],
//         };
//       });
    
//       console.log("Proceeding to payment...");
//       // Redirect to payment page logic (You can replace this with actual payment processing)
//     },
    
// }));

import { create } from "zustand";


// Image Interface
interface Image {
  id: number;
  image: string;
}

// Command Interface
interface Command {
  id: number;
  quote: string;
  name: string;
  position: string;
  image: string;
}

// Rating Interface
interface Rating {
  star: number;
  percent: number;
}

// Product Interface
interface Product {
  id: number;
  description: string;
  price: number;
  quantity: number;
  image: string;
  rating: number;
  reviews: number;
}

// Store Interface
interface ProductView {
  mainImage: string;
  setMainImage: (image: string) => void;
  images: Image[];
  commands: Command[];
  ratings: Rating[];
  productviewItem: Product[];
  updateQuantity: (id: number, newQuantity: number) => void;
  similartProductviewItem: Product[];
  cartItems: Product[];
  updateProduct: (id: number, newQuantity: number) => void;
  addToCart: () => void;
  removeFromCart: (id: number) => void;
  handlePayment: () => void;
  buyNow: () => void;
}

// Zustand Store
export const useProductStore = create<ProductView>((set, get) => ({
  mainImage:
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSItSK_QyN3xK0vAjr791DrE39-ZFMfi7XDg&s",

  // setMainImage: (image) => set({ mainImage: image }),

  images: [
    { id: 1, image: "https://example.com/image1.jpg" },
    { id: 2, image: "https://example.com/image2.jpg" },
    { id: 3, image: "https://example.com/image3.jpg" },
  ],

  commands: [
    {
      id: 1,
      quote: "Lorem ipsum dolor sit amet...",
      name: "SMITH",
      position: "Manager of ABC Tech",
      image: "https://example.com/smith.jpg",
    },
  ],

  ratings: [
    { star: 5, percent: 62 },
    { star: 4, percent: 28 },
    { star: 3, percent: 10 },
    { star: 2, percent: 0 },
    { star: 1, percent: 0 },
  ],

  productviewItem: [
    {
      id: 1,
      description: "MC PRECISION SUPER",
      price: 1500,
      quantity: 1,
      image: "https://example.com/product1.jpg",
      rating: 4.4,
      reviews: 120,
    },
   
  ],

  similartProductviewItem: [
    {
      id: 2,
      description: "MC PRECISION ULTRA",
      price: 1400,
      quantity: 1,
      image: "https://example.com/product2.jpg",
      rating: 4.3,
      reviews: 90,
    },
    {
      id: 3,
      description: "MC PRECISION PRO",
      price: 1600,
      quantity: 1,
      image: "https://example.com/product3.jpg",
      rating: 4.5,
      reviews: 130,
    },
  ],

  cartItems: [
    {
      id: 1,
      description: "MC PRECISION PRO",
      price: 1600,
      quantity: 1,
      image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSItSK_QyN3xK0vAjr791DrE39-ZFMfi7XDg&s",
      rating: 4.5,
      reviews: 130,
    },
    {
      id: 2,
      description: "MC PRECISION PRO",
      price: 1600,
      quantity: 1,
      image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSItSK_QyN3xK0vAjr791DrE39-ZFMfi7XDg&s",
      rating:4.6,
      reviews: 130,
    },
  ],

  updateQuantity: (id, newQuantity) =>
    set((state) => ({
      productviewItem: state.productviewItem.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, newQuantity) } : item
      ),
    })),

  updateProduct: (id, newQuantity) =>
    set((state) => ({
      productviewItem: state.productviewItem.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, newQuantity) } : item
      ),
      cartItems: state.cartItems.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, newQuantity) } : item
      ),
    })),

  addToCart: () => {
    set((state) => {
      const productToAdd = state.productviewItem.find(
        (product) => product.image === state.mainImage
      );

      if (!productToAdd) return state;

      return {
        cartItems: [
          productToAdd,
          ...state.cartItems.filter((item) => item.id !== productToAdd.id),
        ],
      };
    });
  },

  removeFromCart: (id) =>
    set((state) => ({
      cartItems: state.cartItems.filter((item) => item.id !== id),
    })),

  handlePayment: () => {
    set((state) => {
      const mainImageProduct = state.productviewItem[0];
      if (!mainImageProduct) return {};

      const existingItem = state.cartItems.find(
        (item) => item.id === mainImageProduct.id
      );

      return {
        cartItems: existingItem
          ? state.cartItems.map((item) =>
              item.id === mainImageProduct.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          : [...state.cartItems, { ...mainImageProduct, quantity: 1 }],
      };
    });

    console.log("Proceeding to payment...");
  },

  buyNow: () => {
    set((state) => {
      const productToBuy = state.productviewItem.find(
        (product) => product.image === state.mainImage
      );

      if (!productToBuy) return state;

      return {
        cartItems: [productToBuy], // Only this product in the cart
      };
    });

    console.log("Redirecting to checkout...");
  },

  setMainImage: (image) => {
    const product = get().productviewItem.find((p) => p.image === image);
    if (product) {
      set({ mainImage: image });
    }
  },
  

      
}));
