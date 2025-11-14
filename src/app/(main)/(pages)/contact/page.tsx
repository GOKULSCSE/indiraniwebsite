"use client";
import { Phone, Mail, MapPin, MessageCircle, Building } from 'lucide-react';

// Add custom focus ring style
const focusRingStyle = {
    '--tw-ring-color': '#D3B750',
} as React.CSSProperties;

export default function ContactUs() {
    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                            We're here to help you!
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Let's get in touch
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* Contact Information */}
                        <div className="space-y-8">
                            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6">Get in Touch</h2>

                                {/* Head Office */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: '#D3B750' }}>
                                        <Building className="w-5 h-5" />
                                        Head Office
                                    </h3>
                                    <div className="flex items-start space-x-3 text-gray-600">
                                        <MapPin className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: '#D3B750' }} />
                                        <p className="leading-relaxed">
                                            No. 16, Rangasamy Nagar, Seeranaickenpalayam,<br />
                                            Coimbatore - 641007.<br />
                                            Tamil Nadu, India.
                                        </p>
                                    </div>
                                </div>

                                {/* Showroom Address */}
                                <div className="mb-8 pb-6 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: '#D3B750' }}>
                                        <Building className="w-5 h-5" />
                                        Showroom Address
                                    </h3>
                                    <div className="flex items-start space-x-3 text-gray-600">
                                        <MapPin className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: '#D3B750' }} />
                                        <p className="leading-relaxed">
                                            No.1/39 New Ananda Nagar, Maruthamalai Main Road<br />
                                            (Landmark - Opposite HDFC Bank) P.N. Pudur<br />
                                            Coimbatore - 641041.<br />
                                            Tamil Nadu, India.
                                        </p>
                                    </div>
                                </div>

                                {/* Contact Details */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                                        <MessageCircle className="w-5 h-5 mr-2" style={{ color: '#D3B750' }} />
                                        Contact Information
                                    </h4>

                                    <div className="space-y-4 ml-7">
                                        <div>
                                            <h5 className="text-sm font-semibold text-gray-700 mb-2">Call Us</h5>
                                            <a
                                                href="tel:+919840927370"
                                                className="flex items-center space-x-3 text-gray-700 hover:transition-colors group"
                                                style={{ color: '#D3B750' }}
                                                onMouseEnter={(e) => e.currentTarget.style.color = '#B89A3F'}
                                                onMouseLeave={(e) => e.currentTarget.style.color = '#D3B750'}
                                            >
                                                <Phone className="w-4 h-4" />
                                                <span className="font-medium">+91 9840927370</span>
                                            </a>
                                        </div>

                                        <div>
                                            <h5 className="text-sm font-semibold text-gray-700 mb-2">Mail Us 24/7</h5>
                                            <a
                                                href="mailto:reachus@indraniie.com"
                                                className="flex items-center space-x-3 text-gray-700 hover:transition-colors group"
                                                style={{ color: '#D3B750' }}
                                                onMouseEnter={(e) => e.currentTarget.style.color = '#B89A3F'}
                                                onMouseLeave={(e) => e.currentTarget.style.color = '#D3B750'}
                                            >
                                                <Mail className="w-4 h-4" />
                                                <span className="font-medium">reachus@indraniie.com</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Contact Cards */}
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="bg-white rounded-xl p-4 border" style={{ borderColor: '#D3B75033' }}>
                                    <Phone className="w-4 h-4 mb-2" style={{ color: '#D3B750' }} />
                                    <h3 className="font-semibold mb-1 text-sm">Call Us</h3>
                                    <p className="text-gray-500 text-xs">Ready to talk? Give us a call</p>
                                </div>
                                <div className="bg-white rounded-xl p-4 border" style={{ borderColor: '#D3B75033' }}>
                                    <Mail className="w-4 h-4 mb-2" style={{ color: '#D3B750' }} />
                                    <h3 className="font-semibold mb-1 text-sm">Email Us</h3>
                                    <p className="text-gray-500 text-xs">Send us your questions</p>
                                </div>
                            </div>

                        </div>

                        {/* Contact Form */}
                        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Send us a Message</h2>

                            <div className="space-y-6">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <div className="block text-sm font-medium text-gray-700 mb-2">
                                            First Name
                                        </div>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
                                            style={focusRingStyle}
                                            placeholder="John"
                                            onFocus={(e) => e.target.style.setProperty('--tw-ring-color', '#D3B750')}
                                        />
                                    </div>
                                    <div>
                                        <div className="block text-sm font-medium text-gray-700 mb-2">
                                            Last Name
                                        </div>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
                                            style={focusRingStyle}
                                            placeholder="Doe"
                                            onFocus={(e) => e.target.style.setProperty('--tw-ring-color', '#D3B750')}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address
                                    </div>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
                                        style={focusRingStyle}
                                        placeholder="john.doe@example.com"
                                        onFocus={(e) => e.target.style.setProperty('--tw-ring-color', '#D3B750')}
                                    />
                                </div>

                                <div>
                                    <div className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number
                                    </div>
                                    <input
                                        type="tel"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
                                        style={focusRingStyle}
                                        placeholder="+91 12345 67890"
                                        onFocus={(e) => e.target.style.setProperty('--tw-ring-color', '#D3B750')}
                                    />
                                </div>

                                <div>
                                    <div className="block text-sm font-medium text-gray-700 mb-2">
                                        Subject
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
                                        style={focusRingStyle}
                                        placeholder="How can we help you?"
                                        onFocus={(e) => e.target.style.setProperty('--tw-ring-color', '#D3B750')}
                                    />
                                </div>

                                <div>
                                    <div className="block text-sm font-medium text-gray-700 mb-2">
                                        Message
                                    </div>
                                    <textarea
                                        rows={6}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all resize-none"
                                        style={focusRingStyle}
                                        placeholder="Tell us more about your project or inquiry..."
                                        onFocus={(e) => e.currentTarget.style.setProperty('--tw-ring-color', '#D3B750')}
                                    ></textarea>
                                </div>

                                <button
                                    className="w-full text-white font-semibold py-4 px-6 rounded-lg transform hover:scale-105 transition-all duration-200 shadow-lg"
                                    style={{ backgroundColor: '#D3B750' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B89A3F'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#D3B750'}
                                    onClick={() => alert('Form submitted! (This is a demo)')}
                                >
                                    Send Message
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Call-to-Action Banner */}
                    <div className="mt-16 rounded-3xl p-8 text-center text-white shadow-lg" style={{ backgroundColor: '#D3B750' }}>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Ready to Get Started?
                        </h2>
                        <p className="text-xl mb-8 max-w-2xl mx-auto" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                            Let's discuss your project and explore how Indrani Enterprises can help you.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center ">
                            <a
                                href="tel:+919840927370"
                                className="bg-white font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                                style={{ color: '#D3B750' }}
                            >
                                Call Now
                            </a>
                            <a
                                href="mailto:reachus@indraniie.com"
                                className="border-2 border-white text-white font-semibold px-8 py-3 rounded-lg transition-colors"
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'white';
                                    e.currentTarget.style.color = '#D3B750';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = 'white';
                                }}
                            >
                                Email Us
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
