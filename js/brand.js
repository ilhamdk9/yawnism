import { db, $, checkAuth, now } from "./common.js";
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

checkAuth();

let activeCategoryId = null; 
let activeItemId = null; 
const modalCat = $('#modalCategory');
const modalItem = $('#modalBGItem');

// --- EVENT HANDLERS ---
$('#btnAddCategory').onclick = () => { 
    activeCategoryId = null; 
    $('#categoryForm').reset(); 
    modalCat.querySelector('h3').innerText = '📂 Buat Grup Baru';
    modalCat.classList.remove('hidden'); 
};

$('#categoryCancel').onclick = () => modalCat.classList.add('hidden');
$('#bgItemCancel').onclick = () => modalItem.classList.add('hidden');

// Simpan/Update Grup
$('#categoryForm').onsubmit = async (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    if (activeCategoryId) {
        await updateDoc(doc(db, 'brand_guideline_categories', activeCategoryId), { name });
    } else {
        await addDoc(collection(db, 'brand_guideline_categories'), { name, created_at: now() });
    }
    modalCat.classList.add('hidden');
};

// Simpan/Update Item Link
$('#bgItemForm').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = { name: fd.get('name'), link: fd.get('link'), note: fd.get('note') };

    if (activeItemId) {
        await updateDoc(doc(db, 'brand_guideline_categories', activeCategoryId, 'items', activeItemId), data);
    } else {
        await addDoc(collection(db, 'brand_guideline_categories', activeCategoryId, 'items'), { ...data, created_at: now() });
    }
    modalItem.classList.add('hidden');
};

// --- GLOBAL FUNCTIONS (WINDOW) ---
window.editCat = (id, oldName) => {
    activeCategoryId = id;
    modalCat.querySelector('h3').innerText = '✏️ Edit Nama Grup';
    $('#categoryForm').name.value = oldName;
    modalCat.classList.remove('hidden');
};

window.prepAddItem = (catId, itemId = null, encodedData = null) => { 
    activeCategoryId = catId; 
    activeItemId = itemId;
    $('#bgItemForm').reset(); 
    
    if(itemId && encodedData) {
        const d = JSON.parse(decodeURIComponent(encodedData));
        modalItem.querySelector('h3').innerText = '✏️ Edit Link';
        $('#bgItemForm').name.value = d.name;
        $('#bgItemForm').link.value = d.link;
        $('#bgItemForm').note.value = d.note || '';
    } else {
        modalItem.querySelector('h3').innerText = '🔗 Tambah Link Baru';
    }
    modalItem.classList.remove('hidden'); 
};

window.delCat = async (id) => { if(confirm('Hapus grup ini dan semua isinya?')) await deleteDoc(doc(db, 'brand_guideline_categories', id)); };
window.delItem = async (catId, itemId) => { if(confirm('Hapus link ini?')) await deleteDoc(doc(db, 'brand_guideline_categories', catId, 'items', itemId)); };

// --- RENDER DATA ---
const q = query(collection(db, 'brand_guideline_categories'), orderBy('created_at', 'desc'));
onSnapshot(q, (snapshot) => {
    const container = $('#bgCategories');
    container.innerHTML = snapshot.empty ? '<center style="padding:40px; color:#aaa;">Belum ada kategori guideline.</center>' : '';

    snapshot.forEach(docSnap => {
        const cat = docSnap.data();
        const catId = docSnap.id;
        const card = document.createElement('div');
        card.className = 'card';
        card.style.marginBottom = '20px';
        
        card.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">📂 ${cat.name}</h3>
                <div class="action-group">
                    <button class="btn-icon btn-secondary" onclick="editCat('${catId}', '${cat.name.replace(/'/g, "\\'")}')">📝</button>
                    <button class="btn-icon btn-primary" onclick="prepAddItem('${catId}')">＋</button>
                    <button class="btn-icon btn-danger" onclick="delCat('${catId}')">🗑️</button>
                </div>
            </div>
            <div id="items-${catId}" class="list-container"><small>Memuat link...</small></div>
        `;
        container.appendChild(card);

        // Nested Listener untuk Items
        const qItem = query(collection(db, 'brand_guideline_categories', catId, 'items'), orderBy('created_at', 'desc'));
        onSnapshot(qItem, (itemSnap) => {
            const itemDiv = document.getElementById(`items-${catId}`);
            if(!itemDiv) return;
            itemDiv.innerHTML = itemSnap.empty ? '<small style="color:#ccc; padding:10px;">Belum ada link di grup ini.</small>' : '';
            
            itemSnap.forEach(i => {
                const d = i.data();
                const dataString = encodeURIComponent(JSON.stringify(d));
                itemDiv.innerHTML += `
                <div class="link-item">
                    <div class="link-info">
                        <a href="${d.link}" target="_blank" class="link-name">🔗 ${d.name}</a>
                        ${d.note ? `<div class="link-note">${d.note}</div>` : ''}
                    </div>
                    <div class="action-group">
                        <button class="btn-icon btn-secondary" style="background:#fff" onclick="prepAddItem('${catId}','${i.id}', '${dataString}')">✏️</button>
                        <button class="btn-icon btn-danger" style="background:rgba(230,57,70,0.1); color:var(--danger)" onclick="delItem('${catId}','${i.id}')">✕</button>
                    </div>
                </div>`;
            });
        });
    });
});