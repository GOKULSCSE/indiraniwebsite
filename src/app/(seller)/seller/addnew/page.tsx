"use client";
import { useState, ChangeEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Images } from "lucide-react";
import { S3Storage } from "@/lib/s3";
import { FilePond, registerPlugin } from "react-filepond";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond/dist/filepond.min.css";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
import axios from "axios";
import { FilePondFile } from "filepond";

registerPlugin(FilePondPluginImagePreview);

// Define the types for SubCategory and Category
interface SubCategory {
    id: string;
    name: string;
    description: string;
    parentCategoryId: string;
    createdAt: string;
    updatedAt: string;
}

interface Category {
    id: string;
    name: string;
    description: string;
    parentCategoryId: string | null;
    createdAt: string;
    updatedAt: string;
    subCategories: SubCategory[];
    parentCategory: Category | null;
}

type Product = {
    name: string;
    description: string;
    Variants: string;
    quantity: string;
    category: string;
    regularPrice: string;
    salePrice: string;
    discount: string;
    Images: string;
};

interface InputFieldProps {
    label: string;
    name: string;
    placeholder: string;
    type?: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const InputField: React.FC<InputFieldProps> = ({
    label,
    name,
    placeholder,
    type = "text",
    value,
    onChange,
}) => (
    <div className="relative w-full">
        <label className="absolute bg-white px-2 -top-3 left-3 text-gray-600 text-sm">
            {label}
        </label>
        <input
            type={type}
            name={name}
            className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
        />
    </div>
);

const ProductForm: React.FC = () => {
    const [formData, setFormData] = useState({
        sellerId: "0c642688-0196-47fd-95d0-de4886a3eb0f",
        categoryId: "",
        subCategoryId: "",
        name: "",
        description: "",
        Variants: "",
        quantity: "",
        regularPrice: "",
        salePrice: "",
        discount: "",
        Images: "",
    });

    const [file, setFile] = useState<File | null>(null);
    const [base64Image, setBase64Image] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [newProduct, setNewProduct] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [filteredSubCategories, setFilteredSubCategories] = useState<SubCategory[]>([]);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]); // Store uploaded images
    const router = useRouter();
    const s3Storage = new S3Storage();
    const uploadTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get("/api/category");
                console.log("Fetched categories:", response.data);
                setCategories(response.data.data);
            } catch (error) {
                console.error("Error fetching categories:", error);
                setCategories([]);
            }
        };

        fetchCategories();
    }, []);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData((prev) => {
            const newFormData = { ...prev, [e.target.name]: e.target.value };
            console.log("Updated formData:", newFormData); // Debugging
            return newFormData;
        });
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedCategoryId = e.target.value;
        setFormData({
            ...formData,
            categoryId: selectedCategoryId,
            subCategoryId: '',
        });

        const selectedCategory = categories.find(
            (category) => category.id === selectedCategoryId
        );

        if (selectedCategory && selectedCategory.subCategories) {
            setFilteredSubCategories(selectedCategory.subCategories);
        }
    };

    const handleSubCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormData({
            ...formData,
            subCategoryId: e.target.value,
        });
    };

    const handleFileChange = async (files: FilePondFile[] | ChangeEvent<HTMLInputElement>) => {
        if (uploadTimeout.current) {
            clearTimeout(uploadTimeout.current);
        }

        uploadTimeout.current = setTimeout(async () => {
            let selectedFiles: File[] = [];

            if (Array.isArray(files)) {
                selectedFiles = files.map(f => f.file).filter(file => file instanceof File);
            } else if (files.target?.files?.length) {
                selectedFiles = Array.from(files.target.files);
            }

            if (selectedFiles.length === 0) {
                console.warn("No files selected.");
                return;
            }

            try {
                const uploadPromises = selectedFiles.map(async (selectedFile) => {
                    if (!selectedFile || !(selectedFile instanceof File)) return null;

                    const fileBuffer = await selectedFile.arrayBuffer();

                    const imageUrl = await s3Storage.uploadFile({
                        file: Buffer.from(fileBuffer),
                        fileName: selectedFile.name,
                        contentType: selectedFile.type,
                    });

                    return imageUrl;
                });

                const uploadedUrls = (await Promise.all(uploadPromises)).filter(url => url !== null);
                setUploadedImages((prev) => [...prev, ...uploadedUrls]);

                if (selectedFiles.length > 0) {
                    setFile(selectedFiles[0]);

                    const reader = new FileReader();
                    reader.onloadend = () => {
                        if (reader.result) {
                            setPreview(reader.result as string);
                            setBase64Image(reader.result as string);
                        }
                    };
                    reader.readAsDataURL(selectedFiles[0]);
                }
            } catch (error) {
                console.error("Error uploading file:", error);
            }
        }, 300); // Reduced debounce delay
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.categoryId) {
            alert("Please fill all fields.");
            return;
        }

        const discountValue = formData.discount ? parseInt(formData.discount, 10) : 0;
        if (discountValue < 0 || discountValue > 100) {
            alert("Discount must be between 0% and 100%.");
            return;
        }


        const formattedImages = uploadedImages.map((imageUrl, index) => ({
            imageUrl: imageUrl,
            isPrimary: index === 0,
        }));

        const productData = {
            sellerId: "0c642688-0196-47fd-95d0-de4886a3eb0f",
            categoryId: formData.categoryId,
            subCategoryId: formData.subCategoryId,
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.regularPrice) || 0,
            stockQuantity: parseInt(formData.quantity, 10) || 0,
            isApproved: true,
            images: formattedImages, // Use the formatted image structure
            variants: formData.Variants ? [{
                variantType: "Color",
                variantValue: formData.Variants,
                additionalPrice: 0
            }] : [],
            discounts: discountValue > 0 ? [{
                discountType: "percentage",
                discountValue,
                startDate: "2025-04-01T00:00:00Z",
                endDate: "2025-04-10T23:59:59Z"
            }] : []
        };

        console.log("Product data to be sent:", productData);  // Log the product data to ensure it's correct

        try {
            const response = await axios.post("/api/seller/products", productData);
            console.log("Product Created:", response.data);
            router.push("/seller/products");
        } catch (error:any) {
            console.error("Error creating product:", error.response ? error.response.data : error);
            // Show specific error message from the backend if available
            alert("There was an error creating the product. Please check the details.");
        }
    };



    return (
        <>

            <h2 className="text-xl font-semibold my-4 flex items-center">
                <ChevronLeft className="mr-2" />
                Add New Product
            </h2>

            <form onSubmit={handleSubmit}>

                <div className="p-6 border rounded-lg bg-white shadow max-w-3xl mx-auto">
                    <h3 className="text-2xl font-gray-900 font-bold mb-15">Product Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField name="name" label="Enter Product Name" placeholder="Product Name" value={formData.name} onChange={handleChange} />
                        <InputField name="description" label="Product Description" placeholder="Product Description" value={formData.description} onChange={handleChange} />
                    </div>
                    <div className="border-dashed border-2 border-gray-300 p-6 rounded-lg text-center mt-4 flex flex-col items-center justify-center">
                        {/* Hidden Input for Fallback Upload */}
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="hidden"
                            id="fileUpload"
                            accept="image/*"
                        />

                        {/* File Upload UI */}
                        <div className="flex justify-center items-center">
                            <Image
                                src="/assets/images/selleranalysis/dropfiles.png"
                                alt="Overlay Image"
                                width={150}
                                height={150}
                            />
                        </div>

                        {/* FilePond Drag & Drop */}
                        <FilePond
                            files={uploadedImages.map((url) => ({
                                source: url,
                                options: { type: "local" },
                            }))}
                            onupdatefiles={(fileItems) => {
                                const newFileUrls = fileItems
                                    .map((item) => {
                                        if (typeof item.source === "string") {
                                            return item.source; // ✅ Keep existing image URLs
                                        } else if (item.file instanceof File) {
                                            return URL.createObjectURL(item.file); // ✅ Generate preview for new images
                                        }
                                        return undefined; // 🚀 Fix: Prevent "undefined" in the array
                                    })
                                    .filter((url): url is string => typeof url === "string"); // 🚀 Ensure only strings

                                setUploadedImages([...new Set(newFileUrls)]); // ✅ Prevent duplicates
                            }}
                            onremovefile={(error, file) => {
                                if (error) {
                                    console.error("File removal error:", error);
                                    return;
                                }

                                setUploadedImages((prev) => prev.filter((url) => url !== file.source));

                                // Revoke Blob URL to prevent memory leaks
                                if (typeof file.source === "string" && file.source.startsWith("blob:")) {
                                    URL.revokeObjectURL(file.source);
                                }
                            }}
                            allowMultiple={true}
                            maxFiles={5}
                            name="files"
                            labelIdle='Drop files here <br> <span class="text-red-500 font-bold block w-full text-center">click to browse</span>'
                            className="w-80  mt-8 text-red-400"
                            
                        />


                        {/* Image Preview
                        {preview && (
                            <div className="mt-4">
                                <Image
                                    src={preview}
                                    alt="Preview"
                                    width={150}
                                    height={150}
                                    className="rounded-lg"
                                />
                            </div>
                        )} */}

                        {/* Uploaded Images */}
                        <div className="mt-4 w-full max-w-lg grid grid-cols-2 gap-4">
                            {uploadedImages.map((url, index) => (
                                <div key={index} className="relative">
                                    <Image src={url} alt="Uploaded file" width={150} height={150} className="rounded-lg" />

                                </div>
                            ))}
                        </div>

                    </div>
                    <h3 className="text-2xl font-gray-900 font-bold mt-6 mb-15">Properties</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <label className="absolute bg-white px-2 -top-3 left-3 text-gray-600 text-sm">Variants</label>
                        <select name="Variants" className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white" value={formData.Variants} onChange={handleChange}>
                            <option value="" disabled>Select a Variant</option>
                            <option value="electronics">red</option>
                            <option value="fashion">green</option>
                            <option value="home_appliances">blue</option>
                            <option value="sports"></option>

                        </select>
                        <InputField name="quantity" label="Quantity" placeholder="Quantity" value={formData.quantity} onChange={handleChange} />

                        <label className="absolute bg-white px-2 -top-3 left-3 text-gray-600 text-sm">Category</label>
                        <div className="gap-4 ">
                            {/* Parent Category Dropdown */}
                            <select
                                name="categoryId"
                                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                                value={formData.categoryId}
                                onChange={handleCategoryChange}
                            >
                                <option value="" disabled>Select a Category</option>
                                {Array.isArray(categories) && categories.length > 0 ? (
                                    categories.map((category, index) => (
                                        <option key={index} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>Loading...</option>
                                )}
                            </select>


                        </div>
                        <div className="">
                            {/* Sub Category Dropdown */}
                            {formData.categoryId && filteredSubCategories.length > 0 && (
                                <select
                                    name="subCategoryId"
                                    className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white mt-4"
                                    value={formData.subCategoryId}
                                    onChange={handleSubCategoryChange}
                                >
                                    <option value="" disabled>Select a Subcategory</option>
                                    {filteredSubCategories.map((subCategory, index) => (
                                        <option key={index} value={subCategory.id}>
                                            {subCategory.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                    <h3 className="text-2xl font-gray-900 font-bold mt-6 mb-15">Pricing</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <InputField name="regularPrice" label="Regular Price" placeholder="₹ 0.00" value={formData.regularPrice} onChange={handleChange} />
                        <InputField name="salePrice" label="Sale Price" placeholder="₹ 0.00" value={formData.salePrice} onChange={handleChange} />
                        <InputField name="discount" label="Discount(%)" placeholder="%" value={formData.discount} onChange={handleChange} />
                    </div>
                    <div className="flex justify-between items-center mt-6">
                        <label className="inline-flex items-center cursor-pointer">
                            <input type="checkbox" value="" className="sr-only peer" />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600 dark:peer-checked:bg-red-600"></div>
                            <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Publish</span>
                        </label>
                        <button type="submit" className="px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800">Create Product</button>
                    </div>
                </div>

            </form>

        </>
    );
};

export default ProductForm;
