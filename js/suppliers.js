import { db, $, checkAuth, now } from "./common.js";
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

checkAuth();

// Tambah Supplier
$('#btnAddSupplier').onclick = async () => {
    const name = prompt("Masukkan Nama Supplier:");
    if(!name) return;
    const phone = prompt("Nomor Telepon/WA:");
    
    await addDoc(collection(db, 'suppliers'), {
        name: name,
        phone: phone || '-',
        created_at: now()
    });
};

// Hapus Supplier
window.delSupplier = async (id) => {
    if(confirm('Hapus supplier ini?')) await deleteDoc(doc(db, 'suppliers', id));
};

// Render List
const q = query(collection(db, 'suppliers'), orderBy('created_at', 'desc'));
onSnapshot(q, (snap) => {
    const list = $('#suppliersList');
    list.innerHTML = '';
    snap.forEach(d => {
        const s = d.data();
        list.innerHTML += `
        <div class="bg-category">
            <div>
                <strong>${s.name}</strong>
                <div><small>📞 ${s.phone}</small></div>
            </div>
            <button class="btn-danger" onclick="delSupplier('${d.id}')">Hapus</button>
        </div>`;
    });
});