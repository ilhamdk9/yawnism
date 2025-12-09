// js/dashboard.js
import { db, $, checkAuth, formatRupiah } from "./common.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

checkAuth(); // Cek login dulu

// Load Data Sekali Saja (Bukan Realtime agar ringan)
(async () => {
    const cards = $('#dashboard-cards');
    if(!cards) return;
    
    cards.innerHTML = 'Loading data...';

    try {
        const [p, e, i] = await Promise.all([
            getDocs(collection(db,'products')),
            getDocs(collection(db,'expenses')),
            getDocs(collection(db,'incomes'))
        ]);
        
        cards.innerHTML = '';
        const card = (t,v) => cards.innerHTML += `<div class="card"><h4>${t}</h4><strong>${v}</strong></div>`;
        
        card('Total Produk', p.size);
        card('Total Pengeluaran', formatRupiah(e.docs.reduce((a,b)=>a+(b.data().amount||0),0)));
        card('Total Pemasukan', formatRupiah(i.docs.reduce((a,b)=>a+(b.data().amount||0),0)));
    } catch (err) {
        cards.innerHTML = 'Gagal memuat data.';
        console.error(err);
    }
})();