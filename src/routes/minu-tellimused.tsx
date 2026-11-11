import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { eur } from "@/lib/cart";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/minu-tellimused")({
  head: () => seo("Minu tellimused", "Sinu WhiteMint tellimuste ajalugu."),
  component: MyOrders,
});

function MyOrders() {
  const { user, ready } = useAuth();
  const q = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("orders").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });
  if (ready && !user) return <main className="mx-auto max-w-3xl px-4 py-14"><Link to="/auth" className="text-primary">Logi sisse</Link>, et näha oma tellimusi.</main>;
  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-5xl font-semibold">Minu tellimused</h1>
      <ul className="mt-8 space-y-3">
        {q.data?.map((o) => (
          <li key={o.id}><Link to="/tellimus/$id" params={{ id: o.id }} className="flex justify-between rounded-xl border bg-card p-4 hover:bg-secondary">
            <span>Nr {o.order_no} · {new Date(o.created_at).toLocaleDateString("et-EE")}</span><span>{o.status} · {eur(Number(o.total))}</span>
          </Link></li>
        ))}
        {q.isSuccess && q.data.length === 0 && <p className="text-muted-foreground">Tellimusi pole veel.</p>}
      </ul>
    </main>
  );
}
