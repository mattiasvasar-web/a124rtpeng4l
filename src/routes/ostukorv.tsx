import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { eur, useCart } from "@/lib/cart";
import { MediaImg } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/ostukorv")({
  head: () => seo("Ostukorv", "Sinu WhiteMint ostukorv."),
  component: CartPage,
});

function CartPage() {
  const c = useCart();
  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-5xl font-semibold">Ostukorv</h1>
      {c.items.length === 0 ? (
        <p className="mt-8 text-muted-foreground">Ostukorv on tühi. <Link to="/tooted" className="text-primary">Vaata tooteid →</Link></p>
      ) : (
        <>
          <ul className="mt-8 divide-y rounded-2xl border bg-card">
            {c.items.map((i) => (
              <li key={i.id} className="flex items-center gap-4 p-4">
                <MediaImg path={i.image_url} alt={i.name} className="h-16 w-16 rounded-xl" />
                <div className="flex-1">
                  <p className="font-semibold">{i.name}</p>
                  <p className="text-sm text-muted-foreground">{eur(i.price)}</p>
                </div>
                <Input type="number" min={1} max={99} value={i.qty} onChange={(e) => c.setQty(i.id, Number(e.target.value))} className="w-20" aria-label="Kogus" />
                <Button variant="ghost" size="icon" onClick={() => c.remove(i.id)} aria-label="Eemalda"><Trash2 className="h-4 w-4" /></Button>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-xl">Kokku: <strong>{eur(c.subtotal)}</strong></p>
            <Button asChild size="lg" className="rounded-full"><Link to="/kassa">Vormista tellimus</Link></Button>
          </div>
        </>
      )}
    </main>
  );
}
