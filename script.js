document.addEventListener('DOMContentLoaded', () => {
    // Inicializar Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    const auth = firebase.auth();
    const itemsRef = database.ref('items');
    const versionRef = database.ref('config/versionHash');

    // --- Elementos del DOM ---
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userDisplay = document.getElementById('user-display');
    const form = document.getElementById('add-item-form');
    const itemList = document.getElementById('item-list');
    const toggleFormBtn = document.getElementById('toggle-form-btn');
    const addItemCard = document.getElementById('add-item-card');
    const searchInput = document.getElementById('search-input');
    const supermarketSelect = document.getElementById('supermercado');
    const supermarketButtons = document.querySelectorAll('.supermarket-btn');
    const closeFormBtn = document.getElementById('close-form-btn');
    const productInput = document.getElementById('producto');
    const unitSelect = document.getElementById('unidad');
    const addButton = form.querySelector('button[type="submit"]');
    const commitHashDisplay = document.getElementById('commit-hash-display');
    const mainContent = document.getElementById('main-content');

    // --- Variables de estado ---
    let allItems = [];
    let productoSeleccionadoParaClonar = null;
    let productUnits = {};
    const ITEMS_PER_PAGE = 30;
    let currentPage = 1;
    let isLoading = false;
    let sortedAndFilteredItems = [];
    let currentSortColumn = 'fecha';
    let currentSortDirection = 'desc';

    // --- Lógica de Autenticación ---
    const signInWithGoogle = () => {
        sessionStorage.setItem('authInProgress', 'true');
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithRedirect(provider);
    };

    const signOut = () => {
        auth.signOut().catch(error => console.error("Error en el logout:", error));
    };

    loginBtn.addEventListener('click', signInWithGoogle);
    logoutBtn.addEventListener('click', signOut);

    // Comprobar redirección de login
    if (sessionStorage.getItem('authInProgress')) {
        sessionStorage.removeItem('authInProgress');
        auth.getRedirectResult()
            .then(result => {
                if (result.user) {
                    console.log("Login exitoso por redirección para el usuario:", result.user.displayName);
                }
            })
            .catch(error => {
                console.error("Error durante la redirección de login:", error);
            });
    }

    // Listener principal de estado de autenticación
    auth.onAuthStateChanged(user => {
        if (user) {
            // Usuario autenticado
            console.log("Usuario autenticado. UID:", user.uid);
            uiSetupForAuthenticatedUser(user);
            startDataListeners();
        } else {
            // Usuario no autenticado
            console.log("Usuario no autenticado.");
            uiSetupForAnonymousUser();
            stopDataListeners();
        }
    });

    // --- Funciones para manejar los listeners de Firebase ---
    const startDataListeners = () => {
        console.log("Iniciando listeners de la base de datos...");
        // Listener para los productos
        itemsRef.on('value', handleDataSnapshot, handleDataError);
        // Listener para la versión
        versionRef.on('value', handleVersionSnapshot, handleDataError);
    };

    const stopDataListeners = () => {
        console.log("Deteniendo listeners de la base de datos...");
        itemsRef.off('value');
        versionRef.off('value');
    };

    // --- Handlers para los snapshots de Firebase ---
    const handleDataSnapshot = (snapshot) => {
        const data = snapshot.val();
        allItems = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
        
        // Calcular precio medio y guardar unidades de producto
        const productHistory = {};
        allItems.forEach(item => {
            if (!productHistory[item.producto]) {
                productHistory[item.producto] = { prices: [], dates: [] };
            }
            const pricePerUnit = item.precioPorUnidad;
            if (pricePerUnit !== null) {
                productHistory[item.producto].prices.push(pricePerUnit);
            }
            productHistory[item.producto].dates.push(new Date(item.fecha));
            if (!productUnits[item.producto]) {
                productUnits[item.producto] = item.unidad;
            }
        });

        allItems.forEach(item => {
            const history = productHistory[item.producto];
            if (history && history.prices.length > 1) {
                const sum = history.prices.reduce((a, b) => a + b, 0);
                item.precioMedio = sum / history.prices.length;
            } else {
                item.precioMedio = null;
            }
        });

        updateAndRender();
    };

    const handleVersionSnapshot = (snapshot) => {
        const commitHash = snapshot.val();
        if (commitHash && commitHashDisplay) {
            commitHashDisplay.textContent = `v: ${commitHash}`;
            const stylesheet = document.getElementById('main-stylesheet');
            if (stylesheet) {
                stylesheet.href = `style.css?v=${commitHash}`;
            }
        }
    };

    const handleDataError = (error) => {
        console.error("Error al leer de Firebase:", error);
        // Opcional: mostrar un mensaje de error en la UI
        itemList.innerHTML = '<tr><td colspan="4" class="text-center p-3 text-danger">Error al cargar los datos. Es posible que no tengas permiso.</td></tr>';
    };


    // --- Funciones de UI ---
    const uiSetupForAuthenticatedUser = (user) => {
        mainContent.style.display = 'block'; // Mostrar contenido principal
        userDisplay.textContent = `Hola, ${user.displayName.split(' ')[0]}`;
        userDisplay.classList.remove('d-none');
        loginBtn.classList.add('d-none');
        logoutBtn.classList.remove('d-none');
        toggleFormBtn.style.display = 'flex';
    };

    const uiSetupForAnonymousUser = () => {
        mainContent.style.display = 'none'; // Ocultar contenido principal
        userDisplay.classList.add('d-none');
        loginBtn.classList.remove('d-none');
        logoutBtn.classList.add('d-none');
        toggleFormBtn.style.display = 'none';
        addItemCard.style.display = 'none';
        
        // Limpiar estado
        allItems = [];
        productUnits = {};
        updateAndRender(); // Limpiará la tabla y mostrará "No hay productos"
    };


    // El resto de funciones (formatDisplayDate, parsePrice, etc.) permanecen igual
    // ... (se omite por brevedad, ya que no cambian)
    // Función para formatear la fecha para mostrar
    const formatDisplayDate = (isoDateString) => {
        if (!isoDateString) return '';
        const date = new Date(isoDateString);
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'numeric', day: 'numeric' });
    };

    // Función para parsear el precio de string a número
    const parsePrice = (priceString) => {
        if (!priceString) return null;
        const cleanedPrice = String(priceString).replace(',', '.').replace('€', '').trim();
        const parsed = parseFloat(cleanedPrice);
        return isNaN(parsed) ? null : parsed;
    };
    
    const formatPrice = (price) => {
        if (price === null || isNaN(price)) return '-';
        return price.toFixed(1).replace('.', ',');
    };

    const formatPriceTwoDecimals = (price) => {
        if (price === null || isNaN(price)) return '-';
        return price.toFixed(2).replace('.', ',');
    };

    const calculatePricePerUnit = (price, quantity, unit) => {
        if (price === null || quantity === null || quantity === 0) {
            return { value: null, unit: null };
        }
        let pricePerUnit = null;
        let unitPerUnit = null;
        const lowerCaseUnit = unit ? unit.toLowerCase() : '';
        if (lowerCaseUnit === 'ml') {
            pricePerUnit = price / (quantity / 1000);
            unitPerUnit = '€/l';
        } else if (lowerCaseUnit === 'g') {
            pricePerUnit = price / (quantity / 1000);
            unitPerUnit = '€/kg';
        } else if (lowerCaseUnit === 'l' || lowerCaseUnit === 'kg') {
            pricePerUnit = price / quantity;
            unitPerUnit = `€/${lowerCaseUnit}`;
        } else {
            pricePerUnit = price / quantity;
            unitPerUnit = '€/ud';
        }
        return { value: pricePerUnit ? parseFloat(pricePerUnit.toFixed(2)) : null, unit: unitPerUnit };
    };

    const supermarketColorClasses = {
        'Mercadona': 'color-mercadona',
        'Hiperdino': 'color-hiperdino',
        'Alcampo': 'color-alcampo',
        'Lidl': 'color-lidl',
        'Spar': 'color-spar',
        'Primor': 'color-primor',
        'Druni': 'color-druni',
    };

    const appendItems = (itemsToAppend) => {
        itemsToAppend.forEach(item => {
            const row = document.createElement('tr');
            row.dataset.itemId = item.id;
            row.className = 'product-row';
            const cleanUnit = (item.unidadPrecioPorUnidad || '').replace('€/', '');
            row.innerHTML = `
                <td><div class="product-row-color-indicator ${supermarketColorClasses[item.supermercado] || ''}"></div><span class="product-name">${item.producto}</span></td>
                <td class="text-end">${formatPriceTwoDecimals(parsePrice(item.precio))}</td>
                <td class="text-end price-per-unit">${formatPrice(item.precioPorUnidad)} ${cleanUnit}</td>
                <td class="text-end">${formatPrice(item.precioMedio)} ${cleanUnit}</td>
            `;
            itemList.appendChild(row);

            let startX = 0, currentX = 0, isSwiping = false, initialTouchRightZone = false, initialTouchLeftZone = false;
            const BORDER_ZONE_PERCENTAGE = 0.12, SWIPE_THRESHOLD = 50, DELETE_THRESHOLD = -150, EDIT_THRESHOLD = 150;

            row.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                const rowWidth = row.offsetWidth;
                const rowRect = row.getBoundingClientRect();
                const relativeTouchX = startX - rowRect.left;
                initialTouchRightZone = relativeTouchX > rowWidth * (1 - BORDER_ZONE_PERCENTAGE);
                initialTouchLeftZone = relativeTouchX < rowWidth * BORDER_ZONE_PERCENTAGE;
                isSwiping = false;
                row.style.transition = 'none';
            });

            row.addEventListener('touchmove', (e) => {
                if (!initialTouchRightZone && !initialTouchLeftZone) return;
                currentX = e.touches[0].clientX;
                const deltaX = currentX - startX;
                if (initialTouchRightZone && deltaX < 0 && Math.abs(deltaX) > SWIPE_THRESHOLD) {
                    isSwiping = true;
                    e.preventDefault();
                    row.style.transform = `translateX(${Math.max(-150, deltaX)}px)`;
                } else if (initialTouchLeftZone && deltaX > 0 && Math.abs(deltaX) > SWIPE_THRESHOLD) {
                    isSwiping = true;
                    e.preventDefault();
                    row.style.transform = `translateX(${Math.min(150, deltaX)}px)`;
                } else {
                    isSwiping = false;
                    row.style.transform = 'translateX(0px)';
                }
            });

            row.addEventListener('touchend', () => {
                row.style.transition = 'transform 0.3s ease-out';
                const deltaX = currentX - startX;
                if (isSwiping) {
                    if (initialTouchRightZone && deltaX < DELETE_THRESHOLD) {
                        itemIdToDelete = item.id;
                        itemToDeleteData = item;
                        deleteProductName.textContent = itemToDeleteData.producto;
                        deleteProductDate.textContent = formatDisplayDate(itemToDeleteData.fecha);
                        Object.values(supermarketColorClasses).forEach(cls => deleteProductColorIndicator.classList.remove(cls));
                        deleteProductColorIndicator.classList.add(supermarketColorClasses[itemToDeleteData.supermercado] || '');
                        deleteConfirmModal.show();
                        row.style.transform = 'translateX(0px)';
                    } else if (initialTouchLeftZone && deltaX > EDIT_THRESHOLD) {
                        populateFormForEdit(item.id);
                        row.style.transform = 'translateX(0px)';
                    } else {
                        row.style.transform = 'translateX(0px)';
                    }
                } else {
                    row.style.transform = 'translateX(0px)';
                }
                startX = 0; currentX = 0; isSwiping = false; initialTouchRightZone = false; initialTouchLeftZone = false;
            });
        });
    };

    const loadMoreItems = () => {
        if (isLoading) return;
        isLoading = true;
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const itemsToLoad = sortedAndFilteredItems.slice(startIndex, endIndex);
        if (currentPage === 1 && itemsToLoad.length === 0) {
            const message = auth.currentUser ? "No hay productos en la lista." : "Por favor, inicia sesión para ver los productos.";
            itemList.innerHTML = `<tr><td colspan="4" class="text-center p-3">${message}</td></tr>`;
        } else {
            appendItems(itemsToLoad);
        }
        currentPage++;
        isLoading = endIndex >= sortedAndFilteredItems.length;
    };

    const listContainer = document.getElementById('product-list-container');
    listContainer.addEventListener('scroll', () => {
        if (listContainer.scrollTop + listContainer.clientHeight >= listContainer.scrollHeight - 200) {
            loadMoreItems();
        }
    });

    const editItemModal = new bootstrap.Modal(document.getElementById('edit-item-modal'));
    const populateFormForEdit = (itemId) => {
        const itemToEdit = allItems.find(item => item.id === itemId);
        if (!itemToEdit) return;
        document.getElementById('edit-modal-item-id').value = itemId;
        document.getElementById('edit-producto').value = itemToEdit.producto;
        document.getElementById('edit-precio').value = parsePrice(itemToEdit.precio);
        document.getElementById('edit-cantidad').value = itemToEdit.cantidad;
        document.getElementById('edit-unidad').value = itemToEdit.unidad;
        document.getElementById('edit-supermercado').value = itemToEdit.supermercado;
        document.getElementById('edit-fecha').value = new Date(itemToEdit.fecha).toISOString().split('T')[0];
        editItemModal.show();
    };

    document.getElementById('save-edit-btn').addEventListener('click', () => {
        const itemId = document.getElementById('edit-modal-item-id').value;
        if (!itemId) return;
        const rawPrice = document.getElementById('edit-precio').value;
        const parsedPrice = parsePrice(rawPrice);
        const quantity = parseFloat(document.getElementById('edit-cantidad').value);
        const unit = document.getElementById('edit-unidad').value;
        const fecha = new Date(document.getElementById('edit-fecha').value).toISOString();
        const { value: pricePerUnitValue, unit: pricePerUnitUnit } = calculatePricePerUnit(parsedPrice, quantity, unit);
        const updatedData = {
            producto: document.getElementById('edit-producto').value,
            supermercado: document.getElementById('edit-supermercado').value,
            precio: rawPrice,
            cantidad: quantity,
            unidad: unit,
            fecha: fecha,
            precioPorUnidad: pricePerUnitValue,
            unidadPrecioPorUnidad: pricePerUnitUnit
        };
        itemsRef.child(itemId).update(updatedData);
        editItemModal.hide();
    });

    const deleteConfirmModal = new bootstrap.Modal(document.getElementById('delete-confirm-modal'));
    let itemIdToDelete = null, itemToDeleteData = null;
    const deleteProductName = document.getElementById('delete-product-name');
    const deleteProductDate = document.getElementById('delete-product-date');
    const deleteProductColorIndicator = document.getElementById('delete-product-color-indicator');

    const deleteItem = (itemId) => {
        if (!itemId) return;
        itemsRef.child(itemId).remove().catch(error => console.error("Error al eliminar el item:", error));
    };

    document.getElementById('confirm-delete-btn').addEventListener('click', () => {
        if (itemIdToDelete) {
            const rowToDelete = document.querySelector(`[data-item-id="${itemIdToDelete}"]`);
            if (rowToDelete) {
                rowToDelete.style.transform = `translateX(-${rowToDelete.offsetWidth}px)`;
                rowToDelete.style.opacity = '0';
                setTimeout(() => {
                    deleteItem(itemIdToDelete);
                    itemIdToDelete = null;
                    itemToDeleteData = null;
                }, 300);
            } else {
                deleteItem(itemIdToDelete);
                itemIdToDelete = null;
                itemToDeleteData = null;
            }
        }
        deleteConfirmModal.hide();
    });

    productInput.addEventListener('input', () => {
        const selectedProduct = productInput.value;
        if (productUnits[selectedProduct]) {
            unitSelect.value = productUnits[selectedProduct];
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const rawPrice = document.getElementById('precio').value;
        const parsedPrice = parsePrice(rawPrice);
        const quantity = parseFloat(document.getElementById('cantidad').value);
        const unit = unitSelect.value;
        const { value: pricePerUnitValue, unit: pricePerUnitUnit } = calculatePricePerUnit(parsedPrice, quantity, unit);
        const newItem = {
            producto: productInput.value,
            supermercado: supermarketSelect.value,
            precio: rawPrice,
            cantidad: quantity,
            unidad: unit,
            fecha: new Date().toISOString(),
            precioPorUnidad: pricePerUnitValue,
            unidadPrecioPorUnidad: pricePerUnitUnit
        };
        itemsRef.push(newItem);
        form.reset();
        unitSelect.value = 'ud';
        validateForm();
        addItemCard.style.display = 'none';
        toggleFormBtn.style.display = 'flex';
        supermarketButtons.forEach(btn => btn.classList.remove('selected'));
    });

    toggleFormBtn.addEventListener('click', () => {
        if (productoSeleccionadoParaClonar) {
            productInput.value = productoSeleccionadoParaClonar.producto;
            document.getElementById('precio').value = parsePrice(productoSeleccionadoParaClonar.precio);
            document.getElementById('cantidad').value = productoSeleccionadoParaClonar.cantidad;
            unitSelect.value = productoSeleccionadoParaClonar.unidad;
            supermarketSelect.value = productoSeleccionadoParaClonar.supermercado;
            supermarketButtons.forEach(btn => {
                btn.classList.toggle('selected', btn.dataset.supermercado === productoSeleccionadoParaClonar.supermercado);
            });
        }
        addItemCard.style.display = 'block';
        toggleFormBtn.style.display = 'none';
        validateForm();
    });

    closeFormBtn.addEventListener('click', () => {
        form.reset();
        unitSelect.value = 'ud';
        validateForm();
        addItemCard.style.display = 'none';
        toggleFormBtn.style.display = 'flex';
        productoSeleccionadoParaClonar = null;
        supermarketButtons.forEach(btn => btn.classList.remove('selected'));
    });

    searchInput.addEventListener('input', () => updateAndRender());

    supermarketButtons.forEach(button => {
        button.addEventListener('click', () => {
            const selectedSupermarket = button.dataset.supermercado;
            supermarketSelect.value = selectedSupermarket;
            supermarketButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            localStorage.setItem('lastSupermarket', selectedSupermarket);
            validateForm();
            productInput.focus();
        });
    });

    itemList.addEventListener('click', (e) => {
        const target = e.target;
        if (target && target.classList.contains('product-name')) {
            const productRow = target.closest('.product-row');
            const itemId = productRow.dataset.itemId;
            productoSeleccionadoParaClonar = allItems.find(item => item.id === itemId);
            searchInput.value = target.textContent;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });

    const clearSearchBtn = document.getElementById('clear-search-btn');
    searchInput.addEventListener('input', () => {
        clearSearchBtn.style.display = searchInput.value.length > 0 ? 'block' : 'none';
    });
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        productoSeleccionadoParaClonar = null;
        searchInput.dispatchEvent(new Event('input'));
    });

    const updateAndRender = () => {
        const searchTerm = searchInput.value.toLowerCase();
        itemsMostrados = searchTerm
            ? allItems.filter(item =>
                item.producto.toLowerCase().includes(searchTerm) ||
                (item.supermercado && item.supermercado.toLowerCase().includes(searchTerm)))
            : [...allItems];

        sortedAndFilteredItems = [...itemsMostrados].sort((a, b) => {
            let valA = a[currentSortColumn];
            let valB = b[currentSortColumn];
            if (typeof valA === 'string' && !isNaN(parseFloat(valA))) valA = parseFloat(valA);
            if (typeof valB === 'string' && !isNaN(parseFloat(valB))) valB = parseFloat(valB);
            if (valA < valB) return currentSortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return currentSortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        itemList.innerHTML = '';
        currentPage = 1;
        isLoading = false;
        loadMoreItems();
    };

    const headerCells = document.querySelectorAll('.header-cell');
    headerCells.forEach(header => {
        header.addEventListener('click', () => {
            const sortColumn = header.dataset.sort;
            if (sortColumn === currentSortColumn) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortColumn = sortColumn;
                currentSortDirection = 'asc';
            }
            headerCells.forEach(h => h.classList.remove('asc', 'desc'));
            header.classList.add(currentSortDirection);
            updateAndRender();
        });
    });

    const validateForm = () => {
        const isProductValid = productInput.value.trim() !== '';
        const isPriceValid = parseFloat(document.getElementById('precio').value) > 0;
        const isQuantityValid = parseFloat(document.getElementById('cantidad').value) > 0;
        const isUnitValid = unitSelect.value.trim() !== '';
        const isSupermarketSelected = supermarketSelect.value.trim() !== '';
        addButton.disabled = !(isProductValid && isPriceValid && isQuantityValid && isUnitValid && isSupermarketSelected);
    };

    // --- Inicialización ---
    let lastSupermarket = localStorage.getItem('lastSupermarket') || 'Mercadona';
    supermarketSelect.value = lastSupermarket;
    supermarketButtons.forEach(btn => {
        if (btn.dataset.supermercado === lastSupermarket) btn.classList.add('selected');
    });
    
    validateForm();
    // La UI se configurará completamente en el callback de onAuthStateChanged
});