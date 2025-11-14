"use client"
import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight, ArrowDownLeft, Minus, MoreHorizontal, ChevronLeft, ChevronRight, ChevronsUpDown, ChevronDown, X, Clock, Check } from "lucide-react";
import { Description } from "@radix-ui/react-dialog";
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

type Order = {
    id: string;
    productname: string;
    productorder: string;
    price: string;
    status: string;
};



const AnalysisPage = () => {



    const username = "Rohith";

    const Totalusers = [
        {
            title: "Total Users",
            value: "₹1,12,93",
            percentage: "70.5%",
            color: "text-green-500 bg-green-100",
            icon: <ArrowUpRight size={16} className="text-green-500" />,
            extra: "$1,10,890",
            extraColor: "text-green-500",
        },


    ];
    const Totalorder = [
        {
            title: "Total Order",
            value: "₹1,12,93",
            percentage: "70.5%",
            color: "text-red-500 bg-red-100",
            icon: <ChartLine size={16} className="text-red-500" />,
            extra: "$1,10,890",
            extraColor: "text-red-500",
        },


    ];
    const Totalsales = [
        {
            title: "Total Sales",
            value: "₹1,12,93",
            percentage: "70.5%",
            color: "text-yellow-500 bg-yellow-100",
            icon: <ArrowUpRight size={16} className="text-yellow-500" />,
            extra: "$1,10,890",
            extraColor: "text-yellow-500",
        },


    ];
    const Totalmarketing = [
        {
            title: "Total Marketing",
            value: "₹1,12,93",
            percentage: "70.5%",
            color: "text-red-500 bg-red-100",
            icon: <ChartLine size={16} className="text-red-500" />,
            extra: "$1,10,890",
            extraColor: "text-red-500",

        },


    ];

    const stats = [...Totalusers, ...Totalorder, ...Totalsales, ...Totalmarketing];



    const weekData = [
        { date: "06.06", value: 0, income: 100, costOfSales: 90 },
        { date: "07.06", value: 10, income: 100, costOfSales: 90 },
        { date: "08.06", value: 75, income: 100, costOfSales: 90 },
        { date: "09.06", value: 30, income: 100, costOfSales: 90 },
        { date: "10.06", value: 100, income: 100, costOfSales: 90 },
        { date: "11.06", value: 50, income: 100, costOfSales: 90 },
        { date: "12.06", value: 200, income: 100, costOfSales: 90 },
    ];

    const monthData = [
        { date: "", value: 0 },
        { date: "01.06", value: 20 },
        { date: "05.06", value: 50 },
        { date: "10.06", value: 150 },
        { date: "15.06", value: 90 },
        { date: "20.06", value: 180 },
        { date: "25.06", value: 70 },
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


    const [selectedTab, setSelectedTab] = useState("week");

    const monthbardata = [
        { day: "M", value: 50 },
        { day: "T", value: 90 },
        { day: "W", value: 70 },
        { day: "T", value: 80, },
        { day: "F", value: 60 },
        { day: "S", value: 60 },
        { day: "S", value: 60 },

    ];
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);

    const badgeStyles: Record<string, string> = {

        Pending: "bg-blue-100 text-red-500",
        Approved: "bg-green-100 text-green-500",
        Rejected: "bg-red-100 text-red-500",

    };

    const [activeTab, setActiveTab] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const [orders, setOrders] = useState<Order[]>([
        { id: "#6019", productname: "camara camara camara", productorder: "25", price: "₹2,000", status: "Pending" },
        { id: "#6011", productname: "pen camara camara", productorder: "20", price: "₹3,500", status: "Approved" },
        { id: "#6017", productname: "pencil camara camara", productorder: "10", price: "₹1,800", status: "Rejected" },
        { id: "#6013", productname: "note camara camara", productorder: "5", price: "₹5,000", status: "Rejected" },
        { id: "#6014", productname: "ganesh camara camara", productorder: "11", price: "₹2,200", status: "Pending" },
        { id: "#6010", productname: "apple camara camara", productorder: "9", price: "₹3,000", status: "Approved" },
    ]);

    const filterOrders = (status: string) => {
        return status === "All" ? orders : orders.filter(order => order.status === status);
    };



    // Filter orders based on active tab
    const filteredOrders = filterOrders(activeTab);

    // Pagination Logic
    const totalPages = Math.max(1, Math.ceil(filteredOrders.length / rowsPerPage));
    const startIndex = (currentPage - 1) * rowsPerPage;
    

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const allSelected = selectedOrders.length === orders.length && orders.length > 0;

    const handleSelectAll = () => {
        if (allSelected) {
            setSelectedOrders([]); // Deselect all
        } else {
            setSelectedOrders(orders.map(order => order.id)); // Select all
        }
    };

    const handleCheckboxChange = (id: string) => {
        setSelectedOrders(prevSelected =>
            prevSelected.includes(id)
                ? prevSelected.filter(orderId => orderId !== id) // Deselect
                : [...prevSelected, id] // Select
        );
    };


    const data = [
        { month: 'Jun', value: 100 },
        { month: 'Jul', value: 140 },
        { month: 'Aug', value: 90 },
        { month: 'Sep', value: 130 },
        { month: 'Oct', value: 115 },
        { month: 'Nov', value: 95 },
    ];

    const [sortConfig, setSortConfig] = useState<{ key: keyof Order; ascending: boolean } | null>(null);

    // Function to extract numeric values from price (₹3,000 → 3000)
    const extractPriceNumber = (price: string) => parseInt(price.replace(/₹|,/g, ""), 10);

    // Sorting function
    const sortTable = (key: keyof Order) => {
        let ascending = true;
        if (sortConfig && sortConfig.key === key) {
            ascending = !sortConfig.ascending;
        }

        const sortedOrders = [...orders].sort((a, b) => {
            let valA: string | number = a[key];
            let valB: string | number = b[key];

            if (key === "price") {
                valA = extractPriceNumber(a.price);
                valB = extractPriceNumber(b.price);
            }

            if (typeof valA === "number" && typeof valB === "number") {
                return ascending ? valA - valB : valB - valA;
            } else {
                return ascending ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));

            }
        });

        setOrders(sortedOrders);
        setSortConfig({ key, ascending });
    };

    const [selectedOption, setSelectedOption] = useState("This year");
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const options = ["This year", "Last year", "Last 6 months", "Last month"];




    return (
        <>
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
                    <h2 className="text-4xl font-semibold">Welcome To <span className="font-black">{username}</span></h2>
                    <p className="mt-4 text-lg">Here's Your Current Sales Overview</p>
                    <button className="mt-6 bg-red-500 text-white h-15 w-35 rounded-lg shadow-md hover:bg-red-600 transition">
                        Explore
                    </button>
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


            <h1 className="font-medium text-xl text-gray-800 pt-10 ">Analytic Overview</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
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
                        <p className="text-gray-500 mt-2">
                            You made an extra <span className={`font-semibold ${stat.extraColor}`}>{stat.extra}</span> this year
                        </p>
                    </div>
                ))}
            </div>





            <div className=" grid grid-cols-1 md:grid-cols-12 space-y-4">

                {/* left section */}
                <div className=" col-span-8 flex flex-col  p-4">

                    <div className=" flex flex-row items-center justify-between">

                        <p className="font-medium text-xl text-gray-800 ">Income Overview</p>

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

                    <div className=" w-full h-full mt-20">
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
                <div className=" col-span-4 px-7 p-4">

                    <div className=" flex flex-row items-center justify-between">

                        <p className="font-medium text-xl text-gray-800 pl-20">Monthly Report</p>

                        <div className="flex space-x-3 text-gray-400 font-medium text-sm">
                            <span><MoreHorizontal />

                            </span>
                        </div>

                    </div>

                    <div className="p-4 bg-white rounded-lg shadow w-full h-[90%] mt-2">

                        {/* Date and Amount */}
                        <div className="mb-2">
                            <p className="text-gray-500 text-sm">12-19 Sept</p>
                            <h2 className="text-2xl font-bold">$1560</h2>
                        </div>
                        
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





            <div className=" grid grid-cols-1 md:grid-cols-12 space-y-4">

                {/* left section */}
                <div className=" col-span-8 flex flex-col  p-4">

                    <div className=" flex flex-row items-center justify-between">

                        <p className="font-medium text-xl text-gray-800 ">Recent Orders</p>

                        <div className="flex space-x-3 text-gray-400 font-medium text-sm">
                            <span><MoreHorizontal />

                            </span>
                        </div>

                    </div>

                    <div className=" w-full h-full mt-20">
                        {/* Orders Table */}
                        <div className="bg-white p-6 rounded-lg shadow-sm overflow-x-auto">
                            <table className="w-full  border-collapse ">
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

                                        {/* Column headers with sorting */}
                                        <th className="py-4 px-4 text-left w-[100px] text-base cursor-pointer" onClick={() => sortTable("id")}>
                                            <div className="flex items-center gap-1">
                                                Tracking No
                                                <ChevronsUpDown className="w-4 h-4 text-gray-400 cursor-pointer" />
                                            </div>
                                        </th>
                                        <th className="py-4 px-4 text-left w-[200px] text-base cursor-pointer" onClick={() => sortTable("productname")}>
                                            <div className="flex items-center gap-1">
                                                Product Name
                                                <ChevronsUpDown className="w-4 h-4 text-gray-400 cursor-pointer" />
                                            </div>
                                        </th>
                                        <th className="py-4 px-4 text-left w-[120px] text-base cursor-pointer" onClick={() => sortTable("productorder")}>
                                            <div className="flex items-center gap-1">
                                                Total Order
                                                <ChevronsUpDown className="w-4 h-4 text-gray-400 cursor-pointer" />
                                            </div>
                                        </th>
                                        <th className="py-4 px-4 text-left w-[120px] text-base cursor-pointer" onClick={() => sortTable("status")}>
                                            <div className="flex items-center gap-1">
                                                Status
                                                <ChevronsUpDown className="w-4 h-4 text-gray-400 cursor-pointer" />
                                            </div>
                                        </th>
                                        <th className="py-4 px-4 text-left w-[120px] text-base cursor-pointer" onClick={() => sortTable("price")}>
                                            <div className="flex items-center gap-1">
                                                Amount
                                                <ChevronsUpDown className="w-4 h-4 text-gray-400 cursor-pointer" />
                                            </div>
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="text-gray-700">
                                    {orders.map((order) => (
                                        <tr key={order.id} className="border-b">
                                            <td className="py-4 px-4">
                                                <input
                                                    type="checkbox"
                                                    className="form-checkbox h-6 w-6 text-blue-600 border-2 border-gray-600 rounded-md"
                                                    checked={selectedOrders.includes(order.id)}
                                                    onChange={() => handleCheckboxChange(order.id)}
                                                />
                                            </td>
                                            <td className="py-4 px-4 font-bold">{order.id}</td>
                                            <td className="py-4 px-4">{order.productname}</td>
                                            <td className="py-4 px-4">{order.productorder}</td>
                                            <td className="py-4 px-4">
                                                <span className={`px-4 py-2 text-lg font-bold rounded ${badgeStyles[order.status]}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">{order.price}</td>
                                        </tr>
                                    ))}
                                </tbody>

                            </table>

                            {/* Pagination Controls */}
                            <div className="flex items-center justify-end space-x-6 mt-4 p-4 rounded-lg">
                                {/* Rows Per Page Dropdown */}
                                <div className="flex items-center space-x-2">
                                    <h1 className="font-bold text-gray-700 text-lg">Rows Per Page:</h1>
                                    <select
                                        value={rowsPerPage}
                                        onChange={(e) => {
                                            setRowsPerPage(Number(e.target.value));
                                            setCurrentPage(1); // Reset to page 1 when changing rows per page
                                        }}
                                        className="border rounded-md p-1 text-gray-700 font-bold text-lg"
                                    >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                    </select>
                                </div>

                                {/* Pagination Info */}
                                <div className="text-gray-700 font-bold text-lg">
                                    {filteredOrders.length > 0
                                        ? `${startIndex + 1}-${Math.min(startIndex + rowsPerPage, filteredOrders.length)} of ${filteredOrders.length}`
                                        : "No orders found"}
                                </div>

                                {/* Navigation Buttons */}
                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={handlePrevPage}
                                        disabled={currentPage === 1}
                                        className={`p-2 rounded-md ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-200"}`}
                                    >
                                        <ChevronLeft />
                                    </button>
                                    <button
                                        onClick={handleNextPage}
                                        disabled={currentPage === totalPages}
                                        className={`p-2 rounded-md ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-200"}`}
                                    >
                                        <ChevronRight />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
                {/* left section */}



                {/* right section */}
                <div className=" col-span-4 px-7 p-4">

                    <div className=" flex flex-row items-center justify-between">

                        <p className="font-medium text-xl text-gray-800 pl-20">Analytics Report</p>

                        <div className="flex space-x-3 text-gray-400 font-medium text-sm">
                            <span><MoreHorizontal />

                            </span>
                        </div>

                    </div>
                    <br />
                    <br />
                    <br />

                    <div className="p-4 bg-white rounded-lg shadow w-full h-[82%]">





                        {/* First Three  */}
                        <div className="border-b pb-10">
                            <div className="flex justify-between text-gray-800">
                                <span className=" text-lg">Company Finance Growth</span>
                                <span className="font-semibold text-gray-900 text-2xl">+45.14%</span>
                            </div>
                        </div>

                        <div className="border-b py-4 pb-10">
                            <div className="flex justify-between text-gray-700">
                                <span className=" text-lg">Company Expenses Ratio</span>
                                <span className="font-bold text-gray-800 text-2xl">0.58%</span>
                            </div>
                        </div>

                        <div className="py-4 pb-10">
                            <div className="flex justify-between text-gray-700">
                                <span className=" text-lg">Business Risk Cases</span>
                                <span className="font-bold text-gray-800 text-2xl">Low</span>
                            </div>
                        </div>
                        <br />
                        <br />
                        <br />

                        {/* Chart  */}
                        <div className="mt-4">
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={data}>
                                    <XAxis dataKey="month" tick={{ fill: '#888' }} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="value" stroke="#F59E0B" strokeWidth={2} dot={{ fill: "#F59E0B", r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>



                    </div>

                </div>
                {/* right section */}

            </div>



            <div className=" grid grid-cols-1 md:grid-cols-12 space-y-4">

                {/* left section */}
                <div className="col-span-8 flex flex-col p-4">
                    {/* Top Row: Title & Dropdown */}
                    <div className="flex items-center justify-between">
                        <p className="font-medium text-xl text-gray-800">Sales Report</p>

                        {/* Dropdown Button */}
                        <div className="relative">
                            <button
                                onClick={() => setDropdownOpen(!isDropdownOpen)}
                                className="flex items-center space-x-1 text-gray-500 font-medium text-sm"
                            >
                                <span>{selectedOption}</span>
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            {/* Dropdown Options */}
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-32 bg-white shadow-md rounded-md z-10">
                                    {options.map((option) => (
                                        <p
                                            key={option}
                                            className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                                            onClick={() => {
                                                setSelectedOption(option);
                                                setDropdownOpen(false);
                                            }}
                                        >
                                            {option}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Net Profit & Legend (Moves Right when Option Selected) */}
                    <div className="mt-6 flex flex-wrap items-center justify-between">
                        {/* Net Profit */}
                        <div className="mt-5">
                            <p className="text-lg text-gray-500">Net profit</p>

                            <p className="text-2xl font-bold text-gray-800 py-3">₹1560</p>
                        </div>

                        {/* Legends (Moves Right) */}
                        <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded-full bg-[#FF3B30]"></div>
                                <span className="text-sm text-gray-500">Income</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded-full bg-[#F5B82E]"></div>
                                <span className="text-sm text-gray-500">Cost Of Sales</span>
                            </div>
                        </div>
                    </div>

                    {/* Chart Container */}
                    <div className="w-full h-full mt-8" style={{ minHeight: "300px" }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={weekData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tick={{ fill: "#6B7280" }} axisLine={false} />
                                <YAxis tick={{ fill: "#6B7280" }} axisLine={false} />
                                <Tooltip />

                                {/* Bars */}
                                <Bar dataKey="income" fill="#FF3B30" barSize={20} radius={[4, 4, 0, 0]} name="Income"
                                    activeBar={<Rectangle fill="pink" stroke="blue" />} />
                                <Bar dataKey="costOfSales" fill="#F5B82E" barSize={20} radius={[4, 4, 0, 0]} name="Cost Of Sales"
                                    activeBar={<Rectangle fill="gold" stroke="purple" />} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                {/* left section */}



                {/* right section */}
                <div className="col-span-4 px-7 flex flex-col gap-4 p-4 h-full">
                    {/* Header */}
                    <div className="flex flex-row items-center justify-between">
                        <p className="font-medium text-xl text-gray-800">Transaction History</p>
                        <div className="flex space-x-3 text-gray-400 font-medium text-sm">
                            <span><MoreHorizontal /></span>
                        </div>
                    </div>

                    {/* Grid Layout to Separate Sections */}
                    <div className=" flex flex-col justify-between gap-10 bg-white rounded-lg w-full ">

                        {/* Transactions Section (4/6 Rows) */}
                        <div className="row-span-4 overflow-y-auto border shadow p-6 ">
                            {/* Transaction 1 */}
                            <div className="border-b pb-6 py-2">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-x-2">
                                        <div className="bg-green-100 text-green-500 rounded-full h-8 w-8 flex items-center justify-center">
                                            <Check className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">Payment from #002434</p>
                                            <p className="text-xs text-gray-500">Today, 2:00 AM</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-green-500 font-semibold">+ $1.430</p>
                                        <p className="text-xs text-gray-500">35%</p>
                                    </div>
                                </div>
                            </div>

                            {/* Transaction 2 */}
                            <div className="border-b pb-6 py-2">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-x-2">
                                        <div className="bg-red-100 text-red-500 rounded-full h-8 w-8 flex items-center justify-center">
                                            <X className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">Payment from #002434</p>
                                            <p className="text-xs text-gray-500">Today, 6:00 AM</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-red-500 font-semibold">- $1.430</p>
                                        <p className="text-xs text-gray-500">35%</p>
                                    </div>
                                </div>
                            </div>

                            {/* Transaction 3 */}
                            <div className="pb-6 py-2">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-x-2">
                                        <div className="bg-blue-100 text-blue-500 rounded-full h-8 w-8 flex items-center justify-center">
                                            <Clock className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">Pending from #002435</p>
                                            <p className="text-xs text-gray-500">Today, 2:00 AM</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gray-800 font-semibold">- $2.430</p>
                                        <p className="text-xs text-gray-500">35%</p>
                                    </div>
                                </div>
                            </div>
                        </div>


                        

                        {/* Help & Support Chat Section (2/6 Rows) */}
                        <div className="col-span-4 border shadow p-6 bg-white rounded-md flex flex-col justify-between">
                            {/* Header */}
                            <div className="relative flex items-center justify-between w-full">
                        <p className="text-black font-semibold text-lg">Help & Support Chat</p>
                        
                        <div className="flex mt-4">
                                <Image
                                    src="/assets/images/selleranalysis/avatar-group.png"
                                    alt="Overlay Image"
                                    width={150}
                                    height={150}
                                    className=""
                                />

                            </div>
                        </div>
                        <p className="text-md text-gray-500 mb-5 ">Typical reply within 5 min</p>
                            

                                 {/* Need Help Button */}
                            <div className="bg-red-500 text-white rounded-md px-4 py-2 text-center cursor-pointer w-50">
                                <button className="font-medium text-sm ">Need Help?<span></span></button>
                            </div>

                            {/* Avatars Row */}
                           
                            

                           
                        </div>

                    </div>
                </div>

                {/* right section */}

            </div>







        </>
    );
};

export default AnalysisPage;
