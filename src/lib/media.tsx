import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export async function uploadMedia(file: File, folder: string) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
  if (error) throw error;
  return path;
}

export function MediaImg({ path, alt, className }: { path: string | null; alt: string; className?: string }) {
  const q = useQuery({
    queryKey: ["media", path],
    enabled: !!path,
    staleTime: 1000 * 60 * 60 * 12,
    queryFn: async () => {
      const { data } = await supabase.storage.from("media").createSignedUrl(path!, 60 * 60 * 24);
      return data?.signedUrl ?? null;
    },
  });
  if (!path || !q.data) return <div className={cn("bg-secondary", className)} aria-label={alt} />;
  return <img src={q.data} alt={alt} className={cn("object-cover", className)} loading="lazy" />;
}
