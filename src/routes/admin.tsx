import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { MediaImg, uploadMedia } from "@/lib/media";
import { deliveryLabel, eur, paymentLabel } from "@/lib/cart";
import { Invoice, type OrderRow } from "@/components/site/Invoice";
import type { Product } from "@/components/site/ProductCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin | WhiteMint" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

function Admin() {
  const { user, ready, isAdmin, roleLoading } = useAuth();
  if (!ready || roleLoading) return <main className="mx-auto max-w-6xl px-4 py-14">Laen…</main>;
  if (!user) return <main className="mx-auto max-w-6xl px-4 py-14"><Link to="/auth" className="text-primary">Logi sisse</Link> admini vaate jaoks.</main>;
  if (!isAdmin) return <main className="mx-auto max-w-6xl px-4 py-14">Sul pole admini õigusi.</main>;
  return (
    <main className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-5xl font-semibold">Admin</h1>
      <Tabs defaultValue="orders" className="mt-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="orders">Tellimused</TabsTrigger>
          <TabsTrigger value="products">Tooted</TabsTrigger>
          <TabsTrigger value="gallery">Galerii</TabsTrigger>
          <TabsTrigger value="pages">Lehed</TabsTrigger>
          <TabsTrigger value="account">Konto</TabsTrigger>
        </TabsList>
        <TabsContent value="orders"><Orders /></TabsContent>
        <TabsContent value="products"><Products /></TabsContent>
        <TabsContent value="gallery"><Gallery /></TabsContent>
        <TabsContent value="pages"><Pages /></TabsContent>
        <TabsContent value="account"><Account /></TabsContent>
      </Tabs>
    </main>
  );
}

const STATUSES = ["Uus", "Makstud", "Saadetud", "Täidetud", "Tühistatud"];

function Orders() {
  const qc = useQueryClient();
  const [open, setOpen] = useState<OrderRow | null>(null);
  const q = useQuery({ queryKey: ["admin-orders"], queryFn: async () => ((await supabase.from("orders").select("*").order("created_at", { ascending: false })).data ?? []) as OrderRow[] });
  const orders = q.data ?? [];
  const revenue = orders.filter((o) => o.status !== "Tühistatud").reduce((a, o) => a + Number(o.total), 0);
  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  }
  return (
    <div className="mt-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Tellimusi kokku" value={String(orders.length)} />
        <Stat label="Uusi tellimusi" value={String(orders.filter((o) => o.status === "Uus").length)} />
        <Stat label="Müük kokku" value={eur(revenue)} />
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left"><th className="p-3">Nr</th><th>Kuupäev</th><th>Klient</th><th>Tarne</th><th>Makse</th><th>Summa</th><th>Staatus</th><th></th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b">
                <td className="p-3">{o.order_no}</td>
                <td>{new Date(o.created_at).toLocaleDateString("et-EE")}</td>
                <td>{o.customer_name}<br /><span className="text-muted-foreground">{o.phone}</span></td>
                <td>{deliveryLabel[o.delivery_method]}</td>
                <td>{paymentLabel[o.payment_method]}</td>
                <td>{eur(Number(o.total))}</td>
                <td>
                  <Select value={o.status} onValueChange={(v) => setStatus(o.id, v)}>
                    <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td><Button size="sm" variant="outline" onClick={() => setOpen(o)}>Arve</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {q.isSuccess && orders.length === 0 && <p className="p-4 text-muted-foreground">Tellimusi pole veel.</p>}
      </div>
      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Tellimus {open?.order_no}</DialogTitle></DialogHeader>
          {open && <><Invoice o={open} /><Link to="/tellimus/$id" params={{ id: open.id }} className="text-sm text-primary">Ava eraldi lehel ja laadi PDF →</Link></>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 font-serif text-3xl font-semibold">{value}</p></div>;
}

const empty: Partial<Product> = { name: "", description: "", category: "Kotid", price: 0, stock: 1, active: true, image_url: null };

function Products() {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<Partial<Product> | null>(null);
  const [busy, setBusy] = useState(false);
  const q = useQuery({ queryKey: ["admin-products"], queryFn: async () => ((await supabase.from("products").select("*").order("created_at", { ascending: false })).data ?? []) as Product[] });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); qc.invalidateQueries({ queryKey: ["products"] }); };

  async function save() {
    if (!edit?.name?.trim()) { toast.error("Sisesta nimi"); return; }
    setBusy(true);
    const row = { name: edit.name.trim(), description: edit.description ?? "", category: edit.category?.trim() || "Muu", price: Number(edit.price) || 0, stock: Number(edit.stock) || 0, active: !!edit.active, image_url: edit.image_url ?? null };
    const { error } = edit.id ? await supabase.from("products").update(row).eq("id", edit.id) : await supabase.from("products").insert(row);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Salvestatud"); setEdit(null); refresh();
  }
  async function del(id: string) {
    if (!confirm("Kustuta toode?")) return;
    await supabase.from("products").delete().eq("id", id); refresh();
  }
  async function onFile(f?: File) {
    if (!f) return;
    try { setBusy(true); const path = await uploadMedia(f, "products"); setEdit((e) => ({ ...e, image_url: path })); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  return (
    <div className="mt-4">
      <Button className="rounded-full" onClick={() => setEdit({ ...empty })}>+ Lisa toode</Button>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {q.data?.map((p) => (
          <div key={p.id} className="flex gap-3 rounded-2xl border bg-card p-3">
            <MediaImg path={p.image_url} alt={p.name} className="h-20 w-20 rounded-xl" />
            <div className="flex-1 text-sm">
              <p className="font-semibold">{p.name} {!p.active && <span className="text-muted-foreground">(peidetud)</span>}</p>
              <p className="text-muted-foreground">{p.category} · {eur(Number(p.price))} · {p.stock} tk</p>
              <div className="mt-2 flex gap-2"><Button size="sm" variant="outline" onClick={() => setEdit(p)}>Muuda</Button><Button size="sm" variant="ghost" onClick={() => del(p.id)}>Kustuta</Button></div>
            </div>
          </div>
        ))}
      </div>
      <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit?.id ? "Muuda toodet" : "Uus toode"}</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-3">
              <MediaImg path={edit.image_url ?? null} alt="Toote pilt" className="h-40 w-full rounded-xl" />
              <Input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />
              <div><Label>Nimi</Label><Input value={edit.name} maxLength={120} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></div>
              <div><Label>Kategooria</Label><Input value={edit.category} maxLength={50} onChange={(e) => setEdit({ ...edit, category: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Hind (€)</Label><Input type="number" step="0.01" min={0} value={edit.price} onChange={(e) => setEdit({ ...edit, price: Number(e.target.value) })} /></div>
                <div><Label>Laos (tk)</Label><Input type="number" min={0} value={edit.stock} onChange={(e) => setEdit({ ...edit, stock: Number(e.target.value) })} /></div>
              </div>
              <div><Label>Kirjeldus</Label><Textarea rows={4} value={edit.description} maxLength={3000} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm"><Switch checked={!!edit.active} onCheckedChange={(v) => setEdit({ ...edit, active: v })} />Nähtav poes</label>
              <Button className="w-full rounded-full" disabled={busy} onClick={save}>Salvesta</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Gallery() {
  const qc = useQueryClient();
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const q = useQuery({ queryKey: ["gallery"], queryFn: async () => (await supabase.from("gallery_images").select("*").order("created_at", { ascending: false })).data ?? [] });
  async function add(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const f of Array.from(files)) {
        const path = await uploadMedia(f, "gallery");
        const { error } = await supabase.from("gallery_images").insert({ url: path, caption: caption.slice(0, 200) });
        if (error) throw error;
      }
      setCaption(""); toast.success("Pildid lisatud");
    } catch (e) { toast.error((e as Error).message); }
    setBusy(false); qc.invalidateQueries({ queryKey: ["gallery"] });
  }
  async function del(id: string, path: string) {
    if (!confirm("Kustuta pilt?")) return;
    await supabase.from("gallery_images").delete().eq("id", id);
    await supabase.storage.from("media").remove([path]);
    qc.invalidateQueries({ queryKey: ["gallery"] });
  }
  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-4">
        <div className="flex-1"><Label>Pildiallkiri (valikuline)</Label><Input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={200} /></div>
        <div><Label>Vali pildid</Label><Input type="file" accept="image/*" multiple disabled={busy} onChange={(e) => add(e.target.files)} /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {q.data?.map((g) => (
          <div key={g.id} className="overflow-hidden rounded-xl border bg-card">
            <MediaImg path={g.url} alt={g.caption || "Pilt"} className="aspect-square w-full" />
            <div className="flex items-center justify-between p-2 text-xs"><span className="truncate">{g.caption}</span><Button size="sm" variant="ghost" onClick={() => del(g.id, g.url)}>Kustuta</Button></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Pages() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-pages"], queryFn: async () => (await supabase.from("pages").select("*").order("slug")).data ?? [] });
  return (
    <div className="mt-4 space-y-4">
      {q.data?.map((p) => <PageEditor key={p.slug} p={p} onSaved={() => { qc.invalidateQueries({ queryKey: ["admin-pages"] }); qc.invalidateQueries({ queryKey: ["page", p.slug] }); }} />)}
    </div>
  );
}
function PageEditor({ p, onSaved }: { p: { slug: string; title: string; body: string }; onSaved: () => void }) {
  const [title, setTitle] = useState(p.title);
  const [body, setBody] = useState(p.body);
  async function save() {
    const { error } = await supabase.from("pages").update({ title, body, updated_at: new Date().toISOString() }).eq("slug", p.slug);
    if (error) { toast.error(error.message); return; }
    toast.success("Leht salvestatud"); onSaved();
  }
  return (
    <div className="space-y-2 rounded-2xl border bg-card p-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">/{p.slug}</p>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
      <Textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} maxLength={20000} />
      <Button size="sm" className="rounded-full" onClick={save}>Salvesta</Button>
    </div>
  );
}

function Account() {
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  async function save() {
    if (pw.length < 6) { toast.error("Uus parool peab olema vähemalt 6 tähemärki"); return; }
    const { error } = await supabase.auth.updateUser({ password: pw, current_password: cur } as { password: string });
    if (error) { toast.error(error.message); return; }
    setCur(""); setPw(""); toast.success("Parool muudetud");
  }
  return (
    <div className="mt-4 max-w-sm space-y-3 rounded-2xl border bg-card p-4">
      <h2 className="text-2xl font-semibold">Muuda parooli</h2>
      <div><Label>Praegune parool</Label><Input type="password" value={cur} onChange={(e) => setCur(e.target.value)} /></div>
      <div><Label>Uus parool</Label><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
      <Button className="rounded-full" onClick={save}>Salvesta</Button>
    </div>
  );
}
