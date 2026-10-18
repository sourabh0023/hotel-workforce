# HotelFlow — Hotel Workforce Manager

A Next.js app for managing hotel employees, attendance, wages, advances and persistent employee balances.

## 1. Create and configure Supabase
1. Create a project at https://supabase.com/dashboard and wait for provisioning to finish.
2. Open **SQL Editor** in the Supabase dashboard, create a query, paste all of `supabase/schema.sql`, and run it.
3. Open **Project Settings → API** (or **Data API**) and copy the Project URL and publishable/anon key. Never use the `service_role` key in the browser or in a `NEXT_PUBLIC_` variable.
4. In Vercel, open this project → **Settings → Environment Variables**. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for Production, Preview and Development. Redeploy after saving.
5. In Supabase **Authentication → Providers**, keep Email enabled. In **Authentication → URL Configuration**, add your deployed Vercel URL to Site URL and Redirect URLs.
6. In Supabase **Authentication → Users**, create your first admin user. Copy that user's UUID, then run this in SQL Editor after replacing both placeholders:
   ```sql
   insert into public.profiles (id, full_name, role, branch_name)
   values ('AUTH-USER-UUID', 'Your Name', 'super_admin', null);
   ```
7. Sign in at `/login`. Admins can then add employees and record attendance/ledger entries. Create further accounts from Supabase Auth and add matching `profiles` rows with the intended role and branch.

## Roles and data safety
- `super_admin`: all branches.
- `branch_manager`: records in their assigned branch.
- `employee`: limited read access for their branch in the current starter; employee self-attendance/login linking needs an explicit employee-to-auth-user mapping before enabling.
- Database Row Level Security policies are defined in `supabase/schema.sql`. Do not disable RLS.
- Use only the Supabase publishable/anon key in Vercel. Never expose the service-role key.
- The ledger is append-only, preserves history when employees are deactivated, and computes net balance from earnings minus advances/payments/deductions. Record wage earnings accurately; automatic payroll finalization is not yet implemented.
- The current UI supports employee creation/deactivation, daily attendance entry and ledger transaction posting. Test thoroughly before using it for actual payroll.

## Deploy
The project is connected to Vercel. Committing to `main` should trigger a new deployment. Set the Vercel Root Directory to the repository root.
