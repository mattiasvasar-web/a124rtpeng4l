import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/eritellimus")({
  head: () => seo("Eritellimus", "Tellida WhiteMintilt eritellimusena kott, kleit või muu ese oma soovide järgi."),
  component: CustomOrder,
});

const schema = z.object({
  name: z.string().trim().min(1, "Sisesta nimi").max(100),
  email: z.string().trim().email("Vigane e-post").max(255),
  phone: z.string().trim().max(30),
  description: z.string().trim().min(10, "Kirjelda oma soovi vähemalt paari lausega").max(3000),
  budget: z.string().trim().max(100),
});

function CustomOrder() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      name: f.get("name"), email: f.get("email"), phone: f.get("phone"),
      description: f.get("description"), budget: f.get("budget"),
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Vigased andmed"); return; }
    setBusy(true);
    const { error } = await supabase.from("custom_orders").insert({
      user_id: user?.id ?? null,
      customer_name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      description: parsed.data.description,
      budget: parsed.data.budget,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-14 text-center">
        <h1 className="text-5xl font-semibold">Aitäh!</h1>
        <p className="mt-4 text-muted-foreground">
          Sinu eritellimuse päring on saadetud. Võtame sinuga peagi e-posti teel ühendust, et täpsustada detaile, hinna ja tarneviisi.
          Tasumine käib kokkuleppel sularahas või pangaülekandega.
        </p>
        <Button asChild className="mt-6 rounded-full"><Link to="/tooted">Vaata tooteid</Link></Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="text-5xl font-semibold">Eritellimus</h1>
      <p className="mt-4 text-muted-foreground">
        Soovid midagi erilist — kotti, kleiti, karpi või muud eset oma mõõtude, värvide või kangaga? Kirjelda oma soovi ja teeme sulle personaalse pakkumise.
        Tasuda saab sularahas kättesaamisel või pangaülekandega.
      </p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <div><Label htmlFor="name">Nimi</Label><Input id="name" name="name" required maxLength={100} /></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div><Label htmlFor="email">E-post</Label><Input id="email" name="email" type="email" required defaultValue={user?.email ?? ""} /></div>
          <div><Label htmlFor="phone">Telefon (valikuline)</Label><Input id="phone" name="phone" maxLength={30} /></div>
        </div>
        <div>
          <Label htmlFor="description">Sinu soov</Label>
          <Textarea id="description" name="description" rows={6} required maxLength={3000}
            placeholder="Nt millist eset soovid, mõõdud, värv, kangas, tähtaeg…" />
        </div>
        <div><Label htmlFor="budget">Eelarve (valikuline)</Label><Input id="budget" name="budget" maxLength={100} placeholder="Nt kuni 80 €" /></div>
        <Button type="submit" size="lg" className="w-full rounded-full" disabled={busy}>{busy ? "Saadan…" : "Saada päring"}</Button>
      </form>
    </main>
  );
}
