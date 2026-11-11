import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/site/ContentPage";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/kontakt")({
  head: () => seo("Kontakt", "Võta WhiteMint OÜ-ga ühendust."),
  component: () => <ContentPage slug="kontakt" />,
});
