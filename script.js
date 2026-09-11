const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');
hamburger.addEventListener('click', () => {
  mobileNav.classList.toggle('show');
});
document.querySelectorAll('.mobile-nav a').forEach(link => {
  link.addEventListener('click', () => mobileNav.classList.remove('show'));
});

function updateStatus() {
  const now = new Date();
  const time = now.getHours() * 60 + now.getMinutes();
  const open = 7 * 60 + 30;
  const close = 18 * 60;
  const badge = document.getElementById('statusBadge');
  const text = document.getElementById('statusText');
  if (time >= open && time < close) {
    badge.className = 'status open';
    text.textContent = 'Open';
  } else {
    badge.className = 'status closed';
    text.textContent = 'Closed';
  }
}
updateStatus();
setInterval(updateStatus, 60000);

let cart = [];

function addToCart(name, price) {
  const existing = cart.find(i => i.name === name);
  if (existing) existing.qty += 1;
  else cart.push({ name, price, qty: 1 });
  renderCart();
}

function removeFromCart(name) {
  cart = cart.filter(i => i.name !== name);
  renderCart();
}

function getTotal() {
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

function getCount() {
  return cart.reduce((s, i) => s + i.qty, 0);
}

function renderCart() {
  const bar = document.getElementById('cartBar');
  const count = getCount();
  const total = getTotal();

  if (count > 0) {
    bar.classList.add('show');
    document.getElementById('cartCount').textContent = count + (count === 1 ? ' item' : ' items');
    document.getElementById('cartTotal').textContent = 'R' + total;
  } else {
    bar.classList.remove('show');
  }

  document.getElementById('cartItems').innerHTML = cart.map(i =>
    `<div class="cart-item">
      <span>${i.qty}× ${i.name}</span>
      <span>R${i.price * i.qty}
        <button class="remove" onclick="removeFromCart('${i.name}')">✕</button>
      </span>
    </div>`
  ).join('');

  document.getElementById('modalTotal').textContent = 'R' + total;
}

document.querySelectorAll('.add-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    const p = this.closest('.product');
    addToCart(p.dataset.name, parseInt(p.dataset.price));
    this.textContent = 'Added ✓';
    setTimeout(() => this.textContent = 'Add', 700);
  });
});

document.getElementById('viewCartBtn').addEventListener('click', () => {
  document.getElementById('cartModal').classList.add('show');
});

document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('cartModal').classList.remove('show');
});

document.getElementById('cartModal').addEventListener('click', e => {
  if (e.target.id === 'cartModal') {
    document.getElementById('cartModal').classList.remove('show');
  }
});

document.getElementById('whatsappOrderBtn').addEventListener('click', () => {
  if (!cart.length) return;

  let msg = 'Hi TNC Fast Food 👋\nI would like to order for collection:\n\n';
  cart.forEach(i => {
    msg += `• ${i.qty}× ${i.name} – R${i.price * i.qty}\n`;
  });
  msg += `\nTotal: R${getTotal()}\n\nThank you!`;

  window.open('https://wa.me/27840171408?text=' + encodeURIComponent(msg), '_blank');
});
