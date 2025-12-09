import { db, $, checkAuth, now } from "./common.js";
import { collection, addDoc, getDocs, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

checkAuth();

// 1. Isi Dropdown Produk
(async () => {
    const sel = $('#stockProductSelect');
    if(!sel) return;
    
    sel.innerHTML = '<option>Loading...</option>';
    const snap = await getDocs(collection(db,'products'));
    
    sel.innerHTML = '<option value="">-- Pilih Produk --</option>';
    snap.forEach(d => {
        const p = d.data();
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = `${p.name} (${p.code || '-'})`;
        sel.appendChild(opt);
    });
})();

// 2. Tombol Update Stok
const btnApply = $('#stockApply');
if(btnApply) {
    btnApply.onclick = async () => {
        const pid = $('#stockProductSelect').value;
        const size = $('#stockSize').value.trim();
        const delta = Number($('#stockDelta').value);
        const note = $('#stockNote').value.trim();

        if(!pid || !size || delta === 0) {
            return alert('Harap pilih produk, isi ukuran, dan jumlah perubahan (+/-).');
        }

        try {
            await addDoc(collection(db,'stock_logs'), {
                product_id: pid,
                size: size,
                delta: delta,
                note: note,
                created_at: now()
            });
            alert('Stok berhasil dicatat!');
            // Reset form dikit
            $('#stockSize').value = '';
            $('#stockDelta').value = '';
            $('#stockNote').value = '';
        } catch (e) {
            console.error(e);
            alert('Gagal menyimpan data.');
        }
    };
}

// 3. Riwayat Log (Realtime)
const q = query(collection(db,'stock_logs'), orderBy('created_at', 'desc'));
onSnapshot(q, (snapshot) => {
    const container = $('#stockLog');
    if(!container) return;
    
    container.innerHTML = '';
    snapshot.forEach(d => {
        const log = d.data();
        const time = log.created_at?.toDate ? log.created_at.toDate().toLocaleDateString('id-ID') : '-';
        
        // Warna merah jika keluar (-), hijau jika masuk (+)
        const color = log.delta < 0 ? 'color:red' : 'color:green';
        
        container.innerHTML += `
        <div class="item-row">
            <div>
                <strong>Size: ${log.size}</strong> <span style="${color}; font-weight:bold;">(${log.delta > 0 ? '+' : ''}${log.delta})</span>
                <br><small style="color:#888">${log.note || ''}</small>
            </div>
            <small>${time}</small>
        </div>`;
    });
});