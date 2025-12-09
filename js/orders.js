import { db, $, checkAuth } from "./common.js";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

checkAuth();

// Hapus Order
window.delOrder = async (id) => {
    if(confirm('Hapus order ini?')) await deleteDoc(doc(db, 'orders', id));
};

// Render List
const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
onSnapshot(q, (snap) => {
    const list = $('#ordersList');
    list.innerHTML = '';
    
    if(snap.empty) {
        list.innerHTML = '<center>Belum ada order masuk.</center>';
        return;
    }

    snap.forEach(d => {
        const o = d.data();
        list.innerHTML += `
        <div class="bg-category">
            <div>
                <strong>${o.customer_name || 'Customer'}</strong>
                <div><small>Status: ${o.status || 'Pending'}</small></div>
            </div>
            <button class="btn-danger" onclick="delOrder('${d.id}')">Hapus</button>
        </div>`;
    });
});