import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ShoppingBag, User } from "lucide-react";
import logo from "@/assets/whitemint_logo.png.asset.json";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/tooted", label: "Tooted" },
  { to: "/eritellimus", label: "Eritellimus" },
  { to: "/galerii", label: "Galerii" },
  { to: "/kontakt", label: "Kontakt" },
] as const;

export function Header() {
  const { user, isAdmin } = useAuth();
  const { count } = useCart();
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }
  return (
    <header className="no-print sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo.url} alt="WhiteMint" className="h-11 w-11" />
          <span className="font-serif text-2xl font-semibold">WhiteMint</span>
        </Link>
        <nav className="hidden gap-5 text-sm md:flex">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground font-semibold" }}>
              {n.label}
            </Link>
          ))}
          {isAdmin && <Link to="/admin" className="font-semibold text-primary">Admin</Link>}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link to="/minu-tellimused" className="hidden text-sm text-muted-foreground hover:text-foreground sm:block">Minu tellimused</Link>
              <Button variant="ghost" size="sm" onClick={signOut}>Logi välja</Button>
            </>
          ) : (
            <Button asChild variant="ghost" size="sm"><Link to="/auth"><User className="mr-1 h-4 w-4" />Logi sisse</Link></Button>
          )}
          <Button asChild size="sm" className="rounded-full">
            <Link to="/ostukorv"><ShoppingBag className="mr-1 h-4 w-4" />{count}</Link>
          </Button>
        </div>
      </div>
      <nav className="flex justify-center gap-5 pb-2 text-sm md:hidden">
        {nav.map((n) => <Link key={n.to} to={n.to} className="text-muted-foreground">{n.label}</Link>)}
        {isAdmin && <Link to="/admin" className="font-semibold text-primary">Admin</Link>}
      </nav>
    </header>
  );
}
