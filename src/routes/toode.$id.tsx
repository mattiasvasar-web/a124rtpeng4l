import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MediaImg } from "@/lib/media";
import { eur, useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import type { Product } from "@/components/site/ProductCard";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/toode/$id")({
  head: () => seo("Toode", "WhiteMint toote info ja hind."),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const cart = useCart();
  const q = useQuery({
    queryKey: ["product", id],
    queryFn: async () => (await supabase.from("products").select("*").eq("id", id).maybeSingle()).data as Product | null,
  });
  const p = q.data;
  if (q.isLoading) return <main className="mx-auto max-w-6xl px-4 py-14">Laen…</main>;
  if (!p) return <main className="mx-auto max-w-6xl px-4 py-14">Toodet ei leitud. <Link to="/tooted" className="text-primary">Tagasi</Link></main>;
  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2">
      <MediaImg path={p.image_url} alt={p.name} className="aspect-[4/5] w-full rounded-3xl" />
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{p.category}</p>
        <h1 className="mt-2 text-5xl font-semibold">{p.name}</h1>
        <p className="mt-4 text-3xl font-semibold text-primary">{eur(Number(p.price))}</p>
        <p className="mt-6 whitespace-pre-line leading-relaxed text-muted-foreground">{p.description}</p>
        <p className="mt-4 text-sm">{p.stock > 0 ? `Laos: ${p.stock} tk` : "Hetkel otsas"}</p>
        <Button size="lg" className="mt-6 rounded-full" disabled={p.stock <= 0}
          onClick={() => { cart.add({ id: p.id, name: p.name, price: Number(p.price), image_url: p.image_url }); toast.success("Lisatud ostukorvi"); }}>
          Lisa ostukorvi
        </Button>
      </div>
    </main>
  );
}
