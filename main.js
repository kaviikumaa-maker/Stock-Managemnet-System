import './style.css';

const API_URL = window.location.port === '5173' ? 'http://localhost:3000/api' : '/api';

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span style="font-size: 1.2rem">${type === 'success' ? '✅' : '❌'}</span>
    <div>${message}</div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3000);
}

function setLoading(button, isLoading) {
  if (isLoading) {
    button.disabled = true;
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = '<span class="spinner"></span> Loading...';
  } else {
    button.disabled = false;
    button.innerHTML = button.dataset.originalText || 'Submit';
  }
}

function confirmAction(title, message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirm-modal');
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    
    const okBtn = document.getElementById('confirm-ok-btn');
    const cancelBtn = document.getElementById('confirm-cancel-btn');
    
    modal.classList.remove('hidden');
    
    const cleanup = () => {
      modal.classList.add('hidden');
      okBtn.replaceWith(okBtn.cloneNode(true));
      cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    };
    
    document.getElementById('confirm-ok-btn').addEventListener('click', () => {
      cleanup();
      resolve(true);
    });
    
    document.getElementById('confirm-cancel-btn').addEventListener('click', () => {
      cleanup();
      resolve(false);
    });
  });
}

// DOM Elements
const authSection = document.getElementById('auth-section');
const mainAppSection = document.getElementById('main-app-section');
const storesView = document.getElementById('stores-view');
const itemsView = document.getElementById('items-view');
const authForm = document.getElementById('auth-form');
const authError = document.getElementById('auth-error');
const logoutBtn = document.getElementById('logout-btn');
const userDisplay = document.getElementById('user-display');

// Auth Form Elements
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authSwitchText = document.getElementById('auth-switch-text');
const authSwitchLink = document.getElementById('auth-switch-link');
const togglePasswordBtn = document.getElementById('toggle-password');
const passwordInput = document.getElementById('password');
const rememberMeCheckbox = document.getElementById('remember-me');

let isLoginMode = true;

// Stores DOM
const storesGrid = document.getElementById('stores-grid');
const addStoreBtn = document.getElementById('add-store-btn');
const storeModal = document.getElementById('store-modal');
const cancelStoreModalBtn = document.getElementById('cancel-store-modal-btn');
const storeForm = document.getElementById('store-form');
const storeModalTitle = document.getElementById('store-modal-title');

// Items DOM
const backToStoresBtn = document.getElementById('back-to-stores-btn');
const currentStoreTitle = document.getElementById('current-store-title');
const stockTbody = document.getElementById('stock-tbody');
const addItemBtn = document.getElementById('add-item-btn');
const itemModal = document.getElementById('item-modal');
const cancelModalBtn = document.getElementById('cancel-modal-btn');
const itemForm = document.getElementById('item-form');
const modalTitle = document.getElementById('modal-title');

// Profit & Sell DOM
const viewProfitBtn = document.getElementById('view-profit-btn');
const profitModal = document.getElementById('profit-modal');
const closeProfitBtn = document.getElementById('close-profit-btn');
const profitTotalRevenue = document.getElementById('profit-total-revenue');
const profitTotalProfit = document.getElementById('profit-total-profit');
const profitSalesTbody = document.getElementById('profit-sales-tbody');

const sellModal = document.getElementById('sell-modal');
const sellForm = document.getElementById('sell-form');
const cancelSellBtn = document.getElementById('cancel-sell-btn');
const sellItemId = document.getElementById('sell-item-id');
const sellQuantity = document.getElementById('sell-quantity');

// State
let token = localStorage.getItem('token') || sessionStorage.getItem('token');
let username = localStorage.getItem('username') || sessionStorage.getItem('username');
let role = localStorage.getItem('role') || sessionStorage.getItem('role');
let currentStores = [];
let currentItems = [];
let currentStoreId = null;

// Init
function init() {
  if (token) {
    showDashboard();
  } else {
    showLogin();
  }
}

// Navigation
function showLogin() {
  authSection.classList.remove('hidden');
  mainAppSection.classList.add('hidden');
}

function showDashboard() {
  authSection.classList.add('hidden');
  mainAppSection.classList.remove('hidden');
  const roleDisplay = role ? ` (${role})` : '';
  userDisplay.textContent = username + roleDisplay;
  showStoresView();
}

function showStoresView() {
  storesView.classList.remove('hidden');
  itemsView.classList.add('hidden');
  currentStoreId = null;
  fetchStores();
}

function showItemsView(storeId, storeName) {
  storesView.classList.add('hidden');
  itemsView.classList.remove('hidden');
  currentStoreId = storeId;
  currentStoreTitle.textContent = storeName + ' Inventory';
  fetchItems();
}

backToStoresBtn.addEventListener('click', showStoresView);

// API Helpers
async function apiCall(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
  
  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'API Error');
  }
  return data;
}

// Auth Toggle
authSwitchLink.addEventListener('click', (e) => {
  e.preventDefault();
  isLoginMode = !isLoginMode;
  authError.textContent = '';
  if (isLoginMode) {
    authTitle.textContent = 'Welcome Back';
    authSubtitle.textContent = 'Enter your credentials to access the vault.';
    authSubmitBtn.textContent = 'Login';
    authSwitchText.textContent = "Don't have an account?";
    authSwitchLink.textContent = 'Sign up';
  } else {
    authTitle.textContent = 'Create Account';
    authSubtitle.textContent = 'Sign up to start managing your stock.';
    authSubmitBtn.textContent = 'Sign Up';
    authSwitchText.textContent = "Already have an account?";
    authSwitchLink.textContent = 'Login';
  }
});

// Password Visibility
togglePasswordBtn.addEventListener('click', () => {
  const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
  passwordInput.setAttribute('type', type);
  
  // Update icon based on state
  if (type === 'text') {
    togglePasswordBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="eye-icon"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"></path></svg>';
  } else {
    togglePasswordBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="eye-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
  }
});

// Auth Submission
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = document.getElementById('username').value;
  const pass = passwordInput.value;
  const rememberMe = rememberMeCheckbox.checked;
  const btn = e.target.querySelector('button[type="submit"]');
  
  try {
    setLoading(btn, true);
    authError.textContent = '';
    
    const endpoint = isLoginMode ? '/auth/login' : '/auth/register';
    
    const res = await apiCall(endpoint, {
      method: 'POST',
      body: JSON.stringify({ username: user, password: pass })
    });
    
    token = res.token;
    username = res.username;
    role = res.role;
    
    const storage = rememberMe ? localStorage : sessionStorage;
    
    // Clear other storage
    if (rememberMe) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('username');
      sessionStorage.removeItem('role');
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
    }
    
    storage.setItem('token', token);
    storage.setItem('username', username);
    storage.setItem('role', role);
    
    showDashboard();
    showToast(isLoginMode ? 'Logged in successfully' : 'Registered successfully', 'success');
  } catch (err) {
    authError.textContent = err.message;
  } finally {
    setLoading(btn, false);
  }
});

logoutBtn.addEventListener('click', () => {
  token = null;
  username = null;
  role = null;
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('role');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('username');
  sessionStorage.removeItem('role');
  showLogin();
});

// ================= STORES CRUD =================
async function fetchStores() {
  try {
    currentStores = await apiCall('/stores');
    renderStores();
  } catch (err) {
    if(err.message === 'Unauthorized' || err.message === 'No token provided') logoutBtn.click();
    console.error(err);
  }
}

function renderStores() {
  const emptyState = document.getElementById('stores-empty-state');
  storesGrid.innerHTML = '';
  
  if (currentStores.length === 0) {
    emptyState.classList.remove('hidden');
    storesGrid.classList.add('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  storesGrid.classList.remove('hidden');

  currentStores.forEach((store, index) => {
    const card = document.createElement('div');
    card.className = 'store-card';
    card.style.animation = `fadeInSlideUp 0.4s ease forwards`;
    card.style.animationDelay = `${index * 0.05}s`;
    card.style.opacity = '0';
    card.innerHTML = `
      <div>
        <h3>${store.name}</h3>
        <p>${store.description || 'No description provided.'}</p>
      </div>
      <div class="store-card-actions">
        <button class="btn-edit store-edit-btn" data-id="${store.id}">Edit</button>
        <button class="btn-danger store-delete-btn" data-id="${store.id}">Delete</button>
      </div>
    `;
    
    // Clicking the card opens the store's inventory
    card.addEventListener('click', (e) => {
      if(e.target.classList.contains('store-edit-btn') || e.target.classList.contains('store-delete-btn')) return;
      showItemsView(store.id, store.name);
    });

    storesGrid.appendChild(card);
  });
}

function openStoreModal(store = null) {
  storeModal.classList.remove('hidden');
  if (store) {
    storeModalTitle.textContent = 'Edit Store';
    document.getElementById('store-id').value = store.id;
    document.getElementById('store-name').value = store.name;
    document.getElementById('store-desc').value = store.description;
  } else {
    storeModalTitle.textContent = 'Add Store';
    storeForm.reset();
    document.getElementById('store-id').value = '';
  }
}

function closeStoreModal() {
  storeModal.classList.add('hidden');
}

addStoreBtn.addEventListener('click', () => openStoreModal());
cancelStoreModalBtn.addEventListener('click', closeStoreModal);

storeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('store-id').value;
  const btn = e.target.querySelector('button[type="submit"]');
  const payload = {
    name: document.getElementById('store-name').value,
    description: document.getElementById('store-desc').value
  };

  try {
    setLoading(btn, true);
    if (id) {
      await apiCall(`/stores/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await apiCall(`/stores`, { method: 'POST', body: JSON.stringify(payload) });
    }
    closeStoreModal();
    fetchStores();
    showToast(id ? 'Store updated successfully' : 'Store added successfully', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    setLoading(btn, false);
  }
});

storesGrid.addEventListener('click', async (e) => {
  if (e.target.classList.contains('store-edit-btn')) {
    const id = parseInt(e.target.dataset.id, 10);
    const store = currentStores.find(s => s.id === id);
    if (store) openStoreModal(store);
  } else if (e.target.classList.contains('store-delete-btn')) {
    const id = e.target.dataset.id;
    const confirmed = await confirmAction('Delete Store', 'Are you sure you want to delete this store and ALL its items?');
    if (confirmed) {
      try {
        await apiCall(`/stores/${id}`, { method: 'DELETE' });
        fetchStores();
        showToast('Store deleted successfully', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  }
});


// ================= ITEMS CRUD =================
async function fetchItems() {
  if (!currentStoreId) return;
  try {
    currentItems = await apiCall(`/items?storeId=${currentStoreId}`);
    renderTable();
  } catch (err) {
    console.error(err);
  }
}

function renderTable() {
  const emptyState = document.getElementById('items-empty-state');
  const tableContainer = document.getElementById('items-table-container');
  stockTbody.innerHTML = '';
  
  if (currentItems.length === 0) {
    emptyState.classList.remove('hidden');
    tableContainer.classList.add('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  tableContainer.classList.remove('hidden');

  currentItems.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.style.animation = `fadeInSlideUp 0.4s ease forwards`;
    tr.style.animationDelay = `${index * 0.05}s`;
    tr.style.opacity = '0';
    tr.innerHTML = `
      <td><span class="id-pill">#${item.id}</span></td>
      <td style="font-weight: 500;">${item.name}</td>
      <td>${item.quantity} <span style="font-size: 0.8em; color: var(--text-muted)">units</span></td>
      <td style="color: #10b981; font-weight: 600;">₹${item.price.toFixed(2)}</td>
      <td style="color: var(--text-muted);">${item.description}</td>
      <td>
        <button class="btn-primary item-sell-btn" data-id="${item.id}" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">Sell</button>
        <button class="btn-edit item-edit-btn" data-id="${item.id}">Edit</button>
        <button class="btn-danger item-delete-btn" data-id="${item.id}">Delete</button>
      </td>
    `;
    stockTbody.appendChild(tr);
  });
}

function openItemModal(item = null) {
  itemModal.classList.remove('hidden');
  if (item) {
    modalTitle.textContent = 'Edit Stock';
    document.getElementById('item-id').value = item.id;
    document.getElementById('item-name').value = item.name;
    document.getElementById('item-quantity').value = item.quantity;
    document.getElementById('item-cost-price').value = item.cost_price || 0;
    document.getElementById('item-price').value = item.price;
    document.getElementById('item-desc').value = item.description;
  } else {
    modalTitle.textContent = 'Add Stock';
    itemForm.reset();
    document.getElementById('item-id').value = '';
  }
}

function closeItemModal() {
  itemModal.classList.add('hidden');
}

addItemBtn.addEventListener('click', () => openItemModal());
cancelModalBtn.addEventListener('click', closeItemModal);

itemForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('item-id').value;
  const btn = e.target.querySelector('button[type="submit"]');
  const payload = {
    store_id: currentStoreId,
    name: document.getElementById('item-name').value,
    quantity: parseInt(document.getElementById('item-quantity').value, 10),
    cost_price: parseFloat(document.getElementById('item-cost-price').value),
    price: parseFloat(document.getElementById('item-price').value),
    description: document.getElementById('item-desc').value
  };

  try {
    setLoading(btn, true);
    if (id) {
      await apiCall(`/items/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await apiCall(`/items`, { method: 'POST', body: JSON.stringify(payload) });
    }
    closeItemModal();
    fetchItems();
    showToast(id ? 'Item updated successfully' : 'Item added successfully', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    setLoading(btn, false);
  }
});

stockTbody.addEventListener('click', async (e) => {
  if (e.target.classList.contains('item-sell-btn')) {
    const id = parseInt(e.target.dataset.id, 10);
    const item = currentItems.find(i => i.id === id);
    if (item) {
      sellItemId.value = item.id;
      sellQuantity.value = '';
      sellModal.classList.remove('hidden');
    }
  } else if (e.target.classList.contains('item-edit-btn')) {
    const id = parseInt(e.target.dataset.id, 10);
    const item = currentItems.find(i => i.id === id);
    if (item) openItemModal(item);
  } else if (e.target.classList.contains('item-delete-btn')) {
    const id = e.target.dataset.id;
    const confirmed = await confirmAction('Delete Stock', 'Are you sure you want to delete this item?');
    if (confirmed) {
      try {
        await apiCall(`/items/${id}`, { method: 'DELETE' });
        fetchItems();
        showToast('Item deleted successfully', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  }
});

cancelSellBtn.addEventListener('click', () => sellModal.classList.add('hidden'));

sellForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const payload = {
    item_id: parseInt(sellItemId.value, 10),
    quantity: parseInt(sellQuantity.value, 10)
  };

  try {
    setLoading(btn, true);
    await apiCall(`/sales`, { method: 'POST', body: JSON.stringify(payload) });
    sellModal.classList.add('hidden');
    fetchItems();
    showToast('Sale recorded successfully!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    setLoading(btn, false);
  }
});

// Profit Dashboard
viewProfitBtn.addEventListener('click', async () => {
  if (!currentStoreId) return;
  try {
    const data = await apiCall(`/sales/summary?storeId=${currentStoreId}`);
    profitTotalRevenue.textContent = '₹' + data.totalRevenue.toFixed(2);
    profitTotalProfit.textContent = '₹' + data.totalProfit.toFixed(2);
    
    profitSalesTbody.innerHTML = '';
    data.recentSales.forEach(sale => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="padding: 0.75rem; border-top: 1px solid rgba(255,255,255,0.1);">${sale.item_name}</td>
        <td style="padding: 0.75rem; border-top: 1px solid rgba(255,255,255,0.1);">${sale.quantity_sold}</td>
        <td style="padding: 0.75rem; border-top: 1px solid rgba(255,255,255,0.1); color: white;">₹${sale.total_revenue.toFixed(2)}</td>
        <td style="padding: 0.75rem; border-top: 1px solid rgba(255,255,255,0.1); color: #10b981;">₹${sale.total_profit.toFixed(2)}</td>
      `;
      profitSalesTbody.appendChild(tr);
    });
    
    profitModal.classList.remove('hidden');
  } catch (err) {
    showToast(err.message, 'error');
  }
});

closeProfitBtn.addEventListener('click', () => profitModal.classList.add('hidden'));

// Run init
init();
