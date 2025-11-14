"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";

const ShopByPopularCategory = () => {
  const products = [
    {
      title: "Gajalakshmi",
      description: "Check out our unique collection of gajalakshmi wood carving wall decor panels.",
      image: "/assets/images/Landingpage/gajalaskshmi.jpg",
    },
    {
      title: "Flower Bouquet",
      description: "Start your Dried Flower bouquets online shopping journey with Indrani Enterprises today.",
      image: "/assets/images/Landingpage/Flower bouquet.jpg",
    },
    {
      title: "Wooden Crafts",
      description: "Upgrade your home wall decor with our high-quality wood carvings and exclusive hand-carved wooden panels.",
      image: "/assets/images/Landingpage/Wooden cratfs.jpg",
    },
    {
      title: "Mobile Stand",
      description: "Elevate your desk space with our sleek and stylish mobile stand.",
      image: "/assets/images/Landingpage/mobile.jpg",
    },
  ];

  return (
    <main className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="text-center mb-16 space-y-6">
          <h2 className="text-lg sm:text-xl font-medium tracking-wide" style={{ color: '#D3B750' }}>
            Elevate Your Home Decor With Our Art Gallery
          </h2>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
            Premium wood-carved designs From Kaaladi Handicrafts
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            Shop our products for exclusive prices and discounts, and get it from all over India for secure delivery.
          </p>
        </header>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((product, index) => (
            <article
              key={index}
              className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {/* Product Image */}
              <div className="aspect-[4/3] overflow-hidden relative">
                <Image
                  src={product.image}
                  alt={`${product.title} - Premium wood-carved handicraft`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>

              {/* Overlay Content */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex flex-col justify-end p-4 text-white">
                <h3 className="text-xl font-bold mb-2">{product.title}</h3>
                <p className="text-xs text-white/90 mb-4 leading-relaxed">
                  {product.description}
                </p>
                <Button
                  variant="gold"
                  className="w-fit text-sm"
                  aria-label={`Shop ${product.title}`}
                >
                  Shop Now
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
};

export default ShopByPopularCategory;
