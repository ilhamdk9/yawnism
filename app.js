import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, getDoc, getDocs, updateDoc, onSnapshot, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Init
const app = initializeApp(window.FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

// Helper Selector
const $ = (s) => document.querySelector(s);

// Cek Nama File Halaman Saat Ini
let currentPage = window.location.pathname.split("/").pop();
// Kalau kosong (root), anggap index.html
if (currentPage === "" || currentPage === "index") currentPage = "index.html"; 

// --- 1. GLOBAL AUTH CHECK (SECURITY GATE) ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // --- JIKA SUDAH LOGIN ---
        if (currentPage === "index.html") {
            // Kalau buka halaman login, lempar ke dashboard
            window.location.href = "dashboard.html";
        } else {
            // Kalau di halaman dalam, tampilkan email user
            const uiUser = $('#userInfo');
            if(uiUser) uiUser.textContent = user.email;
            
            // Jalankan logika khusus halaman ini
            initPageLogic();
            initSidebar(); // Jalankan sidebar logic
        }
    } else {
        // --- JIKA BELUM LOGIN ---
        if (currentPage !== "index.html") {
            // Kalau maksa buka halaman dalam, tendang ke index.html
            window.location.href = "index.html";
        }
    }
});

// --- 2. LOGIKA SIDEBAR & LOGOUT (Hanya jalan di halaman dalam) ---
function initSidebar() {
    const menuBtn = $('#menuBtn');
    const sidebar = $('#sidebar');
    const logoutBtn = $('#logoutBtn');

    if(menuBtn && sidebar){
        menuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
        // Tutup sidebar kalau klik konten
        $('#content').addEventListener('click', () => sidebar.classList.remove('open'));
        
        // Tandai menu aktif
        document.querySelectorAll('#sidebar nav a').forEach(l => {
            if(l.getAttribute('href') === currentPage) l.classList.add('active');
        });
    }

    if(logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if(confirm('Yakin mau logout? 🐾')) {
                await signOut(auth);
                window.location.href = "index.html";
            }
        });
    }
}

// --- 3. PAGE SPECIFIC LOGIC (ROUTER) ---
function initPageLogic() {
    const now = () => new Date();
    window.del = async (c,id) => { if(confirm('Hapus data ini?')) await deleteDoc(doc(db,c,id)); };
    
    // Helper GDrive Preview
    const gdrive = (l) => {
        if(!l) return 'https://cataas.com/cat/says/NoImage';
        let m = l.match(/\/d\/([a-zA-Z0-9_-]{10,})/); if(m) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
        m = l.match(/open\?id=([a-zA-Z0-9_-]{10,})/); if(m) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
        return l;
    };

    // -> DASHBOARD
    if (currentPage === "dashboard.html") {
        (async () => {
            const cards = $('#dashboard-cards');
            if(!cards) return;
            
            // Ambil data (Bisa dioptimalkan dengan count() aggregation di masa depan)
            const p = await getDocs(collection(db,'products'));
            const e = await getDocs(collection(db,'expenses'));
            const i = await getDocs(collection(db,'incomes'));
            
            cards.innerHTML = '';
            const card = (t,v) => cards.innerHTML += `<div class="card"><h4>${t}</h4><strong>${v}</strong></div>`;
            card('Total Produk', p.size);
            card('Total Pengeluaran', `Rp ${e.docs.reduce((a,b)=>a+(b.data().amount||0),0).toLocaleString()}`);
            card('Total Pemasukan', `Rp ${i.docs.reduce((a,b)=>a+(b.data().amount||0),0).toLocaleString()}`);
        })();
    }

    // -> PRODUCTS
    if (currentPage === "products.html") {
        const modal = $('#modalProduct');
        if($('#btnAddProduct')) $('#btnAddProduct').onclick = () => { $('#productForm').reset(); modal.classList.remove('hidden'); };
        if($('#productCancel')) $('#productCancel').onclick = () => modal.classList.add('hidden');
        
        if($('#productForm')) $('#productForm').onsubmit = async (e) => {
            e.preventDefault(); const fd = new FormData(e.target);
            const d = Object.fromEntries(fd.entries());
            d.price = Number(d.price); d.hpp = Number(d.hpp); d.updated_at = now();
            // Split string to array
            d.sizes = d.sizes ? d.sizes.split(',').map(x=>x.trim()) : [];
            d.colors = d.colors ? d.colors.split(',').map(x=>x.trim()) : [];
            
            await addDoc(collection(db,'products'), d);
            modal.classList.add('hidden');
        };

        // Realtime Listener
        onSnapshot(collection(db,'products'), s => {
            const list = $('#productsList');
            list.innerHTML = '';
            s.forEach(d => {
                const p = d.data();
                list.innerHTML += `
                <div class="bg-category">
                    <div style="display:flex; gap:15px; align-items:center;">
                        <img src="${gdrive(p.photo_link)}" style="width:60px;height:60px;border-radius:10px;object-fit:cover;">
                        <div>
                            <strong>${p.name}</strong> (${p.code||'-'})<br>
                            <small>Rp ${Number(p.price).toLocaleString()}</small>
                        </div>
                    </div>
                    <button class="btn-danger" onclick="del('products','${d.id}')">Hapus</button>
                </div>`;
            });
        });
    }

    // -> FINANCE
    if (currentPage === "finance.html") {
        const modal = $('#financeModal');
        $('#btnAddExpense').onclick = () => { $('#financeForm').reset(); $('#financeForm').type.value='expense'; modal.classList.remove('hidden'); };
        $('#btnAddIncome').onclick = () => { $('#financeForm').reset(); $('#financeForm').type.value='income'; modal.classList.remove('hidden'); };
        $('#financeCancel').onclick = () => modal.classList.add('hidden');
        
        $('#financeForm').onsubmit = async (e) => {
            e.preventDefault(); const fd = new FormData(e.target);
            await addDoc(collection(db, fd.get('type')==='expense'?'expenses':'incomes'), {
                amount: Number(fd.get('amount')), date: fd.get('date'), note: fd.get('note'), created_at: now()
            });
            modal.classList.add('hidden');
        };

        const renderFin = (col, title) => onSnapshot(collection(db, col), s => {
            const list = $('#financeList');
            // Append header logic (simplified for demo)
            // Idealnya pisah div untuk expense dan income
            list.innerHTML += `<h4>${title}</h4>`;
            s.forEach(d => list.innerHTML += `<div class="item-row">Rp ${Number(d.data().amount).toLocaleString()} - ${d.data().note}</div>`);
        });
        
        $('#financeList').innerHTML = '';
        renderFin('expenses', 'Pengeluaran');
        // renderFin('incomes', 'Pemasukan'); // Uncomment jika ingin render pemasukan juga
    }

    // -> STOCK
    if (currentPage === "stock.html") {
        // Isi dropdown
        getDocs(collection(db,'products')).then(s => {
            const sel = $('#stockProductSelect');
            sel.innerHTML = '<option value="">Pilih Produk</option>';
            s.forEach(d => sel.innerHTML += `<option value="${d.id}">${d.data().name}</option>`);
        });

        $('#stockApply').onclick = async () => {
            const pid=$('#stockProductSelect').value, size=$('#stockSize').value, delta=$('#stockDelta').value;
            if(pid && size && delta) { 
                await addDoc(collection(db,'stock_logs'), {product_id:pid, size, delta: Number(delta), note: $('#stockNote').value, created_at:now()}); 
                alert('Stok berhasil dicatat!'); 
                $('#stockSize').value = ''; $('#stockDelta').value = '';
            } else {
                alert('Lengkapi data dulu meow!');
            }
        };

        // Load Logs
        onSnapshot(query(collection(db,'stock_logs'), orderBy('created_at', 'desc')), s => {
             const log = $('#stockLog');
             log.innerHTML = '';
             s.forEach(d => {
                 const v = d.data();
                 log.innerHTML += `<div class="item-row">Updated: ${v.delta} Pcs (${v.size}) <br><small>${v.note||'-'}</small></div>`;
             });
        });
    }

    // -> GENERIC LISTS (Supplier, Collections, HPP, Categories)
    const simpleList = (col, elId) => {
        if($(elId)) onSnapshot(collection(db,col), s => {
            $(elId).innerHTML='';
            s.forEach(d => $(elId).innerHTML += `<div class="bg-category">${d.data().name} <button onclick="del('${col}','${d.id}')">X</button></div>`);
        });
    };

    if(currentPage === "suppliers.html") {
        simpleList('suppliers','#suppliersList'); 
        $('#btnAddSupplier').onclick=async()=>{const n=prompt('Nama Supplier:');if(n)await addDoc(collection(db,'suppliers'),{name:n});}; 
    }
    if(currentPage === "collections.html") {
        simpleList('collections','#collectionsList'); 
        $('#btnAddCollection').onclick=async()=>{const n=prompt('Nama Koleksi:');if(n)await addDoc(collection(db,'collections'),{name:n});}; 
    }
// -> BRAND GUIDELINES (CUSTOM DATA)
    if (currentPage === "brand-guidelines.html") {
        let activeCategoryId = null; // Menyimpan ID kategori yang sedang diedit

        // --- 1. SETUP MODAL KATEGORI (GRUP BARU) ---
        const modalCat = $('#modalCategory');
        
        // Buka modal
        if($('#btnAddCategory')) {
            $('#btnAddCategory').onclick = () => { 
                $('#categoryForm').reset(); 
                modalCat.classList.remove('hidden'); 
            };
        }
        
        // Tutup modal
        if($('#categoryCancel')) $('#categoryCancel').onclick = () => modalCat.classList.add('hidden');
        
        // Simpan Grup Baru ke Firebase
        if($('#categoryForm')) {
            $('#categoryForm').onsubmit = async (e) => {
                e.preventDefault();
                const name = e.target.name.value.trim();
                if(name) {
                    try {
                        await addDoc(collection(db, 'brand_guideline_categories'), { 
                            name: name, 
                            created_at: now() 
                        });
                        modalCat.classList.add('hidden');
                    } catch (err) {
                        console.error("Gagal simpan grup:", err);
                        alert("Gagal menyimpan grup.");
                    }
                }
            };
        }

        // --- 2. SETUP MODAL ITEM (LINK BARU) ---
        const modalItem = $('#modalBGItem');
        if($('#bgItemCancel')) $('#bgItemCancel').onclick = () => modalItem.classList.add('hidden');

        // Simpan Item Link ke Sub-Collection Firebase
        if($('#bgItemForm')) {
            $('#bgItemForm').onsubmit = async (e) => {
                e.preventDefault();
                if (!activeCategoryId) return; // Pastikan ada grup yg dipilih

                const fd = new FormData(e.target);
                const itemData = {
                    name: fd.get('name'),
                    link: fd.get('link'),
                    note: fd.get('note'),
                    created_at: now()
                };

                try {
                    // Simpan ke path: brand_guideline_categories -> {grupID} -> items
                    await addDoc(collection(db, 'brand_guideline_categories', activeCategoryId, 'items'), itemData);
                    modalItem.classList.add('hidden');
                } catch (err) {
                    console.error("Gagal simpan item:", err);
                    alert("Gagal menyimpan link.");
                }
            };
        }

        // --- 3. RENDER DATA (NESTED LISTENER) ---
        // Dengarkan perubahan data Grup secara realtime
        const q = query(collection(db, 'brand_guideline_categories'), orderBy('created_at', 'desc'));
        
        onSnapshot(q, (snapshot) => {
            const container = $('#bgCategories');
            if(!container) return;
            
            container.innerHTML = ''; // Reset tampilan

            if(snapshot.empty) {
                container.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">Belum ada grup data. Klik tombol di atas untuk buat baru.</div>';
                return;
            }

            snapshot.forEach(docSnap => {
                const catData = docSnap.data();
                const catId = docSnap.id;

                // Buat Kartu Grup
                const card = document.createElement('div');
                card.className = 'card';
                card.style.marginBottom = '20px';
                
                // Header Kartu (Judul Grup & Tombol Hapus Grup)
                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #fefae0; padding-bottom:15px; margin-bottom:15px;">
                        <h3 style="margin:0; color:var(--primary); font-size:1.2rem;">📂 ${catData.name}</h3>
                        <div style="display:flex; gap:10px;">
                            <button class="btn-primary btn-add-item" style="font-size:0.8rem; padding:6px 12px;">+ Link</button>
                            <button class="btn-danger btn-del-cat" style="font-size:0.8rem; padding:6px 12px;">Hapus Grup</button>
                        </div>
                    </div>
                    <div id="items-${catId}" style="display:flex; flex-direction:column; gap:10px;">
                        <small style="color:#aaa;">Memuat link...</small>
                    </div>
                `;
                container.appendChild(card);

                // --- Event Listener Tombol di dalam Kartu ---
                
                // 1. Tombol Tambah Link
                card.querySelector('.btn-add-item').onclick = () => {
                    activeCategoryId = catId; // Set target grup yg mau diisi
                    $('#bgItemForm').reset();
                    modalItem.classList.remove('hidden');
                };

                // 2. Tombol Hapus Grup (Hati-hati!)
                card.querySelector('.btn-del-cat').onclick = async () => {
                    if(confirm(`Hapus grup "${catData.name}" beserta semua link di dalamnya?`)) {
                        // Hapus dokumen grup (sub-collection 'items' harus dihapus manual atau dibiarkan jadi orphan di Firestore)
                        // Untuk aplikasi sederhana, hapus parent doc sudah cukup menghilangkan akses UI.
                        await deleteDoc(doc(db, 'brand_guideline_categories', catId));
                    }
                };

                // --- FETCH SUB-ITEMS (Isi Link di dalam Grup) ---
                const itemsQuery = query(collection(db, 'brand_guideline_categories', catId, 'items'), orderBy('created_at', 'desc'));
                
                onSnapshot(itemsQuery, (itemSnap) => {
                    const itemContainer = document.getElementById(`items-${catId}`);
                    if(!itemContainer) return;
                    
                    itemContainer.innerHTML = ''; // Bersihkan loading/isi lama
                    
                    if (itemSnap.empty) {
                        itemContainer.innerHTML = '<small style="color:#ccc; font-style:italic;">Belum ada link tersimpan.</small>';
                        return;
                    }

                    itemSnap.forEach(itemDoc => {
                        const item = itemDoc.data();
                        const itemId = itemDoc.id;
                        
                        const itemEl = document.createElement('div');
                        itemEl.className = 'bg-category'; // Pakai style list kotak putih
                        itemEl.style.padding = '12px 15px';
                        
                        // Tampilan Item Link
                        itemEl.innerHTML = `
                            <div style="flex:1;">
                                <a href="${item.link}" target="_blank" style="font-weight:bold; color:var(--text-main); text-decoration:none; display:flex; align-items:center; gap:8px; font-size:1rem;">
                                    🔗 ${item.name} 
                                    <span style="font-size:0.7rem; color:#d4a373;">↗</span>
                                </a>
                                ${item.note ? `<div style="color:#888; font-size:0.85rem; margin-top:4px;">📝 ${item.note}</div>` : ''}
                            </div>
                            <button class="btn-danger btn-del-item" style="padding:5px 10px; font-size:0.7rem; margin-left:10px;">X</button>
                        `;
                        itemContainer.appendChild(itemEl);

                        // Hapus Item Link Spesifik
                        itemEl.querySelector('.btn-del-item').onclick = async () => {
                            if(confirm(`Hapus link "${item.name}"?`)) {
                                await deleteDoc(doc(db, 'brand_guideline_categories', catId, 'items', itemId));
                            }
                        };
                    });
                }); // End Snapshot Items
            }); // End Loop Docs
        }); // End Snapshot Categories
    }
    if(currentPage === "hpp.html") {
        onSnapshot(collection(db,'products'), s => {
             $('#hppList').innerHTML = '';
             s.forEach(d => $('#hppList').innerHTML += `<div class="bg-category"><strong>${d.data().name}</strong><div>HPP: Rp ${Number(d.data().hpp).toLocaleString()}</div></div>`);
        });
    }
}

// --- 4. LOGIKA LOGIN (Khusus index.html) ---
if(currentPage === "index.html") {
    const loginForm = $('#loginForm');
    if(loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = $('#loginEmail').value.trim();
            const pass = $('#loginPass').value.trim();
            const err = $('#loginError');
            
            err.style.display='block'; err.textContent="Sabar ya meow...";
            
            try { 
                await signInWithEmailAndPassword(auth, email, pass); 
                // Redirect di-handle oleh onAuthStateChanged
            } catch (error) {
                if(error.code==='auth/user-not-found'||error.code==='auth/invalid-credential') {
                    // Auto Register jika belum ada
                    try { 
                        await createUserWithEmailAndPassword(auth, email, pass); 
                        location.reload(); 
                    } catch(re){ err.textContent="Gagal Register: " + re.message; }
                } else { 
                    err.textContent="Password Salah / Gagal Login"; 
                }
            }
        });
    }
}