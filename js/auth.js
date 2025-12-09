// js/auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const app = initializeApp(window.FIREBASE_CONFIG);
const auth = getAuth(app);

// Cek status, kalau sudah login langsung lempar ke dashboard
onAuthStateChanged(auth, (user) => {
    if (user) window.location.href = "dashboard.html";
});

const loginForm = document.getElementById('loginForm');
if(loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const pass = document.getElementById('loginPass').value.trim();
        const err = document.getElementById('loginError');
        
        err.style.display='block'; err.textContent="Sabar ya meow...";
        
        try { 
            await signInWithEmailAndPassword(auth, email, pass); 
            // Redirect ditangani onAuthStateChanged
        } catch (error) {
            if(error.code==='auth/user-not-found'||error.code==='auth/invalid-credential') {
                try { 
                    await createUserWithEmailAndPassword(auth, email, pass); 
                    window.location.reload(); 
                } catch(re){ err.textContent="Gagal Register: " + re.message; }
            } else { 
                err.textContent="Password Salah / Gagal Login"; 
            }
        }
    });
}