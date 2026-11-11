import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/site/ContentPage";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/privaatsus")({
  head: () => seo("Isikuandmete töötlemine", "Kuidas WhiteMint OÜ isikuandmeid töötleb."),
  component: () => <ContentPage slug="privaatsus" />,
});
