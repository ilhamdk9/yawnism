import { db, $, checkAuth, formatRupiah } from "./common.js";
import { collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

checkAuth();

const list = $('#hppList');

if(list) {
    // Ambil data produk realtime
    const q = query(collection(db, 'products'), orderBy('name', 'asc'));
    
    onSnapshot(q, (snapshot) => {
        list.innerHTML = '';
        snapshot.forEach(docSnap => {
            const p = docSnap.data();
            list.innerHTML += `
            <div class="bg-category">
                <div>
                    <strong>${p.name}</strong> <span style="color:#777; font-size:0.8rem;">(${p.code || ''})</span>
                </div>
                <div style="font-weight:bold; color:var(--danger);">
                    HPP: ${formatRupiah(p.hpp || 0)}
                </div>
            </div>`;
        });
    });
}