var cart=[],curBill=null;

function filterProds(){
  var q=document.getElementById('filterBox').value.toLowerCase();
  document.querySelectorAll('.prod-tile').forEach(function(t){
    t.style.display=(q&&(t.getAttribute('data-n')||'').indexOf(q)===-1)?'none':'';
  });
}

function addProd(id,tel,eng){
  var ex=cart.find(function(i){return i.pid===id;});
  if(ex){ex.qty++;ex.total=ex.qty*ex.price;}
  else{cart.push({pid:id,tel:tel,eng:eng,qty:1,price:0,total:0});}
  updBadge(id);renderCart();
  var t=document.getElementById('tile'+id);
  if(t){t.style.transform='scale(1.08)';setTimeout(function(){t.style.transform='';},180);}
}

function updBadge(id){
  var it=cart.find(function(i){return i.pid===id;}),b=document.getElementById('badge'+id),t=document.getElementById('tile'+id);
  if(!b||!t)return;
  if(it&&it.qty>0){
    b.textContent=it.qty;b.classList.remove('hidden');
    t.style.borderColor='#8B4513';t.style.background='rgba(139,69,19,.06)';
  }else{
    b.classList.add('hidden');
    t.style.borderColor='';t.style.background='';
  }
}

function remItem(idx){var id=cart[idx].pid;cart.splice(idx,1);updBadge(id);renderCart();}
function updQty(idx,v){cart[idx].qty=Math.max(1,parseInt(v)||1);cart[idx].total=cart[idx].qty*cart[idx].price;updBadge(cart[idx].pid);renderCart();}
function updPrice(idx,v){cart[idx].price=parseFloat(v)||0;cart[idx].total=cart[idx].qty*cart[idx].price;renderCart();}
function clearCart(){cart.forEach(function(i){updBadge(i.pid);});cart=[];renderCart();}

function renderCart(){
  var e=document.getElementById('cartEmpty'),ci=document.getElementById('cartItems');
  if(!cart.length){e.classList.remove('hidden');ci.classList.add('hidden');}
  else{
    e.classList.add('hidden');ci.classList.remove('hidden');
    // Card layout — each item is a card, no table
    ci.innerHTML=cart.map(function(it,idx){
      return '<div class="border border-gray-200 rounded-xl p-3 bg-gray-50">'+
        '<div class="flex justify-between items-start mb-2">'+
          '<div>'+
            '<p class="font-bold text-gray-900 text-sm">'+it.tel+'</p>'+
            '<p class="text-xs text-gray-400">'+it.eng+'</p>'+
          '</div>'+
          '<button onclick="remItem('+idx+')" class="w-7 h-7 bg-red-50 border border-red-200 text-red-500 rounded-lg text-xs font-bold flex-shrink-0">✕</button>'+
        '</div>'+
        '<div class="flex gap-3 flex-wrap">'+
          '<div class="flex-1 min-w-20">'+
            '<label class="block text-xs text-gray-400 font-bold uppercase mb-1">Qty</label>'+
            '<input type="number" min="1" value="'+it.qty+'" onchange="updQty('+idx+',this.value)"'+
            ' class="w-full px-2 py-2 border-2 border-gray-200 rounded-lg text-center text-sm outline-none focus:border-[#8B4513]"/>'+
          '</div>'+
          '<div class="flex-1 min-w-24">'+
            '<label class="block text-xs text-gray-400 font-bold uppercase mb-1">Price/Unit (₹)</label>'+
            '<input type="number" min="0" step="0.01" value="'+(it.price||'')+'" placeholder="0.00" onchange="updPrice('+idx+',this.value)"'+
            ' class="w-full px-2 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-[#8B4513] placeholder-gray-300"/>'+
          '</div>'+
          '<div class="flex-1 min-w-20 flex flex-col justify-end">'+
            '<label class="block text-xs text-gray-400 font-bold uppercase mb-1">Total</label>'+
            '<p class="font-bold text-[#8B4513] text-sm py-2">₹'+it.total.toFixed(2)+'</p>'+
          '</div>'+
        '</div>'+
      '</div>';
    }).join('');
  }
  calcTotal();
}

function calcTotal(){
  var iT=cart.reduce(function(s,i){return s+i.total;},0);
  var bal=parseFloat((document.getElementById('balAmt')||{}).value)||0;
  var grand=iT+bal;
  document.getElementById('grandTotal').textContent='₹'+grand.toFixed(2);
  var bn=document.getElementById('balNote');if(bn)bn.classList.toggle('hidden',bal<=0);
  var se=document.getElementById('sumItems');
  if(!cart.length&&bal<=0){se.innerHTML='<p class="text-sm text-gray-400">No items yet</p>';}
  else{
    var h=cart.map(function(i){
      return '<div class="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">'+
        '<span class="text-gray-700 pr-2">'+i.tel+' ×'+i.qty+'</span>'+
        '<span class="font-semibold text-gray-900 flex-shrink-0">₹'+i.total.toFixed(2)+'</span></div>';
    }).join('');
    if(bal>0)h+='<div class="flex justify-between text-sm py-1 text-red-500 font-semibold"><span>⚠️ Balance</span><span>₹'+bal.toFixed(2)+'</span></div>';
    se.innerHTML=h;
  }
  var name=(document.getElementById('custName')||{}).value||'';
  var btn=document.getElementById('genBtn'),hint=document.getElementById('genHint');
  btn.disabled=!(name.trim()&&cart.length>0);
  if(hint)hint.classList.toggle('hidden',!(!name.trim()||!cart.length));
}

function genBill(){
  var name=document.getElementById('custName').value.trim();
  var phone=document.getElementById('custPhone').value.trim();
  var bal=parseFloat(document.getElementById('balAmt').value)||0;
  if(!name){alert('Enter customer name');return;}
  if(!cart.length){alert('Add at least one item');return;}
  var mp=cart.find(function(i){return !i.price||i.price<=0;});
  if(mp){alert('Enter price for: '+mp.tel+' ('+mp.eng+')');return;}
  var btn=document.getElementById('genBtn');btn.disabled=true;btn.textContent='⏳ Generating...';
  fetch('/billing/create',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({customer_name:name,customer_phone:phone,balance:bal,
      items:cart.map(function(i){return{product_id:i.pid,name:i.eng,telugu_name:i.tel,quantity:i.qty,price:i.price};})})
  }).then(function(r){return r.json();}).then(function(d){
    if(d.error){alert('Error: '+d.error);btn.disabled=false;btn.textContent='🧾 Generate Bill';return;}
    curBill=d.bill;showSucc(d.bill);
  }).catch(function(){alert('Failed. Try again.');btn.disabled=false;btn.textContent='🧾 Generate Bill';});
}

function showSucc(b){
  document.getElementById('succBillNo').textContent=b.bill_number+' · ₹'+b.total_amount.toFixed(2);
  var rows=b.bill_items.map(function(it){
    return '<div class="border border-gray-200 rounded-lg p-2.5 mb-2 bg-white">'+
      '<div class="flex justify-between items-start">'+
        '<div class="pr-2"><p class="font-bold text-gray-900 text-xs">'+(it.telugu_name||it.name)+'</p>'+
        '<p class="text-gray-400 text-xs">('+it.name+')</p></div>'+
        '<p class="font-bold text-[#8B4513] text-sm flex-shrink-0">₹'+it.total.toFixed(2)+'</p>'+
      '</div>'+
      '<div class="flex gap-3 mt-1 text-xs text-gray-500">'+
        '<span>Qty: '+it.quantity+'</span><span>Price: ₹'+it.price.toFixed(2)+'</span>'+
      '</div></div>';
  }).join('');
  var balRow='';
  if(b.balance&&b.balance>0)balRow='<div class="flex justify-between text-sm p-2.5 bg-red-50 rounded-lg mb-2 text-red-500 font-semibold"><span>⚠️ Previous Balance</span><span>₹'+b.balance.toFixed(2)+'</span></div>';
  document.getElementById('billPreview').innerHTML=
    '<div class="text-center border-b-4 border-double border-gray-800 pb-3 mb-3">'+
      '<h2 class="text-base font-bold text-gray-900" style="font-family:Georgia,serif">AUTO POTTERY BILL</h2>'+
      '<p class="text-xs text-gray-500">HK.pvt.Ltd</p></div>'+
    '<div class="text-xs text-gray-600 mb-2"><strong>'+b.bill_number+'</strong> · '+b.date+' '+b.time+'</div>'+
    '<div class="text-xs text-gray-700 mb-3 font-semibold">👤 '+b.customer_name+(b.customer_phone?' · 📞 '+b.customer_phone:'')+'</div>'+
    rows+balRow+
    '<div class="bg-gray-900 text-white rounded-xl px-4 py-3 flex justify-between items-center mt-1">'+
      '<span class="font-semibold text-sm">Grand Total</span>'+
      '<span class="font-bold text-orange-400 text-base" style="font-family:Georgia,serif">₹'+b.total_amount.toFixed(2)+'</span></div>'+
    '<p class="text-center text-xs text-gray-400 italic mt-3">🙏 Thank you!</p>';
  document.getElementById('successModal').classList.remove('hidden');
}

function dlPDF(){
  if(!curBill)return;
  var html=document.getElementById('billPreview').innerHTML;
  var st='<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Georgia,serif;padding:20px;color:#111;font-size:13px}'+
    '.border{border:1px solid #e5e7eb}.rounded-lg{border-radius:.5rem}.p-2\\.5{padding:.625rem}.mb-2{margin-bottom:.5rem}.mb-3{margin-bottom:.75rem}.mt-1{margin-top:.25rem}.mt-3{margin-top:.75rem}.pb-3{padding-bottom:.75rem}.flex{display:flex}.justify-between{justify-content:space-between}.items-start{align-items:flex-start}.items-center{align-items:center}.gap-3{gap:.75rem}.pr-2{padding-right:.5rem}.px-4{padding-left:1rem;padding-right:1rem}.py-3{padding-top:.75rem;padding-bottom:.75rem}'+
    '.text-xs{font-size:.72rem}.text-sm{font-size:.84rem}.text-base{font-size:1rem}.font-bold{font-weight:700}.font-semibold{font-weight:600}.text-center{text-align:center}.text-gray-400{color:#9ca3af}.text-gray-500{color:#6b7280}.text-gray-600{color:#4b5563}.text-gray-700{color:#374151}.text-gray-800{color:#1f2937}.text-gray-900{color:#111}.text-orange-400{color:#fb923c}.text-red-500{color:#ef4444}.text-white{color:#fff}.bg-white{background:#fff}.bg-gray-900{background:#111827}.bg-red-50{background:#fef2f2}.rounded-xl{border-radius:.75rem}.italic{font-style:italic}'+
    '.border-b-4{border-bottom:4px double #1f2937}.border-double{border-style:double}.border-gray-200{border-color:#e5e7eb}.border-gray-800{border-color:#1f2937}</style>';
  var w=window.open('','_blank');w.document.write('<!DOCTYPE html><html><head><title>'+curBill.bill_number+'</title>'+st+'</head><body>'+html+'</body></html>');w.document.close();setTimeout(function(){w.print();},500);
}
function printBill(){dlPDF();}

function waShare(){
  if(!curBill)return;
  var prev=document.getElementById('billPreview');
  if(typeof html2canvas==='undefined'){waText();return;}
  html2canvas(prev,{scale:2,backgroundColor:'#fffbeb',useCORS:true,logging:false}).then(function(canvas){
    canvas.toBlob(function(blob){
      var file=new File([blob],'bill-'+curBill.bill_number+'.png',{type:'image/png'});
      if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
        navigator.share({title:'Bill '+curBill.bill_number,text:'AUTO POTTERY BILL · ₹'+curBill.total_amount.toFixed(2),files:[file]}).catch(function(){fbWA(canvas);});
      }else{fbWA(canvas);}
    },'image/png');
  }).catch(function(){waText();});
}
function fbWA(canvas){
  var a=document.createElement('a');a.download='bill-'+curBill.bill_number+'.png';a.href=canvas.toDataURL('image/png');a.click();
  setTimeout(function(){window.open('https://wa.me/?text='+encodeURIComponent('AUTO POTTERY BILL\n'+curBill.bill_number+'\n'+curBill.customer_name+'\n₹'+curBill.total_amount.toFixed(2)+'\n\n_Attach downloaded image_'),'_blank');},800);
}
function waText(){
  var msg='*AUTO POTTERY BILL*\n*HK.pvt.Ltd*\n────────────\n📋 '+curBill.bill_number+'\n📅 '+curBill.date+' · '+curBill.time+'\n👤 '+curBill.customer_name+'\n────────────\n';
  curBill.bill_items.forEach(function(i){msg+='• '+(i.telugu_name||i.name)+' × '+i.quantity+' = ₹'+i.total.toFixed(2)+'\n';});
  if(curBill.balance&&curBill.balance>0)msg+='⚠️ Balance = ₹'+curBill.balance.toFixed(2)+'\n';
  msg+='────────────\n💰 *Total: ₹'+curBill.total_amount.toFixed(2)+'*\n\n_Thank you! 🙏_';
  window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank');
}
function newBill(){document.getElementById('successModal').classList.add('hidden');location.reload();}
function tickClock(){
  var el=document.getElementById('billDT');if(!el)return;
  var n=new Date(),mn=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var h=n.getHours()%12||12,mi=n.getMinutes().toString().padStart(2,'0'),ap=n.getHours()>=12?'PM':'AM';
  el.textContent=n.getDate().toString().padStart(2,'0')+' '+mn[n.getMonth()]+' '+n.getFullYear()+'  '+h.toString().padStart(2,'0')+':'+mi+' '+ap;
}
setInterval(tickClock,15000);
