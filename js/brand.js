// js/brand.js
import { db, $, checkAuth, now } from "./common.js";
import { collection, addDoc, doc, deleteDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

checkAuth();

let activeCategoryId = null; 
const modalCat = $('#modalCategory');
const modalItem = $('#modalBGItem');

// Modal Logic
$('#btnAddCategory').onclick = () => { $('#categoryForm').reset(); modalCat.classList.remove('hidden'); };
$('#categoryCancel').onclick = () => modalCat.classList.add('hidden');
$('#bgItemCancel').onclick = () => modalItem.classList.add('hidden');

// Simpan Kategori
$('#categoryForm').onsubmit = async (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    if(name) {
        await addDoc(collection(db, 'brand_guideline_categories'), { name, created_at: now() });
        modalCat.classList.add('hidden');
    }
};

// Simpan Item
$('#bgItemForm').onsubmit = async (e) => {
    e.preventDefault();
    if (!activeCategoryId) return;
    const fd = new FormData(e.target);
    await addDoc(collection(db, 'brand_guideline_categories', activeCategoryId, 'items'), {
        name: fd.get('name'), link: fd.get('link'), note: fd.get('note'), created_at: now()
    });
    modalItem.classList.add('hidden');
};

// Expose fungsi ke window agar bisa dipanggil dari HTML string
window.prepAddItem = (id) => { activeCategoryId = id; $('#bgItemForm').reset(); modalItem.classList.remove('hidden'); };
window.delCat = async (id) => { if(confirm('Hapus grup ini?')) await deleteDoc(doc(db, 'brand_guideline_categories', id)); };
window.delItem = async (catId, itemId) => { if(confirm('Hapus link ini?')) await deleteDoc(doc(db, 'brand_guideline_categories', catId, 'items', itemId)); };

// Render Data
const q = query(collection(db, 'brand_guideline_categories'), orderBy('created_at', 'desc'));
onSnapshot(q, (snapshot) => {
    const container = $('#bgCategories');
    container.innerHTML = '';
    
    if(snapshot.empty) { container.innerHTML = '<center>Belum ada data.</center>'; return; }

    snapshot.forEach(docSnap => {
        const cat = docSnap.data();
        const catId = docSnap.id;
        
        const card = document.createElement('div');
        card.className = 'card'; card.style.marginBottom = '20px';
        
        card.innerHTML = `
            <div style="display:flex;justify-content:space-between;border-bottom:2px solid #fefae0;padding-bottom:10px;margin-bottom:10px;">
                <h3 style="margin:0;color:var(--primary);">📂 ${cat.name}</h3>
                <div>
                    <button class="btn-primary" style="font-size:0.8rem;padding:5px 10px;" onclick="prepAddItem('${catId}')">+ Link</button>
                    <button class="btn-danger" style="font-size:0.8rem;padding:5px 10px;" onclick="delCat('${catId}')">Hapus</button>
                </div>
            </div>
            <div id="items-${catId}" style="display:flex;flex-direction:column;gap:10px;"><small>...</small></div>
        `;
        container.appendChild(card);

        // Nested Listener untuk Items
        const qItem = query(collection(db, 'brand_guideline_categories', catId, 'items'), orderBy('created_at', 'desc'));
        onSnapshot(qItem, (itemSnap) => {
            const itemDiv = document.getElementById(`items-${catId}`);
            if(!itemDiv) return;
            itemDiv.innerHTML = '';
            
            if(itemSnap.empty) { itemDiv.innerHTML = '<small style="color:#ccc">Kosong</small>'; return; }
            
            itemSnap.forEach(i => {
                const d = i.data();
                itemDiv.innerHTML += `
                <div class="bg-category" style="padding:10px;">
                    <div style="flex:1">
                        <a href="${d.link}" target="_blank" style="font-weight:bold;color:#4a403a;text-decoration:none;">🔗 ${d.name}</a>
                        ${d.note ? `<div style="font-size:0.8rem;color:#888">${d.note}</div>` : ''}
                    </div>
                    <button class="btn-danger" style="font-size:0.7rem;padding:4px 8px;" onclick="delItem('${catId}','${i.id}')">X</button>
                </div>`;
            });
        });
    });
});