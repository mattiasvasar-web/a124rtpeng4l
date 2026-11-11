import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/site/ContentPage";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/tingimused")({
  head: () => seo("Müügi- ja kasutustingimused", "WhiteMint veebipoe müügi- ja kasutustingimused."),
  component: () => <ContentPage slug="tingimused" />,
});
