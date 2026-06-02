# Plan: Next.js + Supabase Auth System (ai-survival-index)

## Context
Building the foundational auth layer for ai-survival-index from a completely empty repo. No Next.js project exists yet. The goal is: Sign Up (with email verification) → Login → Protected Dashboard with Logout + Forgot Password via email OTP.

---

## Tech Stack
- Next.js 14 (App Router, TypeScript, `src/` dir)
- Tailwind CSS v3 + Shadcn/ui
- Supabase (Auth + `public.profiles` table)
- `@supabase/ssr` (official SSR package for Next.js 14)
- `react-hook-form` + `zod` (form validation)
- `sonner` (toast notifications)

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx                        # Root layout, dark theme, Toaster
│   ├── globals.css                       # CSS vars (dark theme)
│   ├── page.tsx                          # Redirects to /login or /dashboard
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── verify-email/page.tsx         # Static "check your inbox" page
│   │   ├── forgot-password/page.tsx
│   │   ├── verify-otp/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (protected)/
│   │   ├── layout.tsx                    # Secondary auth guard
│   │   └── dashboard/page.tsx            # Blank page + Logout button
│   └── auth/callback/route.ts            # Email confirmation handler
├── components/
│   ├── ui/                               # Shadcn auto-generated
│   └── auth/
│       ├── SignUpForm.tsx
│       ├── LoginForm.tsx
│       ├── ForgotPasswordForm.tsx
│       ├── VerifyOtpForm.tsx
│       └── ResetPasswordForm.tsx
├── lib/supabase/
│   ├── client.ts                         # createBrowserClient
│   ├── server.ts                         # createServerClient (cookies from next/headers)
│   └── middleware.ts                     # createServerClient (request/response cookies)
├── actions/auth.ts                       # All Server Actions
└── middleware.ts                         # Route protection
```

---

## Supabase Setup

### `public.profiles` Table SQL
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
```

### Auth Settings (Supabase Dashboard)
- Email Confirmations: ENABLED
- Site URL: `http://localhost:3000`
- Redirect URLs: add `http://localhost:3000/auth/callback`

---

## Key Decisions

1. **OTP (not magic link) for Forgot Password**: PRD explicitly says "a code will be sent"; OTP keeps user on-site; better mobile UX. Uses `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })` then `verifyOtp({ email, token, type: 'email' })`.

2. **Server Actions over API Routes**: Cleaner, type-safe, native Next.js 14 pattern.

3. **Three Supabase clients**: browser (client components), server (Server Actions + Server Components), middleware (request/response cookies) — each required by `@supabase/ssr`.

4. **`supabase.auth.getUser()` in middleware**, NOT `getSession()` — Supabase SSR security requirement.

5. **No DB trigger for profile creation**: Trigger can't know first_name/last_name/phone; Server Action inserts both user + profile atomically.

6. **`shouldCreateUser: false` on OTP**: Prevents new account creation for unknown emails; prevents user enumeration.

---

## Server Actions (`src/actions/auth.ts`)

| Action | Key Supabase Call | Redirects To |
|---|---|---|
| `signUp` | `auth.signUp()` + `profiles.insert()` | `/verify-email` |
| `login` | `auth.signInWithPassword()` | `/dashboard` |
| `logout` | `auth.signOut()` | `/login` |
| `requestPasswordReset` | `auth.signInWithOtp({ shouldCreateUser: false })` | `/verify-otp?email=...` |
| `verifyPasswordResetOtp` | `auth.verifyOtp({ type: 'email' })` | `/reset-password` |
| `updatePassword` | `auth.updateUser({ password })` + `auth.signOut()` | `/login` |

---

## Middleware Route Rules

```
Protected (require auth):   /dashboard/**  → redirect /login if no session
Auth-only (block if authed): /login, /signup, /forgot-password, /verify-otp, /reset-password, /verify-email → redirect /dashboard
Public: /auth/callback, /
```
Use `supabase.auth.getUser()` (server-verified, not spoofable).

---

## Implementation Order

### Phase 0: Scaffolding
1. `npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
2. `npm install @supabase/supabase-js @supabase/ssr react-hook-form @hookform/resolvers zod sonner`
3. `npx shadcn@latest init` + `npx shadcn@latest add button input label card form input-otp sonner`

### Phase 1: Supabase Config
4. Create Supabase project → copy keys to `.env.local`
5. Run profiles table SQL + configure auth settings in dashboard

### Phase 2: Core Infrastructure
6. Write 3 Supabase client files (`client.ts`, `server.ts`, `middleware.ts`)
7. Write `src/middleware.ts` (route protection)
8. Write `/auth/callback/route.ts` (email confirmation handler)
9. Write `src/actions/auth.ts` (all 6 Server Actions)

### Phase 3: Pages + Components
10. Root layout + `globals.css` (dark theme)
11. `/signup` + `SignUpForm.tsx`
12. `/verify-email` (static)
13. `/login` + `LoginForm.tsx`
14. `/dashboard` + Logout button
15. `/forgot-password` + `ForgotPasswordForm.tsx`
16. `/verify-otp` + `VerifyOtpForm.tsx`
17. `/reset-password` + `ResetPasswordForm.tsx`
18. Root `/` redirect page

### Phase 4: Polish
19. Mobile responsiveness, loading states, error toasts

---

## Verification Checklist

**Sign Up:** Submit → email received → `profiles` row in DB ✓
**Sign Up Errors:** Duplicate email, mismatched passwords, invalid phone → correct errors ✓
**Login:** Valid credentials → `/dashboard` ✓
**Login Errors:** Wrong password, unverified email → informative error ✓
**Dashboard:** Unauthenticated → redirect `/login` ✓; Logout → session cleared ✓
**Forgot Password:** Email → OTP received → code accepted → new password set → login works ✓
**Route Guards:** Authenticated user visiting `/login` → `/dashboard` ✓
**Build:** `npm run build` 0 errors; `npm run lint` 0 warnings ✓
