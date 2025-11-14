"use client";

import Image from "next/image";

const TopTrendingProducts = () => {
  const products = [
    {
      title: "Dry Flower Bouquet",
      image: "/assets/images/Landingpage/Flower bouquet.jpg",
    },
    {
      title: "Wooden Mobile Stand",
      image: "/assets/images/Landingpage/mobile.jpg",
    },
    {
      title: "Gifts for Special Occasion",
      image: "/assets/images/Landingpage/gajalaskshmi.jpg",
    },
  ];

  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start lg:items-center">
          {/* Left Side - Text Content */}
          <div className="space-y-6">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-foreground leading-tight">
              Our Top Trending Products
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Looking for the best wooden handicrafts online to buy? Explore our collections with trending designs that are personalized to the customer's preference.
            </p>
          </div>

          {/* Right Side - Product Cards */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {products.map((product, index) => (
              <article
                key={index}
                className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
              >
                {/* Product Image */}
                <div className="aspect-[3/4] overflow-hidden relative">
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Light Green Overlay with Product Name */}
                <div className="absolute bottom-0 left-0 right-0 bg-[#E8F5E9] px-2 sm:px-4 py-2 sm:py-3">
                  <h3 className="text-[#8B4513] font-semibold text-xs sm:text-sm text-center leading-tight">
                    {product.title}
                  </h3>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TopTrendingProducts;

