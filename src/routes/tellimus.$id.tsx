import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice, type OrderRow } from "@/components/site/Invoice";
import { Button } from "@/components/ui/button";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/tellimus/$id")({
  head: () => seo("Tellimus", "Sinu WhiteMint tellimuse kinnitus."),
  component: OrderPage,
});

function OrderPage() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["order", id],
    queryFn: async () => (await supabase.from("orders").select("*").eq("id", id).maybeSingle()).data as OrderRow | null,
  });
  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <div className="no-print mb-6">
        <h1 className="text-5xl font-semibold">Aitäh tellimuse eest!</h1>
        <p className="mt-2 text-muted-foreground">Võtame sinuga peagi ühendust.</p>
      </div>
      {q.data ? (
        <>
          <Invoice o={q.data} />
          <Button className="no-print mt-6 rounded-full" onClick={() => window.print()}>Laadi arve alla (PDF)</Button>
        </>
      ) : (
        !q.isLoading && <p className="text-sm text-muted-foreground">Tellimus on vastu võetud. Arve nägemiseks <Link to="/auth" className="text-primary">logi sisse</Link> samal e-postil oleva kontoga.</p>
      )}
    </main>
  );
}
