 import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
        import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

        // TODO: Replace with your actual Firebase project config
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
            authMessage.textContent = msg;
            authMessage.className = `auth-message ${type}`;
        };

        const hideMessage = () => {
            authMessage.className = 'auth-message';
            authMessage.textContent = '';
        };

        const setLoading = (loading) => {
            submitBtn.disabled = loading;
            if (loading) {
                btnText.textContent = 'Authenticating...';
                btnIcon.className = 'fa-solid fa-circle-notch fa-spin';
            } else {
                btnText.textContent = 'Sign In';
                btnIcon.className = 'fa-solid fa-right-to-bracket';
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

        // Firebase Login Handling
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                hideMessage();

                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value;

                setLoading(true);

                try {
                    // Authenticate user with Firebase
                    await signInWithEmailAndPassword(auth, email, password);

                    // Direct instant redirect to index.html
                    window.location.href = 'index.html';

                } catch (error) {
                    let errorMsg = 'Failed to sign in. Please check your credentials.';

                    switch (error.code) {
                        case 'auth/invalid-credential':
                        case 'auth/user-not-found':
                        case 'auth/wrong-password':
                            errorMsg = 'Invalid email or password. Please try again.';
                            break;
                        case 'auth/invalid-email':
                            errorMsg = 'Please enter a valid email address.';
                            break;
                        case 'auth/too-many-requests':
                            errorMsg = 'Access temporarily disabled due to too many failed attempts. Try again later.';
                            break;
                        default:
                            errorMsg = error.message;
                    }

                    showMessage(errorMsg, 'error');
                    setLoading(false);
                }
            });
        }
    