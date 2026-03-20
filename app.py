from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from functools import wraps
import json, os

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'pottery-secret-2026')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///pottery.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ── Models ────────────────────────────────────────────────────────────────────

class User(db.Model):
    id       = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)
    role     = db.Column(db.String(20), nullable=False, default='user')
    bills    = db.relationship('Bill', backref='creator', lazy=True)

class Product(db.Model):
    id          = db.Column(db.Integer, primary_key=True)
    telugu_name = db.Column(db.String(120), nullable=False)   # Telugu script: కుండ
    english_name= db.Column(db.String(120), nullable=False)   # Pronunciation: Kunda

class Bill(db.Model):
    id            = db.Column(db.Integer, primary_key=True)
    bill_number   = db.Column(db.String(30), unique=True, nullable=False)
    customer_name = db.Column(db.String(120), nullable=False)
    customer_phone= db.Column(db.String(20), default='')
    items         = db.Column(db.Text, nullable=False)
    total_amount  = db.Column(db.Float, nullable=False)
    balance       = db.Column(db.Float, nullable=False, default=0.0)
    created_by    = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    def get_items(self):
        return json.loads(self.items)

    def to_dict(self):
        raw = self.get_items()
        bill_items = []
        for item in raw:
            bill_items.append({
                'product_id':  item.get('product_id', ''),
                'name':        item.get('name', ''),
                'telugu_name': item.get('telugu_name', item.get('name', '')),
                'quantity':    item.get('quantity', 1),
                'price':       item.get('price', 0),
                'total':       item.get('total', 0),
            })
        return {
            'id':             self.id,
            'bill_number':    self.bill_number,
            'customer_name':  self.customer_name,
            'customer_phone': self.customer_phone,
            'bill_items':     bill_items,
            'total_amount':   self.total_amount,
            'created_by':     self.creator.username if self.creator else '--',
            'date':           self.created_at.strftime('%d %b %Y'),
            'time':           self.created_at.strftime('%I:%M %p'),
            'balance':        self.balance,
        }

# ── Auth helpers ───────────────────────────────────────────────────────────────

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        if session.get('role') != 'admin':
            return redirect(url_for('billing'))
        return f(*args, **kwargs)
    return decorated

def gen_bill_number():
    count = Bill.query.count() + 1
    return f"APB-{datetime.now().strftime('%Y%m')}-{count:04d}"

# ── Auth routes ────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return redirect(url_for('dashboard') if session.get('role') == 'admin' else url_for('billing'))

@app.route('/login', methods=['GET','POST'])
def login():
    if 'user_id' in session:
        return redirect(url_for('index'))
    error = None
    if request.method == 'POST':
        u = User.query.filter_by(username=request.form.get('username','').strip()).first()
        if u and check_password_hash(u.password, request.form.get('password','')):
            session.update({'user_id': u.id, 'username': u.username, 'role': u.role})
            return redirect(url_for('index'))
        error = 'Invalid username or password'
    return render_template('login.html', error=error)

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

# ── Admin: Dashboard ──────────────────────────────────────────────────────────

@app.route('/dashboard')
@admin_required
def dashboard():
    today = datetime.utcnow().date()
    today_bills   = Bill.query.filter(db.func.date(Bill.created_at) == today).all()
    today_revenue = sum(b.total_amount for b in today_bills)
    recent_bills  = Bill.query.order_by(Bill.created_at.desc()).limit(6).all()
    low_stock     = []  # no stock tracking now
    return render_template('dashboard.html',
        today_revenue=today_revenue,
        today_bills=len(today_bills),
        total_bills=Bill.query.count(),
        total_products=Product.query.count(),
        recent_bills=recent_bills,
        low_stock=low_stock,
    )

# ── Admin: Products ────────────────────────────────────────────────────────────

@app.route('/products')
@admin_required
def products():
    search = request.args.get('q','')
    q = Product.query
    if search:
        q = q.filter(
            db.or_(Product.telugu_name.ilike(f'%{search}%'),
                   Product.english_name.ilike(f'%{search}%'))
        )
    prods = q.order_by(Product.english_name).all()
    return render_template('products.html', products=prods, search=search)

@app.route('/products/add', methods=['POST'])
@admin_required
def add_product():
    telugu  = request.form.get('telugu_name','').strip()
    english = request.form.get('english_name','').strip()
    if not telugu or not english:
        return redirect(url_for('products'))
    db.session.add(Product(telugu_name=telugu, english_name=english))
    db.session.commit()
    return redirect(url_for('products'))

@app.route('/products/edit/<int:pid>', methods=['POST'])
@admin_required
def edit_product(pid):
    p = Product.query.get_or_404(pid)
    p.telugu_name  = request.form.get('telugu_name', p.telugu_name).strip()
    p.english_name = request.form.get('english_name', p.english_name).strip()
    db.session.commit()
    return redirect(url_for('products'))

@app.route('/products/delete/<int:pid>', methods=['POST'])
@admin_required
def delete_product(pid):
    db.session.delete(Product.query.get_or_404(pid))
    db.session.commit()
    return redirect(url_for('products'))

# ── Admin: Users ───────────────────────────────────────────────────────────────

@app.route('/users')
@admin_required
def users():
    return render_template('users.html', users=User.query.order_by(User.username).all())

@app.route('/users/add', methods=['POST'])
@admin_required
def add_user():
    username = request.form.get('username','').strip()
    password = request.form.get('password','')
    role     = request.form.get('role','user')
    if not username or not password:
        return redirect(url_for('users'))
    if User.query.filter_by(username=username).first():
        return redirect(url_for('users') + '?error=Username+already+exists')
    db.session.add(User(username=username, password=generate_password_hash(password), role=role))
    db.session.commit()
    return redirect(url_for('users'))

@app.route('/users/edit/<int:uid>', methods=['POST'])
@admin_required
def edit_user(uid):
    u = User.query.get_or_404(uid)
    new_username = request.form.get('username','').strip()
    new_role     = request.form.get('role', u.role)
    new_password = request.form.get('password','').strip()
    if new_username and new_username != u.username:
        if User.query.filter_by(username=new_username).first():
            return redirect(url_for('users') + '?error=Username+already+taken')
        u.username = new_username
    if u.username != 'admin':
        u.role = new_role
    if new_password:
        u.password = generate_password_hash(new_password)
    db.session.commit()
    return redirect(url_for('users'))

@app.route('/users/delete/<int:uid>', methods=['POST'])
@admin_required
def delete_user(uid):
    u = User.query.get_or_404(uid)
    if u.username != 'admin':
        db.session.delete(u)
        db.session.commit()
    return redirect(url_for('users'))

# ── Admin: All Bills ──────────────────────────────────────────────────────────

@app.route('/admin/bills')
@admin_required
def admin_bills():
    search = request.args.get('q','')
    date_f = request.args.get('date','')
    q = Bill.query
    if search:
        q = q.filter(Bill.customer_name.ilike(f'%{search}%'))
    if date_f:
        try:
            d = datetime.strptime(date_f, '%Y-%m-%d').date()
            q = q.filter(db.func.date(Bill.created_at) == d)
        except: pass
    bills = q.order_by(Bill.created_at.desc()).all()
    return render_template('admin_bills.html', bills=bills, search=search, date_f=date_f)

# ── User: Billing ─────────────────────────────────────────────────────────────

@app.route('/billing')
@login_required
def billing():
    products = Product.query.order_by(Product.english_name).all()
    return render_template('billing.html', products=products, now=datetime.now())

@app.route('/billing/create', methods=['POST'])
@login_required
def create_bill():
    data          = request.get_json()
    customer_name = (data.get('customer_name') or '').strip()
    customer_phone= (data.get('customer_phone') or '').strip()
    items         = data.get('items', [])

    if not customer_name:
        return jsonify({'error': 'Customer name is required'}), 400
    if not items:
        return jsonify({'error': 'Add at least one item'}), 400

    enriched = []
    for item in items:
        qty   = int(item.get('quantity', 1))
        price = float(item.get('price', 0))
        if price <= 0:
            return jsonify({'error': f"Price for {item.get('name')} must be greater than 0"}), 400
        enriched.append({
            'product_id': item.get('product_id'),
            'name': item.get('name'),
            'telugu_name': item.get('telugu_name',''),
            'quantity': qty,
            'price': price,
            'total': round(qty * price, 2)
        })

    total = round(sum(i['total'] for i in enriched), 2)
    balance = round(float(data.get('balance', 0) or 0), 2)
    bill  = Bill(
        bill_number   = gen_bill_number(),
        customer_name = customer_name,
        customer_phone= customer_phone,
        items         = json.dumps(enriched),
        total_amount  = round(total + balance, 2),
        balance       = balance,
        created_by    = session['user_id'],
    )
    db.session.add(bill)
    db.session.commit()
    return jsonify({'success': True, 'bill': bill.to_dict()}), 200

# ── User: History ─────────────────────────────────────────────────────────────

@app.route('/history')
@login_required
def history():
    search = request.args.get('q','')
    date_f = request.args.get('date','')
    uid    = session['user_id']
    role   = session.get('role')
    q = Bill.query if role == 'admin' else Bill.query.filter_by(created_by=uid)
    if search:
        q = q.filter(Bill.customer_name.ilike(f'%{search}%'))
    if date_f:
        try:
            d = datetime.strptime(date_f, '%Y-%m-%d').date()
            q = q.filter(db.func.date(Bill.created_at) == d)
        except: pass
    bills = q.order_by(Bill.created_at.desc()).all()
    bills_data = [b.to_dict() for b in bills]
    return render_template('history.html', bills=bills_data, search=search, date_f=date_f)

@app.route('/bill/<int:bid>')
@login_required
def view_bill(bid):
    bill = Bill.query.get_or_404(bid)
    if session.get('role') != 'admin' and bill.created_by != session['user_id']:
        return redirect(url_for('history'))
    return render_template('bill_detail.html', bill=bill.to_dict())

@app.route('/api/products')
@login_required
def api_products():
    products = Product.query.order_by(Product.english_name).all()
    return jsonify([{'id': p.id, 'telugu_name': p.telugu_name, 'english_name': p.english_name} for p in products])

# ── Seed & Run ────────────────────────────────────────────────────────────────

def seed():
    if not User.query.filter_by(username='admin').first():
        db.session.add(User(username='admin', password=generate_password_hash('admin123'), role='admin'))
        db.session.add(User(username='worker', password=generate_password_hash('worker123'), role='user'))
        db.session.commit()
        print("✅ Seeded users: admin/admin123, worker/worker123")

    if Product.query.count() == 0:
        samples = [
            ('కుండ',         'Kunda'),
            ('చిన్న కుండ',   'Chinna Kunda'),
            ('పెద్ద కుండ',   'Pedda Kunda'),
            ('కూజా',         'Kooja'),
            ('పువ్వుల కుండ', 'Puvvula Kunda'),
            ('మట్టి గిన్నె',  'Matti Ginne'),
            ('సురాయి',       'Surayi'),
            ('మట్టి దీపం',   'Matti Deepam'),
            ('బుడ్డి',        'Buddi'),
            ('కలశం',         'Kalasham'),
        ]
        for t, e in samples:
            db.session.add(Product(telugu_name=t, english_name=e))
        db.session.commit()
        print("✅ Seeded sample products")

with app.app_context():
    db.create_all()
    seed()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)