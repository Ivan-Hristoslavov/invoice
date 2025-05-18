"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function PaymentIntegrationsPage() {
  const [activeTab, setActiveTab] = useState("apple-pay");
  const [isApplePayEnabled, setIsApplePayEnabled] = useState(false);
  const [isGooglePayEnabled, setIsGooglePayEnabled] = useState(false);
  const [isStripeEnabled, setIsStripeEnabled] = useState(false);
  const [isPaymentLinkEnabled, setIsPaymentLinkEnabled] = useState(false);
  
  const handleSaveSettings = () => {
    toast.success("Settings saved", {
      description: "Your payment integration settings have been updated."
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/settings">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Settings
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Payment Integrations</h1>
        </div>
        <Button onClick={handleSaveSettings}>
          Save Settings
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Payment Processing</CardTitle>
          <CardDescription>
            Configure payment gateways to enable clients to pay invoices directly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-md mb-6">
            <h3 className="font-medium text-amber-800 mb-2">Coming Soon</h3>
            <p className="text-amber-700 text-sm">
              Integration with payment providers is currently in development. The settings on this page 
              are placeholders for upcoming functionality. Currently, you can record payments manually
              that were received through these methods.
            </p>
          </div>
          
          <Tabs defaultValue="apple-pay" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="apple-pay">Apple Pay</TabsTrigger>
              <TabsTrigger value="google-pay">Google Pay</TabsTrigger>
              <TabsTrigger value="stripe">Stripe</TabsTrigger>
              <TabsTrigger value="payment-links">Payment Links</TabsTrigger>
            </TabsList>
            
            <TabsContent value="apple-pay">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-lg">Enable Apple Pay</h3>
                    <p className="text-muted-foreground text-sm">Allow clients to pay invoices using Apple Pay</p>
                  </div>
                  <Switch 
                    checked={isApplePayEnabled} 
                    onCheckedChange={setIsApplePayEnabled} 
                    id="apple-pay-enabled"
                  />
                </div>
                
                {isApplePayEnabled && (
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="apple-merchant-id">Merchant ID</Label>
                        <Input id="apple-merchant-id" placeholder="merchant.com.yourcompany.app" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apple-merchant-cert">Merchant Certificate</Label>
                        <Input id="apple-merchant-cert" type="file" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="apple-domain-verification">Domain Verification File</Label>
                      <Input id="apple-domain-verification" type="file" />
                    </div>
                    
                    <div className="p-3 bg-muted rounded text-sm">
                      <p className="flex items-center gap-1">
                        <ExternalLink className="w-4 h-4" />
                        <a 
                          href="https://developer.apple.com/documentation/apple_pay_on_the_web" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Learn more about Apple Pay integration
                        </a>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="google-pay">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-lg">Enable Google Pay</h3>
                    <p className="text-muted-foreground text-sm">Allow clients to pay invoices using Google Pay</p>
                  </div>
                  <Switch 
                    checked={isGooglePayEnabled} 
                    onCheckedChange={setIsGooglePayEnabled} 
                    id="google-pay-enabled"
                  />
                </div>
                
                {isGooglePayEnabled && (
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="google-merchant-id">Merchant ID</Label>
                        <Input id="google-merchant-id" placeholder="1234567890" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="google-merchant-name">Merchant Name</Label>
                        <Input id="google-merchant-name" placeholder="Your Business Name" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="google-api-key">Google Pay API Key</Label>
                      <Input id="google-api-key" type="password" />
                    </div>
                    
                    <div className="p-3 bg-muted rounded text-sm">
                      <p className="flex items-center gap-1">
                        <ExternalLink className="w-4 h-4" />
                        <a 
                          href="https://developers.google.com/pay/api" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Learn more about Google Pay integration
                        </a>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="stripe">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-lg">Enable Stripe</h3>
                    <p className="text-muted-foreground text-sm">Process credit card payments through Stripe</p>
                  </div>
                  <Switch 
                    checked={isStripeEnabled} 
                    onCheckedChange={setIsStripeEnabled} 
                    id="stripe-enabled"
                  />
                </div>
                
                {isStripeEnabled && (
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="stripe-public-key">Publishable Key</Label>
                        <Input id="stripe-public-key" placeholder="pk_test_..." />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stripe-secret-key">Secret Key</Label>
                        <Input id="stripe-secret-key" type="password" placeholder="sk_test_..." />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="stripe-webhook-secret">Webhook Secret</Label>
                      <Input id="stripe-webhook-secret" type="password" placeholder="whsec_..." />
                    </div>
                    
                    <div className="p-3 bg-muted rounded text-sm">
                      <p className="flex items-center gap-1">
                        <ExternalLink className="w-4 h-4" />
                        <a 
                          href="https://stripe.com/docs/payments" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Learn more about Stripe integration
                        </a>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="payment-links">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-lg">Enable Payment Links</h3>
                    <p className="text-muted-foreground text-sm">Generate shareable links for clients to pay invoices</p>
                  </div>
                  <Switch 
                    checked={isPaymentLinkEnabled} 
                    onCheckedChange={setIsPaymentLinkEnabled} 
                    id="payment-link-enabled"
                  />
                </div>
                
                {isPaymentLinkEnabled && (
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="link-expiration">Link Expiration</Label>
                        <select 
                          id="link-expiration" 
                          className="w-full px-3 py-2 border border-input bg-background rounded-md"
                        >
                          <option value="never">Never</option>
                          <option value="24h">24 hours</option>
                          <option value="7d">7 days</option>
                          <option value="30d">30 days</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="link-payments">Allowed Payment Methods</Label>
                        <select 
                          id="link-payments" 
                          className="w-full px-3 py-2 border border-input bg-background rounded-md"
                        >
                          <option value="all">All Available Methods</option>
                          <option value="cards">Credit Cards Only</option>
                          <option value="wallets">Digital Wallets Only</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded bg-green-50 border border-green-200">
                      <h4 className="font-medium text-green-700 mb-1 flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        How it works
                      </h4>
                      <p className="text-sm text-green-700">
                        When enabled, a "Pay Now" button will appear on client invoices. 
                        You can also generate and share payment links directly from invoice details.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Client-Facing Payment Page</CardTitle>
          <CardDescription>
            Customize the payment experience your clients will see
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="payment-page-logo">Company Logo</Label>
              <Input id="payment-page-logo" type="file" />
              <p className="text-xs text-muted-foreground mt-1">Recommended size: 200x60px</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment-page-color">Brand Color</Label>
              <Input id="payment-page-color" type="color" defaultValue="#4F46E5" className="h-10 w-20" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment-page-message">Thank You Message</Label>
              <Input 
                id="payment-page-message" 
                placeholder="Thank you for your payment!" 
                defaultValue="Thank you for your payment! We appreciate your business."
              />
            </div>
            
            <Separator className="my-6" />
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Enable Payment Receipts</h3>
                <p className="text-sm text-muted-foreground">Automatically send email receipts when payments are received</p>
              </div>
              <Switch id="enable-receipts" defaultChecked />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSaveSettings}>Save Changes</Button>
        </CardFooter>
      </Card>
    </div>
  );
} 