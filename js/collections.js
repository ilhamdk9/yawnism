import { db, $, checkAuth, now } from "./common.js";
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

checkAuth();

// Tambah Koleksi
$('#btnAddCollection').onclick = async () => {
    const name = prompt("Nama Koleksi / Season:");
    if(!name) return;
    
    await addDoc(collection(db, 'collections'), {
        name: name,
        created_at: now()
    });
};

// Hapus Koleksi
window.delCollection = async (id) => {
    if(confirm('Hapus koleksi ini?')) await deleteDoc(doc(db, 'collections', id));
};

// Render List
const q = query(collection(db, 'collections'), orderBy('created_at', 'desc'));
onSnapshot(q, (snap) => {
    const list = $('#collectionsList');
    list.innerHTML = '';
    snap.forEach(d => {
        const c = d.data();
        list.innerHTML += `
        <div class="bg-category">
            <strong>${c.name}</strong>
            <button class="btn-danger" onclick="delCollection('${d.id}')">Hapus</button>
        </div>`;
    });
});