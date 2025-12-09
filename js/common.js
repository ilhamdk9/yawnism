// js/common.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- INIT FIREBASE ---
const app = initializeApp(window.FIREBASE_CONFIG);
export const auth = getAuth(app);
export const db = getFirestore(app);

// --- HELPER FUNCTIONS ---
export const $ = (s) => document.querySelector(s);
export const now = () => new Date();
export const formatRupiah = (num) => "Rp " + Number(num).toLocaleString('id-ID');

// --- SIDEBAR & LOGOUT LOGIC ---
export function initSidebar() {
    const menuBtn = $('#menuBtn');
    const sidebar = $('#sidebar');
    const logoutBtn = $('#logoutBtn');
    const currentPage = window.location.pathname.split("/").pop();

    // Toggle Sidebar Mobile
    if(menuBtn && sidebar){
        menuBtn.onclick = () => sidebar.classList.toggle('open');
        $('#content').onclick = () => sidebar.classList.remove('open');
        
        // Active State
        document.querySelectorAll('#sidebar nav a').forEach(l => {
            if(l.getAttribute('href') === currentPage) l.classList.add('active');
        });
    }

    // Logout
    if(logoutBtn) {
        logoutBtn.onclick = async () => {
            if(confirm('Yakin mau logout? 🐾')) {
                await signOut(auth);
                window.location.href = "index.html";
            }
        };
    }
}

// --- GLOBAL AUTH CHECKER ---
export function checkAuth() {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = "index.html"; // Tendang jika belum login
        } else {
            const uiUser = $('#userInfo');
            if(uiUser) uiUser.textContent = user.email;
            initSidebar(); // Jalankan sidebar setelah login terkonfirmasi
        }
    });
}