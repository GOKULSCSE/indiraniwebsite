"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Mail, ChevronRight, Home, FileText } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";

const PrivacyPolicy = () => {
  const sections = [
    { id: "introduction", title: "Introduction" },
    { id: "interpretation", title: "Interpretation and Definitions" },
    { id: "collecting", title: "Collecting and Using Your Personal Data" },
    { id: "types", title: "Types of Data Collected" },
    { id: "use", title: "Use of Your Personal Data" },
    { id: "retention", title: "Retention of Your Personal Data" },
    { id: "transfer", title: "Transfer of Your Personal Data" },
    { id: "disclosure", title: "Disclosure of Your Personal Data" },
    { id: "security", title: "Security of Your Personal Data" },
    { id: "links", title: "Links to Other Websites" },
    { id: "changes", title: "Changes to this Privacy Policy" },
    { id: "contact", title: "Contact Us" }
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
            <span>Privacy Policy</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Shield className="w-12 h-12" />
            <div>
              <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
              <p className="text-xl" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Your privacy is important to us. Learn how we collect, use, and protect your information.
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
        {/* Introduction */}
            <Card id="introduction">
              <CardHeader>
                <CardTitle className="text-2xl" style={{ color: '#D3B750' }}>Introduction</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
            <p className="text-lg text-muted-foreground leading-relaxed">
                  This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You respond to our advertisements and tells You about Your privacy rights and how the law protects You. We use Your Personal Data to contact and support you, as well as to provide and improve the Service. By using the Service, You agree to the collection and use of information in accordance with this Privacy Policy.
                </p>
              </CardContent>
            </Card>

            {/* Interpretation and Definitions */}
            <Card id="interpretation">
              <CardHeader>
                <CardTitle className="text-xl" style={{ color: '#D3B750' }}>Interpretation and Definitions</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <h4 className="font-semibold mt-4 mb-2">Interpretation</h4>
                <p>
                  The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.
                </p>
                
                <h4 className="font-semibold mt-6 mb-2">Definitions</h4>
                <p className="mb-4">For the purposes of this Privacy Policy:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Company</strong> (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to Indrani Enterprises and the registered trademark Kaaladi Handicrafts.</li>
                  <li><strong>Device</strong> means any device that can access the Service such as a computer, a cellphone or a digital tablet.</li>
                  <li><strong>Personal Data</strong> is any information that relates to an identified or identifiable individual.</li>
                  <li><strong>Service</strong> refers to the advertisement, website, or application.</li>
                  <li><strong>Service Provider</strong> means any natural or legal person who processes the data on behalf of the Company. It refers to third-party companies or individuals employed by the Company to facilitate the Service, to provide the Service on behalf of the Company, to perform services related to the Service or to assist the Company in analyzing how the Service is used.</li>
                  <li><strong>Usage Data</strong> refers to data collected automatically, either generated by the use of the Service or from the Service infrastructure itself (for example, the duration of a page visit).</li>
                  <li><strong>You</strong> means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.</li>
                </ul>
              </CardContent>
            </Card>

            {/* Collecting and Using Your Personal Data */}
            <Card id="collecting">
              <CardHeader>
                <CardTitle className="text-xl" style={{ color: '#D3B750' }}>Collecting and Using Your Personal Data</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p>
                  This section provides information about how we collect and use your personal data when you use our Service.
                </p>
              </CardContent>
            </Card>

            {/* Types of Data Collected */}
            <Card id="types">
              <CardHeader>
                <CardTitle className="text-xl" style={{ color: '#D3B750' }}>Types of Data Collected</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <h4 className="font-semibold mt-4 mb-2">Personal Data</h4>
                <p className="mb-4">
                  While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You. Personally identifiable information may include, but is not limited to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>First name and last name</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Location details such as your address, city, or country</li>
                  <li>Any other data such as personal preferences, requirements, or comments</li>
                  <li>GSTIN detail if you require GST Invoice</li>
                </ul>
              </CardContent>
            </Card>

            {/* Use of Your Personal Data */}
            <Card id="use">
              <CardHeader>
                <CardTitle className="text-xl" style={{ color: '#D3B750' }}>Use of Your Personal Data</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p className="mb-4">The Company may use Personal Data for the following purposes:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>To provide and maintain our Service:</strong> including to monitor the usage of our Service.</li>
                  <li><strong>To manage Your Account:</strong> to manage Your registration as a user of the Service. The Personal Data You provide can give You access to different functionalities of the Service that are available to You as a registered user.</li>
                  <li><strong>For the performance of a contract:</strong> the development, compliance and undertaking of the purchase contract for the products, items or services You have purchased or of any other contract with Us through the Service.</li>
                  <li><strong>To contact You:</strong> To contact You by email, telephone calls, SMS, or other equivalent forms of electronic communication, such as a mobile application's push notifications regarding updates or informative communications related to the functionalities, products or contracted services, including the security updates, when necessary or reasonable for their implementation.</li>
                  <li><strong>To provide You with news, special offers and general information:</strong> about other goods, services and events which we offer that are similar to those that you have already purchased or enquired about unless You have opted not to receive such information.</li>
                  <li><strong>To manage Your requests:</strong> To attend and manage Your requests to Us.</li>
                  <li><strong>For business transfers:</strong> We may use Your information to evaluate or conduct a merger, divestiture, restructuring, reorganization, dissolution, or other sale or transfer of some or all of Our assets, whether as a going concern or as part of bankruptcy, liquidation, or similar proceeding, in which Personal Data held by Us about our Service users is among the assets transferred.</li>
                  <li><strong>For other purposes:</strong> We may use Your information for other purposes, such as data analysis, identifying usage trends, determining the effectiveness of our promotional campaigns and to evaluate and improve our Service, products, services, marketing and your experience.</li>
                </ul>

                <h4 className="font-semibold mt-6 mb-2">We may share Your personal information in the following situations:</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>With Service Providers:</strong> We may share Your personal information with Service Providers to monitor and analyze the use of our Service, to contact You.</li>
                  <li><strong>For business transfers:</strong> We may share or transfer Your personal information in connection with, or during negotiations of, any merger, sale of Company assets, financing, or acquisition of all or a portion of Our business to another company.</li>
                  <li><strong>With Affiliates:</strong> We may share Your information with Our affiliates, in which case we will require those affiliates to honour this Privacy Policy. Affiliates include Our parent company and any other subsidiaries, joint venture partners or other companies that We control or that are under common control with Us.</li>
                  <li><strong>With business partners:</strong> We may share Your information with Our business partners to offer You certain products, services or promotions.</li>
                  <li><strong>With other users:</strong> When you share personal information or otherwise interact in public areas with other users, such information may be viewed by all users and may be publicly distributed outside.</li>
                  <li><strong>With Your consent:</strong> We may disclose Your personal information for any other purpose with Your consent.</li>
                </ul>
              </CardContent>
            </Card>

            {/* Retention of Your Personal Data */}
            <Card id="retention">
              <CardHeader>
                <CardTitle className="text-xl" style={{ color: '#D3B750' }}>Retention of Your Personal Data</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p>
                  The Company will retain Your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use Your Personal Data to the extent necessary to comply with our legal obligations (for example, if we are required to retain your data to comply with applicable laws), resolve disputes, and enforce our legal agreements and policies.
                </p>
                <p className="mt-4">
                  The Company will also retain Usage Data for internal analysis purposes.
                </p>
              </CardContent>
            </Card>

            {/* Transfer of Your Personal Data */}
            <Card id="transfer">
              <CardHeader>
                <CardTitle className="text-xl" style={{ color: '#D3B750' }}>Transfer of Your Personal Data</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p>
                  Your information, including Personal Data, is processed at the Company's operating offices and in any other places where the parties involved in the processing are located. It means that this information may be transferred to — and maintained on — computers located outside of Your state, province, country or other governmental jurisdiction where the data protection laws may differ than those from Your jurisdiction.
                </p>
                <p className="mt-4">
                  Your consent to this Privacy Policy followed by Your submission of such information represents Your agreement to that transfer.
                </p>
                <p className="mt-4">
                  The Company will take all steps reasonably necessary to ensure that Your data is treated securely and in accordance with this Privacy Policy and no transfer of Your Personal Data will take place to an organization or a country unless there are adequate controls in place including the security of Your data and other personal information.
                </p>
              </CardContent>
            </Card>

            {/* Disclosure of Your Personal Data */}
            <Card id="disclosure">
              <CardHeader>
                <CardTitle className="text-xl" style={{ color: '#D3B750' }}>Disclosure of Your Personal Data</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <h4 className="font-semibold mt-4 mb-2">Law enforcement</h4>
                <p>
                  Under certain circumstances, the Company may be required to disclose Your Personal Data if required to do so by law or in response to valid requests by public authorities (e.g. a court or a government agency).
                </p>

                <h4 className="font-semibold mt-6 mb-2">Other legal requirements</h4>
                <p className="mb-2">The Company may disclose Your Personal Data in the good faith belief that such action is necessary to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Comply with a legal obligation</li>
                  <li>Protect and defend the rights or property of the Company</li>
                  <li>Prevent or investigate possible wrongdoing in connection with the Service</li>
                  <li>Protect the personal safety of Users of the Service or the public</li>
                  <li>Protect against legal liability</li>
                </ul>
              </CardContent>
            </Card>

            {/* Security of Your Personal Data */}
            <Card id="security">
              <CardHeader>
                <CardTitle className="text-xl" style={{ color: '#D3B750' }}>Security of Your Personal Data</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p>
                  The security of Your Personal Data is important to Us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While We strive to use commercially acceptable means to protect Your Personal Data, We cannot guarantee its absolute security.
            </p>
          </CardContent>
        </Card>

            {/* Links to Other Websites */}
            <Card id="links">
              <CardHeader>
                <CardTitle className="text-xl" style={{ color: '#D3B750' }}>Links to Other Websites</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p>
                  Our Service may contain links to other websites that are not operated by Us. If You click on a third party link, You will be directed to that third party's site. We strongly advise You to review the Privacy Policy of every site You visit.
                </p>
                <p className="mt-4">
                  We have no control over and assume no responsibility for the content, privacy policies or practices of any third party sites or services.
                </p>
              </CardContent>
            </Card>

            {/* Changes to this Privacy Policy */}
            <Card id="changes">
              <CardHeader>
                <CardTitle className="text-xl" style={{ color: '#D3B750' }}>Changes to this Privacy Policy</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p>
                  We may update Our Privacy Policy from time to time. We will notify You of any changes by posting the new Privacy Policy on this page.
                </p>
                <p className="mt-4">
                  You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
                </p>
                <div className="mt-4 p-4 rounded-md" style={{ backgroundColor: '#D3B7501A', borderLeft: '4px solid #D3B750' }}>
                  <p className="font-semibold" style={{ color: '#D3B750' }}>
                    This Privacy Policy was last updated on 25/01/2024
                  </p>
        </div>
              </CardContent>
            </Card>

            {/* Contact Us */}
            <Card id="contact" style={{ backgroundColor: '#D3B7501A', borderColor: '#D3B75033' }}>
              <CardHeader>
                <CardTitle className="text-xl" style={{ color: '#D3B750' }}>Contact Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  If you have any questions about this Privacy Policy, You can contact us via email at:
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    asChild 
                    className="text-white"
                    style={{ backgroundColor: '#D3B750' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B89A3F'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#D3B750'}
                  >
                    <a href="mailto:reachus@indraniie.com">
                      <Mail className="w-4 h-4 mr-2" />
                      reachus@indraniie.com
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

export default PrivacyPolicy;
