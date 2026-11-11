import { Link } from "@tanstack/react-router";
export function Footer() {
  return (
    <footer className="no-print mt-20 border-t bg-secondary/40">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm md:grid-cols-3">
        <div>
          <p className="font-serif text-xl font-semibold">WhiteMint OÜ</p>
          <p className="mt-1 text-muted-foreground">Kotid, kleidid, karbid ja palju muud ilusat.</p>
        </div>
        <div className="flex flex-col gap-1">
          <Link to="/tooted" className="hover:underline">Tooted</Link>
          <Link to="/galerii" className="hover:underline">Galerii</Link>
          <Link to="/kontakt" className="hover:underline">Kontakt</Link>
        </div>
        <div className="flex flex-col gap-1">
          <Link to="/tingimused" className="hover:underline">Müügi- ja kasutustingimused</Link>
          <Link to="/privaatsus" className="hover:underline">Isikuandmete töötlemine</Link>
          <a href="mailto:info@whitemint.eu" className="hover:underline">info@whitemint.eu</a>
        </div>
      </div>
      <p className="pb-6 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} WhiteMint OÜ</p>
    </footer>
  );
}
