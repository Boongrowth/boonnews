// Import Firebase SDK modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyBfoxEnVep0wX5V_KVS-cd8o5sUMvrFY4c",
  authDomain: "primeintelmedia-e2fe3.firebaseapp.com",
  databaseURL: "https://primeintelmedia-e2fe3-default-rtdb.firebaseio.com",
  projectId: "primeintelmedia-e2fe3",
  storageBucket: "primeintelmedia-e2fe3.firebasestorage.app",
  messagingSenderId: "228866357632",
  appId: "1:228866357632:web:72dc9942f1cd41d857a965",
  measurementId: "G-G0HRRV932S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// UI Helpers
const authMessage = document.getElementById('authMessage');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const btnIcon = document.getElementById('btnIcon');

const showMessage = (msg, type = 'error') => {
    if (authMessage) {
        authMessage.textContent = msg;
        authMessage.className = `auth-message ${type}`;
    }
};

const hideMessage = () => {
    if (authMessage) {
        authMessage.className = 'auth-message';
        authMessage.textContent = '';
    }
};

const setLoading = (loading) => {
    if (submitBtn) submitBtn.disabled = loading;
    if (loading) {
        if (btnText) btnText.textContent = 'Creating Account...';
        if (btnIcon) btnIcon.className = 'fa-solid fa-circle-notch fa-spin';
    } else {
        if (btnText) btnText.textContent = 'Create Account';
        if (btnIcon) btnIcon.className = 'fa-solid fa-user-plus';
    }
};

// Sidebar Navigation Handling
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebarClose = document.getElementById('sidebarClose');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');
const sidebarDrawer = document.getElementById('sidebarDrawer');

const openSidebar = () => {
    sidebarDrawer.classList.add('active');
    sidebarBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
};

const closeSidebar = () => {
    sidebarDrawer.classList.remove('active');
    sidebarBackdrop.classList.remove('active');
    document.body.style.overflow = '';
};

if (sidebarToggle) sidebarToggle.addEventListener('click', openSidebar);
if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeSidebar);

// Firebase Sign Up Handling
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessage();

        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Client-side validations
        if (password !== confirmPassword) {
            showMessage('Passwords do not match. Please try again.', 'error');
            return;
        }

        if (password.length < 6) {
            showMessage('Password must be at least 6 characters long.', 'error');
            return;
        }

        setLoading(true);

        try {
            // Create Firebase User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update display name on profile using full name directly
            await updateProfile(user, {
                displayName: fullName
            });

            // Direct instant redirect to index.html
            window.location.href = 'index.html';

        } catch (error) {
            let errorMsg = 'Failed to create account. Please try again.';

            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMsg = 'This email is already registered. Please sign in instead.';
                    break;
                case 'auth/invalid-email':
                    errorMsg = 'Please enter a valid email address.';
                    break;
                case 'auth/weak-password':
                    errorMsg = 'Password is too weak. Choose a stronger password.';
                    break;
                case 'auth/operation-not-allowed':
                    errorMsg = 'Email/Password accounts are not enabled in Firebase Console.';
                    break;
                default:
                    errorMsg = error.message;
            }

            showMessage(errorMsg, 'error');
            setLoading(false);
        }
    });
}
