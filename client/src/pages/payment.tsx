import { useState, useEffect, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { QRCodeSVG } from "qrcode.react";
import { db, type Order } from "@/lib/mock-data";
import { ShieldCheck, Clock, AlertCircle, CheckCircle2, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import meshBg from "@assets/generated_images/subtle_light_fintech_mesh_gradient_background.png";
import logoImage from "@assets/generated_images/minimalist_abstract_shield_logo_for_fintech_app.png";

export default function PaymentPage() {
  const [match, params] = useRoute("/pay/:id");
  const [order, setOrder] = useState<Order | undefined>(undefined);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [, setLocation] = useLocation();

  // Polling for order status and data
  useEffect(() => {
    if (!match || !params?.id) return;

    // Initial fetch
    const fetchOrder = () => {
      const found = db.getOrder(params.id);
      setOrder(found ? { ...found } : undefined);
      return found;
    };

    fetchOrder();

    // Subscribe to DB updates
    const unsubscribe = db.subscribe(() => {
      fetchOrder();
    });

    // Interval for checking expiration
    const interval = setInterval(() => {
      const current = fetchOrder();
      if (current) {
        const now = new Date().getTime();
        const expireTime = new Date(current.expiresAt).getTime();
        const diff = Math.max(0, Math.floor((expireTime - now) / 1000));
        
        setTimeLeft(diff);

        if (diff === 0 && current.status === 'PENDING') {
          db.expireOrder(current.id);
        }
      }
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [match, params?.id]);

  // Simulate Payment from another device
  const handleSimulatePayment = () => {
    if (!order) return;
    db.completeOrder(order.id, "Simulated User", order.amount);
  };

  if (!match || !params?.id) {
    return <div>Invalid URL</div>;
  }

  if (!order) {
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

  // UPI String construction
  const upiString = `upi://pay?pa=${order.upiId}&pn=ChargePayMerchant&am=${order.amount.toFixed(2)}&tr=${order.id}&tn=${order.id}`;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Mesh */}
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
          {/* Status Header */}
          <div className={`h-2 w-full ${
            order.status === 'COMPLETED' ? 'bg-emerald-500' : 
            order.status === 'EXPIRED' ? 'bg-destructive' : 
            'bg-primary animate-pulse'
          }`} />

          <CardHeader className="text-center pb-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">Payment Request</p>
            <h1 className="text-4xl font-extrabold font-heading text-foreground">
              ₹{order.amount.toFixed(2)}
            </h1>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-2 bg-muted/50 py-1 px-3 rounded-full w-fit mx-auto">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Ref: {order.id}</span>
            </div>
          </CardHeader>

          <Separator className="my-4 opacity-50" />

          <CardContent className="flex flex-col items-center space-y-6">
            
            {/* QR Section */}
            <div className="relative group">
              {order.status === 'PENDING' ? (
                <div className="p-4 bg-white rounded-xl border border-border shadow-sm relative">
                  <QRCodeSVG 
                    value={upiString} 
                    size={200}
                    level={"M"}
                    includeMargin={true}
                    className="rounded-lg"
                  />
                  
                  {/* Brand Icon Overlay */}
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

            {/* Timer / Status */}
            <div className="text-center">
              {order.status === 'PENDING' ? (
                 <div className="flex items-center gap-2 text-orange-600 font-medium bg-orange-50 px-4 py-2 rounded-full animate-pulse">
                   <Clock className="w-4 h-4" />
                   <span>Expires in {formatTime(timeLeft)}</span>
                 </div>
              ) : order.status === 'COMPLETED' ? (
                <p className="text-emerald-600 font-medium">Transaction Completed</p>
              ) : (
                <p className="text-destructive font-medium">Please regenerate order</p>
              )}
            </div>

            {/* Helper Text */}
            {order.status === 'PENDING' && (
              <p className="text-sm text-center text-muted-foreground max-w-[250px]">
                Scan with any UPI app (GPay, PhonePe, Paytm) to complete payment.
              </p>
            )}

          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2 pb-8">
            {order.status === 'PENDING' && (
              <>
                <Button className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all" onClick={handleSimulatePayment}>
                  Pay ₹{order.amount} via UPI
                </Button>
                
                <div className="grid grid-cols-2 gap-3 w-full">
                   <Button variant="outline" className="w-full border-dashed">
                     <Download className="w-4 h-4 mr-2" />
                     Save QR
                   </Button>
                   <Button variant="outline" className="w-full border-dashed">
                     <Share2 className="w-4 h-4 mr-2" />
                     Share
                   </Button>
                </div>
              </>
            )}
             {order.status !== 'PENDING' && (
                <Button variant="outline" className="w-full" onClick={() => setLocation('/')}>
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
               {/* Simulated partner logos text */}
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
