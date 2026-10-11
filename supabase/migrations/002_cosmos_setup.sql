-- Run after 001_initial_schema.sql. Safe to run more than once.
-- Creates the Cosmos restaurant record. Also prevents direct browser updates to order rows;
-- staff order status changes must go through the server-side authorization endpoint.
revoke update on public.orders from anon, authenticated;

-- Creates the Cosmos restaurant record and ten table records; save the returned restaurant UUID.
insert into public.restaurants (name,slug,address,opening_hours,currency)
values (
  'Cosmos: Kitchen + Mocktail Bar',
  'cosmos-kitchen-mocktail-bar',
  '714, SS-2nd Rd, Sector G, LDA Colony, Lucknow, Uttar Pradesh 226012',
  '{"Sunday":"12 PM – 11 PM","Monday":"12 PM – 11 PM","Tuesday":"12 PM – 11 PM","Wednesday":"12 PM – 11 PM","Thursday":"12 PM – 11 PM","Friday":"12 PM – 11 PM","Saturday":"12 PM – 11 PM"}'::jsonb,
  'INR'
)
on conflict (slug) do update set address=excluded.address, opening_hours=excluded.opening_hours
returning id;

-- After the insert above, replace the placeholder UUID in the next statement with the returned id.
-- Example: insert into public.restaurant_tables (restaurant_id,code,label) values ('YOUR-RESTAURANT-UUID','T01','Table 01');
-- To create all ten tables in one go, use the setup SQL below after replacing the UUID:
-- insert into public.restaurant_tables (restaurant_id, code, label)
-- select 'YOUR-RESTAURANT-UUID'::uuid, 'T' || lpad(n::text, 2, '0'), 'Table ' || lpad(n::text, 2, '0')
-- from generate_series(1,10) as n
-- on conflict (restaurant_id, code) do update set label=excluded.label, active=true;
