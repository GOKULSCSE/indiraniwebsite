"use client";
import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Package, CreditCard, RotateCcw, Globe, Phone, Mail } from 'lucide-react';

interface FAQItem {
    id: string;
    question: string;
    answer: string;
    category: string;
}

const faqData: FAQItem[] = [
    // Shipping & Orders
    {
        id: '1',
        question: 'How can I track my order?',
        answer: 'Once shipped, you will receive an SMS and email on your registered contact number and email ID containing the courier company name and tracking number. You can also use the "Track now" option available on our website.',
        category: 'Shipping & Orders'
    },
    {
        id: '2',
        question: 'How long will it take to get my order?',
        answer: 'For most serviceable pin codes, we deliver within 10 business days. However, due to unforeseen circumstances like weather, strikes, remote location, or stocking issues, it may take longer. You can track your package using the unique link we email/SMS after dispatch.',
        category: 'Shipping & Orders'
    },
    {
        id: '3',
        question: 'What shipping carriers do you use?',
        answer: 'We work with reliable delivery partners to ensure your orders reach you safely. Specific carrier information will be provided in your tracking details.',
        category: 'Shipping & Orders'
    },
    {
        id: '4',
        question: 'I am unable to see my order details in my account. What should I do?',
        answer: 'Please contact our customer service at +91 98423 33565 or email us at support@makeyoueasy.com with your order number for assistance.',
        category: 'Shipping & Orders'
    },
    {
        id: '5',
        question: 'Will I get GST Credit?',
        answer: 'GST credit eligibility depends on your business registration and the nature of your purchase. Please consult with your tax advisor or contact us for specific details.',
        category: 'Shipping & Orders'
    },
    // Payment
    {
        id: '6',
        question: 'Can I use Cash on Delivery (CoD) payment option for every product?',
        answer: 'CoD availability may vary by product and location. Please check the payment options available during checkout for your specific order.',
        category: 'Payment'
    },
    {
        id: '7',
        question: 'How can I pay for an order?',
        answer: 'We accept all major credit and debit cards, PayTm, PhonePe, GooglePay, BHIM, PayPal, Bank Wires, and Check/Money Orders. Orders paid by check are held until payment clears (3-5 business days).',
        category: 'Payment'
    },
    {
        id: '8',
        question: 'How can I order large quantities as part of a corporate order?',
        answer: 'For corporate orders and bulk quantities, please contact us at +91 98423 33565 or email support@makeyoueasy.com for special pricing and arrangements.',
        category: 'Payment'
    },
    {
        id: '9',
        question: 'My payment process was interrupted. What should I do?',
        answer: 'If your payment was interrupted, please check your bank statement first. If the amount was deducted but order not confirmed, contact us immediately at support@makeyoueasy.com with transaction details.',
        category: 'Payment'
    },
    {
        id: '10',
        question: 'Is it safe to use my credit or debit card on Makeyoueasy.com?',
        answer: 'Yes, our website uses secure encryption and follows industry-standard security practices to protect your payment information.',
        category: 'Payment'
    },
    // Cancellation & Returns
    {
        id: '11',
        question: 'When can I cancel my order?',
        answer: 'Cancellation requests are accepted within 1 business day after receipt of order. A Cancellation Authorization is required - contact us at +91-000000 or support@makeyoueasy.com.',
        category: 'Cancellation & Returns'
    },
    {
        id: '12',
        question: 'How can I cancel my order?',
        answer: 'Contact our customer service at +91-000000 or support@makeyoueasy.com with your order number. Cancellations must be requested within 1 business day with a 10% restocking fee.',
        category: 'Cancellation & Returns'
    },
    {
        id: '13',
        question: 'Can Makeyoueasy.com cancel any order?',
        answer: 'Yes, we reserve the right to cancel orders in case of pricing errors, product unavailability, or other unforeseen circumstances. You will be notified immediately and refunded in full.',
        category: 'Cancellation & Returns'
    },
    {
        id: '14',
        question: 'When can I get my refund once the order has been returned?',
        answer: 'Refunds are processed within 5 business days after we receive the returned product. It may take an additional 5-10 business days to appear in your original payment method.',
        category: 'Cancellation & Returns'
    },
    {
        id: '15',
        question: 'Can I return the product delivered to me?',
        answer: 'Yes, returns are accepted within 3 days of delivery with a Return Authorization. Items must be new, in original packaging, and show no signs of wear or damage.',
        category: 'Cancellation & Returns'
    },
    {
        id: '16',
        question: 'What is Makeyoueasy.com\'s Returns policy?',
        answer: 'Returns require authorization within 3 days of delivery. Items must be new and in original packaging. We refund the purchase price less shipping and 10% restocking fee. Contact support@makeyoueasy.com to initiate returns.',
        category: 'Cancellation & Returns'
    },
    // International & More
    {
        id: '17',
        question: 'Do you ship overseas?',
        answer: 'Yes, we offer international shipping. Shipping fees start from $300. Contact us for specific country availability and shipping costs.',
        category: 'International & More'
    },
    {
        id: '18',
        question: 'Can I get customized tools?',
        answer: 'Yes, we offer customization services. Please contact us at +91 98423 33565 or support@makeyoueasy.com with your requirements for a custom quote.',
        category: 'International & More'
    },
    {
        id: '19',
        question: 'How can I get a quote?',
        answer: 'For quotes on bulk orders, customization, or special requirements, please contact us at +91 98423 33565 or email support@makeyoueasy.com with your specifications.',
        category: 'International & More'
    }
];

const categories = [
    { name: 'All', icon: null, color: 'bg-red-800' },
    { name: 'Shipping & Orders', icon: Package, color: 'bg-red-800' },
    { name: 'Payment', icon: CreditCard, color: 'bg-red-800' },
    { name: 'Cancellation & Returns', icon: RotateCcw, color: 'bg-red-800' },
    { name: 'International & More', icon: Globe, color: 'bg-red-800'}
];

const FAQ: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    const filteredFAQs = useMemo(() => {
        return faqData.filter(item => {
            const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.answer.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, selectedCategory]);

    const toggleExpanded = (id: string) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedItems(newExpanded);
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            Frequently Asked Questions
                        </h1>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Find answers to common questions about shopping, shipping, payments, and returns on Makeyoueasy.com
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Search Bar */}
                <div className="mb-8">
                    <div className="relative max-w-xl mx-auto">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search for answers..."
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 shadow-md text-lg"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Category Filter */}
                <div className="mb-12">
                    <div className="flex flex-wrap gap-3 justify-center">
                        {categories.map((category) => {
                            const Icon = category.icon;
                            const isSelected = selectedCategory === category.name;
                            return (
                                <button
                                    key={category.name}
                                    onClick={() => setSelectedCategory(category.name)}
                                    className={`px-6 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-lg ${isSelected
                                            ? `${category.color} text-white shadow-xl`
                                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {Icon && <Icon className="w-4 h-4" />}
                                        <span>{category.name}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* FAQ Items */}
                <div className="space-y-4">
                    {filteredFAQs.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No results found</h3>
                            <p className="text-gray-500">Try adjusting your search terms or category filter</p>
                        </div>
                    ) : (
                        filteredFAQs.map((item) => {
                            const isExpanded = expandedItems.has(item.id);
                            const categoryInfo = categories.find(cat => cat.name === item.category);

                            return (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
                                >
                                    <button
                                        onClick={() => toggleExpanded(item.id)}
                                        className="w-full px-6 py-6 text-left hover:bg-gray-50 transition-colors duration-200"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${categoryInfo?.color || 'bg-gray-500'}`}>
                                                        {item.category}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-900 pr-4">
                                                    {item.question}
                                                </h3>
                                            </div>
                                            <div className="flex-shrink-0">
                                                {isExpanded ? (
                                                    <ChevronUp className="w-6 h-6 text-gray-400" />
                                                ) : (
                                                    <ChevronDown className="w-6 h-6 text-gray-400" />
                                                )}
                                            </div>
                                        </div>
                                    </button>

                                    <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                        } overflow-hidden`}>
                                        <div className="px-6 pb-6">
                                            <div className="border-t border-gray-100 pt-4">
                                                <p className="text-gray-700 leading-relaxed">
                                                    {item.answer}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Contact Section */}
                <div className="mt-16 bg-red-800 rounded-3xl p-8 text-center text-white shadow-lg">
                    <h2 className="text-3xl font-bold mb-4">Still have questions?</h2>
                    <p className="text-xl mb-8">Our customer support team is here to help you</p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <a
                            href="tel:+919842333565"
                            className="flex items-center gap-2 bg-white text-red-700 px-5 py-2 rounded-full font-semibold"
                        >
                            <Phone className="w-5 h-5" />
                            <span>+91 98423 33565</span>
                        </a>

                        <a
                            href="mailto:support@makeyoueasy.com"
                            className="flex items-center gap-2 bg-white text-red-700 px-5 py-2 rounded-full font-semibold"
                        >
                            <Mail className="w-5 h-5" />
                            <span>support@makeyoueasy.com</span>
                        </a>
                    </div>
                </div>


                {/* Shipping Info */}
                <div className="mt-12 grid md:grid-cols-2 gap-8">
                    <div className="bg-white rounded-2xl p-6 shadow-md">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Shipping Charges</h3>
                        <div className="space-y-3 text-gray-700">
                            <div className="flex justify-between">
                                <span>Express Shipping (up to ₹999)</span>
                                <span className="font-semibold">₹99</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Free Express Shipping</span>
                                <span className="font-semibold text-red-600">Orders above ₹999</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Free Bulk Shipping</span>
                                <span className="font-semibold text-red-600">Orders above ₹15,000</span>
                            </div>
                            <div className="flex justify-between">
                                <span>International Shipping</span>
                                <span className="font-semibold">From $300</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-md">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Processing & Delivery</h3>
                        <div className="space-y-3 text-gray-700">
                            <div>
                                <span className="font-semibold">Order Processing:</span> 1-2 business days
                            </div>
                            <div>
                                <span className="font-semibold">Delivery Time:</span> Within 10 business days
                            </div>
                            <div>
                                <span className="font-semibold">Business Days:</span> Monday - Friday
                            </div>
                            <div>
                                <span className="font-semibold">Return Window:</span> 3 days from delivery
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FAQ;