"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Phone, Mail, Clock, AlertTriangle, CreditCard, Home, ChevronRight, Shield } from 'lucide-react';
import Link from 'next/link';
import { ScrollArea } from "@/components/ui/scroll-area";

const ReturnPolicy = () => {
  const sections = [
    { id: "overview", title: "Overview" },
    { id: "return-refund-exchange", title: "Return, Refund & Exchange Policy" },
    { id: "wrong-item", title: "Wrong Item / Damaged Product" },
    { id: "didnt-like", title: "Didn't Like the Product" },
    { id: "order-cancellation", title: "Order Cancellation" },
    { id: "custom-product", title: "Custom Product Order" },
    { id: "bulk-orders", title: "Bulk Orders" }
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
            <span>Return Policy</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <RotateCcw className="w-12 h-12" />
            <div>
              <h1 className="text-4xl font-bold mb-2">Return Policy</h1>
              <p className="text-xl" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                Easy returns with authorization. Get your refund hassle-free.
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
            {/* Overview */}
            <Card id="overview">
              <CardHeader>
                <CardTitle className="text-2xl" style={{ color: '#D3B750' }}>Overview</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                  Returns is a scheme provided by respective sellers directly under this policy in terms of which the option of exchange, replacement / refund is offered by the respective sellers to you. All products listed under a particular category may not have the same returns policy. For all products, the returns / replacement policy provided on the product page shall prevail over the general returns policy. Do refer the respective item's applicable return / replacement policy on the product page for any exceptions to this returns policy and the table below.
                </p>
                <div className="p-4 rounded-md" style={{ backgroundColor: '#D3B7501A', borderLeft: '4px solid #D3B750' }}>
                  <p className="font-semibold" style={{ color: '#D3B750' }}>
                    Do read the section carefully to understand the conditions and cases under which returns will be accepted.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Return, Refund & Exchange Policy */}
            <Card id="return-refund-exchange">
              <CardHeader>
                <CardTitle className="text-xl" style={{ color: '#D3B750' }}>Return, Refund & Exchange Policy</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p className="mb-4">
                  We know it can be frustrating when the online purchase is not quite right, we offer a complete "no fuss" guarantee to all our customers. We have very customer friendly return & refund policies.
                </p>
                <p className="font-semibold">
                  Please read product details carefully before confirming the order.
                </p>
              </CardContent>
            </Card>

            {/* Wrong Item / Damaged Product */}
            <Card id="wrong-item">
              <CardHeader>
                <CardTitle className="text-xl" style={{ color: '#D3B750' }}>Wrong Item / Damaged Product / Incorrect Size / Incomplete Product</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p className="mb-4">
                  If your goods are damaged or one of any above condition, we would be happy to give you the following alternatives:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Replacement with the right product OR</li>
                  <li>Exchange the product for an alternative of your choice of equal value OR</li>
                  <li>Refund of the full amount paid by you.</li>
                </ul>
                <div className="p-4 rounded-md mb-4" style={{ backgroundColor: '#D3B7501A', borderLeft: '4px solid #D3B750' }}>
                  <p className="mb-2">
                    In any of the above cases, contact must be made within <strong>48 hours</strong> of receipt of the products by email <a href="mailto:reachus@indraniie.com" className="font-semibold" style={{ color: '#D3B750' }}>reachus@indraniie.com</a> notifying us of any damage to the product with pics of the product received.
                  </p>
                  <p>
                    We will schedule return pick up for the product. Upon return, the article will undergo a quality check to ensure the quality problem is found to be our responsibility rather than misuse or abuse of the product outside of our control. Once the returned product passes the quality check to ensure it is unused and in its original packaging stage, an exchange/refund will be processed.
                  </p>
                </div>
                <p>
                  In case of incomplete product / items missing in the package, the missing parts will be sent after verification from our end.
                </p>
              </CardContent>
            </Card>

            {/* Didn't Like the Product */}
            <Card id="didnt-like">
              <CardHeader>
                <CardTitle className="text-xl" style={{ color: '#D3B750' }}>Didn't Like the product or quality / Size not as per requirement / Changed my mind / Don't need anymore</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p className="mb-4">
                  We ensure only the best quality reaches to our customers as each product goes through a well-defined quality check process. However, these being art products, please note that there may be slight variation in looks and finish. The colors shown on the website are close the real color of the product to the extent possible. However, depending upon your display screen, the colors may vary slightly. In case of handmade paintings, there may be minor variations due to nature of the work.
                </p>
                <div className="p-4 rounded-md mb-4" style={{ backgroundColor: '#D3B7501A', borderLeft: '4px solid #D3B750' }}>
                  <p className="font-semibold mb-2" style={{ color: '#D3B750' }}>Important:</p>
                  <p>
                    However, Choosing the right product is customer's prerogative. Every product ordered on our website is carefully prepared. Therefore if the product reached you in the condition and specifications displayed on the website, company is not liable to refund/replace or exchange the said product.
                  </p>
                </div>
                <p className="mb-4">
                  For any refund for prepaid orders we reverse the transaction you made and for COD orders you will have to share the account details so that refunds can be processed. Applicable COD charges are non-refundable and only product charges are refunded. Refund can take up to <strong>5-7 working days</strong> to reflect in your account depending on your bank.
                </p>
                <p className="font-semibold">
                  Please ensure that the products are not used, altered, washed, soiled or damaged in any way. Return all original tags and accessories. Branded packaging should be returned in its original condition.
                </p>
              </CardContent>
            </Card>

            {/* Order Cancellation */}
            <Card id="order-cancellation">
              <CardHeader>
                <CardTitle className="text-xl" style={{ color: '#D3B750' }}>Order Cancellation</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p className="mb-4">
                  Orders can be cancelled within <strong>24 hours</strong> of placing the order without any extra costs. To cancel the order, please call us at our customer care number / mail us at <a href="mailto:reachus@indraniie.com" className="font-semibold" style={{ color: '#D3B750' }}>reachus@indraniie.com</a>. We are unable to cancel the order once it has been dispatched.
                </p>
                <div className="p-4 rounded-md" style={{ backgroundColor: '#D3B7501A', borderLeft: '4px solid #D3B750' }}>
                  <p className="font-semibold mb-2" style={{ color: '#D3B750' }}>Exceptions:</p>
                  <p>
                    Above policies do not apply on gajalakshmi, woodencrafts / handpainted paintings / Custom Orders. All of the above mentioned products are non-refundable and non-exchangeable. For cancellation of hand painted items, call / write to us within 24 hrs. No cancellation will be made beyond that.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Custom Product Order */}
            <Card id="custom-product">
              <CardHeader>
                <CardTitle className="text-xl" style={{ color: '#D3B750' }}>Custom Product Order</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p>
                  Custom products are the products those are created on your request, apart from other available products on website. On such product orders COD won't be applicable. Such orders are <strong>non-refundable, non-cancelable & non-exchangeable</strong>. They can only be replaced in case of in-correct product or damaged product received.
                </p>
              </CardContent>
            </Card>

            {/* Bulk Orders */}
            <Card id="bulk-orders">
              <CardHeader>
                <CardTitle className="text-xl" style={{ color: '#D3B750' }}>Bulk Orders</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p>
                  All the orders having value more than <strong>INR 15,000/-</strong> comes under bulk order category. For bulk orders above return & refund policies are not applicable. Bulk orders are <strong>not refundable in any scenario</strong>, only defective items or damaged items individually can be replaced. Bulk orders may take some extra time to ship depending on the volume. The delivery time will be confirmed by our team at the time of order confirmation.
                </p>
              </CardContent>
            </Card>

            {/* Contact Section */}
            <Card style={{ backgroundColor: '#D3B7501A', borderColor: '#D3B75033' }}>
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4" style={{ color: '#D3B750' }}>Need Help with Your Return?</h3>
                <p className="text-muted-foreground mb-6">
                  Our customer service team is here to help you with your return authorization.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    className="text-white"
                    style={{ backgroundColor: '#D3B750' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B89A3F'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#D3B750'}
                    asChild
                  >
                    <a href="tel:+919840927370">
                      <Phone className="w-4 h-4 mr-2" />
                      Call +91 9840927370
                    </a>
                  </Button>
                  <Button 
                    variant="outline"
                    style={{ borderColor: '#D3B750', color: '#D3B750' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#D3B7501A';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    asChild
                  >
                    <a href="mailto:reachus@indraniie.com">
                      <Mail className="w-4 h-4 mr-2" />
                      Email Support
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnPolicy;
