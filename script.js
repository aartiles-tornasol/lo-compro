document.addEventListener('DOMContentLoaded', () => {
    // Inicializar Firebase
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const database = firebase.database();

    // --- Lógica de Autenticación con FirebaseUI ---
    const ui = new firebaseui.auth.AuthUI(auth);
    const appContainer = document.getElementById('app-container');
    const authContainer = document.getElementById('firebaseui-auth-container');
    const userProfileDropdown = document.getElementById('user-profile-dropdown');
    const userEmailDisplay = document.getElementById('user-email-display');
    const logoutBtn = document.getElementById('logout-btn');

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        auth.signOut();
    });

    auth.onAuthStateChanged(user => {
        if (user) {
            // Usuario ha iniciado sesión
            appContainer.style.display = 'block';
            authContainer.style.display = 'none';
            userProfileDropdown.style.display = 'block';
            userEmailDisplay.textContent = user.email;

            // Iniciar la lógica de la aplicación principal solo cuando el usuario está autenticado
            initializeAppLogic(user);
        } else {
            // Usuario no ha iniciado sesión
            appContainer.style.display = 'none';
            authContainer.style.display = 'block';
            userProfileDropdown.style.display = 'none';

            ui.start('#firebaseui-auth-container', {
                signInOptions: [
                    firebase.auth.EmailAuthProvider.PROVIDER_ID
                ],
                signInSuccessUrl: '#', // Para permanecer en la misma página
                callbacks: {
                    signInSuccessWithAuthResult: function(authResult, redirectUrl) {
                        // No es necesario redirigir, onAuthStateChanged se encargará
                        return false;
                    }
                }
            });
        }
    });

    // --- Lógica principal de la aplicación ---
    function initializeAppLogic(user) {
        const itemsRef = database.ref('items');
        const form = document.getElementById('add-item-form');
        const itemList = document.getElementById('item-list');
        const toggleFormBtn = document.getElementById('toggle-form-btn');
        const addItemCard = document.getElementById('add-item-card');
        const searchInput = document.getElementById('search-input');
        const supermarketSelect = document.getElementById('supermercado');
        const supermarketButtons = document.querySelectorAll('.supermarket-btn');
        const closeFormBtn = document.getElementById('close-form-btn');
        const productInput = document.getElementById('producto');
        const productSuggestions = document.getElementById('product-suggestions');
        const unitSelect = document.getElementById('unidad');
        const addButton = form.querySelector('button[type="submit"]');

        // ... (el resto del código de la app se mantiene igual)
    }
});