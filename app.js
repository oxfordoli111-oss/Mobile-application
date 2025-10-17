// ----------------------------
// SecondMate - app logic
// ----------------------------

// Keep original firebase config (optional) - retained from template
const firebaseConfig = {
  apiKey: "AIzaSyDenEhKV4Zzt5rqx95O8BGnQt-rPoZSvg4",
  authDomain: "secondmate-92729.firebaseapp.com",
  databaseURL: "https://secondmate-92729-default-rtdb.firebaseio.com",
  projectId: "secondmate-92729",
  storageBucket: "secondmate-92729.firebasestorage.app",
  messagingSenderId: "116216019257",
  appId: "1:116216019257:web:6dc6330e68ebbd215810e8"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Demo OTP and state
const DEMO_OTP = '123456';
let cart = [];
let activeFilter = 'all';

// "Dumb" secondhand products (funny / realistic)
const products = [
  { id: 101, name: "iPhone 8 — The Brick Edition", price: 7500, condition: "Fair", type: "phone", description: "Works fine-ish. Heavy scratches. Battery 60%. Charger not included. Comes with optimistic owner.", img: "https://placehold.co/600x400/111827/ffffff?text=iPhone+8+Used" },
  { id: 102, name: "Dell Inspiron 2012 (Windows 7)", price: 12000, condition: "Used", type: "laptop", description: "Vintage laptop. Runs a little warm. Great for retro vibes and nostalgic typing.", img: "https://placehold.co/600x400/0b63d1/ffffff?text=Old+Dell+Laptop" },
  { id: 103, name: "Smart TV 32\" (No Remote)", price: 9000, condition: "Good", type: "tv", description: "Screen fine. Remote was eaten by couch. HDMI works.", img: "https://placehold.co/600x400/0b9cd1/ffffff?text=32inch+TV" },
  { id: 104, name: "GoPro Knockoff (Unknown Model)", price: 2500, condition: "Fair", type: "camera", description: "Records video. Mount included. Waterproofing? Maybe.", img: "https://placehold.co/600x400/1f2937/ffffff?text=Action+Cam" },
  { id: 105, name: "Samsung Galaxy S9 (screen guard stickers)", price: 14000, condition: "Good", type: "phone", description: "Good battery, slight notch at corner. Protective stickers applied.", img: "https://placehold.co/600x400/0b63d1/ffffff?text=Galaxy+S9" },
  { id: 106, name: "HP Pavilion — Works, loud fan", price: 8000, condition: "Used", type: "laptop", description: "Perfect for students. Loud cooling — we call it a feature.", img: "https://placehold.co/600x400/111827/ffffff?text=HP+Pavilion" },
  { id: 107, name: "Mystery Router (no manual)", price: 1200, condition: "Fair", type: "other", description: "Provides WiFi in mysterious ways.", img: "https://placehold.co/600x400/0b9cd1/ffffff?text=Router" },
  { id: 108, name: "Vintage DSLR (lens missing)", price: 3500, condition: "Fair", type: "camera", description: "Body in good condition, lens sadly missing. Great for parts or collectors.", img: "https://placehold.co/600x400/374151/ffffff?text=DSLR+Body" }
];

// Initial load
document.addEventListener('DOMContentLoaded', () => {
  // small loading then show auth
  setTimeout(() => {
    showScreen('auth');
  }, 1400);
});

// Screen manager
function showScreen(id) {
  // hide all screens
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });

  const screen = document.getElementById(id);
  if (!screen) return;
  screen.classList.add('active');
  screen.style.display = 'block';

  // special hooks
  if (id === 'app') {
    renderProductList();
    updateCartCount();
  }
  if (id === 'cart-screen') {
    renderCart();
  }
  if (id === 'checkout-screen') {
    updateCheckoutSummary();
  }
}

// Auth helpers
function showSignup(){
  document.getElementById('login-view').style.display = 'none';
  document.getElementById('signup-view').style.display = 'block';
}
function showLogin(){
  document.getElementById('signup-view').style.display = 'none';
  document.getElementById('login-view').style.display = 'block';
}

function handleSignup(){
  const name = document.getElementById('signup-name').value.trim();
  const number = document.getElementById('signup-number').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;

  if(!name || !number || !password){ alert('Please fill required fields'); return; }

  // Save to firebase under users/<number> (demo)
  db.ref('users/' + number).get().then(snapshot => {
    if(snapshot.exists()){
      alert('User exists — please login');
    } else {
      db.ref('users/' + number).set({ name, number, email: email||'', password })
        .then(()=> {
          alert('Account created — verify OTP (hint: 123456)');
          showScreen('app'); // skip OTP to simplify flow
        }).catch(err=> {
          console.error(err);
          alert('Signup failed');
        });
    }
  }).catch(err => {
    console.error(err);
    alert('Network error');
  });
}

function handleLogin(){
  const id = document.getElementById('login-id').value.trim();
  const password = document.getElementById('login-password').value;
  if(!id || !password){ alert('Enter credentials'); return; }

  // simple firebase lookup; if not found allow demo access
  db.ref('users/' + id).get().then(snapshot => {
    if(snapshot.exists()){
      const user = snapshot.val();
      if(user.password === password) {
        showScreen('app');
      } else {
        alert('Wrong password');
      }
    } else {
      // demo fallback
      const proceed = confirm('User not found — continue as guest?');
      if(proceed) showScreen('app');
    }
  }).catch(err => {
    console.error(err);
    showScreen('app'); // fallback
  });
}

// Products render + search + sort + filters
function filterBy(type){
  activeFilter = type;
  document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
  const el = document.getElementById('chip-'+(type==='all'?'all':type));
  if(el) el.classList.add('active');
  renderProductList();
}

function renderProductList(){
  const container = document.getElementById('market');
  container.innerHTML = '';

  const q = (document.getElementById('search-input')?.value || '').toLowerCase();
  const sort = document.getElementById('sort-select')?.value || 'relevance';

  let list = products.slice();

  // filter type
  if(activeFilter !== 'all'){
    list = list.filter(p => p.type === activeFilter);
  }

  // search
  if(q){
    list = list.filter(p => (p.name + ' ' + p.description).toLowerCase().includes(q));
  }

  // sort
  if(sort === 'price-asc') list.sort((a,b)=>a.price-b.price);
  if(sort === 'price-desc') list.sort((a,b)=>b.price-a.price);
  if(sort === 'condition') list.sort((a,b)=> a.condition.localeCompare(b.condition));

  // render cards
  list.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="badge">${p.condition}</div>
      <img src="${p.img}" alt="${p.name}" />
      <div class="meta">
        <h4>${p.name}</h4>
        <div class="price">Rs. ${p.price.toFixed(2)}</div>
      </div>
      <p class="muted">${p.description.substring(0,80)}${p.description.length>80?'...':''}</p>
      <div class="card-actions">
        <button class="btn" onclick="viewProduct(${p.id})">Details</button>
        <button class="btn primary" onclick="quickAdd(${p.id})"><i class="fas fa-cart-plus"></i> Add</button>
      </div>
    `;
    container.appendChild(card);
  });

  if(list.length === 0){
    container.innerHTML = '<p class="muted">No items found. Try searching or clearing filters.</p>';
  }
}

// Detail view
function viewProduct(id){
  const p = products.find(x=>x.id===id);
  if(!p) return;
  const container = document.getElementById('product-detail-container');
  container.innerHTML = `
    <img src="${p.img}" style="width:100%;max-height:360px;object-fit:cover;border-radius:12px;margin-bottom:12px;" />
    <h3>${p.name}</h3>
    <p class="muted">${p.condition} • ${p.type}</p>
    <p>${p.description}</p>
    <h3>Rs. ${p.price.toFixed(2)}</h3>
    <div style="display:flex;gap:8px;margin-top:12px;">
      <input type="number" id="detail-qty" value="1" min="1" style="width:88px;padding:8px;border-radius:8px;border:1px solid #eef4ff;">
      <button class="btn primary" onclick="addToCart(${p.id})">Add to Cart</button>
      <button class="btn" onclick="showScreen('app')">Back</button>
    </div>
  `;
  showScreen('product-detail-screen');
}

// cart functions
function quickAdd(id){
  const product = products.find(p=>p.id===id);
  if(!product) return;
  const idx = cart.findIndex(i=>i.id===id);
  if(idx > -1) cart[idx].qty += 1;
  else cart.push({...product, qty:1});
  updateCartCount();
  alert(`${product.name} added to cart.`);
}

function addToCart(id){
  const qty = parseInt(document.getElementById('detail-qty')?.value) || 1;
  const product = products.find(p=>p.id===id);
  if(!product) return;
  const idx = cart.findIndex(i=>i.id===id);
  if(idx > -1) cart[idx].qty += qty;
  else cart.push({...product, qty});
  updateCartCount();
  showScreen('app');
}

function updateCartCount(){
  const c = cart.reduce((acc,i)=>acc + (i.qty||0), 0);
  document.getElementById('cart-count').textContent = c;
}

function renderCart(){
  const list = document.getElementById('cart-items-list');
  list.innerHTML = '';
  if(cart.length === 0){
    list.innerHTML = '<p>Your cart is empty.</p>';
    document.getElementById('cart-summary').innerHTML = '';
    return;
  }
  cart.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div>
        <strong>${item.name}</strong><div class="muted">Rs. ${item.price.toFixed(2)} × ${item.qty}</div>
      </div>
      <div class="cart-item-controls">
        <button class="btn" onclick="changeQty(${idx}, -1)">-</button>
        <button class="btn" onclick="changeQty(${idx}, 1)">+</button>
        <button class="btn" onclick="removeItem(${idx})"><i class="fas fa-trash"></i></button>
      </div>
    `;
    list.appendChild(div);
  });
  updateCartSummary();
}

function changeQty(index, delta){
  cart[index].qty += delta;
  if(cart[index].qty < 1) cart.splice(index, 1);
  renderCart();
  updateCartCount();
}

function removeItem(index){
  cart.splice(index,1);
  renderCart();
  updateCartCount();
}

function updateCartSummary(){
  const subtotal = cart.reduce((acc,i)=>acc + i.price * i.qty, 0);
  document.getElementById('cart-summary').innerHTML = `
    <div class="cart-summary">
      <div>Subtotal: Rs. ${subtotal.toFixed(2)}</div>
      <div>Total (incl. Rs.150 shipping): Rs. ${(subtotal + 150).toFixed(2)}</div>
    </div>
  `;
}

// checkout
function navigateToCheckout(){
  if(cart.length === 0){ alert('Cart empty!'); return; }
  showScreen('checkout-screen');
  updateCheckoutSummary();
}

function updateCheckoutSummary(){
  const subtotal = cart.reduce((acc,i)=>acc + i.price * i.qty, 0);
  document.getElementById('checkout-subtotal').textContent = `Rs. ${subtotal.toFixed(2)}`;
  document.getElementById('checkout-total').textContent = `Rs. ${(subtotal + 150).toFixed(2)}`;
}

function placeOrder(){
  if(cart.length === 0){ alert('Cart empty'); return; }
  const name = document.getElementById('checkout-name').value.trim();
  const phone = document.getElementById('checkout-phone').value.trim();
  const addr = document.getElementById('checkout-address').value.trim();
  if(!name || !phone || !addr){ alert('Please fill shipping details'); return; }

  const subtotal = cart.reduce((acc,i)=>acc + i.price * i.qty, 0);
  const total = subtotal + 150;
  const orderId = 'SM' + Math.floor(Math.random() * 900000 + 100000);

  // Optionally write order to firebase (demo)
  const orderData = {
    orderId, name, phone, addr, total, items: cart.map(i=>({id:i.id,name:i.name,qty:i.qty,price:i.price})), createdAt: Date.now()
  };
  // push to /orders (non blocking)
  db.ref('orders/' + orderId).set(orderData).catch(()=>{ /* ignore */ });

  // show confirmation
  document.getElementById('conf-order-id').textContent = orderId;
  document.getElementById('conf-total-amount').textContent = `Rs. ${total.toFixed(2)}`;
  document.getElementById('conf-msg').textContent = `Thanks ${name || ''}! We'll contact you at ${phone}.`;

  cart = [];
  updateCartCount();
  showScreen('confirmation-screen');
}

// logout (clears cart)
function logout(){
  if(confirm('Sign out?')) {
    cart = [];
    updateCartCount();
    showScreen('auth');
    showLogin();
  }
}
