"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, FileText, Home } from "lucide-react";

const TermsConditions = () => {
  const sections = [
    { id: "welcome", title: "Welcome" },
    { id: "terminology", title: "Terminology" },
    { id: "cookies", title: "Cookies" },
    { id: "license", title: "License" },
    { id: "comments", title: "Comments" }
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="text-white py-12" style={{ backgroundColor: '#D3B750' }}>
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 mb-6" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            <Home className="w-4 h-4" />
            <ChevronRight className="w-4 h-4" />
            <span>Terms & Conditions</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <FileText className="w-12 h-12" />
            <div>
              <h1 className="text-4xl font-bold mb-2">Terms & Conditions</h1>
              <p className="text-xl" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                Please read these terms carefully before using our services
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of Contents - Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">Quick Navigation</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <nav className="space-y-2">
                    {sections.map((section, index) => (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className="w-full text-left p-2 text-sm rounded-md transition-colors"
                        style={{ 
                          color: '#1f2937'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#D3B7501A';
                          e.currentTarget.style.color = '#D3B750';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#1f2937';
                        }}
                      >
                        {index + 1}. {section.title}
                      </button>
                    ))}
                  </nav>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Welcome Section */}
            <Card id="welcome">
              <CardHeader>
                <CardTitle className="text-2xl" style={{ color: '#D3B750' }}>Welcome to Indrani Enterprises!</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p className="text-lg text-muted-foreground mb-4">
                  These terms and conditions outline the rules and regulations for the use of Indrani Enterprises Website, located at indraniie.com.
                </p>
                <p className="mb-4">
                  By accessing this website, we assume you accept these terms and conditions. Do not continue to use Indrani Enterprises if you do not agree to all of the terms and conditions stated on this page.
                </p>
              </CardContent>
            </Card>

            {/* Terminology Section */}
            <Card id="terminology">
              <CardHeader>
                <CardTitle className="text-xl" style={{ color: '#D3B750' }}>Terminology</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p>
                  The following terminology applies to these Terms and Conditions, Privacy Statement and Disclaimer Notice and all Agreements: "Client", "You" and "Your" refers to you, the person log on this website and compliant to the Company's terms and conditions. The Company," "Ourselves," "we," "Our" and "Us", refers to our Company. "Party", "Parties", or "Us", refers to both the Client and ourselves.
                </p>
                <p className="mt-4">
                  All terms refer to the offer, acceptance and consideration of payment necessary to undertake the process of our assistance to the Client in the most appropriate manner for the express purpose of meeting the Client's needs in respect of provision of the Company's stated services, in accordance with and subject to, prevailing law of India. Any use of the above terminology or other words in the singular, plural, capitalization and/or he/she or they, are taken as interchangeable and therefore as referring to same.
                </p>
              </CardContent>
            </Card>

            {/* Cookies Section */}
            <Card id="cookies">
              <CardHeader>
                <CardTitle className="text-xl" style={{ color: '#D3B750' }}>Cookies</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p>
                  We employ the use of cookies. By accessing Indrani Enterprises, you agreed to use cookies in agreement with the Indrani Enterprises Privacy Policy.
                </p>
                <p className="mt-4">
                  Most interactive websites use cookies to let us retrieve the user's details for each visit. Cookies are used by our website to enable the functionality of certain areas to make it easier for people visiting our website. Some of our affiliate/advertising partners may also use cookies.
                </p>
              </CardContent>
            </Card>

            {/* License Section */}
            <Card id="license">
              <CardHeader>
                <CardTitle className="text-xl" style={{ color: '#D3B750' }}>License</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p>
                  Unless otherwise stated, Indrani Enterprises and/or its licensors own the intellectual property rights for all material on Indrani Enterprises. All intellectual property rights are reserved. You may access this from Indrani Enterprises for your own personal use subjected to restrictions set in these terms and conditions.
                </p>
                <p className="mt-4 font-semibold">You must not:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>Republish material from Indrani Enterprises</li>
                  <li>Sell, rent or sub-license material from Indrani Enterprises</li>
                  <li>Reproduce, duplicate or copy material from Indrani Enterprises</li>
                  <li>Redistribute content from Indrani Enterprises</li>
                </ul>
                <p className="mt-4">
                  This Agreement shall begin on the date hereof.
                </p>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card id="comments">
              <CardHeader>
                <CardTitle className="text-xl" style={{ color: '#D3B750' }}>Comments</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p>
                  Parts of this website offer an opportunity for users to post and exchange opinions and information in certain areas of the website. Indrani Enterprises does not filter, edit, publish or review Comments prior to their presence on the website. Comments do not reflect the views and opinions of Indrani Enterprises, its agents and/or affiliates. Comments reflect the views and opinions of the person who post their views and opinions. To the extent permitted by applicable laws, Indrani Enterprises shall not be liable for the Comments or for any liability, damages or expenses caused and/or suffered as a result of any use of and/or posting of and/or appearance of the Comments on this website.
                </p>
                <p className="mt-4">
                  Indrani Enterprises reserves the right to monitor all Comments and to remove any Comments which can be considered inappropriate, offensive or causes breach of these Terms and Conditions.
                </p>
                <div className="mt-6 p-4 rounded-md" style={{ backgroundColor: '#D3B7501A', borderLeft: '4px solid #D3B750' }}>
                  <p className="font-semibold mb-3" style={{ color: '#D3B750' }}>You warrant and represent that:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>You are entitled to post the Comments on our website and have all necessary licenses and consents to do so;</li>
                    <li>The Comments do not invade any intellectual property right, including without limitation copyright, patent or trademark of any third party;</li>
                    <li>The Comments do not contain any defamatory, libelous, offensive, indecent or otherwise unlawful material which is an invasion of privacy</li>
                    <li>The Comments will not be used to solicit or promote business or custom or present commercial activities or unlawful activity.</li>
                </ul>
                </div>
                <p className="mt-4">
                  You hereby grant Indrani Enterprises a non-exclusive license to use, reproduce, edit and authorize others to use, reproduce and edit any of your Comments in any and all forms, formats or media.
                </p>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card style={{ backgroundColor: '#D3B7501A', borderColor: '#D3B75033' }}>
              <CardHeader>
                <CardTitle className="text-xl" style={{ color: '#D3B750' }}>Questions About These Terms?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  If you have any questions about these Terms & Conditions, please contact us:
                </p>
                <div className="space-y-2">
                  <p><strong>Phone:</strong> +91 9840927370</p>
                  <p><strong>Email:</strong> reachus@indraniie.com</p>
                  <p><strong>Address:</strong> No. 16, Rangasamy Nagar, Seeranaickenpalayam, Coimbatore-641007. Tamil Nadu, India.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
