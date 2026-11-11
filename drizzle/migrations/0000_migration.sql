create type public.app_role as enum ('admin','user');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null, role app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not exists (select 1 from public.user_roles where role='admin') then
    insert into public.user_roles(user_id, role) values (new.id,'admin');
  else
    insert into public.user_roles(user_id, role) values (new.id,'user');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.products (id uuid primary key default gen_random_uuid(), name text not null, description text not null default '', category text not null default 'Muu', price numeric(10,2) not null default 0, image_url text, stock int not null default 0, active boolean not null default true, created_at timestamptz not null default now());
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "public read active" on public.products for select using (active or public.has_role(auth.uid(),'admin'));
create policy "admin write" on public.products for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.gallery_images (id uuid primary key default gen_random_uuid(), url text not null, caption text not null default '', created_at timestamptz not null default now());
grant select on public.gallery_images to anon, authenticated;
grant insert, update, delete on public.gallery_images to authenticated;
grant all on public.gallery_images to service_role;
alter table public.gallery_images enable row level security;
create policy "public read" on public.gallery_images for select using (true);
create policy "admin write" on public.gallery_images for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.pages (slug text primary key, title text not null, body text not null default '', updated_at timestamptz not null default now());
grant select on public.pages to anon, authenticated;
grant insert, update, delete on public.pages to authenticated;
grant all on public.pages to service_role;
alter table public.pages enable row level security;
create policy "public read" on public.pages for select using (true);
create policy "admin write" on public.pages for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.orders (id uuid primary key default gen_random_uuid(), order_no serial, user_id uuid, customer_name text not null, email text not null, phone text not null, delivery_method text not null, delivery_point text not null default '', payment_method text not null, items jsonb not null, subtotal numeric(10,2) not null, shipping numeric(10,2) not null, total numeric(10,2) not null, note text not null default '', status text not null default 'Uus', created_at timestamptz not null default now());
grant select, update, delete on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "own or admin read" on public.orders for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin update" on public.orders for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin delete" on public.orders for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.place_order(_name text, _email text, _phone text, _delivery text, _point text, _payment text, _note text, _items jsonb)
returns table(order_id uuid, order_no int) language plpgsql security definer set search_path=public as $$
declare _sub numeric := 0; _ship numeric; _lines jsonb := '[]'; r record; p record; _id uuid; _no int;
begin
  if length(trim(_name))=0 or length(_name)>100 or _email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(_phone)<5 or length(_phone)>30 then raise exception 'Vigased andmed'; end if;
  if _delivery not in ('pickup','omniva','dpd') then raise exception 'Vale tarneviis'; end if;
  if _payment not in ('cash','bank') then raise exception 'Vale makseviis'; end if;
  if _delivery <> 'pickup' and length(trim(coalesce(_point,'')))=0 then raise exception 'Vali pakiautomaat'; end if;
  for r in select (e->>'id')::uuid as id, greatest(1, least(99,(e->>'qty')::int)) as qty from jsonb_array_elements(_items) e loop
    select * into p from public.products where id=r.id and active;
    if not found then raise exception 'Toode puudub'; end if;
    _sub := _sub + p.price*r.qty;
    _lines := _lines || jsonb_build_object('id',p.id,'name',p.name,'price',p.price,'qty',r.qty);
  end loop;
  if jsonb_array_length(_lines)=0 then raise exception 'Ostukorv on tühi'; end if;
  _ship := case _delivery when 'pickup' then 0 else 3.99 end;
  insert into public.orders(user_id,customer_name,email,phone,delivery_method,delivery_point,payment_method,items,subtotal,shipping,total,note)
  values (auth.uid(),trim(_name),trim(_email),trim(_phone),_delivery,coalesce(_point,''),_payment,_lines,_sub,_ship,_sub+_ship,left(coalesce(_note,''),500))
  returning id, orders.order_no into _id, _no;
  return query select _id, _no;
end $$;
grant execute on function public.place_order to anon, authenticated;

create policy "media read" on storage.objects for select to anon, authenticated using (bucket_id='media');
create policy "media admin insert" on storage.objects for insert to authenticated with check (bucket_id='media' and public.has_role(auth.uid(),'admin'));
create policy "media admin delete" on storage.objects for delete to authenticated using (bucket_id='media' and public.has_role(auth.uid(),'admin'));

insert into public.pages(slug,title,body) values
('kontakt','Kontakt','WhiteMint OÜ\nE-post: info@whitemint.eu\nTelefon: +372 0000 0000\nAadress: Eesti'),
('tingimused','Müügi- ja kasutustingimused','1. Üldsätted\nNeed tingimused kehtivad WhiteMint OÜ veebipoes tehtud ostudele.\n\n2. Tellimine ja tasumine\nTellimuse saab tasuda sularahas kättesaamisel või pangaülekandega.\n\n3. Tarne\nKaup tarnitakse Omniva või DPD pakiautomaati või saab selle ise järele tulla.\n\n4. Taganemisõigus\nOstjal on õigus 14 päeva jooksul lepingust taganeda.'),
('privaatsus','Isikuandmete töötlemine','WhiteMint OÜ töötleb kliendi andmeid (nimi, e-post, telefon, tarnekoht) ainult tellimuse täitmiseks. Andmeid ei edastata kolmandatele osapooltele peale transpordifirma. Andmete kustutamiseks kirjuta info@whitemint.eu.');

insert into public.products(name,description,category,price,stock) values
('Linane kott','Käsitsi õmmeldud linane kott mündirohelise detailiga.','Kotid',24.90,10),
('Suvekleit','Kerge puuvillane suvekleit.','Kleidid',49.00,5),
('Kinkekarp','Ilus kinkekarp väikesteks kingitusteks.','Karbid',12.50,20);