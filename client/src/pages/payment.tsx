import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { ordersApi, type Order } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { ShieldCheck, Clock, AlertCircle, CheckCircle2, Download, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import meshBg from "@assets/generated_images/subtle_light_fintech_mesh_gradient_background.png";
import logoImage from "@assets/generated_images/minimalist_abstract_shield_logo_for_fintech_app.png";

const ORDER_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

export default function PaymentPage() {
  const [match, params] = useRoute("/pay/:id");
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [, setLocation] = useLocation();

  const { data: order, isLoading, error } = useQuery({
    queryKey: ["/api/orders", params?.id],
    queryFn: () => ordersApi.getOne(params?.id || ""),
    enabled: !!params?.id,
    refetchInterval: 3000,
  });

  const simulatePaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "android.title": `Simulated User paid you ₹${order?.amount || 0}`,
          "android.text": order?.orderId || "",
          "android.bigText": order?.orderId || "",
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders", params?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  useEffect(() => {
    if (!order) return;

    const interval = setInterval(() => {
      const createdAt = new Date(order.createdAt).getTime();
      const now = Date.now();
      const elapsed = now - createdAt;
      const remaining = Math.max(0, Math.floor((ORDER_TIMEOUT_MS - elapsed) / 1000));
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [order]);

  if (!match || !params?.id) {
    return <div>Invalid URL</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md border-destructive/20 shadow-2xl">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold text-destructive mb-2">Order Not Found</h2>
            <p className="text-muted-foreground">This payment link is invalid or does not exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const upiString = `upi://pay?pa=${order.receiverUpiId}&pn=ChargePayMerchant&am=${order.amount}&tr=${order.orderId}&tn=${order.orderId}`;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isExpired = timeLeft === 0 && order.status === "PENDING";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      <div 
        className="absolute inset-0 z-0 opacity-50 pointer-events-none"
        style={{ 
          backgroundImage: `url(${meshBg})`, 
          backgroundSize: 'cover',
          backgroundPosition: 'center' 
        }}
      />
      
      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src={logoImage} alt="Logo" className="w-8 h-8 rounded-sm shadow-sm" />
          <span className="text-2xl font-bold font-heading text-foreground tracking-tight">ChargePay</span>
        </div>

        <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-xl ring-1 ring-black/5 overflow-hidden">
          <div className={`h-2 w-full ${
            order.status === 'COMPLETED' ? 'bg-emerald-500' : 
            order.status === 'EXPIRED' || isExpired ? 'bg-destructive' : 
            'bg-primary animate-pulse'
          }`} />

          <CardHeader className="text-center pb-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">Payment Request</p>
            <h1 className="text-4xl font-extrabold font-heading text-foreground" data-testid="text-amount">
              ₹{order.amount.toLocaleString()}
            </h1>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-2 bg-muted/50 py-1 px-3 rounded-full w-fit mx-auto">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span data-testid="text-order-id">Ref: {order.orderId}</span>
            </div>
          </CardHeader>

          <Separator className="my-4 opacity-50" />

          <CardContent className="flex flex-col items-center space-y-6">
            <div className="relative group">
              {order.status === 'PENDING' && !isExpired ? (
                <div className="p-4 bg-white rounded-xl border border-border shadow-sm relative">
                  <QRCodeSVG 
                    value={upiString} 
                    size={200}
                    level={"M"}
                    includeMargin={true}
                    className="rounded-lg"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100">
                      <img src={logoImage} alt="" className="w-6 h-6 rounded-full" />
                    </div>
                  </div>
                </div>
              ) : order.status === 'COMPLETED' ? (
                <div className="w-[232px] h-[232px] bg-emerald-50/50 rounded-xl border border-emerald-100 flex flex-col items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-16 h-16 mb-4" />
                  <span className="font-bold text-lg">Payment Successful</span>
                </div>
              ) : (
                <div className="w-[232px] h-[232px] bg-destructive/5 rounded-xl border border-destructive/10 flex flex-col items-center justify-center text-destructive">
                  <AlertCircle className="w-16 h-16 mb-4" />
                  <span className="font-bold text-lg">Link Expired</span>
                </div>
              )}
            </div>

            <div className="text-center">
              {order.status === 'PENDING' && !isExpired ? (
                <div className="flex items-center gap-2 text-orange-600 font-medium bg-orange-50 px-4 py-2 rounded-full animate-pulse">
                  <Clock className="w-4 h-4" />
                  <span data-testid="text-timer">Expires in {formatTime(timeLeft)}</span>
                </div>
              ) : order.status === 'COMPLETED' ? (
                <p className="text-emerald-600 font-medium" data-testid="text-status">Transaction Completed</p>
              ) : (
                <p className="text-destructive font-medium" data-testid="text-status">Please regenerate order</p>
              )}
            </div>

            {order.status === 'PENDING' && !isExpired && (
              <p className="text-sm text-center text-muted-foreground max-w-[250px]">
                Scan with any UPI app (GPay, PhonePe, Paytm) to complete payment.
              </p>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2 pb-8">
            {order.status === 'PENDING' && !isExpired && (
              <>
                <Button 
                  className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all" 
                  onClick={() => simulatePaymentMutation.mutate()}
                  disabled={simulatePaymentMutation.isPending}
                  data-testid="button-simulate-pay"
                >
                  {simulatePaymentMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Pay ₹{order.amount.toLocaleString()} via UPI
                </Button>
                
                <div className="grid grid-cols-2 gap-3 w-full">
                  <Button 
                    variant="outline" 
                    className="w-full border-dashed" 
                    data-testid="button-download-qr"
                    onClick={async () => {
                      try {
                        const qrPath = order.qrPath || `/uploads/qr/${order.orderId}.png`;
                        const response = await fetch(qrPath);
                        if (!response.ok) throw new Error("Failed to fetch QR");
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `ChargePay-QR-${order.orderId}.png`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                      } catch (error) {
                        console.error("Download failed:", error);
                        alert("Failed to download QR. Please try again.");
                      }
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Save QR
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-dashed" 
                    data-testid="button-share"
                    onClick={async () => {
                      try {
                        if (navigator.share) {
                          const qrPath = order.qrPath || `/uploads/qr/${order.orderId}.png`;
                          const response = await fetch(qrPath);
                          if (response.ok) {
                            const blob = await response.blob();
                            const file = new File([blob], `ChargePay-QR-${order.orderId}.png`, { type: "image/png" });
                            
                            const shareData: ShareData = {
                              title: `Payment Request - ₹${order.amount}`,
                              text: `Pay ₹${order.amount} to complete your order. Scan QR with GPay/PhonePe/Paytm.`,
                            };
                            
                            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                              shareData.files = [file];
                            } else {
                              shareData.url = window.location.href;
                            }
                            
                            await navigator.share(shareData);
                          } else {
                            await navigator.share({
                              title: `Payment Request - ₹${order.amount}`,
                              text: `Pay ₹${order.amount} to complete your order.`,
                              url: window.location.href,
                            });
                          }
                        } else {
                          await navigator.clipboard.writeText(window.location.href);
                          alert("Link copied to clipboard!");
                        }
                      } catch (error) {
                        if ((error as Error).name !== "AbortError") {
                          await navigator.clipboard.writeText(window.location.href);
                          alert("Link copied to clipboard!");
                        }
                      }
                    }}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </>
            )}
            {(order.status !== 'PENDING' || isExpired) && (
              <Button variant="outline" className="w-full" onClick={() => setLocation('/')} data-testid="button-new-order">
                Create New Order
              </Button>
            )}
          </CardFooter>
        </Card>
        
        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-muted-foreground/60">
            Secured by ChargePay • RBI Compliant • End-to-End Encrypted
          </p>
          <div className="flex justify-center gap-4 opacity-40 grayscale">
            <span className="font-bold text-xs">GPay</span>
            <span className="font-bold text-xs">PhonePe</span>
            <span className="font-bold text-xs">Paytm</span>
            <span className="font-bold text-xs">BHIM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
