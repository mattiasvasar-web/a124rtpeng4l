import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type Product } from "@/components/site/ProductCard";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tooted")({
  head: () => seo("Tooted", "Kõik WhiteMint tooted: kotid, kleidid, karbid ja muu."),
  component: Products,
});

function Products() {
  const [cat, setCat] = useState("Kõik");
  const q = useQuery({
    queryKey: ["products", "all"],
    queryFn: async () => ((await supabase.from("products").select("*").eq("active", true).order("created_at", { ascending: false })).data ?? []) as Product[],
  });
  const cats = ["Kõik", ...Array.from(new Set((q.data ?? []).map((p) => p.category)))];
  const list = (q.data ?? []).filter((p) => cat === "Kõik" || p.category === cat);
  return (
    <main className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-5xl font-semibold">Tooted</h1>
      <div className="mt-6 flex flex-wrap gap-2">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={cn("rounded-full border px-4 py-1.5 text-sm", c === cat ? "bg-primary text-primary-foreground" : "bg-card hover:bg-secondary")}>{c}</button>
        ))}
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
      {q.isSuccess && list.length === 0 && <p className="mt-8 text-muted-foreground">Tooteid pole veel lisatud.</p>}
    </main>
  );
}
