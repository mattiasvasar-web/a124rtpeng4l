import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import hero from "@/assets/hero-flatlay.jpg";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type Product } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { Truck, Banknote, Leaf } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WhiteMint OÜ – kotid, kleidid ja karbid" },
      { name: "description", content: "WhiteMint veebipood: käsitsi valitud kotid, kleidid ja kinkekarbid. Tarne Omniva ja DPD pakiautomaati." },
      { property: "og:title", content: "WhiteMint OÜ – kotid, kleidid ja karbid" },
      { property: "og:description", content: "Käsitsi valitud kotid, kleidid ja kinkekarbid. Tarne Omniva ja DPD pakiautomaati." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const q = useQuery({
    queryKey: ["products", "home"],
    queryFn: async () => ((await supabase.from("products").select("*").eq("active", true).order("created_at", { ascending: false }).limit(6)).data ?? []) as Product[],
  });
  return (
    <main>
      <section className="bg-hero">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-primary">WhiteMint OÜ</p>
            <h1 className="mt-4 text-6xl font-semibold leading-[0.95] md:text-7xl">Värske ja ilus <em className="text-primary">igaks päevaks</em></h1>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">Kotid, kleidid, karbid ja palju muud – hoolega valitud ja armastusega pakitud.</p>
            <div className="mt-8 flex gap-3">
              <Button asChild size="lg" className="rounded-full"><Link to="/tooted">Vaata tooteid</Link></Button>
              <Button asChild size="lg" variant="outline" className="rounded-full"><Link to="/galerii">Galerii</Link></Button>
            </div>
          </div>
          <img src={hero} alt="Linane kott, mündiroheline kleit ja kinkekarbid" width={1600} height={1104} className="rounded-[2rem] shadow-soft" />
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-12 md:grid-cols-3">
        {[
          { icon: Truck, t: "Omniva ja DPD", d: "Tarne pakiautomaati üle Eesti või tule ise järele." },
          { icon: Banknote, t: "Sularaha või ülekanne", d: "Maksa kättesaamisel või pangaülekandega." },
          { icon: Leaf, t: "Hoolega valitud", d: "Iga toode on valitud kvaliteeti ja ilu silmas pidades." },
        ].map(({ icon: I, t, d }) => (
          <div key={t} className="rounded-2xl border bg-card p-6">
            <I className="h-6 w-6 text-primary" />
            <h3 className="mt-3 text-2xl font-semibold">{t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-end justify-between">
          <h2 className="text-4xl font-semibold">Uued tooted</h2>
          <Link to="/tooted" className="text-sm text-primary hover:underline">Kõik tooted →</Link>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {q.data?.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>
    </main>
  );
}
