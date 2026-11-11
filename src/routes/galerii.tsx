import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MediaImg } from "@/lib/media";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/galerii")({
  head: () => seo("Galerii", "Pildid WhiteMint toodetest ja tööst."),
  component: Gallery,
});

function Gallery() {
  const q = useQuery({
    queryKey: ["gallery"],
    queryFn: async () => (await supabase.from("gallery_images").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  return (
    <main className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-5xl font-semibold">Galerii</h1>
      <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
        {q.data?.map((g) => (
          <figure key={g.id} className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border bg-card">
            <MediaImg path={g.url} alt={g.caption || "Galerii pilt"} className="w-full min-h-40" />
            {g.caption && <figcaption className="p-3 text-sm text-muted-foreground">{g.caption}</figcaption>}
          </figure>
        ))}
      </div>
      {q.isSuccess && q.data.length === 0 && <p className="mt-8 text-muted-foreground">Galeriis pole veel pilte.</p>}
    </main>
  );
}
