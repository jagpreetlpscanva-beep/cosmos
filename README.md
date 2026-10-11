# Cosmos: Kitchen + Mocktail Bar

A Vercel-compatible Next.js 15 + TypeScript + Supabase foundation with the customer menu/cart/checkout flow, server-validated order creation, staff sign-in and order management, and printable QR codes for ten tables. The existing premium dark-and-gold visual direction is preserved.

## Current implementation status

Implemented in this stage:
- Restaurant address configured as `714, SS-2nd Rd, Sector G, LDA Colony, Lucknow, Uttar Pradesh 226012`; hours are 12 PM–11 PM daily, based on the supplied listing screenshot.
- Live menu endpoint reads only active, non-archived menu items from Supabase. The menu is intentionally empty until the restaurant supplies verified items/prices.
- Customer menu categories, local cart, checkout, takeaway/dine-in selection, optional table code, and pay-at-counter order submission.
- Server validates inputs, validates active table codes, verifies item IDs and availability, calculates prices from database values, and uses an idempotency key to reduce duplicate submissions.
- Staff sign-in through Supabase Auth; staff order API verifies the Supabase access token and restaurant membership server-side.
- Staff order dashboard with status updates and 15-second refresh; ten QR codes can be generated and downloaded individually.
- Initial schema and a Cosmos setup migration are included.

Not yet production-ready:
- Menu editing/upload management, realtime subscriptions, kitchen ticket printing, advanced reports, rate limiting, automated test suite, reservation management, and payment processing are not implemented.
- Order header and line items are inserted in separate requests with rollback on line-item failure; use a PostgreSQL transaction/RPC before high-volume production.
- The QR generator creates links for T01–T10; matching active table records must exist in Supabase. QR downloads are generated in the browser.
- Staff roles currently gate access by membership but do not yet apply granular owner/manager/staff permission differences.
- The project has not been security-audited. Test on a staging project before accepting live orders.

## Requirements
- Node.js 20+
- Supabase project
- Vercel account

## Local setup
1. Extract the project and run `npm install`.
2. Copy `.env.example` to `.env.local`.
3. In Supabase SQL Editor, run `supabase/migrations/001_initial_schema.sql` first.
4. Run `supabase/migrations/002_cosmos_setup.sql`. Copy the UUID returned by the Cosmos restaurant insert.
5. Set `RESTAURANT_ID` in `.env.local` to that UUID.
6. Create the ten tables, replacing `YOUR-RESTAURANT-UUID` with the same UUID:

   ```sql
   insert into public.restaurant_tables (restaurant_id, code, label)
   select 'YOUR-RESTAURANT-UUID'::uuid,
          'T' || lpad(n::text, 2, '0'),
          'Table ' || lpad(n::text, 2, '0')
   from generate_series(1,10) as n
   on conflict (restaurant_id, code)
   do update set label=excluded.label, active=true;
   ```

7. Add a real Supabase Auth user for each staff member in Supabase Dashboard → Authentication → Users. Then add each user's UUID to `staff_memberships` with the Cosmos restaurant UUID and a role (`owner`, `manager`, or `staff`). For example:

   ```sql
   insert into public.staff_memberships (restaurant_id, user_id, role)
   values ('YOUR-RESTAURANT-UUID'::uuid, 'AUTH-USER-UUID'::uuid, 'owner');
   ```

8. Add menu categories and verified menu items using the Supabase dashboard or SQL. Do not guess prices or dietary claims. The public menu reads from `menu_items` joined to `menu_categories`.
9. Run `npm run dev` and visit `/`, `/menu`, `/checkout`, `/admin`, and `/order/table/T01`.

## Important environment variables
- `NEXT_PUBLIC_SUPABASE_URL`: public project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: public anon/publishable key; safe for browser use when RLS is configured.
- `SUPABASE_SERVICE_ROLE_KEY`: **secret**; server-side only. Never expose it in client code or commit it.
- `RESTAURANT_ID`: Cosmos row UUID; server-only.
- Restaurant address is preconfigured. Add the verified phone and Google Maps URL before launch.

## Vercel deployment
1. Push the project to a private Git repository and import it into Vercel.
2. Set the environment variables above in Vercel Project Settings → Environment Variables.
3. Deploy to Preview first and test the complete workflow with test menu items and staff accounts.
4. Verify that the service-role key is only used in server routes, staff membership checks work, inactive tables are rejected, and prices are always server-calculated.
5. Add a custom domain and confirm HTTPS before production launch.

## Payment and ordering scope
- Current payment mode is pay at counter only. No online payment is simulated.
- Enabled order types are dine-in and takeaway; delivery is intentionally disabled.
- Reservations are not enabled.
- No customer registration is required to place an order.

## Testing checklist before live use
- Invalid payload and malformed JSON return a client error.
- Client-submitted prices are ignored; database prices determine totals.
- Unknown, inactive, or mismatched table codes are rejected.
- Archived or unavailable items cannot be ordered.
- Repeated idempotency keys do not intentionally create duplicate order headers.
- Anonymous users cannot access staff order APIs.
- Authenticated users without a Cosmos membership cannot access staff order APIs.
- Order creation and line-item failure/rollback are tested in a staging database.
- Staff status changes and mobile checkout are tested on real devices.
