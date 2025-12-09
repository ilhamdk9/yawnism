// js/products.js
import { db, $, checkAuth, now, formatRupiah } from "./common.js";
import { collection, addDoc, doc, deleteDoc, onSnapshot, orderBy, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

checkAuth();

const modal = $('#modalProduct');
$('#btnAddProduct').onclick = () => { $('#productForm').reset(); modal.classList.remove('hidden'); };
$('#productCancel').onclick = () => modal.classList.add('hidden');

// Tambah Produk
$('#productForm').onsubmit = async (e) => {
    e.preventDefault(); 
    const fd = new FormData(e.target);
    const d = Object.fromEntries(fd.entries());
    
    d.price = Number(d.price); 
    d.hpp = Number(d.hpp); 
    d.updated_at = now();
    d.sizes = d.sizes ? d.sizes.split(',').map(x=>x.trim()) : [];
    d.colors = d.colors ? d.colors.split(',').map(x=>x.trim()) : [];
    
    await addDoc(collection(db,'products'), d);
    modal.classList.add('hidden');
};

// Hapus Produk
window.delProduct = async (id) => { if(confirm('Hapus produk ini?')) await deleteDoc(doc(db,'products',id)); };

// Realtime List
const q = query(collection(db,'products'), orderBy('updated_at', 'desc'));
onSnapshot(q, s => {
    const list = $('#productsList');
    list.innerHTML = '';
    s.forEach(d => {
        const p = d.data();
        const img = p.photo_link || 'https://cataas.com/cat/says/NoImage';
        // Simple GDrive convert logic inline or imported helper
        
        list.innerHTML += `
        <div class="bg-category">
            <div style="display:flex; gap:15px; align-items:center;">
                <div style="width:50px;height:50px;background:#eee;border-radius:8px;overflow:hidden;">
                    <img src="${img}" style="width:100%;height:100%;object-fit:cover;" onerror="this.src='https://cataas.com/cat/says/Error'">
                </div>
                <div>
                    <strong>${p.name}</strong> <span style="color:#888;font-size:0.8rem">(${p.code||'-'})</span><br>
                    <small>${formatRupiah(p.price)}</small>
                </div>
            </div>
            <button class="btn-danger" onclick="delProduct('${d.id}')">Hapus</button>
        </div>`;
    });
});