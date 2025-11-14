"use client"
import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bell, Mail, CreditCard, User, MonitorCog, Languages, FileCheck, MoreVertical, ReceiptIndianRupee } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react"
import CustomAlert from "@/components/CustomAlert";
import SellerOrderLoader from "@/components/SellerOrderLoader";
import axios from "axios";


// interface GstInfo {
//     id: string;
//     type: string;
//     percentage: string;
//     sellerProfileId: string;
//     createdAt: string;
//     updatedAt: string;
// }

interface SellerProfile {
    id: string;
    userId: string;
    storeName: string;
    storeDescription: string;
    upiId: string;
    gstNumber: string | null;
    isApproved: boolean;
    createdAt: string;
    updatedAt: string;
    bankAccount: {
        id: string;
        accountHolderName: string;
        accountNumber: string;
        bankName: string;
        ifscCode: string;
        branchName: string;
        accountType: string;
        sellerProfileId: string;
        isVerified: boolean;
        verificationDate: string | null;
        createdAt: string;
        updatedAt: string;
    };
    user: {
        id: string;
        email: string;
        profile: string;
        firstName: string | null;
        lastName: string | null;
        name: string;
        roleId: string;
        isEmailVerified: boolean;
        emailVerifiedAt: string;
        createdAt: string;
        updatedAt: string;
    };

    // gstInfo?: GstInfo;
}

interface ApiResponse {
    version: string;
    validationErrors: any[];
    code: number;
    status: string;
    message: string;
    data: SellerProfile;
}

interface UpdateProfileData {
    storeName?: string;
    storeDescription?: string;
    upiId?: string;
    gstNumber?: string;
    user?: {
        name?: string;
        profile?: string;
    };
}

interface UpdateBankData {
    accountHolderName?: string;
    accountNumber?: string;
    bankName?: string;
    ifscCode?: string;
    branchName?: string;
    accountType?: string;
}

// interface UpdateGstData {
//     type?: string;
//     percentage?: number;

// }

const ProfileSettings = () => {
    const [notifications, setNotifications] = useState({
        orderConfirmation: false,
        emailNotification: false,
        systemNotification: false,
    });

    const [sellerData, setSellerData] = useState<SellerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState({
        profile: false,
        bank: false
    });
    const [profileFormData, setProfileFormData] = useState<UpdateProfileData>({});
    const [bankFormData, setBankFormData] = useState<UpdateBankData>({});
    // const [gstData, setGstData] = useState<GstInfo | null>(null);
    // const [gstFormData, setGstFormData] = useState<UpdateGstData>({
    //     type: '',
    //     percentage: 0,
    // });

    const { data: session } = useSession();
    const imageUrl = sellerData?.user?.profile;

    const toggleNotification = (key: keyof typeof notifications) => {
        setNotifications((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    useEffect(() => {
        const fetchSellerData = async () => {
            try {
                const response = await fetch('/api/seller');
                const data: ApiResponse = await response.json();
                if (data.status === "success") {
                    setSellerData(data.data);
                    // Initialize form data with current values
                    setProfileFormData({
                        storeName: data.data.storeName,
                        storeDescription: data.data.storeDescription,
                        upiId: data.data.upiId,
                        gstNumber: data.data.gstNumber || undefined,
                        user: {
                            name: data.data.user.name,
                            profile: data.data.user.profile
                        }
                    });
                    setBankFormData({
                        accountHolderName: data.data.bankAccount.accountHolderName,
                        accountNumber: data.data.bankAccount.accountNumber,
                        bankName: data.data.bankAccount.bankName,
                        ifscCode: data.data.bankAccount.ifscCode,
                        branchName: data.data.bankAccount.branchName,
                        accountType: data.data.bankAccount.accountType
                    });

                    // const gstResponse = await axios.get('/api/seller/gst');
                    // if (gstResponse.data.status === "success") {
                    //     setGstData(gstResponse.data.data);
                    //     setGstFormData({
                    //         type: gstResponse.data.data.type,
                    //         percentage: parseFloat(gstResponse.data.data.percentage)
                    //     });
                    // }


                }


            } catch (error) {
                console.error("Failed to fetch seller data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSellerData();
    }, []);

    // const handleCreateGst = async () => {
    //     try {
    //         const response = await axios.post('/api/seller/gst', gstFormData);
    //         if (response.data.status === "success") {
    //             setGstData(response.data.data);
    //             setGstFormData({
    //                 type: response.data.data.type,
    //                 percentage: parseFloat(response.data.data.percentage)
    //             });
    //             // Show success message
    //         }
    //     } catch (error) {
    //         console.error("Failed to create GST:", error);
    //         // Show error message
    //     }
    // }


    const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name.startsWith('user.')) {
            const userField = name.split('.')[1];
            setProfileFormData(prev => ({
                ...prev,
                user: {
                    ...prev.user,
                    [userField]: value
                }
            }));
        } else {
            setProfileFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleBankInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setBankFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEdit = (tab: 'profile' | 'bank') => {
        setEditMode(prev => ({
            ...prev,
            [tab]: true
        }));
    };

    const handleCancel = (tab: 'profile' | 'bank') => {
        setEditMode(prev => ({
            ...prev,
            [tab]: false
        }));
        // Reset form data to original values
        if (sellerData) {
            if (tab === 'profile') {
                setProfileFormData({
                    storeName: sellerData.storeName,
                    storeDescription: sellerData.storeDescription,
                    upiId: sellerData.upiId,
                    gstNumber: sellerData.gstNumber || undefined,
                    user: {
                        name: sellerData.user.name,
                        profile: sellerData.user.profile
                    }
                });
            } else {
                setBankFormData({
                    accountHolderName: sellerData.bankAccount.accountHolderName,
                    accountNumber: sellerData.bankAccount.accountNumber,
                    bankName: sellerData.bankAccount.bankName,
                    ifscCode: sellerData.bankAccount.ifscCode,
                    branchName: sellerData.bankAccount.branchName,
                    accountType: sellerData.bankAccount.accountType
                });
            }
        }
    };

    const handleSaveProfile = async () => {
        try {
            const response = await fetch('/api/seller', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profileFormData)
            });

            const data = await response.json();

            if (data.status === "success") {
                setSellerData(data.data);
                setEditMode(prev => ({
                    ...prev,
                    profile: false
                }));
                // Show success message
            } else {
                console.error("Failed to update profile:", data.message);
                // Show error message to user
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            // Show error message to user
        }
    };

    const handleSaveBank = async () => {
        try {
            const response = await fetch('/api/seller/Bankinfo', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bankFormData)
            });

            const data = await response.json();

            if (data.status === "success") {
                // Update the seller data with new bank info
                setSellerData(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        bankAccount: {
                            ...prev.bankAccount,
                            ...bankFormData
                        }
                    };
                });
                setEditMode(prev => ({
                    ...prev,
                    bank: false
                }));
                // Show success message
            } else {
                console.error("Failed to update bank info:", data.message);
                // Show error message to user
            }
        } catch (error) {
            console.error("Error updating bank info:", error);
            // Show error message to user
        }
    };

    // const handleGstInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     const { name, value } = e.target;
    //     setGstFormData(prev => ({
    //         ...prev,
    //         [name]: name === 'percentage' ? parseFloat(value) : value
    //     }));
    // };

    // const handleSaveGst = async () => {
    //     try {
    //         const response = await axios.put('/api/seller/gst', {
    //             type: gstFormData.type,
    //             percentage: gstFormData.percentage
    //         });
            
    //         if (response.data.status === "success") {
    //             setGstData(response.data.data);
    //             setGstFormData({
    //                 type: response.data.data.type,
    //                 percentage: parseFloat(response.data.data.percentage)
    //             });
    //             setEditMode(prev => ({
    //                 ...prev,
    //                 gst: false
    //             }));
    //             // Show success message
    //         } else {
    //             console.error("Failed to update GST:", response.data.message);
    //             // Show error message to user
    //         }
    //     } catch (error) {
    //         console.error("Error updating GST:", error);
    //         // Show error message to user
    //     }
    // };


    if (loading) {
        return <SellerOrderLoader />;
    }


    if (!sellerData) {
        return <div className="p-6">Failed to load seller data</div>;
    }

    return (
        <>
            <nav className="text-sm text-gray-600" aria-label="breadcrumb">
                <ol className="flex space-x-2 mb-4">
                    <li>
                        <Link href="/" className="text-blue-600 hover:underline">
                            Home
                        </Link>
                    </li>
                    <li>/</li>
                    <li className="text-gray-800 font-medium">Settings</li>
                </ol>
            </nav>

            <h2 className="text-xl font-semibold my-4 flex items-center">
                Settings
            </h2>
            <div className="">
                <Tabs defaultValue="profile" className="mt-4">
                    <TabsList className="flex gap-6 border-b pb-2">
                        <TabsTrigger value="profile" className="flex items-center">
                            <User className="w-4 h-4 mr-2" /> Profile
                        </TabsTrigger>
                        <TabsTrigger value="bank" className="flex items-center">
                            <CreditCard className="w-4 h-4 mr-2" />
                            Bank Account / Payout Settings
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="flex items-center">
                            <Bell className="w-4 h-4 mr-2" /> Notification Settings
                        </TabsTrigger>
                        {/* <TabsTrigger value="gst" className="flex items-center">
                            <ReceiptIndianRupee className="w-4 h-4 mr-2" /> GST
                        </TabsTrigger> */}
                    </TabsList>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 ml-20 w-full mt-6">
                        <div className="bg-white p-6 shadow rounded-lg md:col-span-1 h-fit">
                            {/* <MoreVertical /> */}
                            <div className="w-24 h-24 rounded-full mx-auto overflow-hidden bg-gray-200 flex items-center justify-center">
                                {imageUrl ? (
                                    <img
                                        src={imageUrl}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-12 h-12 text-gray-500" />
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-center mt-3">{sellerData.user.name}</h3>
                            <p className="text-gray-500 text-center">{sellerData.storeName}</p>
                            <p className="text-gray-500 text-center">{sellerData.storeDescription}</p>
                            {sellerData.gstNumber && (
                                <p className="text-gray-500 text-center mt-2">GST: {sellerData.gstNumber}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:col-span-3 pr-20 gap-6">
                            <TabsContent value="profile">
                                <form className="space-y-6">
                                    <p className="text-gray-600 font-bold">Personal Information</p>
                                    <hr className="mb-4" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Name</label>
                                            <input
                                                type="text"
                                                name="user.name"
                                                value={profileFormData.user?.name || ''}
                                                onChange={handleProfileInputChange}
                                                className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-red-500"
                                                readOnly={!editMode.profile}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Email Address</label>
                                            <input
                                                type="email"
                                                value={sellerData.user.email}
                                                className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-red-500"
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Store Name</label>
                                            <input
                                                type="text"
                                                name="storeName"
                                                value={profileFormData.storeName || ''}
                                                onChange={handleProfileInputChange}
                                                className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-red-500"
                                                readOnly={!editMode.profile}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Store Description</label>
                                            <input
                                                type="text"
                                                name="storeDescription"
                                                value={profileFormData.storeDescription || ''}
                                                onChange={handleProfileInputChange}
                                                className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-red-500"
                                                readOnly={!editMode.profile}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">GST Number</label>
                                            <input
                                                type="text"
                                                name="gstNumber"
                                                value={profileFormData.gstNumber || ''}
                                                onChange={handleProfileInputChange}
                                                className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-red-500"
                                                readOnly={!editMode.profile}
                                                placeholder="Enter GST number"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-4 mt-4">
                                        {editMode.profile ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCancel('profile')}
                                                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleSaveProfile}
                                                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
                                                >
                                                    Save
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleEdit('profile')}
                                                className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition"
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </TabsContent>

                            <TabsContent value="bank">
                                <h3 className="text-lg font-bold mb-4">Bank Account Details</h3>
                                <hr className="mb-4" />
                                <form className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Account Holder Name</label>
                                            <input
                                                type="text"
                                                name="accountHolderName"
                                                value={bankFormData.accountHolderName || ''}
                                                onChange={handleBankInputChange}
                                                className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-red-500"
                                                readOnly={!editMode.bank}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Account Number</label>
                                            <input
                                                type="text"
                                                name="accountNumber"
                                                value={bankFormData.accountNumber || ''}
                                                onChange={handleBankInputChange}
                                                className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-red-500"
                                                readOnly={!editMode.bank}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                                            <input
                                                type="text"
                                                name="bankName"
                                                value={bankFormData.bankName || ''}
                                                onChange={handleBankInputChange}
                                                className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-red-500"
                                                readOnly={!editMode.bank}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">IFSC Code</label>
                                            <input
                                                type="text"
                                                name="ifscCode"
                                                value={bankFormData.ifscCode || ''}
                                                onChange={handleBankInputChange}
                                                className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-red-500"
                                                readOnly={!editMode.bank}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Branch Name</label>
                                            <input
                                                type="text"
                                                name="branchName"
                                                value={bankFormData.branchName || ''}
                                                onChange={handleBankInputChange}
                                                className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-red-500"
                                                readOnly={!editMode.bank}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Account Type</label>
                                            <input
                                                type="text"
                                                name="accountType"
                                                value={bankFormData.accountType || ''}
                                                onChange={handleBankInputChange}
                                                className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-red-500"
                                                readOnly={!editMode.bank}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-4 mt-4">
                                        {editMode.bank ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCancel('bank')}
                                                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleSaveBank}
                                                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
                                                >
                                                    Save
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleEdit('bank')}
                                                className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition"
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </TabsContent>

                            <TabsContent value="notifications">
                                <h3 className="text-lg font-bold mb-4">Notification Settings</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <FileCheck className="text-red-500 w-5 h-5" />
                                            <div>
                                                <p className="font-medium">Order Confirmation</p>
                                                <p className="text-gray-500 text-sm">You will be notified when a customer places an order.</p>
                                            </div>
                                        </div>
                                        <label className="inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={notifications.orderConfirmation}
                                                onChange={() => toggleNotification("orderConfirmation")}
                                            />
                                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                    <br />
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <Mail className="text-red-500 w-5 h-5" />
                                            <div>
                                                <p className="font-medium">Setup Email Notification</p>
                                                <p className="text-gray-500 text-sm">Turn on email notifications for updates.</p>
                                            </div>
                                        </div>
                                        <label className="inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={notifications.emailNotification}
                                                onChange={() => toggleNotification("emailNotification")}
                                            />
                                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                    <br />
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <MonitorCog className="text-red-500 w-5 h-5" />
                                            <div>
                                                <p className="font-medium">Update System Notification</p>
                                                <p className="text-gray-500 text-sm">Receive notifications for system updates.</p>
                                            </div>
                                        </div>
                                        <label className="inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={notifications.systemNotification}
                                                onChange={() => toggleNotification("systemNotification")}
                                            />
                                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                    <br />
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <Languages className="text-red-500 w-5 h-5" />
                                            <div>
                                                <p className="font-medium">Language check</p>
                                                <p className="text-gray-500 text-sm">Receive notifications for system updates.</p>
                                            </div>
                                        </div>
                                        <label className="inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={notifications.systemNotification}
                                                onChange={() => toggleNotification("systemNotification")}
                                            />
                                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* <TabsContent value="gst">
                                <form className="space-y-6">
                                    <p className="text-gray-600 font-bold">Product GST</p>
                                    <hr className="mb-4" />

                                    {gstData ? (
                                        // Show existing GST info with edit option
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Type</label>
                                                    <input
                                                        type="text"
                                                        name="type"
                                                        value={gstFormData.type || ''}
                                                        onChange={handleGstInputChange}
                                                        className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-red-500"
                                                        readOnly={!editMode.gst}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Percentage</label>
                                                    <input
                                                        type="number"
                                                        name="percentage"
                                                        value={gstFormData.percentage || ''}
                                                        onChange={handleGstInputChange}
                                                        className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-red-500"
                                                        readOnly={!editMode.gst}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-4 mt-4">
                                                {editMode.gst ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditMode({ ...editMode, gst: false })}
                                                            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={handleSaveGst}
                                                            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
                                                        >
                                                            Save Changes
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditMode({ ...editMode, gst: true })}
                                                        className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition"
                                                    >
                                                        Edit GST
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        // Show create GST form
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Type</label>
                                                    <input
                                                        type="text"
                                                        name="type"
                                                        value={gstFormData.type || ''}
                                                        onChange={handleGstInputChange}
                                                        className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-red-500"
                                                        placeholder="e.g. Goods GST"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Percentage</label>
                                                    <input
                                                        type="number"
                                                        name="percentage"
                                                        value={gstFormData.percentage || ''}
                                                        onChange={handleGstInputChange}
                                                        className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-red-500"
                                                        placeholder="e.g. 18.5"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-4 mt-4">
                                                <button
                                                    type="button"
                                                    onClick={handleCreateGst}
                                                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
                                                >
                                                    Create GST
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </form>
                            </TabsContent> */}

                        </div>
                    </div>
                </Tabs>
            </div>
        </>
    );
}

export default ProfileSettings;