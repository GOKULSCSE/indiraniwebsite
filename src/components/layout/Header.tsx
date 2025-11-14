"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Search, ChevronDown, User, ShoppingCart, Globe, Package, HelpCircle, Heart, Home, Store, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { useWishlistStore } from "@/store/wishlistStore"
import { useCartStore } from "@/store/cartStore"


import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useRouter } from "next/navigation"
import axios from "axios"
import { useDebounce } from "../../hooks/useDebounce"
import { Loader2 } from "lucide-react"

interface Category {
  id: string;
  name: string;
  parentCategoryId: string | null;
  subCategories?: Category[];
}

interface Product {
  id: string;
  name: string;
  description: string;
  images: Array<{ imageUrl: string }>;
}

interface SearchSuggestion {
  type: 'product' | 'suggestion';
  text: string;
}

interface WishlistItem {
  id: string;
  productId: string;
  productVariantId: string;
  name: string;
  image: string;
  price: number;
  rating?: number;
  reviews?: number;
  quantity: number;
  isSelected: boolean;
  variants?: Array<{ id: string }>;
}

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("home")
  const { data, status } = useSession()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])

  const { data: session } = useSession();
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  
  // Use the wishlist store to get real-time updates
  const { wishlist } = useWishlistStore();
  
  // Use the cart store to get real-time updates
  const { cartItems: storeCartItems } = useCartStore();
  
  // Update wishlist count when the wishlist store changes
  useEffect(() => {
    if (wishlist?.items && Array.isArray(wishlist.items)) {
      setWishlistCount(wishlist.items.length);
    } else {
      setWishlistCount(0);
    }
  }, [wishlist]);

  // Update cart count when the cart store changes
  useEffect(() => {
    if (storeCartItems && Array.isArray(storeCartItems)) {
      setCartCount(storeCartItems.length);
    } else {
      setCartCount(0);
    }
  }, [storeCartItems]);



  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await axios.get('/api/category');
      // Filter to only get top-level categories (where parentCategoryId is null)
      const topLevelCategories = response.data.data.filter(
        (category: any) => category.parentCategoryId === null
      );
      setCategories(topLevelCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.addEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchSearchResults = async () => {
    if (debouncedSearch.trim()) {
      setIsSearching(true)
      try {
        const response = await fetch(`/api/products?search=${encodeURIComponent(debouncedSearch)}${selectedCategory ? `&categoryId=${selectedCategory.id}` : ''}`)
        const data = await response.json()
        setSearchResults(data.data || [])

        // Generate search suggestions
        const searchTerms = debouncedSearch.toLowerCase().split(' ')
        const generatedSuggestions: SearchSuggestion[] = [
          { type: 'suggestion' as const, text: debouncedSearch },
          { type: 'suggestion' as const, text: `${debouncedSearch} online` },
          ...searchTerms.map((term: string) => ({
            type: 'suggestion' as const,
            text: `${term} ${selectedCategory ? `in ${selectedCategory.name}` : ''}`
          }))
        ]
        setSuggestions(generatedSuggestions)
      } catch (error) {
        console.error("Search error:", error)
        setSearchResults([])
        setSuggestions([])
      } finally {
        setIsSearching(false)
      }
    } else {
      setSearchResults([])
      setSuggestions([])
    }
  }

  useEffect(() => {

    fetchSearchResults()
  }, [debouncedSearch, selectedCategory])

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setShowSuggestions(true)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/filter?search=${encodeURIComponent(searchQuery)}${selectedCategory ? `&categoryId=${selectedCategory.id}` : ''}`)
      setShowSuggestions(false)
    }
  }

  const handleProductClick = async (productId: string) => {
    console.log("product is clicking : ");
    setShowSuggestions(false);
    // Navigate first, then close modal
    router.push(`/product/${productId}`);
    setIsMobileSearchOpen(false);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    console.log("suggestion is clicking : ");
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    // Navigate first, then close modal
    router.push(`/filter?search=${encodeURIComponent(suggestion)}${selectedCategory ? `&categoryId=${selectedCategory.id}` : ''}`);
    setIsMobileSearchOpen(false);
  };

  // Animation for the active tab indicator
  const getIndicatorStyles = () => {
    switch (activeTab) {
      case "home":
        return "left-[10%] translate-x-0"
      case "categories":
        return "left-[30%] translate-x-0"
      case "cart":
        return "left-[50%] translate-x-0"
      case "account":
        return "left-[70%] translate-x-0"
      case "wishlist":
        return "left-[90%] translate-x-0"
      default:
        return "left-[10%] translate-x-0"
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement search functionality here
    console.log("Searching for:", searchQuery)
    // You could redirect to search results page or filter results
  }
  const handleOrder = () => {
    router.push("/profile")
  }

  const handleWishlist = () => {
    router.push("/wishlist")
  }

  // Add useEffect for controlling body scroll when modal is open
  useEffect(() => {
    if (isMobileSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobileSearchOpen]);

  useEffect(() => {
    // Check if there's a selected category in localStorage
    const savedCategory = localStorage.getItem('selectedCategory');
    if (savedCategory) {
      try {
        const parsedCategory = JSON.parse(savedCategory);
        setSelectedCategory(parsedCategory);
      } catch (error) {
        console.error('Error parsing saved category:', error);
      }
    }
  }, []);



  const handleClick = () => {
    router.push('/contact');
  };

  return (
    <header className="w-full sticky top-0 left-0 z-[99] bg-white">
      {/* Top utility bar - hidden on mobile */}
      <div className="w-full text-white py-4 hidden lg:block" style={{ backgroundColor: '#D3B750' }}>
        <div className="container mx-auto flex justify-end items-center gap-6 px-4">
          {/* <button className="flex items-center gap-1 text-sm hover:text-gray-200">
            <Globe className="h-4 w-4" />
            English
          </button> */}
          <button onClick={handleOrder}
            className="flex items-center gap-1 text-sm hover:text-gray-200">
            <Package className="h-4 w-4" />
            Track your order
          </button>
          <button 
          onClick={handleClick}
          className="flex items-center gap-1 text-sm hover:text-gray-200">
            <HelpCircle className="h-4 w-4" />
            Helpcentre
          </button>
          <button
            onClick={handleWishlist}
            className="flex items-center gap-1 text-sm hover:text-gray-200 relative"
          >
            <Heart className="h-4 w-4" />
            Wishlist
            {wishlistCount > 0 && (
              <span className="absolute -top-2 -right-5 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center" style={{ backgroundColor: '#D3B750' }}>
                {wishlistCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main header */}
      <div className="border-b">
        <div className="container mx-auto py-4 flex items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src={"/assets/indiranilogo.png"}
              width={236}
              height={64}
              alt="Kaaladi Handicrafts"
              className="lg:w-auto w-[150px]"
            />
          </Link>

          {/* Desktop Search bar */}
          <div className="flex-1 max-w-xl mx-4 relative hidden lg:block" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit} className="flex">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search for products"
                  className="w-full pl-10 pr-4 py-6 rounded-l-full border-r-0"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={() => setShowSuggestions(true)}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />

                {/* Search Results Dropdown */}
                {showSuggestions && (searchResults.length > 0 || suggestions.length > 0 || isSearching) && (
                  <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-[80vh] overflow-y-auto">
                    <div className="p-2">
                      {/* Search Suggestions */}
                      {suggestions.length > 0 && (
                        <div className="mb-4">
                          <h3 className="text-sm font-medium text-gray-900 px-3 py-2">
                            Suggestions
                          </h3>
                          <div className="space-y-1">
                            {suggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2"
                                onClick={() => handleSuggestionClick(suggestion.text)}
                              >
                                <Search className="h-4 w-4 text-gray-400" />
                                {suggestion.text}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Products */}
                      {searchResults.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 px-3 py-2">
                            Products
                          </h3>
                          <div className="space-y-1">
                            {searchResults.map((product) => (
                              <Link
                                key={product.id}
                                href={`/product/${product.id}`}
                                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md transition-colors"
                                onClick={() => setShowSuggestions(false)}
                              >
                                {product.images?.[0]?.imageUrl && (
                                  <Image
                                    src={product.images[0].imageUrl}
                                    alt={product.name}
                                    width={40}
                                    height={40}
                                    className="rounded-md object-cover"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {product.name}
                                  </p>
                                  <p className="text-sm text-gray-500 truncate">
                                    {product.description}
                                  </p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {isSearching && (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Category Dropdown Button */}
              <div className="relative">
                <Button
                  type="button"
                  className="rounded-r-full flex items-center gap-2 px-4 py-6"
                  style={{ backgroundColor: '#D3B750' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B89A3F'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#D3B750'}
                  onClick={toggleDropdown}
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                >
                  <span className="hidden md:inline">{selectedCategory ? selectedCategory.name : 'All Category'}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>

                {isOpen && (
                  <div className="absolute z-50 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 max-h-96 overflow-y-auto">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      {loadingCategories ? (
                        <div className="px-4 py-2 text-sm text-gray-700">Loading...</div>
                      ) : categories.length > 0 ? (
                        <>
                          {/* All Categories option */}
                          <button
                            type="button"
                            className={cn(
                              "block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-medium",
                              !selectedCategory && "bg-gray-100"
                            )}
                            onClick={() => {
                              localStorage.removeItem('selectedCategory'); // Clear any selected category
                              router.push('/filter'); // Navigate to filter page
                              setIsOpen(false);
                              setSelectedCategory(null);
                            }}
                          >
                            All Categories
                          </button>

                          {/* Top-level categories only */}
                          {categories
                            .filter(category => category.parentCategoryId === null)
                            .map((category) => (
                              <button
                                key={category.id}
                                type="button"
                                className={cn(
                                  "block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100",
                                  selectedCategory?.id === category.id && "bg-gray-100"
                                )}
                                onClick={() => {
                                  // Store the selected category in localStorage
                                  localStorage.setItem('selectedCategory', JSON.stringify(category));
                                  // Fix the URL parameter name to be consistent (categoryId instead of category)
                                  router.push(`/filter?categoryId=${category.id}`);
                                  setIsOpen(false);
                                  setSelectedCategory(category);
                                }}
                              >
                                {category.name}
                              </button>
                            ))
                          }
                        </>
                      ) : (
                        <div className="px-4 py-2 text-sm text-gray-700">
                          No categories found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Mobile search trigger and modal */}
          <div className="lg:hidden">
            <button
              className="flex items-center justify-center"
              onClick={() => setIsMobileSearchOpen(true)}
            >
              <Search className="h-6 w-6" />
            </button>

            {/* Mobile Search Modal with Animation */}
            <div
              className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${isMobileSearchOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              onClick={() => setIsMobileSearchOpen(false)}
            >
              <div
                className={`absolute inset-y-0 right-0 max-w-full w-full bg-white shadow-xl transition-transform duration-300 ease-in-out ${isMobileSearchOpen ? 'translate-x-0' : 'translate-x-full'
                  }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col h-full">
                  {/* Header with fade-in animation */}
                  <div className={`p-4 border-b flex items-center gap-4 transition-opacity duration-300 delay-150 ${isMobileSearchOpen ? 'opacity-100' : 'opacity-0'
                    }`}>
                    <button
                      onClick={() => setIsMobileSearchOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                    <div className="flex-1 relative">
                      <Input
                        type="text"
                        placeholder="Search for products"
                        className="w-full pl-10 pr-4 py-6"
                        value={searchQuery}
                        onChange={handleSearchInputChange}
                        onFocus={() => setShowSuggestions(true)}
                        autoFocus={isMobileSearchOpen}
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Content with staggered animation */}
                  <div className={`flex-1 overflow-y-auto p-4 transition-all duration-300 delay-200 ${isMobileSearchOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                    }`}>
                    {/* Search Results */}
                    {(searchResults.length > 0 || suggestions.length > 0 || isSearching) && (
                      <div className="space-y-6">
                        {/* Suggestions */}
                        {suggestions.length > 0 && (
                          <div className={`transition-all duration-300 delay-300 ${isMobileSearchOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                            }`}>
                            <h3 className="text-sm font-medium text-gray-900 mb-2">
                              Suggestions
                            </h3>
                            <div className="space-y-2">
                              {suggestions.map((suggestion, index) => (
                                <div
                                  key={index}
                                  className={`p-2 rounded-md cursor-pointer transition-all duration-300 delay-${300 + (index * 50)}`}
                                  style={{ backgroundColor: 'transparent' }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D3B7501A'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    console.log("suggestion is clicking : ");
                                    handleSuggestionClick(suggestion.text);
                                    setIsMobileSearchOpen(false);
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <Search className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-700">{suggestion.text}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Products */}
                        {searchResults.length > 0 && (
                          <div className={`transition-all duration-300 delay-400 ${isMobileSearchOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                            }`}>
                            <h3 className="text-sm font-medium text-gray-900 mb-2">
                              Products
                            </h3>
                            <div className="space-y-2">
                              {searchResults.map((product, index) => (
                                <div
                                  key={product.id}
                                  className={`p-2 hover:bg-gray-50 rounded-md cursor-pointer transition-all duration-300 delay-${400 + (index * 50)}`}
                                  onClick={() => {
                                    console.log("product is clicking : ");
                                    handleProductClick(product.id);
                                    setIsMobileSearchOpen(false);
                                  }}
                                >
                                  <div className="flex items-center gap-3">
                                    {product.images?.[0]?.imageUrl && (
                                      <Image
                                        src={product.images[0].imageUrl}
                                        alt={product.name}
                                        width={40}
                                        height={40}
                                        className="rounded-md object-cover"
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {product.name}
                                      </p>
                                      <p className="text-sm text-gray-500 truncate">
                                        {product.description}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Loading State */}
                        {isSearching && (
                          <div className={`flex items-center justify-center py-4 transition-opacity duration-300 delay-200 ${isMobileSearchOpen ? 'opacity-100' : 'opacity-0'
                            }`}>
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Categories */}
                    <div className={`mt-6 transition-all duration-300 delay-500 ${isMobileSearchOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                      }`}>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Categories</h3>
                      <div className="space-y-2">
                        <div
                          className={`p-2 hover:bg-gray-50 rounded-md cursor-pointer transition-all duration-300 delay-550 ${isMobileSearchOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                            } ${!selectedCategory && "bg-gray-50"}`}
                          onClick={() => setSelectedCategory(null)}
                        >
                          <span className="text-sm text-gray-700">All Categories</span>
                        </div>
                        {categories.map((category, index) => (
                          <div
                            key={category.id}
                            className={`p-2 hover:bg-gray-50 rounded-md cursor-pointer transition-all duration-300 delay-${550 + (index * 50)} ${isMobileSearchOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                              } ${selectedCategory?.id === category.id && "bg-gray-50"}`}
                            onClick={() => setSelectedCategory(category)}
                          >
                            <span className="text-sm text-gray-700">{category.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop navigation links */}
          <div className="hidden md:flex items-center gap-6">
          {/* Wholesale button commented out
          <Link
            href="/filter?wholesale=true"
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-yellow-400 text-black font-medium shadow hover:bg-yellow-300 transition-colors relative"
            style={{ minWidth: 110, justifyContent: 'center' }}
          >
            <Image src={"/assets/images/wholesale.png"} width={20} height={20} alt="wholesale-icon" />
            <span>Wholesale</span>
          </Link>
          */}

            <Link
              href={status === "authenticated" ? "/profile" : "/auth/signin"}
              className="flex items-center gap-2 transition-colors"
              style={{ color: '#1f2937' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#D3B750'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#1f2937'}
            >
              {data?.user?.image ? (
                <Image
                  src={data.user.image}
                  width={30}
                  height={30}
                  alt="user-icon"
                  className="rounded-full"
                />
              ) : (
                <Image src={"/assets/icons/user.png"} width={20} height={20} alt="user-icon" />
              )}
              <span className="text-sm font-medium">
                {status === "authenticated" ? data.user?.name : "Account"}
              </span>
            </Link>

            <Link href="/cart" className="flex items-center gap-2 relative transition-colors" style={{ color: '#1f2937' }} onMouseEnter={(e) => e.currentTarget.style.color = '#D3B750'} onMouseLeave={(e) => e.currentTarget.style.color = '#1f2937'}>
              <Image src={"/assets/icons/cart.svg"} width={20} height={20} alt="cart-icon" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-5 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center" style={{ backgroundColor: '#D3B750' }}>
                  {cartCount}
                </span>
              )}
            </Link>

            {data?.user?.isSeller && data.user.isSellerApproved && data.user.sellerId ? (
              <Link
                href="/seller"
                className="flex items-center gap-2 group relative transition-colors"
                style={{ color: '#1f2937' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#D3B750'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#1f2937'}
              >
                <Image
                  src={"/assets/icons/seller-store.svg"}
                  width={20}
                  height={20}
                  alt="seller-store"
                />
                <span>Seller Dashboard</span>

                {/* Dropdown-style hover text */}
                <span className="absolute top-full left-0 mt-1 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Go to seller
                </span>
              </Link>
            ) : (
              /* Become a seller button commented out
              <Link
                href="/become-a-seller"
                className="flex items-center gap-2 transition-colors"
                style={{ color: '#1f2937' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#D3B750'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#1f2937'}
              >
                <Image
                  src={"/assets/icons/seller-store.svg"}
                  width={20}
                  height={20}
                  alt="seller-store"
                />
                <span>Become a seller</span>
              </Link>
              */
              null
            )}
          </div>

        </div>
      </div>

      {/* Mobile bottom navigation bar */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t shadow-lg z-50">
        <div className="relative h-16">
          {/* Animated indicator */}
          {/* <div
            className={cn(
              "absolute bottom-0 w-[20%] h-1 bg-[#b01116] transition-all duration-300 ease-in-out",
              getIndicatorStyles(),
            )}
          ></div> */}

          <nav className="flex justify-around items-center h-full">
            <Link
              href="/"
              className={cn(
                "flex flex-col items-center justify-center w-full h-full transition-all duration-300",
                activeTab === "home" ? "" : "text-gray-500",
              )}
              style={activeTab === "home" ? { color: '#D3B750' } : {}}
              onClick={() => setActiveTab("home")}
            >
              <Home className="h-5 w-5" />
              <span className="text-xs mt-1">Home</span>
            </Link>

            <Link
              href="/filter"
              className={cn(
                "flex flex-col items-center justify-center w-full h-full transition-all duration-300",
                activeTab === "categories" ? "" : "text-gray-500",
              )}
              style={activeTab === "categories" ? { color: '#D3B750' } : {}}
              onClick={() => setActiveTab("categories")}
            >
              <Store className="h-5 w-5" />
              <span className="text-xs mt-1">Categories</span>
            </Link>

            <Link
              href="/cart"
              className={cn(
                "flex flex-col items-center justify-center w-full h-full transition-all duration-300 relative",
                activeTab === "cart" ? "" : "text-gray-500",
              )}
              style={activeTab === "cart" ? { color: '#D3B750' } : {}}
              onClick={() => setActiveTab("cart")}
            >
              <div className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-4 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center" style={{ backgroundColor: '#D3B750' }}>
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1">Cart</span>
            </Link>

            <Link
              href={status === "authenticated" ? "/profile" : "/auth/signin"}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full transition-all duration-300",
                activeTab === "account" ? "" : "text-gray-500",
              )}
              style={activeTab === "account" ? { color: '#D3B750' } : {}}
              onClick={() => setActiveTab("account")}
            >
              <User className="h-5 w-5" />
              <span className="text-xs mt-1">Account</span>
            </Link>


            <Link
              href="/wishlist"
              className={cn(
                "flex flex-col items-center justify-center w-full h-full transition-all duration-300 relative",
                activeTab === "wishlist" ? "" : "text-gray-500",
              )}
              style={activeTab === "wishlist" ? { color: '#D3B750' } : {}}
              onClick={() => setActiveTab("wishlist")}
            >
              <div className="relative">
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-4 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center" style={{ backgroundColor: '#D3B750' }}>
                    {wishlistCount}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1">Wishlist</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}

