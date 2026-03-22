# 🏺 AUTO POTTERY BILL — HK.pvt.Ltd

A mobile-first billing system for pottery shops. Built with Flask + Tailwind CSS.

## ▶️ Run on Windows

Double-click `start.bat` — opens browser automatically!

## ▶️ Run Manually

```bash
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
python app.py
```

Open **http://localhost:5000**

## 🔐 Default Login

| Role   | Username | Password  |
|--------|----------|-----------|
| Admin  | admin    | admin123  |
| Worker | worker   | worker123 |

## ✨ Features

- 📱 Mobile-first PWA (installable on phone)
- 🧾 Create bills with Telugu product names
- 💬 Share bills via WhatsApp (as image)
- ⬇️ Download / Print PDF
- 📋 Bill history with search & resend
- 🌐 4 Languages: English, Hindi, Telugu, Tamil
- ⚙️ Settings — language switcher + change password
- 👥 User management (Admin only)
- 🏺 Product management (Admin only)
- 📊 Dashboard with revenue stats

## 📁 Structure

```
pottery/
├── app.py              ← Flask backend
├── requirements.txt
├── start.bat           ← Windows one-click starter
├── static/
│   ├── css/style.css
│   ├── js/billing.js
│   ├── js/i18n.js      ← Language translations
│   ├── manifest.json
│   └── sw.js
└── templates/
    ├── base.html
    ├── login.html
    ├── dashboard.html
    ├── billing.html
    ├── history.html
    ├── bill_detail.html
    ├── products.html
    ├── users.html
    ├── admin_bills.html
    └── settings.html
```

## 🚀 Deploy to Render.com

1. Push to GitHub
2. Connect repo on [render.com](https://render.com)
3. It auto-deploys using `render.yaml`
