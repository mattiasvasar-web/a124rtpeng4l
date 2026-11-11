import logo from "@/assets/whitemint_logo.png.asset.json";
import { deliveryLabel, eur, paymentLabel } from "@/lib/cart";

export type OrderRow = {
  id: string; order_no: number; customer_name: string; email: string; phone: string; delivery_method: string; delivery_point: string;
  payment_method: string; items: unknown; subtotal: number; shipping: number; total: number; note: string; status: string; created_at: string;
};
type Line = { name: string; price: number; qty: number };

export function Invoice({ o }: { o: OrderRow }) {
  const lines = (o.items as Line[]) ?? [];
  return (
    <div className="rounded-2xl border bg-card p-8 print:border-0 print:p-0">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <img src={logo.url} alt="WhiteMint" className="h-16 w-16" />
          <div><p className="font-serif text-2xl font-semibold">WhiteMint OÜ</p><p className="text-sm text-muted-foreground">info@whitemint.eu</p></div>
        </div>
        <div className="text-right text-sm">
          <p className="font-serif text-3xl font-semibold">Arve nr {o.order_no}</p>
          <p className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString("et-EE")}</p>
          <p className="mt-1">Staatus: <strong>{o.status}</strong></p>
        </div>
      </div>
      <div className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
        <div><p className="font-semibold">Klient</p><p>{o.customer_name}</p><p>{o.email}</p><p>{o.phone}</p></div>
        <div><p className="font-semibold">Tarne ja makse</p><p>{deliveryLabel[o.delivery_method] ?? o.delivery_method}{o.delivery_point && `: ${o.delivery_point}`}</p><p>{paymentLabel[o.payment_method] ?? o.payment_method}</p></div>
      </div>
      <table className="mt-8 w-full text-sm">
        <thead><tr className="border-b text-left"><th className="py-2">Toode</th><th>Kogus</th><th className="text-right">Hind</th><th className="text-right">Summa</th></tr></thead>
        <tbody>
          {lines.map((l, i) => <tr key={i} className="border-b"><td className="py-2">{l.name}</td><td>{l.qty}</td><td className="text-right">{eur(Number(l.price))}</td><td className="text-right">{eur(Number(l.price) * l.qty)}</td></tr>)}
        </tbody>
      </table>
      <div className="mt-4 ml-auto w-60 space-y-1 text-sm">
        <p className="flex justify-between"><span>Vahesumma</span><span>{eur(Number(o.subtotal))}</span></p>
        <p className="flex justify-between"><span>Transport</span><span>{eur(Number(o.shipping))}</span></p>
        <p className="flex justify-between border-t pt-1 text-lg font-semibold"><span>Kokku</span><span>{eur(Number(o.total))}</span></p>
      </div>
      {o.payment_method === "bank" && (
        <p className="mt-6 rounded-xl bg-secondary p-4 text-sm">Palun tasu pangaülekandega: saaja WhiteMint OÜ, selgitus „Tellimus {o.order_no}“. Pangakonto andmed saadame e-postiga.</p>
      )}
      {o.note && <p className="mt-4 text-sm text-muted-foreground">Märkus: {o.note}</p>}
    </div>
  );
}
