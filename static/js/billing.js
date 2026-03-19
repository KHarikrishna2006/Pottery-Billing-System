var cart = [];
var currentBill = null;

// ── Filter grid ──────────────────────────────────────────────────────────────
function filterProducts() {
  var q = document.getElementById('productFilter').value.toLowerCase();
  document.querySelectorAll('.product-tile').forEach(function(tile) {
    var name = tile.getAttribute('data-name') || '';
    tile.classList.toggle('hidden', q.length > 0 && name.indexOf(q) === -1);
  });
}

// ── Add to cart ──────────────────────────────────────────────────────────────
function addToCart(id, telugu, english) {
  var existing = cart.find(function(i) { return i.product_id === id; });
  if (existing) {
    existing.quantity += 1;
    existing.total = existing.quantity * existing.price;
  } else {
    cart.push({ product_id: id, telugu_name: telugu, name: english, quantity: 1, price: 0, total: 0 });
  }
  updateBadge(id);
  renderCart();
  // bounce tile
  var tile = document.getElementById('tile-' + id);
  if (tile) { tile.style.transform='scale(1.1)'; setTimeout(function(){tile.style.transform='';},180); }
}

function updateBadge(id) {
  var item  = cart.find(function(i){ return i.product_id===id; });
  var badge = document.getElementById('badge-'+id);
  var tile  = document.getElementById('tile-'+id);
  if (!badge || !tile) return;
  if (item) { badge.textContent=item.quantity; badge.style.display='flex'; tile.classList.add('in-cart'); }
  else      { badge.style.display='none'; tile.classList.remove('in-cart'); }
}

function removeFromCart(idx) {
  var id = cart[idx].product_id;
  cart.splice(idx,1);
  updateBadge(id);
  renderCart();
}

function updateQty(idx, val) {
  var qty = Math.max(1, parseInt(val)||1);
  cart[idx].quantity = qty;
  cart[idx].total = qty * cart[idx].price;
  updateBadge(cart[idx].product_id);
  renderCart();
}

function updatePrice(idx, val) {
  var price = parseFloat(val) || 0;
  cart[idx].price = price;
  cart[idx].total = cart[idx].quantity * price;
  renderCart();
}

function clearCart() {
  cart.forEach(function(i){ updateBadge(i.product_id); });
  cart = [];
  renderCart();
}

function renderCart() {
  var body  = document.getElementById('cartBody');
  var empty = document.getElementById('cartEmpty');
  var table = document.getElementById('cartTable');

  if (!cart.length) {
    empty.style.display='block'; table.style.display='none';
  } else {
    empty.style.display='none'; table.style.display='block';
    body.innerHTML = cart.map(function(item, idx) {
      return '<tr>' +
        '<td><div style="font-weight:700;font-size:.92rem">'+ item.telugu_name +'</div>' +
             '<div style="font-size:.75rem;color:var(--muted)">'+ item.name +'</div></td>' +
        '<td><input type="number" min="1" value="'+ item.quantity +'" class="cart-input" onchange="updateQty('+ idx +',this.value)"/></td>' +
        '<td><input type="number" min="0" step="0.01" value="'+ (item.price||'') +'" class="cart-input price-input" placeholder="0.00" onchange="updatePrice('+ idx +',this.value)"/></td>' +
        '<td><strong style="color:var(--accent)">₹'+ item.total.toFixed(2) +'</strong></td>' +
        '<td><button class="btn-icon" onclick="removeFromCart('+ idx +')" style="color:var(--danger)">✕</button></td>' +
        '</tr>';
    }).join('');
  }
  updateSummary();
}

function updateSummary() {
  var itemsTotal = cart.reduce(function(s,i){ return s+i.total; },0);
  var balance    = parseFloat(document.getElementById('balanceAmount').value) || 0;
  var grandTotal = itemsTotal + balance;

  document.getElementById('grandTotalDisplay').textContent = '₹'+grandTotal.toFixed(2);

  // show balance warning
  var balNote = document.getElementById('balanceNote');
  if (balNote) balNote.style.display = balance > 0 ? 'block' : 'none';

  var summaryEl = document.getElementById('summaryItems');
  if (!cart.length && balance <= 0) {
    summaryEl.innerHTML = '<p class="text-muted" style="font-size:.85rem">No items added yet</p>';
  } else {
    var html = cart.map(function(item){
      return '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);font-size:.83rem">' +
        '<span>'+ item.telugu_name +' <span style="color:var(--muted);font-size:.72rem">('+item.name+')</span> ×'+item.quantity+'</span>' +
        '<span style="font-weight:600">₹'+item.total.toFixed(2)+'</span></div>';
    }).join('');
    if (balance > 0) {
      html += '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);font-size:.83rem;color:var(--danger)">' +
        '<span>⚠️ Previous Balance</span>' +
        '<span style="font-weight:600">₹'+balance.toFixed(2)+'</span></div>';
    }
    summaryEl.innerHTML = html || '<p class="text-muted" style="font-size:.85rem">No items added yet</p>';
  }

  var name = (document.getElementById('customerName')||{}).value || '';
  var btn  = document.getElementById('generateBtn');
  var hint = document.getElementById('billHint');
  btn.disabled = !(name.trim() && cart.length > 0);
  hint.style.display = (name.trim() && !cart.length) || (!name.trim() && cart.length) ? 'block' : 'none';
}

// ── Generate ─────────────────────────────────────────────────────────────────
function generateBill() {
  var name    = document.getElementById('customerName').value.trim();
  var phone   = document.getElementById('customerPhone').value.trim();
  var balance = parseFloat(document.getElementById('balanceAmount').value) || 0;
  if (!name)        { alert('Enter customer name'); return; }
  if (!cart.length) { alert('Add at least one item'); return; }

  var missingPrice = cart.find(function(i){ return !i.price || i.price <= 0; });
  if (missingPrice) { alert('Enter price for: ' + missingPrice.telugu_name + ' (' + missingPrice.name + ')'); return; }

  var btn = document.getElementById('generateBtn');
  btn.disabled = true; btn.textContent = '⏳ Generating...';

  fetch('/billing/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_name: name, customer_phone: phone, items: cart, balance: balance })
  })
  .then(function(r){ return r.json(); })
  .then(function(data){
    if (data.error) { alert('Error: '+data.error); btn.disabled=false; btn.textContent='🧾 Generate Bill'; return; }
    currentBill = data.bill;
    showSuccessModal(data.bill);
  })
  .catch(function(){ alert('Failed. Try again.'); btn.disabled=false; btn.textContent='🧾 Generate Bill'; });
}

// ── Success modal ─────────────────────────────────────────────────────────────
function showSuccessModal(bill) {
  document.getElementById('successBillNo').textContent = bill.bill_number + ' · ₹' + bill.total_amount.toFixed(2);

  var rows = bill.bill_items.map(function(item){
    return '<div class="bill-item-row">' +
      '<span style="flex:3">'+ item.telugu_name +' <span style="font-size:.75rem;color:#888">('+item.name+')</span></span>' +
      '<span style="flex:1;text-align:center">'+ item.quantity +'</span>' +
      '<span style="flex:1;text-align:right">₹'+ item.price.toFixed(2) +'</span>' +
      '<span style="flex:1;text-align:right">₹'+ item.total.toFixed(2) +'</span>' +
      '</div>';
  }).join('');

  // show previous balance row if any
  var balanceRow = '';
  if (bill.balance && bill.balance > 0) {
    balanceRow = '<div class="bill-item-row" style="color:#e94560">' +
      '<span style="flex:3">⚠️ Previous Balance</span>' +
      '<span style="flex:1;text-align:center">—</span>' +
      '<span style="flex:1;text-align:right">—</span>' +
      '<span style="flex:1;text-align:right">₹'+ bill.balance.toFixed(2) +'</span>' +
      '</div>';
  }

  document.getElementById('billPreview').innerHTML =
    '<div class="bill-header">' +
      '<h2>AUTO POTTERY BILL</h2>' +
      '<div class="bill-sub">HK.pvt.Ltd</div>' +
    '</div>' +
    '<div style="display:flex;justify-content:space-between;font-size:.83rem;margin-bottom:8px">' +
      '<span><strong>'+bill.bill_number+'</strong></span><span>'+bill.date+' · '+bill.time+'</span></div>' +
    '<div style="font-size:.83rem;margin-bottom:10px"><strong>Customer:</strong> '+bill.customer_name+
      (bill.customer_phone ? ' &nbsp;📞 '+bill.customer_phone : '') +'</div>' +
    '<div style="display:flex;padding:4px 0;font-size:.73rem;color:#aaa;border-bottom:1px solid #eee;margin-bottom:4px">' +
      '<span style="flex:3">Item</span><span style="flex:1;text-align:center">Qty</span>' +
      '<span style="flex:1;text-align:right">Price</span><span style="flex:1;text-align:right">Total</span></div>' +
    rows + balanceRow +
    '<div class="grand-total-box" style="margin-top:12px"><span>Grand Total</span><span>₹'+bill.total_amount.toFixed(2)+'</span></div>' +
    '<div style="text-align:center;margin-top:12px;font-size:.8rem;color:#888;font-style:italic">🙏 Thank you!</div>';

  document.getElementById('successModal').style.display='flex';
}

function downloadPDF() {
  if (!currentBill) return;
  var html = document.getElementById('billPreview').innerHTML;
  var style = '<style>body{font-family:Georgia,serif;max-width:640px;margin:0 auto;padding:24px;color:#111}.bill-header{text-align:center;border-bottom:3px double #1a1a2e;padding-bottom:12px;margin-bottom:12px}.bill-header h2{font-size:20px;color:#1a1a2e;margin:0;letter-spacing:1px}.bill-sub{font-size:11px;color:#888;margin-top:2px}.bill-item-row{display:flex;padding:6px 0;border-bottom:1px dashed #eee;font-size:13px}.grand-total-box{background:linear-gradient(135deg,#1a1a2e,#0f3460);color:white;padding:10px 14px;border-radius:6px;display:flex;justify-content:space-between;font-size:15px;font-weight:bold}</style>';
  var win = window.open('','_blank');
  win.document.write('<!DOCTYPE html><html><head><title>'+currentBill.bill_number+'</title>'+style+'</head><body>'+html+'</body></html>');
  win.document.close();
  setTimeout(function(){ win.print(); }, 500);
}
function printBill() { downloadPDF(); }

function shareWhatsApp() {
  if (!currentBill) return;
  var preview = document.getElementById('billPreview');
  if (!preview) { shareWhatsAppText(); return; }

  var waBtn = document.querySelector('[onclick="shareWhatsApp()"]');
  if (waBtn) { waBtn.textContent = '⏳ Preparing...'; waBtn.disabled = true; }

  html2canvas(preview, { scale: 2, backgroundColor: '#fffdf8', useCORS: true, logging: false })
    .then(function(canvas) {
      if (waBtn) { waBtn.textContent = '💬 WhatsApp'; waBtn.disabled = false; }
      canvas.toBlob(function(blob) {
        var file = new File([blob], 'bill-' + currentBill.bill_number + '.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({
            title: 'Bill ' + currentBill.bill_number,
            text: 'AUTO POTTERY BILL · ₹' + currentBill.total_amount.toFixed(2),
            files: [file]
          }).catch(function() { fallbackWA(canvas); });
        } else {
          fallbackWA(canvas);
        }
      }, 'image/png');
    })
    .catch(function() {
      if (waBtn) { waBtn.textContent = '💬 WhatsApp'; waBtn.disabled = false; }
      shareWhatsAppText();
    });
}

function fallbackWA(canvas) {
  var link = document.createElement('a');
  link.download = 'bill-' + currentBill.bill_number + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  var msg = '🏺 *AUTO POTTERY BILL*\n📋 ' + currentBill.bill_number +
            '\n👤 ' + currentBill.customer_name +
            '\n💰 ₹' + currentBill.total_amount.toFixed(2) +
            '\n\n_Image downloaded — attach it in WhatsApp!_';
  setTimeout(function() { window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank'); }, 800);
}

function shareWhatsAppText() {
  if (!currentBill) return;
  var msg = '*AUTO POTTERY BILL*\n────────────────────\n';
  msg += '📋 Bill: *' + currentBill.bill_number + '*\n';
  msg += '📅 ' + currentBill.date + ' · ' + currentBill.time + '\n';
  msg += '👤 Customer: *' + currentBill.customer_name + '*\n';
  if (currentBill.customer_phone) msg += '📞 ' + currentBill.customer_phone + '\n';
  msg += '────────────────────\n';
  currentBill.bill_items.forEach(function(i) {
    msg += '• ' + (i.telugu_name||i.name) + ' × ' + i.quantity + ' = ₹' + i.total.toFixed(2) + '\n';
  });
  if (currentBill.balance && currentBill.balance > 0) {
    msg += '⚠️ Previous Balance = ₹' + currentBill.balance.toFixed(2) + '\n';
  }
  msg += '────────────────────\n💰 *Total: ₹' + currentBill.total_amount.toFixed(2) + '*\n\n_Thank you! 🙏_';
  window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
}

function newBill() {
  document.getElementById('successModal').style.display='none';
  location.reload();
}

// Live clock
function updateTime() {
  var el = document.getElementById('billDateTime'); if (!el) return;
  var now = new Date();
  var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var h=now.getHours()%12||12, mi=now.getMinutes().toString().padStart(2,'0');
  el.textContent = now.getDate().toString().padStart(2,'0')+' '+months[now.getMonth()]+' '+now.getFullYear()+'  '+h.toString().padStart(2,'0')+':'+mi+' '+(now.getHours()>=12?'PM':'AM');
}
setInterval(updateTime, 10000);