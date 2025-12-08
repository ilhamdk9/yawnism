import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, setDoc, getDoc, getDocs, updateDoc, onSnapshot, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Init Firebase
const app = initializeApp(window.FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

// --- CONFIG CREDENTIALS ---
// Pastikan huruf besar/kecil SESUAI persis keinginan
const TARGET_EMAIL = "yawnism.co@gmail.com"; 

// --- UI ELEMENTS ---
const UI_LOGIN = document.getElementById('login-overlay');
const UI_APP = document.getElementById('app');
const UI_DENIED = document.getElementById('access-denied');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

// --- 1. AUTH LOGIC (DIPERBAIKI) ---

// Cek status login saat halaman dibuka
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Cek apakah emailnya benar (abaikan huruf besar/kecil)
        if (user.email.toLowerCase() === TARGET_EMAIL.toLowerCase()) {
            showDashboard(user);
        } else {
            // Login berhasil, TAPI email beda -> TENDANG
            console.log("Email tidak cocok:", user.email);
            triggerAccessDenied();
        }
    } else {
        // Belum login -> Tampilkan Form Login
        UI_APP.classList.add('hidden');
        UI_LOGIN.classList.remove('hidden');
        UI_DENIED.classList.add('hidden');
    }
});

// Handler Tombol Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 1. Ambil data & BERSIHKAN SPASI (Trim)
    // Ini penting agar " yawnism..." tidak dianggap beda dengan "yawnism..."
    const emailInput = document.getElementById('loginEmail').value.trim();
    const passInput = document.getElementById('loginPass').value.trim();

    // Reset pesan error
    loginError.style.display = 'none';
    loginError.textContent = "Loading...";
    loginError.style.display = 'block';

    try {
        // 2. Coba Login ke Firebase
        await signInWithEmailAndPassword(auth, emailInput, passInput);
        // Jika sukses, onAuthStateChanged di atas akan jalan otomatis
    } catch (error) {
        console.error("Login Error:", error.code);

        // 3. Analisa Error
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            // Kasus: Akun belum ada -> Kita buatkan otomatis
            try {
                console.log("Mencoba mendaftar akun baru...");
                await createUserWithEmailAndPassword(auth, emailInput, passInput);
                location.reload(); // Refresh halaman setelah daftar
            } catch (regErr) {
                // Gagal daftar (biasanya karena format password jelek/koneksi)
                showError("Gagal Register: " + regErr.message);
            }
        } else if (error.code === 'auth/wrong-password') {
            // Kasus: Akun SUDAH ADA, tapi password yang diketik BEDA dengan database
            showError("Password Salah! (Akun ini sudah ada dengan password lama)");
        } else if (error.code === 'auth/too-many-requests') {
            showError("Terlalu banyak mencoba. Tunggu sebentar.");
        } else {
            // Error lain
            showError("Error: " + error.message);
        }
    }
});

function showError(msg) {
    loginError.textContent = msg;
    loginError.style.display = 'block';
    // Goyangkan box login biar user sadar
    const box = document.querySelector('.login-box');
    box.style.animation = "shake 0.5s";
    setTimeout(() => box.style.animation = "", 500);
}

function showDashboard(user) {
    UI_LOGIN.classList.add('hidden');
    UI_DENIED.classList.add('hidden');
    UI_APP.classList.remove('hidden'); 
    document.getElementById('userInfo').textContent = user.email;
    
    // Load Data
    loadDashboardData();
    listenProducts();
    listenFinance();
    listenStock();
    listenOthers();
}

function triggerAccessDenied() {
    UI_LOGIN.classList.add('hidden');
    UI_APP.classList.add('hidden');
    UI_DENIED.classList.remove('hidden'); // Munculkan layar seram
    signOut(auth);
}

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await signOut(auth);
    location.reload();
});

// Tambahkan animasi shake via JS injection (opsional, biar keren)
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes shake {
  0% { transform: translate(1px, 1px) rotate(0deg); }
  10% { transform: translate(-1px, -2px) rotate(-1deg); }
  20% { transform: translate(-3px, 0px) rotate(1deg); }
  30% { transform: translate(3px, 2px) rotate(0deg); }
  40% { transform: translate(1px, -1px) rotate(1deg); }
  50% { transform: translate(-1px, 2px) rotate(-1deg); }
  60% { transform: translate(-3px, 1px) rotate(0deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}`;
document.head.appendChild(styleSheet);


// --- 2. NAVIGATION & UI HELPERS ---
const $ = (s) => document.querySelector(s);
const $a = (s) => document.querySelectorAll(s);
const now = () => new Date();
function gdrive(link) {
    if(!link) return 'https://cataas.com/cat/says/NoImage';
    let m = link.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
    if(m) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
    m = link.match(/open\?id=([a-zA-Z0-9_-]{10,})/);
    if(m) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
    return link;
}

$a('#sidebar nav button').forEach(btn => {
    if(btn.id === 'logoutBtn') return;
    btn.addEventListener('click', () => {
        $a('#sidebar nav button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        $a('.view').forEach(v => v.classList.add('hidden'));
        $(`#view-${btn.dataset.view}`).classList.remove('hidden');
    });
});

// --- 3. FEATURES (CRUD) ---

// DASHBOARD
async function loadDashboardData() {
    const p = await getDocs(collection(db,'products'));
    const e = await getDocs(collection(db,'expenses'));
    const i = await getDocs(collection(db,'incomes'));
    const cards = $('#dashboard-cards'); cards.innerHTML = '';
    const card = (t,v) => cards.innerHTML += `<div class="card"><h4>${t}</h4><strong>${v}</strong></div>`;
    
    card('Produk Aktif', p.size);
    card('Total Pengeluaran', `Rp ${e.docs.reduce((a,b)=>a+(b.data().amount||0),0).toLocaleString()}`);
    card('Total Pemasukan', `Rp ${i.docs.reduce((a,b)=>a+(b.data().amount||0),0).toLocaleString()}`);
}

// PRODUCTS
const modalProd = $('#modalProduct');
$('#btnAddProduct').onclick = () => { $('#productForm').reset(); modalProd.classList.remove('hidden'); };
$('#productCancel').onclick = () => modalProd.classList.add('hidden');
$('#productForm').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const d = Object.fromEntries(fd.entries());
    d.price = Number(d.price); d.hpp = Number(d.hpp);
    d.sizes = d.sizes.split(',').map(x=>x.trim());
    d.colors = d.colors.split(',').map(x=>x.trim());
    d.updated_at = now();
    await addDoc(collection(db,'products'), d);
    modalProd.classList.add('hidden');
};
function listenProducts() {
    onSnapshot(collection(db,'products'), s => {
        $('#productsList').innerHTML = '';
        s.forEach(d => {
            const p = d.data();
            $('#productsList').innerHTML += `
            <div class="bg-category">
                <div style="display:flex; gap:15px; align-items:center;">
                    <img src="${gdrive(p.photo_link)}" style="width:60px;height:60px;border-radius:10px;object-fit:cover;">
                    <div><strong>${p.name}</strong><br><small>Rp ${p.price}</small></div>
                </div>
                <button class="btn-danger" onclick="del('products','${d.id}')">Hapus</button>
            </div>`;
        });
    });
}

// FINANCE
const modalFin = $('#financeModal');
$('#btnAddExpense').onclick = () => { $('#financeForm').reset(); $('#financeForm').type.value='expense'; modalFin.classList.remove('hidden'); };
$('#btnAddIncome').onclick = () => { $('#financeForm').reset(); $('#financeForm').type.value='income'; modalFin.classList.remove('hidden'); };
$('#financeCancel').onclick = () => modalFin.classList.add('hidden');
$('#financeForm').onsubmit = async (e) => {
    e.preventDefault(); const fd = new FormData(e.target);
    await addDoc(collection(db, fd.get('type')==='expense'?'expenses':'incomes'), {
        amount: Number(fd.get('amount')), date: fd.get('date'), note: fd.get('note'), created_at: now()
    });
    modalFin.classList.add('hidden');
};
function listenFinance() {
    const r = (col, title) => onSnapshot(collection(db, col), s => {
        $('#financeList').innerHTML += `<h4>${title}</h4>`;
        s.forEach(d => $('#financeList').innerHTML += `<div class="item-row">Rp ${d.data().amount} - ${d.data().note}</div>`);
    });
    $('#financeList').innerHTML = '';
    r('expenses', 'Pengeluaran'); 
}

// STOCK
function listenStock() {
    getDocs(collection(db,'products')).then(s => {
        $('#stockProductSelect').innerHTML = '<option>Pilih Produk</option>';
        s.forEach(d => $('#stockProductSelect').innerHTML += `<option value="${d.id}">${d.data().name}</option>`);
    });
}
$('#stockApply').onclick = async () => {
    const pid = $('#stockProductSelect').value;
    const size = $('#stockSize').value;
    const delta = $('#stockDelta').value;
    if(pid && size) {
        await addDoc(collection(db,'stock_logs'), { product_id: pid, size, delta, created_at: now() });
        alert('Stok dicatat (Log only)');
    }
};

// OTHERS & HELPERS
function listenOthers() {
    const simpleList = (col, elId) => onSnapshot(collection(db,col), s => {
        $(elId).innerHTML = '';
        s.forEach(d => $(elId).innerHTML += `<div class="bg-category">${d.data().name} <button onclick="del('${col}','${d.id}')">X</button></div>`);
    });
    simpleList('suppliers', '#suppliersList');
    simpleList('collections', '#collectionsList');
    simpleList('brand_guideline_categories', '#bgCategories');
    
    $('#btnAddSupplier').onclick = async () => { const n=prompt('Nama'); if(n) await addDoc(collection(db,'suppliers'),{name:n}); };
    $('#btnAddCollection').onclick = async () => { const n=prompt('Nama'); if(n) await addDoc(collection(db,'collections'),{name:n}); };
    $('#btnAddCategory').onclick = async () => { const n=prompt('Nama'); if(n) await addDoc(collection(db,'brand_guideline_categories'),{name:n}); };
}

window.del = async (col, id) => { if(confirm('Hapus?')) await deleteDoc(doc(db, col, id)); };

// Initial View
$('#view-dashboard').classList.remove('hidden');

const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');

// 1. Toggle Sidebar saat tombol hamburger diklik
if(menuBtn){
    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
}

$a('#sidebar nav button').forEach(btn => {
    btn.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
        }
    });
});

document.getElementById('content').addEventListener('click', () => {
    if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
    }
});