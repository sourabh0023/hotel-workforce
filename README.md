# HotelFlow — Hotel Workforce Manager

This is a Next.js starter interface for a multi-branch hotel workforce management app.

## Deploy on Vercel
1. Import this GitHub repository into Vercel.
2. Keep the framework preset as Next.js.
3. Deploy; this demo UI does not require environment variables.

## Important limitation
This repository currently contains a **UI demo only**. The employee list uses sample rows; attendance and salary pages are placeholders. Do not enter real employee data or use this app to calculate/pay wages. Production work still required: secure authentication, Super Admin and employee roles, branch-level access policies, database persistence, employee self-attendance, attendance approval, payroll calculation/finalization, advances, balance carry-forward, audit logging, exports, backups and end-to-end tests.

Balances should come from a persistent transaction ledger and must not reset when an employee leaves and returns months later.
