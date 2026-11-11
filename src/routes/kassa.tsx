import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { deliveryLabel, eur, paymentLabel, shippingCost, useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/kassa")({
  head: () => seo("Kassa", "Vormista oma WhiteMint tellimus."),
  component: Checkout,
});

const schema = z.object({
  name: z.string().trim().min(1, "Sisesta nimi").max(100),
  email: z.string().trim().email("Vigane e-post").max(255),
  phone: z.string().trim().min(5, "Sisesta telefon").max(30),
});

function Checkout() {
  const c = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState("omniva");
  const [payment, setPayment] = useState("cash");
  const [point, setPoint] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const ship = shippingCost(delivery);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const parsed = schema.safeParse({ name: f.get("name"), email: f.get("email"), phone: f.get("phone") });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Vigased andmed"); return; }
    if (delivery !== "pickup" && !point.trim()) { toast.error("Sisesta pakiautomaadi asukoht"); return; }
    if (!agree) { toast.error("Nõustu tingimustega"); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc("place_order", {
      _name: parsed.data.name, _email: parsed.data.email, _phone: parsed.data.phone,
      _delivery: delivery, _point: point.trim().slice(0, 200), _payment: payment,
      _note: String(f.get("note") ?? ""), _items: c.items.map((i) => ({ id: i.id, qty: i.qty })),
    });
    setBusy(false);
    if (error || !data?.[0]) { toast.error(error?.message ?? "Tellimust ei õnnestunud esitada"); return; }
    c.clear();
    navigate({ to: "/tellimus/$id", params: { id: data[0].order_id } });
  }

  if (c.items.length === 0) return <main className="mx-auto max-w-3xl px-4 py-14">Ostukorv on tühi. <Link to="/tooted" className="text-primary">Vaata tooteid</Link></main>;

  return (
    <main className="mx-auto grid max-w-5xl gap-10 px-4 py-14 md:grid-cols-[1fr_320px]">
      <form onSubmit={submit} className="space-y-8">
        <h1 className="text-5xl font-semibold">Kassa</h1>
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Kontaktandmed</h2>
          <div><Label htmlFor="name">Nimi</Label><Input id="name" name="name" required maxLength={100} /></div>
          <div><Label htmlFor="email">E-post</Label><Input id="email" name="email" type="email" required defaultValue={user?.email ?? ""} /></div>
          <div><Label htmlFor="phone">Telefon</Label><Input id="phone" name="phone" required maxLength={30} /></div>
        </section>
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Tarneviis</h2>
          <RadioGroup value={delivery} onValueChange={setDelivery} className="gap-2">
            {Object.entries(deliveryLabel).map(([k, v]) => (
              <label key={k} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                <RadioGroupItem value={k} /> <span className="flex-1">{v}</span>
                <span className="text-sm text-muted-foreground">{shippingCost(k) ? eur(shippingCost(k)) : "Tasuta"}</span>
              </label>
            ))}
          </RadioGroup>
          {delivery !== "pickup" && (
            <div><Label htmlFor="point">Pakiautomaat (linn ja asukoht)</Label>
              <Input id="point" value={point} onChange={(e) => setPoint(e.target.value)} placeholder="Nt Tallinn, Rocca al Mare Selver" maxLength={200} /></div>
          )}
        </section>
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Makseviis</h2>
          <RadioGroup value={payment} onValueChange={setPayment} className="gap-2">
            {Object.entries(paymentLabel).map(([k, v]) => (
              <label key={k} className="flex items-center gap-3 rounded-xl border bg-card p-3"><RadioGroupItem value={k} />{v}</label>
            ))}
          </RadioGroup>
        </section>
        <div><Label htmlFor="note">Lisainfo (valikuline)</Label><Textarea id="note" name="note" maxLength={500} /></div>
        <label className="flex items-start gap-2 text-sm">
          <Checkbox checked={agree} onCheckedChange={(v) => setAgree(!!v)} />
          <span>Nõustun <Link to="/tingimused" className="text-primary underline">müügitingimuste</Link> ja <Link to="/privaatsus" className="text-primary underline">andmetöötlusega</Link>.</span>
        </label>
        <Button type="submit" size="lg" className="w-full rounded-full" disabled={busy}>{busy ? "Saadan…" : `Esita tellimus (${eur(c.subtotal + ship)})`}</Button>
      </form>
      <aside className="h-fit rounded-2xl border bg-card p-5">
        <h2 className="text-2xl font-semibold">Kokkuvõte</h2>
        <ul className="mt-3 space-y-1 text-sm">{c.items.map((i) => <li key={i.id} className="flex justify-between"><span>{i.qty} × {i.name}</span><span>{eur(i.qty * i.price)}</span></li>)}</ul>
        <div className="mt-3 border-t pt-3 text-sm">
          <p className="flex justify-between"><span>Transport</span><span>{eur(ship)}</span></p>
          <p className="mt-1 flex justify-between text-lg font-semibold"><span>Kokku</span><span>{eur(c.subtotal + ship)}</span></p>
        </div>
      </aside>
    </main>
  );
}
