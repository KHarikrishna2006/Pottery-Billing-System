/* ═══════════════════════════════════════
   AUTO POTTERY BILL — BILLING LOGIC
   ═══════════════════════════════════════ */

var cart = [];
var curBill = null;

/* ── FILTER PRODUCTS ── */
function filterProds() {
  var q = document.getElementById('filterBox').value.toLowerCase();
  document.querySelectorAll('.prod-tile').forEach(function(t) {
    t.style.display = (q && (t.getAttribute('data-n') || '').indexOf(q) === -1) ? 'none' : '';
  });
}

/* ── ADD PRODUCT ── */
function addProd(id, tel, eng) {
  var ex = cart.find(function(i) { return i.pid === id; });
  if (ex) {
    ex.qty++;
    ex.total = ex.qty * ex.price;
  } else {
    cart.push({ pid: id, tel: tel, eng: eng, qty: 1, price: 0, total: 0 });
  }
  highlightTile(id, true);
  updateBadge(id);
  renderCart();
}

/* ── HIGHLIGHT TILE ── */
function highlightTile(id, selected) {
  var t = document.getElementById('tile' + id);
  if (!t) return;
  if (selected) {
    t.style.border = '2.5px solid #4F46E5';
    t.style.background = '#EEF2FF';
    t.style.boxShadow = '0 0 0 3px rgba(79,70,229,.15)';
  } else {
    t.style.border = '';
    t.style.background = '';
    t.style.boxShadow = '';
  }
}

/* ── UPDATE BADGE ── */
function updateBadge(id) {
  var it = cart.find(function(i) { return i.pid === id; });
  var b = document.getElementById('badge' + id);
  if (!b) return;
  if (it && it.qty > 0) {
    b.textContent = it.qty;
    b.style.display = 'flex';
  } else {
    b.style.display = 'none';
  }
}

/* ── REMOVE ITEM ── */
function remItem(idx) {
  var id = cart[idx].pid;
  cart.splice(idx, 1);
  highlightTile(id, false);
  updateBadge(id);
  renderCart();
}

/* ── UPDATE QTY ── */
function updQty(idx, v) {
  cart[idx].qty = Math.max(1, parseInt(v) || 1);
  cart[idx].total = cart[idx].qty * cart[idx].price;
  updateBadge(cart[idx].pid);
  renderCart();
}

/* ── UPDATE PRICE ── */
function updPrice(idx, v) {
  cart[idx].price = parseFloat(v) || 0;
  cart[idx].total = cart[idx].qty * cart[idx].price;
  renderCart();
}

/* ── CLEAR CART ── */
function clearCart() {
  cart.forEach(function(i) {
    highlightTile(i.pid, false);
    updateBadge(i.pid);
  });
  cart = [];
  renderCart();
}

/* ── RENDER CART ── */
function renderCart() {
  var empty = document.getElementById('cartEmpty');
  var items = document.getElementById('cartItems');
  if (!cart.length) {
    empty.style.display = '';
    items.style.display = 'none';
    items.innerHTML = '';
  } else {
    empty.style.display = 'none';
    items.style.display = '';
    items.innerHTML = cart.map(function(it, idx) {
      return (
        '<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:12px 14px;margin-bottom:8px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">' +
            '<div>' +
              '<p style="font-weight:700;font-size:.88rem;color:#0F172A;margin:0;">' + it.tel + '</p>' +
              '<p style="font-size:.72rem;color:#94A3B8;margin:2px 0 0;">' + it.eng + '</p>' +
            '</div>' +
            '<button onclick="remItem(' + idx + ')" style="width:26px;height:26px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);color:#EF4444;border-radius:7px;font-size:.75rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;">✕</button>' +
          '</div>' +
          '<div style="display:flex;gap:8px;">' +
            '<div style="flex:1;">' +
              '<p style="font-size:.65rem;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.5px;margin:0 0 4px;">Qty</p>' +
              '<input type="number" min="1" value="' + it.qty + '" onchange="updQty(' + idx + ',this.value)" ' +
              'style="width:100%;padding:7px 8px;border:1.5px solid #E2E8F0;border-radius:8px;text-align:center;font-size:.85rem;color:#0F172A;background:#fff;outline:none;font-family:Inter,sans-serif;"/>' +
            '</div>' +
            '<div style="flex:1.5;">' +
              '<p style="font-size:.65rem;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.5px;margin:0 0 4px;">Price / Unit (₹)</p>' +
              '<input type="number" min="0" step="0.01" value="' + (it.price || '') + '" placeholder="0.00" onchange="updPrice(' + idx + ',this.value)" ' +
              'style="width:100%;padding:7px 8px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:.85rem;color:#0F172A;background:#fff;outline:none;font-family:Inter,sans-serif;"/>' +
            '</div>' +
            '<div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;">' +
              '<p style="font-size:.65rem;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.5px;margin:0 0 4px;">Total</p>' +
              '<p style="font-weight:700;font-size:.9rem;color:#4F46E5;margin:0;padding:7px 0;">₹' + it.total.toFixed(2) + '</p>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }
  calcTotal();
}

/* ── CALC TOTAL ── */
function calcTotal() {
  var itemTotal = cart.reduce(function(s, i) { return s + i.total; }, 0);
  var bal = parseFloat((document.getElementById('balAmt') || {}).value) || 0; /* negative = reduce total */
  var grand = itemTotal + bal;

  var gtEl = document.getElementById('grandTotal');
  if (gtEl) gtEl.textContent = '₹' + grand.toFixed(2);

  var bn = document.getElementById('balNote');
  if (bn) bn.style.display = bal > 0 ? '' : 'none';

  var se = document.getElementById('sumItems');
  if (se) {
    if (!cart.length && bal <= 0) {
      se.innerHTML = '<p style="font-size:.85rem;color:#94A3B8;">No items yet</p>';
    } else {
      var h = cart.map(function(i) {
        return '<div style="display:flex;justify-content:space-between;font-size:.84rem;padding:4px 0;border-bottom:1px solid #F1F5F9;">' +
          '<span style="color:#475569;">' + i.tel + ' ×' + i.qty + '</span>' +
          '<span style="font-weight:600;color:#0F172A;">₹' + i.total.toFixed(2) + '</span>' +
        '</div>';
      }).join('');
      if (bal > 0) h += '<div style="display:flex;justify-content:space-between;font-size:.84rem;padding:4px 0;color:#EF4444;font-weight:600;"><span>⚠️ Balance</span><span>₹' + bal.toFixed(2) + '</span></div>';
      se.innerHTML = h;
    }
  }

  var btn = document.getElementById('genBtn');
  var name = (document.getElementById('custName') || {}).value || '';
  if (btn) btn.disabled = !(name.trim() && cart.length > 0);

  var hint = document.getElementById('genHint');
  if (hint) hint.style.display = (!name.trim() || !cart.length) ? '' : 'none';
}

/* ── GENERATE BILL ── */
function genBill() {
  var name = document.getElementById('custName').value.trim();
  var phone = document.getElementById('custPhone').value.trim();
  var bal = parseFloat(document.getElementById('balAmt').value) || 0;
  if (!name) { alert('Enter customer name'); return; }
  if (!cart.length) { alert('Add at least one item'); return; }
  var mp = cart.find(function(i) { return !i.price || i.price <= 0; });
  if (mp) { alert('Enter price for: ' + mp.tel); return; }

  var now = new Date();
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var dd = now.getDate().toString().padStart(2,'0');
  var mo = months[now.getMonth()];
  var yyyy = now.getFullYear();
  var hh = (now.getHours() % 12 || 12).toString().padStart(2,'0');
  var mi = now.getMinutes().toString().padStart(2,'0');
  var ampm = now.getHours() >= 12 ? 'PM' : 'AM';
  var jsDate = dd + ' ' + mo + ' ' + yyyy;
  var jsTime = hh + ':' + mi + ' ' + ampm;

  var btn = document.getElementById('genBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Generating...';

  fetch('/billing/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_name: name, customer_phone: phone, balance: bal,
      items: cart.map(function(i) {
        return { product_id: i.pid, name: i.eng, telugu_name: i.tel, quantity: i.qty, price: i.price };
      })
    })
  }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.error) { alert('Error: ' + d.error); btn.disabled = false; btn.textContent = '🧾 Generate Bill'; return; }
    d.bill.date = jsDate;
    d.bill.time = jsTime;
    curBill = d.bill;
    showSucc(d.bill);
  }).catch(function() { alert('Failed. Try again.'); btn.disabled = false; btn.textContent = '🧾 Generate Bill'; });
}

/* ── SHOW SUCCESS MODAL ── */
function showSucc(b) {
  document.getElementById('succBillNo').textContent = b.bill_number + ' · ₹' + b.total_amount.toFixed(2);

  var rows = b.bill_items.map(function(it) {
    return '<div style="display:flex;align-items:center;padding:10px 0;border-bottom:1px solid #F1F5F9;">' +
      '<span style="flex:3;font-size:.88rem;color:#0F172A;font-weight:500;">' + (it.telugu_name || it.name) + ' <span style="color:#94A3B8;font-size:.75rem;">(' + it.name + ')</span></span>' +
      '<span style="flex:1;text-align:center;font-size:.88rem;color:#475569;">' + it.quantity + '</span>' +
      '<span style="flex:1.1;text-align:right;font-size:.88rem;color:#475569;">₹' + it.price.toFixed(2) + '</span>' +
      '<span style="flex:1.1;text-align:right;font-size:.88rem;font-weight:700;color:#0F172A;">₹' + it.total.toFixed(2) + '</span>' +
    '</div>';
  }).join('');

  var balRow = '';
  if (b.balance && b.balance > 0) {
    balRow = '<div style="display:flex;align-items:center;padding:10px 0;border-bottom:1px solid #F1F5F9;">' +
      '<span style="flex:3;font-size:.88rem;color:#EF4444;font-weight:600;">⚠️ Previous Balance</span>' +
      '<span style="flex:1;"></span><span style="flex:1.1;"></span>' +
      '<span style="flex:1.1;text-align:right;font-size:.88rem;font-weight:700;color:#EF4444;">₹' + b.balance.toFixed(2) + '</span>' +
    '</div>';
  }

  document.getElementById('billPreview').innerHTML =
    '<div id="bill-render" style="font-family:Inter,system-ui,sans-serif;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden;">'+
      '<div style="padding:22px 22px 18px;text-align:center;border-bottom:3px double #0F172A;">'+
        '<h2 style="font-family:Georgia,serif;font-size:1.45rem;font-weight:800;color:#0F172A;letter-spacing:.5px;margin:0;">AUTO POTTERY BILL</h2>'+
        '<p style="font-size:.8rem;color:#94A3B8;margin:4px 0 0;">HK.pvt.Ltd</p>'+
      '</div>'+
      '<div style="padding:18px 22px;">'+
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;flex-wrap:wrap;gap:8px;">'+
          '<div>'+
            '<p style="font-weight:800;font-size:.9rem;color:#0F172A;font-family:monospace;margin:0;">'+b.bill_number+'</p>'+
            '<p style="font-size:.9rem;color:#0F172A;margin:5px 0 0;"><strong>Customer:</strong> '+b.customer_name+'</p>'+
            (b.customer_phone?'<p style="font-size:.8rem;color:#475569;margin:3px 0 0;">📞 '+b.customer_phone+'</p>':'')+
          '</div>'+
          '<p style="font-size:.8rem;color:#94A3B8;text-align:right;margin:0;white-space:nowrap;">'+b.date+' · '+b.time+'</p>'+
        '</div>'+
        '<div style="border-top:1.5px solid #CBD5E1;"></div>'+
        '<div style="display:flex;padding:8px 0;border-bottom:1px solid #E2E8F0;">'+
          '<span style="flex:3;font-size:.7rem;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.6px;">Item</span>'+
          '<span style="flex:1;text-align:center;font-size:.7rem;font-weight:700;color:#94A3B8;text-transform:uppercase;">Qty</span>'+
          '<span style="flex:1.1;text-align:right;font-size:.7rem;font-weight:700;color:#94A3B8;text-transform:uppercase;">Price</span>'+
          '<span style="flex:1.1;text-align:right;font-size:.7rem;font-weight:700;color:#94A3B8;text-transform:uppercase;">Total</span>'+
        '</div>'+
        rows+balRow+
        '<div style="margin:20px 4px 4px;background:#1E2D4A;border-radius:18px;padding:22px 28px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 6px 20px rgba(15,23,42,.25);">'+
          '<span style="color:#FFFFFF;font-weight:800;font-size:1.1rem;letter-spacing:.3px;">Grand Total</span>'+
          '<span style="color:#FBBF24;font-weight:800;font-size:1.5rem;font-family:Georgia,serif;letter-spacing:-.5px;">₹'+b.total_amount.toFixed(2)+'</span>'+
        '</div>'+
        '<p style="text-align:center;font-size:.82rem;color:#94A3B8;font-style:italic;margin:14px 0 8px;">🙏 Thank you!</p>'+
      '</div>'+
    '</div>';

  document.getElementById('successModal').style.display = 'flex';
  document.getElementById('successModal').classList.remove('hidden');
}

/* ── PDF / PRINT ── */
function dlPDF() {
  var src = document.getElementById('bill-render') || document.getElementById('billPreview');
  var w = window.open('', '_blank');
  w.document.write('<!DOCTYPE html><html><head><title>' + (curBill ? curBill.bill_number : 'Bill') + '</title>' +
    '<style>body{font-family:Georgia,serif;padding:24px;max-width:500px;margin:0 auto;color:#111;}*{box-sizing:border-box;}</style>' +
    '</head><body>' + src.innerHTML + '</body></html>');
  w.document.close();
  setTimeout(function() { w.print(); }, 500);
}
function printBill() { dlPDF(); }

/* ── WHATSAPP ── */
function waShare() {
  if (!curBill) return;
  var prev = document.getElementById('billPreview');
  if (typeof html2canvas === 'undefined') { waText(); return; }
  html2canvas(prev, { scale: 2.5, backgroundColor: '#FEFDF8', useCORS: true, logging: false }).then(function(canvas) {
    canvas.toBlob(function(blob) {
      var file = new File([blob], 'bill-' + curBill.bill_number + '.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ title: 'Bill ' + curBill.bill_number, files: [file] }).catch(function() { fbWA(canvas); });
      } else { fbWA(canvas); }
    }, 'image/png');
  }).catch(function() { waText(); });
}
function fbWA(canvas) {
  var a = document.createElement('a'); a.download = 'bill-' + curBill.bill_number + '.png'; a.href = canvas.toDataURL('image/png'); a.click();
  setTimeout(function() { window.open('https://wa.me/?text=' + encodeURIComponent('AUTO POTTERY BILL\n' + curBill.bill_number + '\n' + curBill.customer_name + '\n₹' + curBill.total_amount.toFixed(2)), '_blank'); }, 800);
}
function waText() {
  var msg = '*AUTO POTTERY BILL*\n────────────\n' + curBill.bill_number + '\n' + curBill.customer_name + '\n────────────\n';
  curBill.bill_items.forEach(function(i) { msg += '• ' + (i.telugu_name || i.name) + ' ×' + i.quantity + ' = ₹' + i.total.toFixed(2) + '\n'; });
  if (curBill.balance > 0) msg += '⚠️ Balance = ₹' + curBill.balance.toFixed(2) + '\n';
  msg += '────────────\n*Total: ₹' + curBill.total_amount.toFixed(2) + '*\n🙏 Thank you!';
  window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
}
function newBill() { location.reload(); }

/* ── CLOCK ── */
function tickClock() {
  var el = document.getElementById('billDT'); if (!el) return;
  var n = new Date(), mn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var h = n.getHours() % 12 || 12, mi = n.getMinutes().toString().padStart(2,'0'), ap = n.getHours() >= 12 ? 'PM' : 'AM';
  el.textContent = n.getDate().toString().padStart(2,'0') + ' ' + mn[n.getMonth()] + ' ' + n.getFullYear() + '  ' + h.toString().padStart(2,'0') + ':' + mi + ' ' + ap;
}
setInterval(tickClock, 15000);
