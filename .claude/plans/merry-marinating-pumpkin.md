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
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── verify-email/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── verify-otp/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (protected)/
│   │   ├── layout.tsx
│   │   └── dashboard/page.tsx
│   └── auth/callback/route.ts
├── components/
│   ├── ui/
│   └── auth/
│       ├── SignUpForm.tsx
│       ├── LoginForm.tsx
│       ├── ForgotPasswordForm.tsx
│       ├── VerifyOtpForm.tsx
│       └── ResetPasswordForm.tsx
├── lib/supabase/
│   ├── client.ts
│   ├── server.ts
│   └── middleware.ts
├── actions/auth.ts
└── middleware.ts
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

## Key Decisions
1. OTP for Forgot Password (not magic link)
2. Server Actions over API Routes
3. Three Supabase clients (browser, server, middleware)
4. `getUser()` in middleware (not `getSession()`)
5. No DB trigger — Server Action inserts profile atomically
6. `shouldCreateUser: false` on OTP to prevent enumeration

## Server Actions
| Action | Key Call | Redirects To |
|---|---|---|
| `signUp` | `auth.signUp()` + `profiles.insert()` | `/verify-email` |
| `login` | `auth.signInWithPassword()` | `/dashboard` |
| `logout` | `auth.signOut()` | `/login` |
| `requestPasswordReset` | `auth.signInWithOtp({ shouldCreateUser: false })` | `/verify-otp?email=...` |
| `verifyPasswordResetOtp` | `auth.verifyOtp({ type: 'email' })` | `/reset-password` |
| `updatePassword` | `auth.updateUser({ password })` + `auth.signOut()` | `/login` |

## Implementation Order
- Phase 0: `create-next-app`, install deps, shadcn init
- Phase 1: Supabase clients + middleware + callback route + server actions
- Phase 2: All pages + form components
- Phase 3: Polish (mobile, loading states, toasts)

## Verification
- Sign Up → email received → profiles row in DB
- Login with valid/invalid credentials
- Dashboard auth guard
- Forgot password OTP flow end-to-end
- Route guards (authed user blocked from /login)
- `npm run build` 0 errors
