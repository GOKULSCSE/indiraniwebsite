"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import type React from "react"

import { Filter, Search, X } from "lucide-react"
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import axios from "axios"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Slider } from "primereact/slider"
import FilterPageLoader from "@/components/FilterPageLoader"
import { useDebounce } from "@/hooks/useDebounce"
import { toast } from "sonner"
import ProductCard from "@/components/common/ProductCard"
import { useIsMobile } from "@/hooks/use-mobile"

interface SubCategory {
  id: string
  name: string
  description: string
  parentCategoryId: string
  createdAt: string
  updatedAt: string
}

interface Category {
  id: string
  name: string
  description: string
  parentCategoryId: string | null
  createdAt: string
  updatedAt: string
  subCategories: SubCategory[]
  parentCategory: Category | null
}

interface Product {
  id: string
  name: string
  description: string
  price: string
  brand: string
  aboutProduct?: any
  stockQuantity: number
  images: {
    id: string
    imageUrl: string
    isPrimary: boolean
  }[]
  variants: {
    id: string
    variantType: string
    title: string
    variantValue: string
    additionalPrice: string
    description: string
    price: number
    stockQuantity: number
    ProductVariantImage?: {
      id: string
      imageUrl: string
      isPrimary: boolean
    }[]
    discounts?: {
      id: string
      discountType: string
      discountValue: number
      startDate: string
      endDate: string
    }[]
  }[]
  reviews: {
    id: string
    rating: number
    reviewText: string | null
    createdAt: string
  }[]
  discounts?: {
    id: string
    discountType: string
    discountValue: string
    startDate: string
    endDate: string
  }[]
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

interface SubmittedReview {
  rating: number
  text: string
  createdAt: string // ISO format
}

const ProductList = () => {
  const [showFilter, setShowFilter] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [mainCategories, setMainCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null)
  const [filteredSubCategories, setFilteredSubCategories] = useState<SubCategory[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [availableBrands, setAvailableBrands] = useState<string[]>([])
  const { data: session } = useSession()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 350)
  const [initialLoad, setInitialLoad] = useState(true)
  const isMobile = useIsMobile()
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  
  // Pagination state
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: isMobile ? 6 : 8,
    totalPages: 1,
    hasMore: false
  })

  const MIN = 0
  const MAX = 500000

  const [range, setRange] = useState<[number, number]>([0, 50000])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const searchParam = params.get("search")
    const categoryParam = params.get("categoryId")
    const wholesaleParam = params.get("wholesale")

    if (searchParam) {
      setSearchTerm(decodeURIComponent(searchParam))
    }
    if (categoryParam) {
      setSelectedCategory(categoryParam)
    }
    if (wholesaleParam === 'true') {
      // stash in URL in case we rewrite query later
      params.set('wholesale', 'true')
      window.history.replaceState(null, "", `?${params.toString()}`)
    }
    setInitialLoad(false)
  }, [])

  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setLoadingProducts(true)
    }
  }, [searchTerm, debouncedSearchTerm])

  // Reset pagination when filters change
  useEffect(() => {
    if (!initialLoad) {
      setPagination(prev => ({
        ...prev,
        page: 1,
        hasMore: true
      }))
      setProducts([])
      fetchFilteredProducts(1, pagination.limit, true)
    }
  }, [range, selectedCategory, selectedSubCategory, selectedBrands, debouncedSearchTerm, initialLoad])

  // Update limit based on device
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      limit: isMobile ? 6 : 8
    }))
  }, [isMobile])

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    }

    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && pagination.hasMore && !loadingMore && !loadingProducts) {
        loadMoreProducts()
      }
    }

    observerRef.current = new IntersectionObserver(handleObserver, options)
    
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [pagination.hasMore, loadingMore, loadingProducts, products.length])

  const fetchFilteredProducts = async (page: number, limit: number, resetResults = false) => {
      const params = new URLSearchParams()

    params.append("page", page.toString())
    params.append("limit", limit.toString())

      if (range[0] !== undefined) params.append("fromPrice", range[0].toString())
      if (range[1] !== undefined) params.append("toPrice", range[1].toString())
      // Use subcategory if selected, otherwise use main category
      const categoryToUse = selectedSubCategory || selectedCategory
      if (selectedSubCategory) {
        params.append("categoryId", selectedSubCategory.toString())
      } else if (selectedCategory) {
        params.append("categoryId", selectedCategory.toString())
        params.append("includeSubCategories", "true")
      }
      if (debouncedSearchTerm) params.append("search", debouncedSearchTerm)
      
      // Add brand filters
      if (selectedBrands.length > 0) {
        selectedBrands.forEach(brand => {
          params.append("brand", brand)
        })
      }

    // wholesale filter passthrough
    const currentUrlParams = new URLSearchParams(window.location.search)
    if (currentUrlParams.get('wholesale') === 'true') {
      params.append('wholesale', 'true')
    }

    if (resetResults) {
      setLoadingProducts(true)
    } else {
      setLoadingMore(true)
    }

      try {
        const res = await fetch(`/api/products?${params.toString()}`)
        const json = await res.json()
      
      if (resetResults) {
        setProducts(json.data)
      } else {
        setProducts(prev => [...prev, ...json.data])
      }
      
      setPagination(json.pagination)
      } catch (error) {
        console.error("Error fetching filtered products:", error)
      if (resetResults) {
        setProducts([])
      }
      setPagination(prev => ({ ...prev, hasMore: false }))
      } finally {
        setLoadingProducts(false)
      setLoadingMore(false)
        setLoading(false)
      }
    }

  const loadMoreProducts = () => {
    if (pagination.hasMore && !loadingMore) {
      fetchFilteredProducts(pagination.page + 1, pagination.limit)
    }
  }

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("/api/category")
        const allCategories = response.data.data
        setCategories(allCategories)
        
        // Filter main categories and include their subcategories
        const mainCats = allCategories
          .filter((category: any) => !category.parentCategoryId)
          .map((category: any) => ({
            ...category,
            subCategories: allCategories.filter((sub: any) => sub.parentCategoryId === category.id)
          }));
        setMainCategories(mainCats);
      } catch (error) {
        console.error("Error fetching categories:", error)
        setCategories([])
        setMainCategories([])
      }
    }

    fetchCategories()
  }, [])

  // Fetch available brands from products based on selected category
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const params = new URLSearchParams();
        
        // If a category is selected, fetch brands only for that category
        if (selectedSubCategory) {
          params.append("categoryId", selectedSubCategory);
        } else if (selectedCategory) {
          params.append("categoryId", selectedCategory);
          params.append("includeSubCategories", "true");
        }
        
        const response = await axios.get(`/api/products/brands?${params.toString()}`);
        const brands = response.data.data;
        
        setAvailableBrands(brands);
        
        // Clear selected brands that are no longer available
        if (selectedBrands.length > 0) {
          const validBrands = selectedBrands.filter(brand => brands.includes(brand));
          if (validBrands.length !== selectedBrands.length) {
            setSelectedBrands(validBrands);
          }
        }
      } catch (error) {
        console.error("Error fetching brands:", error);
        setAvailableBrands([]);
      }
    };

    fetchBrands();
  }, [selectedCategory, selectedSubCategory])

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId)
    setSelectedSubCategory(null) // Reset subcategory when main category changes
    setSelectedBrands([]) // Reset brand selection when category changes since brands will be different
    
    // Find subcategories for the selected main category
    if (categoryId) {
      const selectedMainCategory = mainCategories.find(cat => cat.id === categoryId)
      if (selectedMainCategory && selectedMainCategory.subCategories) {
        setFilteredSubCategories(selectedMainCategory.subCategories)
      } else {
        setFilteredSubCategories([])
      }
    } else {
      setFilteredSubCategories([])
    }
  }

  const handleSubCategoryChange = (subCategoryId: string | null) => {
    setSelectedSubCategory(subCategoryId)
    setSelectedBrands([]) // Reset brand selection when subcategory changes
  }

  const handleBrandChange = (brand: string) => {
    setSelectedBrands(prev => {
      if (prev.includes(brand)) {
        return prev.filter(b => b !== brand)
      } else {
        return [...prev, brand]
      }
    })
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value
    setSearchTerm(newSearchTerm)

    const params = new URLSearchParams(window.location.search)
    if (newSearchTerm) {
      params.set("search", newSearchTerm)
    } else {
      params.delete("search")
    }
    window.history.replaceState(null, "", `?${params.toString()}`)
  }

  if (loading) {
    return <FilterPageLoader />
  }

  // Convert the API products to the format ProductCard expects
  const convertedProducts = products.map(product => {
    return {
      ...product,
      variants: product.variants.map(variant => ({
        ...variant,
        // Ensure these properties are always present even if optional in API
        title: variant.title || variant.variantValue,
        description: variant.description || product.description,
        stockQuantity: variant.stockQuantity || 0
      }))
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Sidebar Filter for Desktop */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-700 rounded-lg flex items-center justify-center">
                    <Filter className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="font-semibold text-lg text-slate-800">Filters</h2>
                </div>

                <div className="space-y-8">
                  {/* Price Filter */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-slate-700 flex items-center gap-2">
                      <span className="w-2 h-2 bg-violet-400 rounded-full"></span>
                      Price Range
                    </h3>

                    <div className="px-2">
                      <Slider
                        value={range}
                        onChange={(e) => setRange(e.value as [number, number])}
                        range
                        min={MIN}
                        max={MAX}
                        step={1000}
                        className="mb-4"
                      />

                      <div className="flex justify-between text-sm font-medium text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                        <span>₹{range[0].toLocaleString()}</span>
                        <span>₹{range[1].toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-slate-700 flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                      Categories
                    </h3>

                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          name="category"
                          checked={selectedCategory === null}
                          onChange={() => handleCategoryChange(null)}
                          className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500 focus:ring-2"
                        />
                        <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                          All Categories
                        </span>
                      </label>

                      {mainCategories.map((cat) => (
                        <div key={cat.id} className="space-y-2">
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              name="category"
                              checked={selectedCategory === cat.id}
                              onChange={() => handleCategoryChange(cat.id)}
                              className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500 focus:ring-2"
                            />
                            <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors flex items-center gap-2">
                              {cat.name}
                              {cat.subCategories && cat.subCategories.length > 0 && (
                                <span className="text-xs text-blue-600">
                                  ({cat.subCategories.length})
                                </span>
                              )}
                            </span>
                          </label>
                          
                          {/* Subcategories */}
                          {selectedCategory === cat.id && cat.subCategories && cat.subCategories.length > 0 && (
                            <div className="ml-6 space-y-2 border-l-2 border-slate-200 pl-3">
                              {cat.subCategories.map((subCat) => (
                                <label key={subCat.id} className="flex items-center gap-3 cursor-pointer group">
                                  <input
                                    type="checkbox"
                                    name="subcategory"
                                    checked={selectedSubCategory === subCat.id}
                                    onChange={() => handleSubCategoryChange(subCat.id)}
                                    className="w-3 h-3 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-1"
                                  />
                                  <span className="text-xs text-slate-600 group-hover:text-slate-800 transition-colors">
                                    {subCat.name}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Brand Filter */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-slate-700 flex items-center gap-2">
                      <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                      Brands
                    </h3>

                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                      {availableBrands.map((brand) => (
                        <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={selectedBrands.includes(brand)}
                            onChange={() => handleBrandChange(brand)}
                            className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500 focus:ring-2"
                          />
                          <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                            {brand}
                          </span>
                        </label>
                      ))}
                      {availableBrands.length === 0 && (
                        <p className="text-sm text-slate-500 italic">No brands available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-4">
            {/* Search and Mobile Filter */}
            <div className="mb-8">
              <div className="flex items-center gap-4">
                {/* Mobile Filter Button */}
                <div className="lg:hidden">
                  <Drawer>
                    <DrawerTrigger asChild>
                      <Button variant="outline" size="icon" className="rounded-xl border-slate-200 hover:bg-slate-50">
                        <Filter className="w-4 h-4" />
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent className="p-4 h-screen w-full">
                      <DrawerHeader className="px-0">
                        <DrawerTitle className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-700 rounded-lg flex items-center justify-center">
                            <Filter className="w-4 h-4 text-white" />
                          </div>
                          Filters
                        </DrawerTitle>
                      </DrawerHeader>

                      <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)] pr-2">
                        {/* Price Filter */}
                        <div className="space-y-4">
                          <h3 className="font-medium text-slate-700">Price Range</h3>
                          <Slider
                            value={range}
                            onChange={(e) => setRange(e.value as [number, number])}
                            range
                            min={MIN}
                            max={MAX}
                            step={1000}
                            className="mb-4"
                          />
                          <div className="flex justify-between text-sm font-medium text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                            <span>₹{range[0].toLocaleString()}</span>
                            <span>₹{range[1].toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Categories */}
                        <div className="space-y-4">
                          <h3 className="font-medium text-slate-700">Categories</h3>
                          <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!selectedCategory}
                                onChange={() => handleCategoryChange(null)}
                                className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500"
                              />
                              <span className="text-sm text-slate-700">All Categories</span>
                            </label>
                            {mainCategories.map((cat) => (
                              <div key={cat.id} className="space-y-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedCategory === cat.id}
                                    onChange={() => handleCategoryChange(cat.id === selectedCategory ? null : cat.id)}
                                    className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500"
                                  />
                                  <span className="text-sm text-slate-700 flex items-center gap-2">
                                    {cat.name}
                                    {cat.subCategories && cat.subCategories.length > 0 && (
                                      <span className="text-xs text-blue-600">
                                        ({cat.subCategories.length})
                                      </span>
                                    )}
                                  </span>
                                </label>
                                
                                {/* Subcategories */}
                                {selectedCategory === cat.id && cat.subCategories && cat.subCategories.length > 0 && (
                                  <div className="ml-6 space-y-2 border-l-2 border-slate-200 pl-3">
                                    {cat.subCategories.map((subCat) => (
                                      <label key={subCat.id} className="flex items-center gap-3 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={selectedSubCategory === subCat.id}
                                          onChange={() => handleSubCategoryChange(subCat.id === selectedSubCategory ? null : subCat.id)}
                                          className="w-3 h-3 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-xs text-slate-600">
                                          {subCat.name}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Brands */}
                        <div className="space-y-4">
                          <h3 className="font-medium text-slate-700">Brands</h3>
                          <div className="space-y-3 max-h-48 overflow-y-auto">
                            {availableBrands.map((brand) => (
                              <label key={brand} className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedBrands.includes(brand)}
                                  onChange={() => handleBrandChange(brand)}
                                  className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500"
                                />
                                <span className="text-sm text-slate-700">{brand}</span>
                              </label>
                            ))}
                            {availableBrands.length === 0 && (
                              <p className="text-sm text-slate-500 italic">No brands available</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </DrawerContent>
                  </Drawer>
                </div>

                {/* Search Bar */}
                <div className="flex-1 relative">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-slate-700 placeholder-slate-400"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Initial Loading State */}
            {loadingProducts && products.length === 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                {[...Array(isMobile ? 6 : 8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                    <div className="bg-slate-200 h-48 rounded-xl mb-4"></div>
                    <div className="space-y-3">
                      <div className="bg-slate-200 h-4 rounded w-3/4"></div>
                      <div className="bg-slate-200 h-4 rounded w-1/2"></div>
                      <div className="bg-slate-200 h-6 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Products Grid using ProductCard component */}
            {!loadingProducts || products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2 lg:gap-6">
                  {/* Display actual products */}
                  {convertedProducts.map((product, index) => (
                    <ProductCard 
                      key={product.id}
                      product={product} 
                      index={index}
                      smallCardVariant={isMobile} 
                                      />
                                    ))}
                  
                  {/* Display skeleton loaders inline with products when loading more */}
                  {loadingMore && 
                    [...Array(isMobile ? 6 : 8)].map((_, i) => (
                      <div key={`skeleton-${i}`} className="bg-white rounded-2xl p-6 animate-pulse">
                        <div className="bg-slate-200 h-48 rounded-xl mb-4"></div>
                        <div className="space-y-3">
                          <div className="bg-slate-200 h-4 rounded w-3/4"></div>
                          <div className="bg-slate-200 h-4 rounded w-1/2"></div>
                          <div className="bg-slate-200 h-6 rounded w-1/3"></div>
                              </div>
                            </div>
                    ))
                  }
                              </div>

                {/* Load more trigger element */}
                {pagination.hasMore && !loadingMore && (
                  <div ref={loadMoreRef} className="h-10 mt-4"></div>
                )}
                
                {/* End of results message */}
                {!pagination.hasMore && products.length > 0 && (
                  <div className="mt-8 text-center py-4 text-sm text-slate-500">
                    End of results
                            </div>
                          )}
              </>
            ) : null}

            {/* Empty State */}
            {!loadingProducts && products.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">No products found</h3>
                <p className="text-slate-500">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  )
}

export default ProductList