# Amanda Cards – Developer Setup Guide

## File Structure
 
```
amanda-cards/
├── index.html              ← Landing page (hero)
├── login.html              ← Login (email/password + Google + Apple)
├── signup.html             ← Registration
├── dashboard.html          ← User dashboard (plans, profile setup, analytics, messages)
├── admin/
│   └── dashboard.html      ← Super admin (orders, QR codes, user management)
├── card/
│   └── preview.html        ← Public profile card (yoursite.com/card/{slug})
└── api/
    ├── handler.php         ← PHP email handler
    └── supabase_schema.sql ← Supabase database setup
```

## Quick Start

### 1. Supabase Setup

1. Create a project at https://supabase.com
2. Go to SQL Editor → paste contents of `api/supabase_schema.sql` → Run
3. Go to Authentication → Providers → Enable Email, Google, Apple
4. Go to Storage → Create two public buckets: `avatars` and `gallery`
5. Copy your Project URL and Anon Key from Settings → API

### 2. Update Config in HTML Files

Replace these placeholders in `login.html` and `signup.html`:

```javascript
const SUPABASE_URL = "https://mzokzdbqctnlezngutgb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_pgFzbPv--9AAAgJcy3rxRA_T5_dJApH";
```

### 3. Google OAuth

1. Go to https://console.cloud.google.com
2. Create OAuth 2.0 credentials
3. Add your domain to Authorized Redirect URIs
4. Add Client ID and Secret to Supabase Dashboard → Auth → Google

### 4. Apple OAuth

1. Go to https://developer.apple.com
2. Register a Service ID
3. Add your domain and callback URL
4. Add credentials to Supabase Dashboard → Auth → Apple

### 5. PHP Email Setup

- Upload all files to PHP hosting (cPanel recommended)
- Configure SMTP/mail in cPanel → Email Accounts
- The `api/handler.php` uses PHP's `mail()` function
- All emails go to: amandatechnologies@gmail.com

### 6. Card URL Routing

For `amandacards.co.ug/card/jane-nakato`:

- Either generate static HTML per user, OR
- Use a PHP router (index.php) that reads slug from URL and renders the card

Example `.htaccess` for card routing:

```apache
RewriteEngine On
RewriteRule ^card/([a-z0-9-]+)/?$ card/index.php?slug=$1 [L,QSA]
```

## Admin Login

- Email: amandatechnologies@gmail.com
- The system auto-redirects this email to the admin dashboard

## Package Activation Flow

1. User signs up → selects plan → enters phone number
2. System emails amandatechnologies@gmail.com with request details
3. Admin calls user to confirm payment
4. Admin goes to Admin Dashboard → Orders → toggles the activation switch
5. System emails user that their card is now active
6. User can now set up their profile

## Phone Number Warning

The phone number on the card profile is:

- Displayed prominently with a warning before saving
- Locked after first save (disabled input + message shown)
- Cannot be changed without admin intervention (UGX 20,000 fee)

## Pricing

- Starter: UGX 65,000 (1 card, 5 photos, 1 template)
- Premium: UGX 120,000 (2 cards, 10 photos, 5 templates, video, brand colour, contact form)
- Card replacement: UGX 20,000

## Analytics Tracked

- Profile visits (with referrer source)
- Contact saves
- Individual link clicks (Instagram, WhatsApp, phone, website, etc.)
- Avg. time on page (JS `visibilitychange` event)
- Video plays (Premium only)
- Messages received
