# 🏺 Sri Lakshmi Pottery — Billing System

Pure Python + HTML/CSS/JS. No Node.js, no npm, no React needed.

## ▶️ Run on Windows (easiest)

Double-click `start.bat` — it does everything automatically!

Then open: **http://localhost:5000**

---

## ▶️ Run Manually

```bash
# 1. Create virtual environment (only first time)
python -m venv venv

# 2. Activate it
venv\Scripts\activate          # Windows
source venv/bin/activate       # Mac/Linux

# 3. Install packages (only first time)
pip install -r requirements.txt

# 4. Run
python app.py
```

Open **http://localhost:5000** in your browser.

---

## 🔐 Login

| Role   | Username | Password   |
|--------|----------|------------|
| Admin  | admin    | admin123   |
| Worker | worker   | worker123  |

---

## 👑 Admin Features
- Dashboard (revenue, bills, low stock)
- Products — Add / Edit / Delete
- Users — Add / Edit / Delete
- View all bills

## 🧑 Worker Features
- New Bill — search products, add to cart, auto-calculate
- Download PDF / Print / Share on WhatsApp
- View own bill history

---

## 📁 Files
```
pottery/
├── app.py              ← Flask backend (everything)
├── requirements.txt
├── start.bat           ← Windows one-click starter
├── static/
│   ├── css/style.css
│   └── js/billing.js
└── templates/
    ├── base.html
    ├── login.html
    ├── dashboard.html
    ├── products.html
    ├── users.html
    ├── billing.html
    ├── history.html
    └── bill_detail.html
```
