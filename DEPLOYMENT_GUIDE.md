# 🚀 Alpha Banking Cooperative - Hostinger Deployment Guide

## Complete Step-by-Step Guide to Deploy from GitHub to Hostinger with Supabase

---

## 📋 Prerequisites

Before starting, ensure you have:
- [ ] GitHub account with access to your repository
- [ ] Hostinger hosting account (Premium or Business plan recommended)
- [ ] Domain connected to Hostinger (e.g., `mainoffice.online`)
- [ ] Supabase account with your production project ready
- [ ] Node.js installed locally (v18 or higher)

---

## 🔧 PHASE 1: Prepare Your Supabase Production Database

### Step 1.1: Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your production project (e.g., `onlacjgyixikndtrxcug`)
3. Navigate to **Settings → API**
4. Copy these values:
   - **Project URL**: `https://onlacjgyixikndtrxcug.supabase.co`
   - **Anon Public Key**: `eyJhbGci...` (the long JWT token)

### Step 1.2: Set Up Database Tables

In Supabase SQL Editor, run the schema migrations to create all required tables:

```sql
-- Run these in order in your Supabase SQL Editor

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create ENUM types
CREATE TYPE kyc_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE membership_tier AS ENUM ('bronze', 'silver', 'gold', 'founding');
CREATE TYPE loan_status AS ENUM ('open', 'funded', 'repaid', 'defaulted');
CREATE TYPE transaction_status AS ENUM ('clearing', 'completed', 'reversed');
CREATE TYPE transaction_type AS ENUM (
  'deposit', 'withdrawal', 'transfer_out', 'transfer_in',
  'lending_profit', 'vault_interest', 'loan_funding', 'loan_repayment',
  'collateral_lock', 'collateral_release', 'referral_commission'
);
CREATE TYPE app_role AS ENUM ('member', 'admin', 'governor');

-- 3. Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id TEXT UNIQUE NOT NULL,
  email TEXT,
  display_name TEXT,
  phone TEXT,
  vault_balance BIGINT DEFAULT 0,
  frozen_balance BIGINT DEFAULT 0,
  lending_balance BIGINT DEFAULT 0,
  membership_tier membership_tier DEFAULT 'bronze',
  kyc_status kyc_status DEFAULT 'pending',
  referral_code TEXT UNIQUE,
  referrer_id UUID REFERENCES public.profiles(id),
  total_referral_earnings BIGINT DEFAULT 0,
  security_question_1 TEXT,
  security_answer_1 TEXT,
  security_question_2 TEXT,
  security_answer_2 TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 5. Create global_settings table
CREATE TABLE public.global_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_interest_rate NUMERIC DEFAULT 0.5,
  lending_yield_rate NUMERIC DEFAULT 0.5,
  borrower_cost_rate NUMERIC DEFAULT 15.0,
  referral_level1_rate NUMERIC DEFAULT 3.0,
  system_kill_switch BOOLEAN DEFAULT FALSE,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  qr_gateway_url TEXT,
  receiver_name TEXT,
  receiver_phone TEXT,
  founding_alpha_end_date DATE DEFAULT '2026-03-31',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID
);

-- 6. Create public_config table (for realtime sync)
CREATE TABLE public.public_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_interest_rate NUMERIC DEFAULT 0.5,
  lending_yield_rate NUMERIC DEFAULT 0.5,
  qr_gateway_url TEXT,
  receiver_name TEXT,
  receiver_phone TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create ledger table
CREATE TABLE public.ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  type transaction_type NOT NULL,
  amount BIGINT NOT NULL,
  status transaction_status DEFAULT 'clearing',
  reference_number TEXT NOT NULL,
  description TEXT,
  destination TEXT,
  related_user_id UUID,
  related_loan_id UUID,
  metadata JSONB,
  approval_status TEXT DEFAULT 'pending_review',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  clearing_ends_at TIMESTAMPTZ,
  cleared_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create p2p_loans table
CREATE TABLE public.p2p_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_id UUID NOT NULL REFERENCES public.profiles(id),
  lender_id UUID REFERENCES public.profiles(id),
  principal_amount BIGINT NOT NULL,
  collateral_amount BIGINT NOT NULL,
  interest_rate NUMERIC NOT NULL,
  duration_days INTEGER DEFAULT 30,
  capital_lock_days INTEGER DEFAULT 28,
  status loan_status DEFAULT 'open',
  approval_status TEXT DEFAULT 'pending_review',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  reference_number TEXT NOT NULL,
  funded_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  capital_unlock_date TIMESTAMPTZ,
  repaid_at TIMESTAMPTZ,
  auto_repay_triggered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Create reserve_fund table
CREATE TABLE public.reserve_fund (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_reserve_balance BIGINT DEFAULT 0,
  total_payouts_made BIGINT DEFAULT 0,
  fee_accumulation BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Create cms_posts table
CREATE TABLE public.cms_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body_text TEXT NOT NULL,
  media_type TEXT,
  content_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_announcement BOOLEAN DEFAULT FALSE,
  author_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Create admin_audit_log table
CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Create interest_history table
CREATE TABLE public.interest_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  previous_balance BIGINT NOT NULL,
  interest_rate NUMERIC NOT NULL,
  interest_amount BIGINT NOT NULL,
  new_balance BIGINT NOT NULL,
  reference_number TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.p2p_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reserve_fund ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interest_history ENABLE ROW LEVEL SECURITY;

-- 14. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ledger;
ALTER PUBLICATION supabase_realtime ADD TABLE public.p2p_loans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.public_config;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_audit_log;
```

### Step 1.3: Create Storage Bucket

```sql
-- Create QR codes storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('qr-codes', 'qr-codes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "QR codes are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'qr-codes');

CREATE POLICY "Admins can upload QR codes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'qr-codes' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'governor')
  )
);
```

### Step 1.4: Configure Authentication

1. Go to **Authentication → URL Configuration**
2. Set **Site URL**: `https://mainoffice.online`
3. Add **Redirect URLs**:
   - `https://mainoffice.online`
   - `https://mainoffice.online/*`
   - `https://mainoffice.online/login`
   - `https://mainoffice.online/dashboard`

4. Go to **Authentication → Email Templates** and customize if needed

5. Go to **Authentication → Settings**:
   - Enable "Confirm email" or disable for auto-confirm
   - Set password requirements

---

## 🔧 PHASE 2: Prepare Your Local Project

### Step 2.1: Clone from GitHub

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME

# Install dependencies
npm install
```

### Step 2.2: Create Production Environment File

Create a new file `.env.production` in the project root:

```env
# Production Supabase Configuration
VITE_SUPABASE_URL=https://onlacjgyixikndtrxcug.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ubGFjamd5aXhpa25kdHJ4Y3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MDQ5NDgsImV4cCI6MjA4NDQ4MDk0OH0.vz75hle7XgTzXutuVoFCnoZKKgLmpIX-lYDHYPbOMqw
VITE_SUPABASE_PROJECT_ID=onlacjgyixikndtrxcug
```

### Step 2.3: Update Supabase Client (IMPORTANT!)

Edit `src/integrations/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use environment variables for flexibility
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://onlacjgyixikndtrxcug.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ubGFjamd5aXhpa25kdHJ4Y3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MDQ5NDgsImV4cCI6MjA4NDQ4MDk0OH0.vz75hle7XgTzXutuVoFCnoZKKgLmpIX-lYDHYPbOMqw';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

### Step 2.4: Update Vite Config for Hostinger

Edit `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: '/', // Use '/' for root domain, '/subfolder/' if in subfolder
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
        }
      }
    }
  }
});
```

### Step 2.5: Build the Project

```bash
# Build for production
npm run build

# This creates a 'dist' folder with all static files
```

---

## 🌐 PHASE 3: Deploy to Hostinger

### Step 3.1: Access Hostinger File Manager

1. Log in to [Hostinger](https://hpanel.hostinger.com)
2. Go to **Websites → Your Domain → File Manager**
3. Navigate to `public_html` folder

### Step 3.2: Clear Existing Files (if any)

1. Select all files in `public_html`
2. Delete them (backup first if needed)

### Step 3.3: Upload Your Build

**Option A: Using File Manager (Easy)**

1. Open the `dist` folder on your computer
2. Select ALL files and folders inside `dist`:
   - `index.html`
   - `assets/` folder
   - Any other files
3. Upload them directly to `public_html`

**Option B: Using FTP (Recommended for large projects)**

1. Go to **Files → FTP Accounts** in Hostinger
2. Get your FTP credentials
3. Use FileZilla or similar FTP client:
   ```
   Host: ftp.mainoffice.online (or your domain)
   Username: your-ftp-username
   Password: your-ftp-password
   Port: 21
   ```
4. Upload contents of `dist` folder to `public_html`

### Step 3.4: Create .htaccess for SPA Routing

Create a file named `.htaccess` in `public_html`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Handle Authorization Header
  RewriteCond %{HTTP:Authorization} .
  RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
  
  # Redirect Trailing Slashes
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_URI} (.+)/$
  RewriteRule ^ %1 [L,R=301]
  
  # Handle Front Controller
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteRule ^ index.html [L]
</IfModule>

# Security Headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

---

## 🔒 PHASE 4: Configure Domain & SSL

### Step 4.1: Point Domain to Hostinger

1. Go to **Domains → Your Domain → DNS Zone**
2. Ensure A record points to your Hostinger IP
3. Wait for DNS propagation (up to 48 hours)

### Step 4.2: Enable SSL Certificate

1. Go to **Websites → Your Domain → SSL**
2. Click **Install SSL** (Let's Encrypt - Free)
3. Wait for installation (usually 5-10 minutes)
4. Enable **Force HTTPS**

---

## ✅ PHASE 5: Final Verification

### Step 5.1: Test Your Deployment

Visit these URLs and verify they work:

- [ ] `https://mainoffice.online` - Landing page loads
- [ ] `https://mainoffice.online/login` - Login page works
- [ ] `https://mainoffice.online/register` - Registration works
- [ ] `https://mainoffice.online/dashboard` - Dashboard loads (after login)

### Step 5.2: Test Supabase Connection

1. Open browser DevTools (F12)
2. Go to Network tab
3. Verify requests to `onlacjgyixikndtrxcug.supabase.co` return 200

### Step 5.3: Test Authentication Flow

1. Register a new account
2. Check Supabase Dashboard → Authentication → Users
3. Verify user was created

---

## 🔄 PHASE 6: Continuous Deployment (Optional)

### Option A: Manual Updates

```bash
# After making changes
npm run build
# Re-upload dist folder to Hostinger
```

### Option B: GitHub Actions Auto-Deploy

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Hostinger

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
      
      - name: Deploy via FTP
        uses: SamKirkland/FTP-Deploy-Action@v4.3.4
        with:
          server: ${{ secrets.FTP_SERVER }}
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          local-dir: ./dist/
          server-dir: /public_html/
```

Add these secrets in GitHub → Settings → Secrets:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `FTP_SERVER`
- `FTP_USERNAME`
- `FTP_PASSWORD`

---

## 🚨 Troubleshooting

### Issue: Blank page after deployment
**Solution**: Check `.htaccess` file is uploaded and has correct content

### Issue: 404 on page refresh
**Solution**: Ensure `.htaccess` SPA routing rules are in place

### Issue: Supabase connection failing
**Solution**: 
1. Check browser console for CORS errors
2. Verify Site URL in Supabase matches your domain
3. Ensure environment variables are correct

### Issue: Authentication not working
**Solution**:
1. Check Supabase Auth → URL Configuration
2. Verify redirect URLs include your domain
3. Check browser console for errors

### Issue: Assets not loading
**Solution**:
1. Check file paths in index.html
2. Ensure `base: '/'` in vite.config.ts
3. Verify assets folder was uploaded

---

## 📞 Support Contacts

- **Hostinger Support**: Via hPanel live chat
- **Supabase Support**: support@supabase.io
- **GitHub Issues**: Your repository issues page

---

## 🎉 Deployment Complete!

Your Alpha Banking Cooperative is now live at `https://mainoffice.online`!

Remember to:
- [ ] Set up the Supreme Governor account
- [ ] Configure initial QR gateway
- [ ] Seed initial system settings
- [ ] Test all critical flows (deposit, loan, transfer)
