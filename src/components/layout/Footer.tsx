"use client"

import Link from "next/link";
import {
  MapPin,
  Phone,
  Smartphone,
  Truck,
  Award,
  RotateCcw,
  Headphones,
  ChevronDown,
  ChevronUp,
  Send,
  Mail,
  CreditCard,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Footer() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const features = [
    {
      icon: <CreditCard className="h-8 w-8" style={{ color: '#D3B750' }} />,
      title: "100% Secure Payment",
      description: "We accept UPI, net banking, cards and other digital payment methods for seamless shopping experience"
    },
    {
      icon: <Settings className="h-8 w-8" style={{ color: '#D3B750' }} />,
      title: "Customized Options",
      description: "We provide wide range of personalized options tailored to meet every individual requirements"
    },
    {
      icon: <Truck className="h-8 w-8" style={{ color: '#D3B750' }} />,
      title: "Free Delivery",
      description: "We offer free shipping for every purchase you made and ensure safe deliver at your doorstep"
    }
  ];

  // Auto-scroll carousel
  useEffect(() => {
    const interval = setInterval(() => {
      if (carouselRef.current) {
        setActiveSlide((prev) => (prev + 1) % features.length);
        const nextSlide = (activeSlide + 1) % features.length;
        const slideWidth = carouselRef.current.scrollWidth / features.length;
        carouselRef.current.scrollTo({
          left: nextSlide * slideWidth,
          behavior: 'smooth'
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeSlide, features.length]);

  // Handle manual scroll
  const handleScroll = () => {
    if (carouselRef.current) {
      const scrollPosition = carouselRef.current.scrollLeft;
      const slideWidth = carouselRef.current.scrollWidth / features.length;
      const newActiveSlide = Math.round(scrollPosition / slideWidth);
      setActiveSlide(newActiveSlide);
    }
  };

  const toggleSection = (section: string) => {
    if (openSection === section) {
      setOpenSection(null);
    } else {
      setOpenSection(section);
    }
  };

  return (
    <footer className="w-full mt-[7rem]">
      <div className="text-white py-12 relative" style={{ background: 'linear-gradient(175.63deg, #D3B750 -2.16%, #8B6F1F 108.15%)' }}>
        {/* Features section */}
        <div className="bg-transparent mx-auto w-[90%] mt-[-7rem] mb-[2rem] text-black">
          <div className="container mx-auto px-4">
            {/* Desktop layout */}
            <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-5 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 bg-white py-8 px-6 rounded-lg shadow-[0px_0px_13.1px_0px_rgba(0,0,0,0.15)]">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start p-4">
                  <div className="mr-4 flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900">{feature.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Mobile layout with auto-playing horizontal scroll */}
            <div className="md:hidden w-full">
              <div 
                className="flex overflow-x-auto pb-4 gap-4 hide-scrollbar snap-x snap-mandatory w-full" 
                ref={carouselRef}
                onScroll={handleScroll}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {/* Duplicate first items at the end for infinite effect */}
                {features.map((feature, index) => (
                  <motion.div 
                    key={index} 
                    className="flex-shrink-0 w-[100%] snap-center "
                    initial={{ opacity:1, scale: 0.95 }}
                    animate={{ 
                      opacity:1, 
                      scale: activeSlide === index ? 1 : 0.95 
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="bg-white backdrop-blur-sm rounded-2xl p-5 shadow-md flex items-start border border-gray-100">
                      <div className="bg-gray-50 p-3 rounded-full shadow-sm mr-4 flex-shrink-0">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-base mb-1 text-gray-900">{feature.title}</h3>
                        <p className="text-xs text-gray-600 leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
          
              </div>
              
              {/* Indicator dots */}
              {/* <div className="flex justify-center mt-4 gap-1.5">
                {features.map((_, index) => (
                  <div 
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${activeSlide % features.length === index ? 'bg-[#b01116] w-4' : 'bg-gray-300'}`}
                  ></div>
                ))}
              </div> */}
            </div>
          </div>
        </div>
        
        {/* Main footer content */}
        <div className="container mx-auto px-4">
          {/* Logo and address section - always visible */}
          <div className="md:hidden mb-8">
            <Link href="/" className="flex items-center justify-center">
              <Image
                src={"/assets/indiranilogo.png"}
                width={120}
                height={32}
                alt="Kaaladi Handicrafts"
                className="mb-4"
              />
            </Link>
            
            <div className="flex justify-center gap-6 mt-4">
              {[
                {
                  href: "https://www.facebook.com/profile.php?id=100011499022503",
                  bg: "bg-blue-50",
                  border: "border-blue-100",
                  src: "https://makeyoueasy.blr1.digitaloceanspaces.com/uploads/1749471648161-facebook1.png",
                  alt: "Facebook",
                },
                {
                  href: "https://www.instagram.com/kaaladihandicrafts/",
                  bg: "bg-pink-50",
                  border: "border-pink-100",
                  src: "https://makeyoueasy.blr1.digitaloceanspaces.com/uploads/1749471798305-instagram1.png",
                  alt: "Instagram",
                },
                {
                  href: "https://www.youtube.com/@kaaladihandicrafts",
                  bg: "bg-red-50",
                  border: "border-red-100",
                  src: "https://makeyoueasy.blr1.digitaloceanspaces.com/uploads/1749471798294-youtube1.png",
                  alt: "YouTube",
                },
                {
                  href: "https://x.com/KaaladiH",
                  bg: "bg-gray-100",
                  border: "border-gray-200",
                  src: "https://makeyoueasy.blr1.digitaloceanspaces.com/uploads/1749471648150-twitter1.png",
                  alt: "Twitter",
                },
              ].map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className={`w-10 h-10 ${item.bg} rounded-full flex items-center justify-center border ${item.border}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={item.src}
                    alt={item.alt}
                    className="w-6 h-6 object-contain"
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Desktop footer layout */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="mb-6">
                <Link href="/" className="flex items-center">
                  <Image
                    src={"/assets/indiranilogo.png"}
                    width={150}
                    height={40}
                    alt="Kaaladi Handicrafts"
                  />
                </Link>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold mb-1">Head Office</p>
                    <p>No. 16, Rangasamy Nagar, Seeranaickenpalayam, Coimbatore - 641007. Tamil Nadu, India.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold mb-1">Showroom Address</p>
                    <p>No.1/39 New Ananda Nagar, Maruthamalai Main Road (Landmark - Opposite HDFC Bank) P.N. Pudur Coimbatore - 641041. Tamil Nadu, India.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">+91 9840927370</p>
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">reachus@indraniie.com</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">Company</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/about" className="text-sm hover:underline">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/filter" className="text-sm hover:underline">
                    All Products
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-sm hover:underline">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">Services</h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/profile"
                    className="text-sm hover:underline"
                  >
                    Order tracking
                  </Link>
                </li>
                <li>
                  <Link href="/wishlist" className="text-sm hover:underline">
                    Wish List
                  </Link>
                </li>

                <li>
                  <Link href="/terms-and-conditions" className="text-sm hover:underline">
                    Terms and conditions
                  </Link>
                </li>

                <li>
                  <Link href="/privacy-policy" className="text-sm hover:underline">
                    Privacy Policy
                  </Link>
                </li>

                <li>
                  <Link href="/returnpolicy" className="text-sm hover:underline">
                    Returns Policy
                  </Link>
                </li>

                <li>
                  <Link href="/support-policy" className="text-sm hover:underline">
                    Support Policy
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">Customer Care</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/auth/signin" className="text-sm hover:underline">
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="/" className="text-sm hover:underline">
                    My Account
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-sm hover:underline">
                    Contact us
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Mobile collapsible sections */}
          <div className="md:hidden">
            {/* Contact Info Section */}
            <div className="mb-3 bg-white/10 rounded-xl overflow-hidden">
              <motion.button 
                className="w-full py-4 px-4 flex justify-between items-center"
                onClick={() => toggleSection('contact')}
                whileTap={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              >
                <span className="font-bold text-lg">Contact Info</span>
                {openSection === 'contact' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </motion.button>
              
              <AnimatePresence>
                {openSection === 'contact' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pb-4 space-y-4 px-4 pt-1">
                      <div className="flex items-start gap-3">
                        <div className="bg-white/20 p-2 rounded-full">
                          <MapPin className="h-5 w-5 flex-shrink-0" />
                        </div>
                        <div className="text-sm">
                          <p className="font-semibold mb-1">Head Office</p>
                          <p>No. 16, Rangasamy Nagar, Seeranaickenpalayam, Coimbatore - 641007. Tamil Nadu, India.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="bg-white/20 p-2 rounded-full">
                          <MapPin className="h-5 w-5 flex-shrink-0" />
                        </div>
                        <div className="text-sm">
                          <p className="font-semibold mb-1">Showroom Address</p>
                          <p>No.1/39 New Ananda Nagar, Maruthamalai Main Road (Landmark - Opposite HDFC Bank) P.N. Pudur Coimbatore - 641041. Tamil Nadu, India.</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-full">
                          <Phone className="h-5 w-5 flex-shrink-0" />
                        </div>
                        <p className="text-sm">+91 9840927370</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-full">
                          <Mail className="h-5 w-5 flex-shrink-0" />
                        </div>
                        <p className="text-sm">reachus@indraniie.com</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Company Section */}
            <div className="mb-3 bg-white/10 rounded-xl overflow-hidden">
              <motion.button 
                className="w-full py-4 px-4 flex justify-between items-center"
                onClick={() => toggleSection('company')}
                whileTap={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              >
                <span className="font-bold text-lg">Company</span>
                {openSection === 'company' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </motion.button>
              
              <AnimatePresence>
                {openSection === 'company' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <ul className="pb-4 pt-1 px-4">
                      <li>
                        <Link href="/about" className="text-sm block py-3 border-b border-white/10">
                          About
                        </Link>
                      </li>
                      <li>
                        <Link href="/filter" className="text-sm block py-3 border-b border-white/10">
                          All Products
                        </Link>
                      </li>
                      <li>
                        <Link href="/faq" className="text-sm block py-3">
                          FAQ
                        </Link>
                      </li>
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Services Section */}
            <div className="mb-3 bg-white/10 rounded-xl overflow-hidden">
              <motion.button 
                className="w-full py-4 px-4 flex justify-between items-center"
                onClick={() => toggleSection('services')}
                whileTap={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              >
                <span className="font-bold text-lg">Services</span>
                {openSection === 'services' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </motion.button>
              
              <AnimatePresence>
                {openSection === 'services' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <ul className="pb-4 pt-1 px-4">
                      <li>
                        <Link href="/profile" className="text-sm block py-3 border-b border-white/10">
                          Order tracking
                        </Link>
                      </li>
                      <li>
                        <Link href="/wishlist" className="text-sm block py-3 border-b border-white/10">
                          Wish List
                        </Link>
                      </li>
                      <li>
                        <Link href="/terms-and-conditions" className="text-sm block py-3 border-b border-white/10">
                          Terms and conditions
                        </Link>
                      </li>
                      <li>
                        <Link href="/privacy-policy" className="text-sm block py-3 border-b border-white/10">
                          Privacy Policy
                        </Link>
                      </li>
                      <li>
                        <Link href="/returnpolicy" className="text-sm block py-3 border-b border-white/10">
                          Returns Policy
                        </Link>
                      </li>
                      <li>
                        <Link href="/support-policy" className="text-sm block py-3">
                          Support Policy
                        </Link>
                      </li>
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Customer Care Section */}
            <div className="mb-3 bg-white/10 rounded-xl overflow-hidden">
              <motion.button 
                className="w-full py-4 px-4 flex justify-between items-center"
                onClick={() => toggleSection('customer')}
                whileTap={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              >
                <span className="font-bold text-lg">Customer Care</span>
                {openSection === 'customer' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </motion.button>
              
              <AnimatePresence>
                {openSection === 'customer' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <ul className="pb-4 pt-1 px-4">
                      <li>
                        <Link href="/auth/signin" className="text-sm block py-3 border-b border-white/10">
                          Login
                        </Link>
                      </li>
                      <li>
                        <Link href="/" className="text-sm block py-3 border-b border-white/10">
                          My Account
                        </Link>
                      </li>
                      <li>
                        <Link href="/contact" className="text-sm block py-3">
                          Contact us
                        </Link>
                      </li>
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-12">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-2">
                <h3 className="text-xl font-bold mb-4 md:text-left text-center">Newsletter</h3>
                <p className="text-sm mb-4 md:text-left text-center">
                  Subscribe to our weekly updates and notifications
                </p>

                <div className="flex h-[3rem]">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="h-full rounded-full md:rounded-sm bg-white text-black border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-4"
                  />
                  <Button className="ml-2 rounded-full md:rounded-sm h-full bg-black hover:bg-gray-800 px-4">
                    <Send size={18} />
                  </Button>
                </div>
              </div>

              <div className="hidden md:flex lg:col-span-2 items-end justify-end mt-6 md:mt-0">
                <div className="flex gap-4">
                  {[
                    {
                      href: "https://www.facebook.com/profile.php?id=100011499022503",
                      bg: "bg-blue-50",
                      border: "border-blue-100",
                      src: "https://makeyoueasy.blr1.digitaloceanspaces.com/fb.png",
                      alt: "Facebook",
                    },
                    {
                      href: "https://www.instagram.com/kaaladihandicrafts/",
                      bg: "bg-pink-50",
                      border: "border-pink-100",
                      src: "https://makeyoueasy.blr1.digitaloceanspaces.com/insta.png",
                      alt: "Instagram",
                    },
                    {
                      href: "https://www.youtube.com/@kaaladihandicrafts",
                      bg: "bg-red-50",
                      border: "border-red-100",
                      src: "https://makeyoueasy.blr1.digitaloceanspaces.com/yt.png",
                      alt: "YouTube",
                    },
                    {
                      href: "https://x.com/KaaladiH",
                      bg: "bg-gray-100",
                      border: "border-gray-200",
                      src: "https://makeyoueasy.blr1.digitaloceanspaces.com/x.png",
                      alt: "Twitter",
                    },
                  ].map((item, index) => (
                    <a
                      key={index}
                      href={item.href}
                      className={`w-12 h-12 ${item.bg} rounded-full flex items-center justify-center border cursor-pointer  ${item.border}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={item.src}
                        alt={item.alt}
                        className="w-8 h-8 object-contain"
                      />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Copyright notice */}
          <div className="mt-8 pt-4 border-t border-white/20 text-center text-sm">
            © {new Date().getFullYear()} Make Easy. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
