import { Link } from "@tanstack/react-router";
import { MediaImg } from "@/lib/media";
import { eur } from "@/lib/cart";

export type Product = { id: string; name: string; description: string; category: string; price: number; image_url: string | null; stock: number; active: boolean };

export function ProductCard({ p }: { p: Product }) {
  return (
    <Link to="/toode/$id" params={{ id: p.id }} className="group overflow-hidden rounded-2xl border bg-card transition hover:shadow-soft">
      <MediaImg path={p.image_url} alt={p.name} className="aspect-[4/5] w-full transition group-hover:scale-[1.02]" />
      <div className="p-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{p.category}</p>
        <h3 className="mt-1 text-2xl font-semibold">{p.name}</h3>
        <p className="mt-1 font-semibold text-primary">{eur(Number(p.price))}</p>
      </div>
    </Link>
  );
}
