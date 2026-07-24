import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getApplicationById, processPayment } from "@/lib/applications.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Smartphone, Building2, Wallet, ShieldCheck, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const appQuery = (id: string) => queryOptions({ queryKey: ["application", id], queryFn: () => getApplicationById({ data: { id } }) });

export const Route = createFileRoute("/_authenticated/payment/$applicationId")({
  head: () => ({ meta: [{ title: "Payment — EventCompass AI" }, { name: "robots", content: "noindex" }] }),
  loader: ({ params, context }) => context.queryClient.ensureQueryData(appQuery(params.applicationId)),
  component: PaymentPage,
});

const METHODS = [
  { id: "card", label: "Credit / Debit Card", icon: CreditCard },
  { id: "upi", label: "UPI", icon: Smartphone },
  { id: "netbanking", label: "Net Banking", icon: Building2 },
  { id: "wallet", label: "Wallet", icon: Wallet },
];

function PaymentPage() {
  const { applicationId } = Route.useParams();
  const { data: app } = useSuspenseQuery(appQuery(applicationId));
  const navigate = useNavigate();
  const payFn = useServerFn(processPayment);
  const [method, setMethod] = useState("card");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [upi, setUpi] = useState("");
  const [processing, setProcessing] = useState(false);

  const mutation = useMutation({
    mutationFn: () => payFn({ data: { applicationId, method, simulateSuccess: true } }),
    onSuccess: (res) => {
      setProcessing(false);
      if (res.ok) {
        toast.success("Payment successful!");
        navigate({ to: "/application/$id", params: { id: applicationId } });
      } else {
        toast.error("Payment failed. Try again.");
      }
    },
    onError: () => { setProcessing(false); toast.error("Payment could not be processed."); },
  });

  if (!app) {
    return <div className="p-20 text-center">Application not found. <Link to="/events" className="text-primary">Browse events</Link></div>;
  }
  if (app.payment_status === "paid") {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
        <div className="mt-3 text-xl font-bold">Already paid</div>
        <Link to="/application/$id" params={{ id: applicationId }} className="text-primary text-sm">View application</Link>
      </div>
    );
  }

  const submit = () => {
    if (method === "card") {
      if (!/^\d{12,19}$/.test(card.number.replace(/\s/g, ""))) return toast.error("Enter a valid card number");
      if (!card.name.trim()) return toast.error("Enter name on card");
      if (!/^\d{2}\/\d{2}$/.test(card.expiry)) return toast.error("Expiry format MM/YY");
      if (!/^\d{3,4}$/.test(card.cvv)) return toast.error("Invalid CVV");
    } else if (method === "upi") {
      if (!/^[\w.\-]+@[\w]+$/.test(upi)) return toast.error("Enter a valid UPI ID (e.g. name@upi)");
    }
    setProcessing(true);
    setTimeout(() => mutation.mutate(), 1400);
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/events/$slug" params={{ slug: (app as any).events.slug }} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to event
      </Link>

      <div className="grid lg:grid-cols-[1fr,360px] gap-6">
        <Card className="p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6"><ShieldCheck className="h-5 w-5 text-emerald-500" /><span className="text-sm text-muted-foreground">Secure mock payment gateway · demo mode</span></div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
            {METHODS.map((m) => (
              <button key={m.id} type="button" onClick={() => setMethod(m.id)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-all ${method === m.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:border-primary/40"}`}>
                <m.icon className={`h-5 w-5 ${method === m.id ? "text-primary" : "text-muted-foreground"}`} />
                <span className="font-medium text-xs">{m.label}</span>
              </button>
            ))}
          </div>

          {method === "card" && (
            <div className="space-y-4">
              <div><Label className="text-xs">Card number</Label>
                <Input inputMode="numeric" maxLength={19} placeholder="4242 4242 4242 4242"
                  value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} />
              </div>
              <div><Label className="text-xs">Name on card</Label>
                <Input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs">Expiry (MM/YY)</Label>
                  <Input placeholder="12/28" maxLength={5} value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} />
                </div>
                <div><Label className="text-xs">CVV</Label>
                  <Input type="password" maxLength={4} value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} />
                </div>
              </div>
            </div>
          )}
          {method === "upi" && (
            <div><Label className="text-xs">UPI ID</Label>
              <Input placeholder="name@okhdfcbank" value={upi} onChange={(e) => setUpi(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-2">A collect request will be sent to your UPI app.</p>
            </div>
          )}
          {method === "netbanking" && (
            <div><Label className="text-xs">Select bank</Label>
              <select className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option>HDFC Bank</option><option>ICICI Bank</option><option>SBI</option><option>Axis Bank</option><option>Kotak</option>
              </select>
            </div>
          )}
          {method === "wallet" && (
            <div><Label className="text-xs">Select wallet</Label>
              <select className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option>Paytm</option><option>PhonePe</option><option>Amazon Pay</option><option>Mobikwik</option>
              </select>
            </div>
          )}

          <Button size="lg" className="w-full mt-8 bg-gradient-brand text-white shadow-glow h-14"
            disabled={processing || mutation.isPending} onClick={submit}>
            {processing || mutation.isPending ? (
              <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Processing payment…</>
            ) : (
              <>Pay ₹{app.amount}</>
            )}
          </Button>
        </Card>

        <aside>
          <Card className="p-6 sticky top-6">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Order summary</div>
            <div className="font-semibold text-lg leading-tight">{(app as any).events.title}</div>
            <Badge variant="outline" className="mt-2">{(app as any).events.event_type}</Badge>
            <div className="mt-6 space-y-2 text-sm">
              <Row label="Registration" value={`₹${app.amount}`} />
              <Row label="Platform fee" value="₹0" />
              <Row label="Tax" value="Included" />
              <div className="border-t my-3" />
              <div className="flex items-center justify-between font-bold text-lg">
                <span>Total</span><span>₹{app.amount}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              This is a demo checkout — no real charges are made. A transaction receipt is generated in your history.
            </p>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>;
}
