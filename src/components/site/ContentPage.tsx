import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function ContentPage({ slug }: { slug: string }) {
  const q = useQuery({
    queryKey: ["page", slug],
    queryFn: async () => (await supabase.from("pages").select("*").eq("slug", slug).maybeSingle()).data,
  });
  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-5xl font-semibold">{q.data?.title ?? ""}</h1>
      <div className="mt-8 whitespace-pre-line leading-relaxed text-muted-foreground">{q.isLoading ? "Laen…" : q.data?.body}</div>
    </main>
  );
}
