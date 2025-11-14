"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Phone,
  Mail,
  MapPin,
  Target,
  Award,
  Users,
  Zap,
  CheckCircle,
  Truck,
  Shield,
  HeadphonesIcon,
  Wrench,
  Building,
  Clock,
  Star,
  ArrowRight,
  ShoppingBag,
  ThumbsUp,
} from "lucide-react";
import Image from "next/image";

const About = () => {
  const values = [
    {
      title: "Empower Precision",
      description:
        "We aim to equip every workshop with tools that help users achieve their best work—every single time.",
      icon: <Target className="w-8 h-8" style={{ color: '#D3B750' }} />,
    },
    {
      title: "Quality & Reliability",
      description:
        "Each product is carefully tested to meet high industry standards.",
      icon: <Award className="w-8 h-8" style={{ color: '#D3B750' }} />,
    },
    {
      title: "Customer-First Service",
      description:
        "Need advice or solutions? Our Coimbatore-based team is just a call (+91 90901 06868) or email away.",
      icon: <HeadphonesIcon className="w-8 h-8" style={{ color: '#D3B750' }} />,
    },
    {
      title: "Transparent Practices",
      description:
        "You'll always find clear pricing, shipping details, and return policies—no surprises.",
      icon: <Shield className="w-8 h-8" style={{ color: '#D3B750' }} />,
    },
  ];

  const offerings = [
    {
      title: "Wide range of industrial products and accessories",
      description:
        "End mills, drills, inserts, ER collet holders, and more specialized tools for every machining need.",
      icon: <Wrench className="w-6 h-6" style={{ color: '#D3B750' }} />,
    },
    {
      title: "Express Shipping",
      description:
        "Across India (free for higher-value orders), plus international shipping.",
      icon: <Truck className="w-6 h-6" style={{ color: '#D3B750' }} />,
    },
    {
      title: "Hassle-free Returns",
      description:
        "Within 3 days for defective or mis-shipped items with full support.",
      icon: <CheckCircle className="w-6 h-6" style={{ color: '#D3B750' }} />,
    },
    {
      title: "Custom Solutions",
      description:
        "Customized tooling solutions tailored to your specifications—reach us anytime!",
      icon: <Target className="w-6 h-6" style={{ color: '#D3B750' }} />,
    },
  ];

  const whyChoose = [
    {
      reason: "High-quality Industrial products",
      benefit: "Reliable performance, consistent finishes",
      icon: <Zap className="w-5 h-5" style={{ color: '#D3B750' }} />,
    },
    {
      reason: "Clear, honest policies",
      benefit: "No hidden charges, fast returns",
      icon: <CheckCircle className="w-5 h-5" style={{ color: '#D3B750' }} />,
    },
    {
      reason: "Fast delivery",
      benefit: "Shipped within 1–2 business days in India",
      icon: <Truck className="w-5 h-5" style={{ color: '#D3B750' }} />,
    },
    {
      reason: "Local support",
      benefit: "Based in Coimbatore – always accessible",
      icon: <MapPin className="w-5 h-5" style={{ color: '#D3B750' }} />,
    },
    {
      reason: "Custom capabilities",
      benefit: "Tailored tooling solutions just for you",
      icon: <Target className="w-5 h-5" style={{ color: '#D3B750' }} />,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with About Us Image */}
      <section className="relative">
        {/* Background Image Section - Top Portion */}
        <div className="relative h-[400px] md:h-[500px] overflow-hidden">
          <Image
            src="/assets/images/about/About us.webp"
            alt="Kaaladi Handicrafts Background"
            fill
            className="object-contain"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent"></div>
        </div>

        {/* Content Box Overlay - Overlapping with negative margin */}
        <div className="container mx-auto max-w-5xl px-4 -mt-32 md:-mt-40 relative z-10">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 md:p-12 shadow-2xl">
            {/* Header Text */}
            <p className="text-center font-semibold text-lg md:text-xl mb-2" style={{ color: '#D3B750' }}>
              Discover the Artistry Behind Every Handi-Crafted Piece
            </p>
            
            {/* Main Title */}
            <h1 className="text-center text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 font-serif">
              Welcome to Kaaladi Handicrafts
          </h1>

            {/* About Us Paragraph */}
            <p className="text-center text-muted-foreground text-base md:text-lg leading-relaxed mb-8 max-w-4xl mx-auto">
              Kaaladi handicrafts, established in 2015 under Indrani Enterprises, is a premium handicraft store known for its fine woodwork and handicrafts. With a passion for craftsmanship and dedication to providing quality products, & we aim to preserve all the traditional Indian handicrafts in our store, preserve their beauty, and showcase them to those who have yet to discover their glory.
            </p>

            {/* Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
              {/* Years of Experience */}
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="p-3 rounded-full" style={{ backgroundColor: '#D3B7501A' }}>
                    <Star className="w-8 h-8" style={{ color: '#D3B750' }} />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">10+</div>
                <div className="text-sm md:text-base text-muted-foreground">Years of Experience</div>
              </div>

              {/* Products Sold */}
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="p-3 rounded-full" style={{ backgroundColor: '#D3B7501A' }}>
                    <ShoppingBag className="w-8 h-8" style={{ color: '#D3B750' }} />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">1000+</div>
                <div className="text-sm md:text-base text-muted-foreground">Products Sold</div>
              </div>

              {/* Happy Customers */}
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="p-3 rounded-full" style={{ backgroundColor: '#D3B7501A' }}>
                    <ThumbsUp className="w-8 h-8" style={{ color: '#D3B750' }} />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">500+</div>
                <div className="text-sm md:text-base text-muted-foreground">Happy Customers</div>
              </div>

              {/* Premium Quality */}
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="p-3 rounded-full" style={{ backgroundColor: '#D3B7501A' }}>
                    <Award className="w-8 h-8" style={{ color: '#D3B750' }} />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">100%</div>
                <div className="text-sm md:text-base text-muted-foreground">Premium Quality</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground font-serif">
                What We Do
              </h2>
              
              <p className="text-muted-foreground leading-relaxed text-lg">
                From intricately carved sculptures to perfectly designed wall pieces, our handcrafted woodwork is sure to impress with its unmatched artistry and timeless elegance in the 19th century.
              </p>
              
              <p className="text-muted-foreground leading-relaxed text-lg">
                We specialize in unique pieces of wood panels, Art, Paintings, Wooden crafts, Eco-Friendly Art; Modern Art, Mix Media Art, Dried Flower Bouquet, Agri Foliage Flowers, Function Plate Décor, Corporate Gifts; Weddings, and Function Return Gifts.
              </p>

              {/* Happy Customers Subsection */}
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold" style={{ color: '#D3B750' }}>
                  Happy Customers
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  The reason behind every hard work is to make customers happy and to get credit for the work done. So that we provide customized products to meet the expectations of our customers.
                </p>
              </div>

              {/* Traditional craft Subsection */}
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold" style={{ color: '#D3B750' }}>
                  Traditional craft
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Every traditional craft form has its own beauty & uniqueness perfected by the local artisans through years of dedicated & passionate craftsmanship. We bring together exquisite craft items for you to make them a part of your life & home.
                </p>
              </div>
            </div>

            {/* Right Column - Image */}
            <div className="relative h-[500px] md:h-[600px] rounded-lg overflow-hidden shadow-lg">
              <Image
                src="/assets/images/about/Sculpturer.webp"
                alt="Wood carving artisan at work"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* About Our Products Section */}
      

      {/* Mission & Vision Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Mission Box */}
            <Card className="bg-white/95 shadow-lg border-0 p-8 md:p-10">
              <CardContent className="p-0">
                <div className="mb-6">
                  <h3 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: '#D3B750' }}>
                    Mission
                  </h3>
                  <div className="w-16 h-1" style={{ backgroundColor: '#D3B750' }}></div>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Our mission is to provide high-quality Indian artwork as per customer requirements and satisfaction across the globe.
                </p>
              </CardContent>
            </Card>

            {/* Vision Box */}
            <Card className="bg-white/95 shadow-lg border-0 p-8 md:p-10">
              <CardContent className="p-0">
                <div className="mb-6">
                  <h3 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: '#D3B750' }}>
                    Vision
                  </h3>
                  <div className="w-16 h-1" style={{ backgroundColor: '#D3B750' }}></div>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Our Vision is to be an enterprise providing new and traditional artwork with world-class precision and excellent customer satisfaction.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Who We Are & Our Story */}
      {/* <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Building className="w-8 h-8" style={{ color: '#D3B750' }} />
              <h2 className="text-4xl font-bold text-foreground">Who We Are</h2>
            </div>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
            Welcome to MakeYouEasy! Based in Coimbatore, Tamil Nadu, we're your trusted partner for high-quality Industrial solutions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <Card className="p-8 border-2 hover:shadow-lg transition-shadow duration-300" style={{ borderColor: '#D3B75033' }}>
              <CardContent className="p-0">
                <h3 className="text-2xl font-semibold mb-4 text-foreground flex items-center gap-2">
                  <Star className="w-6 h-6" style={{ color: '#D3B750' }} />
                  Our Story
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Elite India, was a well-established trading business with over
                  15 years of experience buying and selling a wide range of
                  goods. They had long-standing relationships with manufacturers
                  and a network of brick-and-mortar retail clients. However, the
                  signs of a changing market were becoming impossible to ignore.
                  Their sales to smaller, independent retailers were declining,
                  and customers increasingly expected faster, more convenient,
                  and more personalized shopping experiences.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The challenge: We realized the company's traditional B2B model
                  was no longer sufficient. They had deep inventory and supplier
                  connections but were invisible to the growing number of
                  consumers who shopped online. The existing system was clunky
                  and not built for the complexities of direct-to-consumer (D2C)
                  online sales, such as managing individual orders, processing
                  diverse payment methods, and handling returns.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  The transition: We decided to move into e-commerce, seeing it
                  not as a replacement for their existing business but as a new
                  revenue stream. The leadership team embarked on a three-phase
                  transition with the new start up company "Porunei Marketing
                  Corporation" in the brand name of "Makeyouesy"
                </p>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <div className="rounded-lg p-6 border-l-4 transition-colors" style={{ backgroundColor: '#D3B7501A', borderLeftColor: '#D3B750' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D3B75033'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#D3B7501A'}>
                <h4 className="font-semibold text-lg mb-2">
                  Founded by Engineers
                </h4>
                <p className="text-muted-foreground">
                  Built by professionals who understand your needs
                </p>
              </div>
              <div className="rounded-lg p-6 border-l-4 transition-colors" style={{ backgroundColor: '#D3B7501A', borderLeftColor: '#D3B750' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D3B75033'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#D3B7501A'}>
                <h4 className="font-semibold text-lg mb-2">Quality Tested</h4>
                <p className="text-muted-foreground">
                  Every tool rigorously tested in our workshop
                </p>
              </div>
              <div className="rounded-lg p-6 border-l-4 transition-colors" style={{ backgroundColor: '#D3B7501A', borderLeftColor: '#D3B750' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D3B75033'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#D3B7501A'}>
                <h4 className="font-semibold text-lg mb-2">Trusted Supplier</h4>
                <p className="text-muted-foreground">
                  Known for reliability and fast turnaround
                </p>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Mission & Values */}
      {/* <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Target className="w-8 h-8" style={{ color: '#D3B750' }} />
              <h2 className="text-4xl font-bold text-foreground">
                Our Mission & Values
              </h2>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our core principles drive everything we do at MakeYouEasy
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                style={{ borderColor: '#D3B75033' }}
              >
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-2">{value.icon}</div>
                  <CardTitle className="text-lg">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center text-sm leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section> */}

      {/* What We Offer */}
      {/* <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Wrench className="w-8 h-8" style={{ color: '#D3B750' }} />
              <h2 className="text-4xl font-bold text-foreground">
                What We Offer
              </h2>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive industrial products and solutions tailored to your
              needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {offerings.map((offering, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-lg transition-all duration-300"
                style={{ borderColor: '#D3B75033' }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-2 rounded-lg" style={{ backgroundColor: '#D3B7501A' }}>
                    {offering.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-foreground">
                      {offering.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {offering.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section> */}

      {/* Team Section */}
      {/* <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Users className="w-8 h-8" style={{ color: '#D3B750' }} />
            <h2 className="text-4xl font-bold text-foreground">Our Team</h2>
          </div>
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              At the heart of MakeYouEasy is a young, passionate team of
              engineers and industrial professionals based in Coimbatore. We
              believe in hands-on support, practical advice, and real-world
              solutions.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              When you connect with us, you're talking to someone who knows the
              industrial equipments and how they're used.
            </p>
          </div>
        </div>
      </section> */}

      {/* Why Choose Us */}
      {/* <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <CheckCircle className="w-8 h-8" style={{ color: '#D3B750' }} />
              <h2 className="text-4xl font-bold text-foreground">
                Why Choose MakeYouEasy?
              </h2>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Start your next machining project with confidence
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyChoose.map((item, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                style={{ borderColor: '#D3B75033' }}
              >
                <div className="flex items-start gap-3">
                  {item.icon}
                  <div>
                    <h3 className="font-semibold text-lg mb-1 text-foreground">
                      {item.reason}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {item.benefit}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section> */}

      {/* Important Links Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background Image with Blur */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/images/about/important links banner.png"
            alt="Important Links Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-12">
            Important Links
          </h2>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Address Box */}
            <div 
              className="p-6 rounded-lg backdrop-blur-md border"
              style={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderColor: '#D3B750'
              }}
            >
              <div className="flex flex-col items-center text-center">
                <MapPin className="w-10 h-10 mb-4" style={{ color: '#D3B750' }} />
                <h3 className="text-xl font-semibold text-white mb-3">Address</h3>
                <p className="text-white text-sm leading-relaxed">
                  No. 16, Rangasamy Nagar, Seeranaickenpalayam, Coimbatore-641007. Tamil Nadu, India.
                </p>
              </div>
            </div>

            {/* Phone Box */}
            <div 
              className="p-6 rounded-lg backdrop-blur-md border"
              style={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderColor: '#D3B750'
              }}
            >
              <div className="flex flex-col items-center text-center">
                <Phone className="w-10 h-10 mb-4" style={{ color: '#D3B750' }} />
                <h3 className="text-xl font-semibold text-white mb-3">Phone</h3>
                <p className="text-white">+91 9840927370</p>
              </div>
            </div>

            {/* Email Box */}
            <div 
              className="p-6 rounded-lg backdrop-blur-md border"
              style={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderColor: '#D3B750'
              }}
            >
              <div className="flex flex-col items-center text-center">
                <Mail className="w-10 h-10 mb-4" style={{ color: '#D3B750' }} />
                <h3 className="text-xl font-semibold text-white mb-3">Email</h3>
                <p className="text-white">reachus@indraniie.com</p>
              </div>
            </div>
          </div>

          {/* WhatsApp Icon - Bottom Right */}
          <div className="fixed bottom-6 right-6 z-50">
            <a
              href="https://wa.me/919840927370"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors"
            >
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground font-serif">
                About Our Products
              </h2>
              
              <ul className="space-y-4 text-muted-foreground leading-relaxed">
                <li className="flex items-start gap-3">
                  <span className="text-lg font-semibold" style={{ color: '#D3B750' }}>▷▷▷</span>
                  <span className="text-base md:text-lg">
                    Our online store sells a wide range of fully wood-carved and highly customizable handicraft products.
                  </span>
                </li>
                
                <li className="flex items-start gap-3">
                  <span className="text-lg font-semibold" style={{ color: '#D3B750' }}>▷▷▷</span>
                  <span className="text-base md:text-lg">
                    Almost all products are unique and handmade, with extra care taken to make each a masterpiece.
                  </span>
                </li>
                
                <li className="flex items-start gap-3">
                  <span className="text-lg font-semibold" style={{ color: '#D3B750' }}>▷▷▷</span>
                  <span className="text-base md:text-lg">
                    Woodcraft is primarily done in teak wood, with a minimum thickness of 2 inches, and aims to bring temple architecture images to life in wooden art.
                  </span>
                </li>
                
                <li className="flex items-start gap-3">
                  <span className="text-lg font-semibold" style={{ color: '#D3B750' }}>▷▷▷</span>
                  <span className="text-base md:text-lg">
                    We offer customized artwork including Tanjore Painting, Kerala Mural Art, Warli Art, Pichwai paintings, Madhubani paintings, Pattachitra Art, Palm Leaf Engravings, and Portrait Paintings.
                  </span>
                </li>
                
                <li className="flex items-start gap-3">
                  <span className="text-lg font-semibold" style={{ color: '#D3B750' }}>▷▷▷</span>
                  <span className="text-base md:text-lg">
                    Custom products for Corporate Gifts in all sizes and shapes, and both high volume and high value varieties for Wedding and Function Return Gifts.
                  </span>
                </li>
              </ul>
            </div>

            {/* Right Column - Image */}
            <div className="relative h-[500px] md:h-[600px] rounded-lg overflow-hidden shadow-lg">
              <Image
                src="/assets/images/about/about our products.jpg"
                alt="Hands carving wood - artisan at work"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Looking Ahead */}
      {/* <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Clock className="w-8 h-8" style={{ color: '#D3B750' }} />
            <h2 className="text-4xl font-bold text-foreground">
              Looking Ahead
            </h2>
          </div>
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            Our sight is set on growing alongside you! We're continuously expanding our catalog, investing in quality assurance, and exploring digital tools (like tutorials and project guides) to make your Industrial journey smoother and more efficient.
            </p>
            <div className="rounded-lg p-8 border" style={{ backgroundColor: '#D3B7501A', borderColor: '#D3B7504D' }}>
              <p className="text-xl font-semibold text-foreground flex items-center justify-center gap-2">
                Start your next machining project with confidence.
                <ArrowRight className="w-5 h-5" style={{ color: '#D3B750' }} />
              </p>
              <p className="text-muted-foreground mt-2">
                Explore our product range, or get in touch today — let's make
                CNC work easy, together!
              </p>
            </div>
          </div>
        </div>
      </section> */}
    </div>
  );
};

export default About;
