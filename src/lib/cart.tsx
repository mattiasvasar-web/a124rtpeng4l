import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = { id: string; name: string; price: number; qty: number; image_url: string | null };
type Cart = {
  items: CartItem[];
  add: (i: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};
const Ctx = createContext<Cart | null>(null);
const KEY = "whitemint-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { /* empty */ }
  }, []);
  const save = (next: CartItem[]) => { setItems(next); localStorage.setItem(KEY, JSON.stringify(next)); };
  const value: Cart = {
    items,
    add: (i, qty = 1) => {
      const ex = items.find((x) => x.id === i.id);
      save(ex ? items.map((x) => (x.id === i.id ? { ...x, qty: Math.min(99, x.qty + qty) } : x)) : [...items, { ...i, qty }]);
    },
    setQty: (id, qty) => save(items.map((x) => (x.id === id ? { ...x, qty: Math.max(1, Math.min(99, qty)) } : x))),
    remove: (id) => save(items.filter((x) => x.id !== id)),
    clear: () => save([]),
    count: items.reduce((a, b) => a + b.qty, 0),
    subtotal: items.reduce((a, b) => a + b.qty * b.price, 0),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("CartProvider puudub");
  return c;
}
export const eur = (n: number) => new Intl.NumberFormat("et-EE", { style: "currency", currency: "EUR" }).format(n);
export const shippingCost = (m: string) => (m === "pickup" ? 0 : 3.99);
export const deliveryLabel: Record<string, string> = { pickup: "Tulen ise järele", omniva: "Omniva pakiautomaat", dpd: "DPD pakiautomaat" };
export const paymentLabel: Record<string, string> = { cash: "Sularaha kättesaamisel", bank: "Pangaülekanne" };
