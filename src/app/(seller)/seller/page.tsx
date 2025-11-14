"use client"
import { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowUpRight, ArrowDownLeft, Minus, MoreHorizontal, ChevronLeft, ChevronRight, ChevronsUpDown, ChevronDown, X, Clock, Check } from "lucide-react";
import { ChartLine } from 'lucide-react';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import { LineChart, Line } from "recharts";
import { BarChart, Bar, Cell, Legend, CartesianGrid, Rectangle } from "recharts";
import { useSession } from "next-auth/react"
import CustomAlert from "@/components/CustomAlert";
import DashboardLoader from "@/components/DashboardLoader";

interface OrderItem {
    id: string;
    orderId: string;
    formattedOrderId: string;
    quantity: number;
    priceAtPurchase: string;
    status: string;
    createdAt: string;
    order: {
      id: string;
      totalAmount: string;
      user: {
        name: string;
        email: string;
      };
      shippingAddress: {
        city: string;
        state: string;
        country: string;
      };
    };
    productVariant: {
      title: string;
      product: {
        name: string;
        images: {
          imageUrl: string;
          isPrimary: boolean;
        }[];
      };
    };
    trackings: {
      status: string;
    }[];
  }
  
  interface ApiResponse {
    data: {
      orderItems: OrderItem[];
    };
  }

type IncomeDataPoint = {
    date: string;
    value: number;
};

type MonthlyReportDay = {
    day: string;
    value: number;
};

type DashboardData = {
    totalUsers: number;
    totalOrders: number;
    totalSales: number;
    totalRefund: number;
    totalShippingCharge: number;
    totalGST: number;
    incomeOverview: {
        weekly: IncomeDataPoint[];
        monthly: IncomeDataPoint[];
    };
    monthlyReport: {
        week: MonthlyReportDay[];
    };
    analyticsReport: {
        companyFinanceGrowth: number;
        companyExpensesRatio: number;
        businessRiskCases: string;
    };
    salesReport: {
        thisYear: number;
        lastYear: number;
        thisMonth: number;
        lastMonth: number;
    };
};

const AnalysisPage = () => {
    const { data: session } = useSession();
    const username = session?.user?.name;
    
    // State for dashboard data
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: string; ascending: boolean } | null>(null);
    
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                // Add seller ID to request headers
                const response = await fetch('/api/seller/dashboard', {
                    headers: {
                        'x-user': JSON.stringify({
                            id: session?.user?.id,
                            sellerId: session?.user?.sellerId
                        })
                    }
                });
                const result = await response.json();
                
                if (result.status === "success") {
                    setDashboardData(result.data);
                } else {
                    setError(result.message || "Failed to fetch dashboard data");
                }
            } catch (err) {
                setError("An error occurred while fetching data");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        
        fetchDashboardData();
    }, []);

    // Stats cards data using API data
    const createStatCards = () => {
        if (!dashboardData) return [];
        
        return [
            {
                title: "Total Users",
                value: `${dashboardData.totalUsers}`,
                percentage: "70.5%",
                color: "text-green-500 bg-green-100",
                icon: <ArrowUpRight size={16} className="text-green-500" />,
                extra: "$1,10,890",
                extraColor: "text-green-500",
            },
            {
                title: "Total Orders",
                value: `${dashboardData.totalOrders}`,
                percentage: "70.5%",
                color: "text-red-500 bg-red-100",
                icon: <ChartLine size={16} className="text-red-500" />,
                extra: "$1,10,890",
                extraColor: "text-red-500",
            },
            {
                title: "Total Sales",
                value: `₹${dashboardData.totalSales.toLocaleString('en-IN')}`,
                percentage: `${dashboardData.analyticsReport?.companyFinanceGrowth || 0}%`,
                color: "text-yellow-500 bg-yellow-100",
                icon: <ArrowUpRight size={16} className="text-yellow-500" />,
                extra: dashboardData.salesReport ? `₹${dashboardData.salesReport.thisYear.toLocaleString('en-IN')}` : "₹0",
                extraColor: "text-yellow-500",
            },
            {
                title: "Total Refunds",
                value: `₹${dashboardData.totalRefund.toLocaleString('en-IN')}`,
                percentage: "0%",
                color: "text-red-500 bg-red-100",
                icon: <ArrowDownLeft size={16} className="text-red-500" />,
                extra: "This year",
                extraColor: "text-red-500",
            },
            {
                title: "Shipping Charges",
                value: `₹${dashboardData.totalShippingCharge.toLocaleString('en-IN')}`,
                percentage: "0%",
                color: "text-blue-500 bg-blue-100",
                icon: <Minus size={16} className="text-blue-500" />,
                extra: "All time",
                extraColor: "text-blue-500",
            },
            {
                title: "Total GST",
                value: `₹${dashboardData.totalGST.toLocaleString('en-IN')}`,
                percentage: "0%",
                color: "text-purple-500 bg-purple-100",
                icon: <Minus size={16} className="text-purple-500" />,
                extra: "All time",
                extraColor: "text-purple-500",
            }
        ];
    };

    const stats = createStatCards();

    const [selectedTab, setSelectedTab] = useState("week");
    
    // Use API data for charts or fallback to defaults
    const weekData = dashboardData?.incomeOverview?.weekly || [
        { date: "06.06", value: 0 },
        { date: "07.06", value: 10 },
        { date: "08.06", value: 75 },
        { date: "09.06", value: 30 },
        { date: "10.06", value: 100 },
        { date: "11.06", value: 50 },
        { date: "12.06", value: 200 },
    ];

    const monthData = dashboardData?.incomeOverview?.monthly || [
        { date: "01.06", value: 20 },
        { date: "05.06", value: 50 },
        { date: "10.06", value: 150 },
        { date: "15.06", value: 90 },
        { date: "20.06", value: 180 },
        { date: "25.06", value: 70 },
        { date: "30.06", value: 120 },
    ];

    const monthbardata = dashboardData?.monthlyReport?.week || [
        { day: "M", value: 50 },
        { day: "T", value: 90 },
        { day: "W", value: 70 },
        { day: "T", value: 80 },
        { day: "F", value: 60 },
        { day: "S", value: 60 },
        { day: "S", value: 60 },
    ];

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white shadow-md px-3 py-1 rounded-full border border-gray-200 text-blue-500 font-semibold text-sm">
                    ${payload[0].value}
                </div>
            );
        }
        return null;
    };

    const [hoverIndex, setHoverIndex] = useState<number | null>(null);



    useEffect(() => {
        const fetchOrders = async () => {
          try {
            const response = await fetch('api/seller/orders');
            const data: ApiResponse = await response.json();
            // Sort by createdAt date (newest first) and take first 5
            const recentOrders = data.data.orderItems
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5);
            setOrders(recentOrders);
            setLoading(false);
          } catch (error) {
            console.error('Error fetching orders:', error);
            setLoading(false);
          }
        };
    
        fetchOrders();
      }, []);
    
      const allSelected = selectedOrders.length === orders.length && orders.length > 0;
    
      const handleSelectAll = () => {
        if (allSelected) {
          setSelectedOrders([]);
        } else {
          setSelectedOrders(orders.map(order => order.id));
        }
      };
    
      const handleCheckboxChange = (id: string) => {
        setSelectedOrders(prevSelected =>
          prevSelected.includes(id)
            ? prevSelected.filter(orderId => orderId !== id)
            : [...prevSelected, id]
        );
      };
    
      const sortTable = (key: string) => {
        let ascending = true;
        if (sortConfig && sortConfig.key === key) {
          ascending = !sortConfig.ascending;
        }
    
        const sortedOrders = [...orders].sort((a, b) => {
          let valA: any, valB: any;
    
          switch (key) {
            case 'id':
              valA = a.orderId;
              valB = b.orderId;
              break;
            case 'productname':
              valA = a.productVariant.title;
              valB = b.productVariant.title;
              break;
            case 'productorder':
              valA = a.quantity;
              valB = b.quantity;
              break;
            case 'price':
              valA = parseFloat(a.priceAtPurchase);
              valB = parseFloat(b.priceAtPurchase);
              break;
            case 'status':
              valA = a.status;
              valB = b.status;
              break;
            default:
              valA = a[key as keyof OrderItem];
              valB = b[key as keyof OrderItem];
          }
    
          if (typeof valA === 'number' && typeof valB === 'number') {
            return ascending ? valA - valB : valB - valA;
          } else {
            return ascending 
              ? String(valA).localeCompare(String(valB)) 
              : String(valB).localeCompare(String(valA));
          }
        });
    
        setOrders(sortedOrders);
        setSortConfig({ key, ascending });
      };
    
      // Status badge styles
      const badgeStyles: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800',
        shipped: 'bg-blue-100 text-blue-800',
        delivered: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800',
      };
    if (loading) {
        return <DashboardLoader/>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-96 text-red-500">{error}</div>;
    }

    return (
        <>
            <div className="relative">
               {/* <CustomAlert />  */}
                <div className="relative flex items-center justify-between w-full h-[300px] bg-gray-100 rounded-lg shadow-lg mx-auto px-10">
                    {/* Background Image */}
                    <Image
                        src="/assets/images/selleranalysis/Banneranalysis.png"
                        alt="Main Background"
                        layout="fill"
                        objectFit="cover"
                        className="absolute inset-0 rounded-lg opacity-80"
                    />

                    {/* Text Content (Left Side) */}
                    <div className="relative z-10 text-black max-w-md ml-15">
                        <h2 className="text-4xl font-semibold">Welcome <span className="font-black">{username}</span></h2>
                        <p className="mt-4 text-lg">Here's Your Current Sales Overview</p>
                        {/* <button className="mt-6 bg-red-500 text-white h-15 w-35 rounded-lg shadow-md hover:bg-red-600 transition">
                            Explore
                        </button> */}
                    </div>

                    {/* Overlay Image (Right Side) */}
                    <div className="relative z-10 flex justify-end items-center">
                        <Image
                            src="/assets/images/selleranalysis/Frameanalysis.png"
                            alt="Overlay Image"
                            width={500}
                            height={500}
                            className=""
                        />
                    </div>
                </div>

                <h1 className="font-medium text-xl text-gray-800 pt-10">Analytic Overview</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white shadow-lg rounded-lg p-6">
                            {/* Title & Value on the left, Percentage on the right */}
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-gray-500 text-lg">{stat.title}</h3>
                                    <div className="flex items-center mt-1">
                                        <p className="text-2xl font-semibold text-black">{stat.value}</p>
                                        <div className={`ml-2 flex items-center px-2 py-1 rounded-md text-sm font-medium ${stat.color}`}>
                                            {stat.icon}
                                            <span className="ml-1">{stat.percentage}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <br />

                            {/* Extra Information Below */}
                            {/* <p className="text-gray-500 mt-2">
                                {index < 3 ? 'You made an extra ' : ''}<span className={`font-semibold ${stat.extraColor}`}>{stat.extra}</span>{index < 3 ? ' this year' : ''}
                            </p> */}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 space-y-4">
                    {/* left section */}
                    <div className="col-span-8 flex flex-col p-4">
                        <div className="flex flex-row items-center justify-between">
                            <p className="font-medium text-xl text-gray-800">Income Overview</p>

                            <div className="flex space-x-3 text-gray-400 font-medium text-sm">
                                <span
                                    className={`cursor-pointer ${selectedTab === "week" ? "text-red-500 font-semibold" : ""}`}
                                    onClick={() => setSelectedTab("week")}
                                >
                                    Week
                                </span>
                                <span
                                    className={`cursor-pointer ${selectedTab === "month" ? "text-black font-semibold" : ""}`}
                                    onClick={() => setSelectedTab("month")}
                                >
                                    Month
                                </span>
                            </div>
                        </div>

                        <div className="w-full h-full mt-20">
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={selectedTab === "week" ? weekData : monthData}>
                                    <defs>
                                        <linearGradient id="redFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="red" stopOpacity={0.6} />
                                            <stop offset="100%" stopColor="red" stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>

                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: "gray" }}
                                        domain={["dataMin", "dataMax"]}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: "gray" }}
                                        domain={[0, "auto"]}
                                        tickCount={5}
                                    />

                                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: "red", strokeWidth: 1 }} />

                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        fill="url(#redFill)"
                                        stroke="red"
                                        strokeWidth={2}
                                        dot={{ r: 6 }}
                                        activeDot={{ r: 8, fill: "red", stroke: "red", strokeWidth: 2 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    {/* left section */}

                    {/* right section */}
                    <div className="col-span-4 px-7 p-4">
                        <div className="flex flex-row items-center justify-between">
                            <p className="font-medium text-xl text-gray-800 pl-20">Monthly Report</p>

                            <div className="flex space-x-3 text-gray-400 font-medium text-sm">
                                <span><MoreHorizontal /></span>
                            </div>
                        </div>

                        <div className="p-4 bg-white rounded-lg shadow w-full h-[90%] mt-2">
                            {/* Date and Amount */}
                            {/* <div className="mb-2">
                                <p className="text-gray-500 text-sm">12-19 Sept</p>
                                <h2 className="text-2xl font-bold">$1560</h2>
                            </div> */}

                            {/* Chart */}
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={monthbardata}>
                                    <XAxis
                                        dataKey="day"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: "gray" }}
                                    />
                                    <Tooltip cursor={{ fill: "transparent" }} />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {monthbardata.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={index === hoverIndex ? "#52C41A" : "#E5E7EB"} // Only hover effect
                                                onMouseEnter={() => setHoverIndex(index)}
                                                onMouseLeave={() => setHoverIndex(null)}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    {/* right section */}
                </div>

                <div className="space-y-4">
      <div className="p-4">
        <div className="flex flex-row items-center justify-between">
          <p className="font-medium text-xl text-gray-800">Recent Orders</p>
          <div className="flex space-x-3 text-gray-400 font-medium text-sm">
            <span><MoreHorizontal /></span>
          </div>
        </div>

        <div className="w-full h-full mt-6">
          <div className="bg-white p-6 rounded-lg shadow-sm overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="py-4 px-4 text-left w-[50px]">
                    <input
                      type="checkbox"
                      className="form-checkbox h-6 w-6 text-blue-600 border-2 border-gray-600 rounded-md"
                      checked={allSelected}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="py-4 px-4 text-left w-[100px] text-base cursor-pointer" onClick={() => sortTable('id')}>
                    <div className="flex items-center gap-1">
                      Order ID
                      <ChevronsUpDown className="w-4 h-4 text-gray-400 cursor-pointer" />
                    </div>
                  </th>
                  <th className="py-4 px-4 text-left w-[200px] text-base cursor-pointer" onClick={() => sortTable('productname')}>
                    <div className="flex items-center gap-1">
                      Product Name
                      <ChevronsUpDown className="w-4 h-4 text-gray-400 cursor-pointer" />
                    </div>
                  </th>
                  <th className="py-4 px-4 text-left w-[120px] text-base cursor-pointer" onClick={() => sortTable('productorder')}>
                    <div className="flex items-center gap-1">
                      Quantity
                      <ChevronsUpDown className="w-4 h-4 text-gray-400 cursor-pointer" />
                    </div>
                  </th>
                  <th className="py-4 px-4 text-left w-[120px] text-base cursor-pointer" onClick={() => sortTable('status')}>
                    <div className="flex items-center gap-1">
                      Status
                      <ChevronsUpDown className="w-4 h-4 text-gray-400 cursor-pointer" />
                    </div>
                  </th>
                  <th className="py-4 px-4 text-left w-[120px] text-base cursor-pointer" onClick={() => sortTable('price')}>
                    <div className="flex items-center gap-1">
                      Amount
                      <ChevronsUpDown className="w-4 h-4 text-gray-400 cursor-pointer" />
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody className="text-gray-700">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const primaryImage = order.productVariant.product.images.find(img => img.isPrimary)?.imageUrl || 
                                     order.productVariant.product.images[0]?.imageUrl;

                    return (
                      <tr key={order.id} className="border-b">
                        <td className="py-4 px-4">
                          <input
                            type="checkbox"
                            className="form-checkbox h-6 w-6 text-blue-600 border-2 border-gray-600 rounded-md"
                            checked={selectedOrders.includes(order.id)}
                            onChange={() => handleCheckboxChange(order.id)}
                          />
                        </td>
                        <td className="py-4 px-4 font-bold">
                          <span className="bg-gray-100 rounded-md px-2 py-1 text-sm">
                            {order.formattedOrderId || "100-1"}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            {primaryImage && (
                              <img 
                                src={primaryImage} 
                                alt={order.productVariant.title}
                                className="w-10 h-10 object-cover rounded mr-3"
                              />
                            )}
                            {order.productVariant.title}
                          </div>
                        </td>
                        <td className="py-4 px-4">{order.quantity}</td>
                        <td className="py-4 px-4">
                          <span className={`px-4 py-2 text-lg font-bold rounded ${badgeStyles[order.status]}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4">₹{(parseFloat(order.priceAtPurchase) * order.quantity).toLocaleString()}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
            </div>
        </>
    );
};

export default AnalysisPage;