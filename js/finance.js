import { db, $, checkAuth, now, formatRupiah } from "./common.js";
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

checkAuth();

const modal = $('#financeModal');
const form = $('#financeForm');

// Buka Modal
$('#btnAddExpense').onclick = () => { form.reset(); form.type.value = 'expense'; modal.classList.remove('hidden'); };
$('#btnAddIncome').onclick = () => { form.reset(); form.type.value = 'income'; modal.classList.remove('hidden'); };
$('#financeCancel').onclick = () => modal.classList.add('hidden');

// Simpan Transaksi
form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const type = fd.get('type'); // 'expense' atau 'income'
    const collectionName = type === 'expense' ? 'expenses' : 'incomes';

    try {
        await addDoc(collection(db, collectionName), {
            amount: Number(fd.get('amount')),
            date: fd.get('date'),
            note: fd.get('note'),
            created_at: now()
        });
        modal.classList.add('hidden');
    } catch (err) {
        alert('Gagal menyimpan transaksi.');
    }
};

// Hapus Transaksi (Global function agar bisa dipanggil HTML string)
window.delFinance = async (col, id) => {
    if(confirm('Hapus data keuangan ini?')) await deleteDoc(doc(db, col, id));
};

// Render List (Gabung Expense & Income itu agak ribet di NoSQL murni tanpa backend, 
// jadi kita tampilkan 2 list atau list sederhana per koleksi. 
// Di sini saya buat render realtime sederhana).

function renderList(colName, title) {
    const container = $('#financeList');
    const q = query(collection(db, colName), orderBy('date', 'desc'));
    
    // Kita buat wrapper div biar gak numpuk aneh
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `<h3 style="margin-top:20px; border-bottom:2px solid #ddd;">${title}</h3>`;
    container.appendChild(wrapper);

    onSnapshot(q, (snap) => {
        // Hapus elemen lama di bawah judul ini (agak tricky kalau digabung, 
        // tapi untuk admin sederhana ini oke)
        // Cara lebih rapi: kosongkan container dulu baru render ulang semua.
    });
    
    // --- Revisi: Render Simple (Langsung tumpuk aja biar gampang) ---
}

// Versi Simple: Render Expense Saja dulu, lalu Income (atau sebaliknya)
const container = $('#financeList');

// 1. Monitor Pengeluaran
onSnapshot(query(collection(db, 'expenses'), orderBy('date', 'desc')), (snap) => {
    // Untuk MPA sederhana, kita render ulang container setiap ada perubahan
    // (Note: Ini akan me-reset list income juga kalau tidak dipisah div-nya. 
    // Biar aman, kita buat div terpisah di HTML finance.html nanti, 
    // TAPI karena HTML sudah jadi, kita inject JS saja)
    
    // Strategi: Kita render Expense dulu
    renderData();
});

// Strategi Render Gabungan (Manual Trigger)
async function renderData() {
    container.innerHTML = 'Loading...';
    // Ini agak berat kalau datanya ribuan, tapi ok untuk ratusan.
    // Idealnya pakai onSnapshot terpisah.
    
    // Kita pakai listener terpisah untuk DOM yang berbeda
    // Agar tidak konflik, saya sarankan kamu ubah HTML finance.html sedikit
    // Tapi kalau tidak mau ubah HTML, biarkan JS memanipulasi:
    
    container.innerHTML = '<div id="list-exp"></div><div id="list-inc"></div>';
    
    // Listener Expense
    onSnapshot(query(collection(db, 'expenses'), orderBy('date', 'desc')), s => {
        const el = document.getElementById('list-exp');
        el.innerHTML = '<h4 style="color:red; margin-top:20px;">Pengeluaran</h4>';
        s.forEach(d => {
            const v = d.data();
            el.innerHTML += `
            <div class="item-row">
                <div>Rp ${Number(v.amount).toLocaleString()} <br><small>${v.note} (${v.date})</small></div>
                <button onclick="delFinance('expenses', '${d.id}')" style="color:red; border:1px solid red; background:none; padding:2px 8px; border-radius:4px;">Hapus</button>
            </div>`;
        });
    });

    // Listener Income
    onSnapshot(query(collection(db, 'incomes'), orderBy('date', 'desc')), s => {
        const el = document.getElementById('list-inc');
        el.innerHTML = '<h4 style="color:green; margin-top:20px;">Pemasukan</h4>';
        s.forEach(d => {
            const v = d.data();
            el.innerHTML += `
            <div class="item-row">
                <div>Rp ${Number(v.amount).toLocaleString()} <br><small>${v.note} (${v.date})</small></div>
                <button onclick="delFinance('incomes', '${d.id}')" style="color:red; border:1px solid red; background:none; padding:2px 8px; border-radius:4px;">Hapus</button>
            </div>`;
        });
    });
}

// Jalankan render awal
renderData();