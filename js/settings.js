import { db, $, checkAuth } from "./common.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

checkAuth();

const form = $('#settingsForm');

// Load Settings saat halaman dibuka
(async () => {
    const docSnap = await getDoc(doc(db, 'settings', 'app'));
    if (docSnap.exists()) {
        const data = docSnap.data();
        form.brand_name.value = data.brand_name || '';
        form.logo_link.value = data.logo_link || '';
        form.contact_email.value = data.contact_email || '';
    }
})();

// Simpan Settings
form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    
    try {
        await setDoc(doc(db, 'settings', 'app'), {
            brand_name: fd.get('brand_name'),
            logo_link: fd.get('logo_link'),
            contact_email: fd.get('contact_email')
        }, { merge: true });
        
        alert('Pengaturan berhasil disimpan!');
    } catch (err) {
        console.error(err);
        alert('Gagal menyimpan pengaturan.');
    }
};