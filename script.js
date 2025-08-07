document.addEventListener('DOMContentLoaded', () => {
    // Inicializar Firebase
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const database = firebase.database();
    const itemsRef = database.ref('items');

    // Variable para el producto actualmente en edición
    let currentEditingItem = null;

    // Inicializar FirebaseUI
    const ui = new firebaseui.auth.AuthUI(auth);
    const uiConfig = {
        signInOptions: [
            {
                provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
                requireDisplayName: false,
                disableSignUp: {
                    status: true
                }
            }
        ],
        signInFlow: 'popup',
        credentialHelper: firebaseui.auth.CredentialHelper.NONE,
        callbacks: {
            signInSuccessWithAuthResult: function(authResult, redirectUrl) {
                console.log('Login exitoso:', authResult.user.email);
                // Limpiar la UI de autenticación
                const authContainer = document.getElementById('firebaseui-auth-container');
                authContainer.innerHTML = '';
                return false;
            },
            signInFailure: function(error) {
                console.error('=== ERROR DE AUTENTICACIÓN ===');
                console.error('Error completo:', error);
                console.error('Código de error:', error.code);
                console.error('Mensaje de error:', error.message);
                console.error('Email intentado:', error.email || 'No disponible');
                console.error('Credential:', error.credential || 'No disponible');
                
                // Verificar si es un problema de dominio autorizado
                if (error.code === 'auth/unauthorized-domain') {
                    console.error('PROBLEMA: Dominio no autorizado en Firebase Console');
                }
                
                return Promise.resolve();
            }
        }
    };

    // Referencias a elementos de autenticación y contenido
    const authenticatedContent = document.getElementById('authenticated-content');
    const unauthenticatedMessage = document.getElementById('unauthenticated-message');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userEmailItem = document.getElementById('userEmailItem');
    const userEmailDisplay = document.getElementById('userEmailDisplay');
    const logoutBtnItem = document.getElementById('logoutBtnItem');
    const form = document.getElementById('add-item-form');

    // Manejar el estado de autenticación
    auth.onAuthStateChanged((user) => {
        if (user) {
            // Usuario autenticado
            console.log('Usuario logueado:', user.email);
            authenticatedContent.style.display = 'block';
            unauthenticatedMessage.style.display = 'none';
            toggleFormBtn.style.display = 'flex';
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'block';
            // Mostrar email del usuario en el menú
            userEmailDisplay.textContent = user.email;
            userEmailItem.style.display = 'block';
            logoutBtnItem.style.display = 'block';
            // Limpiar el formulario de Firebase
            const authContainer = document.getElementById('firebaseui-auth-container');
            authContainer.innerHTML = '';
            // Cargar los datos cuando el usuario está autenticado
            itemsRef.on('value', loadData);
        } else {
            // Usuario no autenticado
            console.log('Usuario no logueado');
            authenticatedContent.style.display = 'none';
            unauthenticatedMessage.style.display = 'block';
            toggleFormBtn.style.display = 'none';
            loginBtn.style.display = 'block';
            logoutBtn.style.display = 'none';
            // Ocultar email del usuario en el menú
            userEmailItem.style.display = 'none';
            logoutBtnItem.style.display = 'none';
            // Limpiar cualquier formulario de Firebase previo
            const authContainer = document.getElementById('firebaseui-auth-container');
            authContainer.innerHTML = '';
            // Desconectar el listener cuando el usuario no está autenticado
            itemsRef.off('value', loadData);
            // Limpiar los datos
            allItems = [];
            itemList.innerHTML = '';
        }
    });

    // Manejar clic en login
    loginBtn.addEventListener('click', () => {
        console.log('=== INICIANDO FIREBASE UI ===');
        console.log('Dominio actual:', window.location.hostname);
        console.log('URL completa:', window.location.href);
        console.log('FirebaseUI disponible:', typeof firebaseui !== 'undefined');
        console.log('Firebase Auth disponible:', typeof firebase.auth !== 'undefined');
        
        // Limpiar el contenedor antes de iniciar FirebaseUI
        const container = document.getElementById('firebaseui-auth-container');
        container.innerHTML = '';
        
        try {
            ui.start('#firebaseui-auth-container', uiConfig);
            console.log('FirebaseUI iniciado correctamente');
        } catch (error) {
            console.error('Error al iniciar FirebaseUI:', error);
        }
    });

    // Manejar clic en logout
    logoutBtn.addEventListener('click', async () => {
        try {
            await auth.signOut();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            alert('Error al cerrar sesión: ' + error.message);
        }
    });
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

    // Referencias para el popup de información del producto
    const productInfoPopup = document.getElementById('product-info-popup');
    const closeProductInfo = document.getElementById('close-product-info');
    const popupProductName = document.getElementById('popup-product-name');
    const popupQuantity = document.getElementById('popup-quantity');
    const popupUnit = document.getElementById('popup-unit');
    const popupPrice = document.getElementById('popup-price');
    const popupDate = document.getElementById('popup-date');
    const popupSupermarket = document.getElementById('popup-supermarket');
    const popupPricePerUnit = document.getElementById('popup-price-per-unit');
    const popupAveragePrice = document.getElementById('popup-average-price');
    const popupUnitLabel1 = document.getElementById('popup-unit-label-1');
    const popupUnitLabel2 = document.getElementById('popup-unit-label-2');

    // Establecer 'ud' como valor por defecto para la unidad
    unitSelect.value = 'ud';

    // Función para validar el formulario y habilitar/deshabilitar el botón de añadir
    const validateForm = () => {
        const isProductValid = productInput.value.trim() !== '';
        const isPriceValid = parseFloat(document.getElementById('precio').value) > 0;
        const isQuantityValid = parseFloat(document.getElementById('cantidad').value) > 0;
        const isUnitValid = unitSelect.value.trim() !== '';
        const isSupermarketSelected = supermarketSelect.value.trim() !== '';

        if (isProductValid && isPriceValid && isQuantityValid && isUnitValid && isSupermarketSelected) {
            addButton.disabled = false;
        } else {
            addButton.disabled = true;
        }
    };

    // Llamar a la validación al cargar la página
    validateForm();

    // Llamar a la validación en cada cambio de los campos relevantes
    productInput.addEventListener('input', validateForm);
    document.getElementById('precio').addEventListener('input', validateForm);
    document.getElementById('cantidad').addEventListener('input', validateForm);
    // Listener para validar y mover el foco al cambiar la unidad
    unitSelect.addEventListener('change', () => {
        validateForm();
        document.getElementById('cantidad').focus();
    });

    let allItems = []; // Para guardar todos los items y poder filtrar
    let itemsMostrados = []; // Para guardar los items que se están mostrando (filtrados o todos)
    let productoSeleccionadoParaClonar = null; // Para guardar el último producto clicado
    let productUnits = {}; // Para guardar la última unidad usada por producto

    // --- Estado para Scroll Infinito ---
    const ITEMS_PER_PAGE = 30;
    let currentPage = 1;
    let isLoading = false;
    let sortedAndFilteredItems = []; // Array sobre el que se pagina, ya filtrado y ordenado

    // Función para formatear la fecha para mostrar
    const formatDisplayDate = (isoDateString) => {
        if (!isoDateString) return '';
        const date = new Date(isoDateString);
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'numeric', day: 'numeric' });
    };

    // Función para parsear el precio de string a número
    const parsePrice = (priceString) => {
        if (!priceString) return null;
        // Reemplazar coma por punto para el parsing decimal y eliminar el símbolo €
        const cleanedPrice = priceString.replace(',', '.').replace('€', '').trim();
        const parsed = parseFloat(cleanedPrice);
        return isNaN(parsed) ? null : parsed;
    };

    // Función para formatear un número como precio con un decimal y coma
    const formatPrice = (price) => {
        if (price === null || isNaN(price)) return '-';
        return price.toFixed(1).replace('.', ',');
    };

    // Función para formatear un número como precio con dos decimales y coma
    const formatPriceTwoDecimals = (price) => {
        if (price === null || isNaN(price)) return '-';
        return price.toFixed(2).replace('.', ',');
    };

    // Función para mostrar el popup de información del producto
    const showProductInfoPopup = (item) => {
        console.log('📱 Abriendo popup para producto:', item.producto, 'ID:', item.id);
        
        // Establecer el producto actual para las operaciones de imagen
        currentEditingItem = item;
        console.log('✅ currentEditingItem establecido:', currentEditingItem.id);
        // Rellenar el contenido del popup
        popupProductName.textContent = item.producto;
        popupQuantity.textContent = item.cantidad;
        popupUnit.textContent = item.unidad;
        popupPrice.textContent = `${formatPriceTwoDecimals(parsePrice(item.precio))}€`;
        popupDate.textContent = formatDisplayDate(item.fecha);
        popupSupermarket.textContent = item.supermercado;
        
        // Configurar las etiquetas de unidades
        const cleanUnit = (item.unidadPrecioPorUnidad || '').replace('€/', '');
        if (cleanUnit) {
            popupUnitLabel1.textContent = `€/${cleanUnit}`;
            popupUnitLabel2.textContent = `€⊘/${cleanUnit}`;
        } else {
            popupUnitLabel1.textContent = '';
            popupUnitLabel2.textContent = '';
        }
        
        // Rellenar precios por unidad
        if (item.precioPorUnidad) {
            popupPricePerUnit.textContent = formatPrice(item.precioPorUnidad);
        } else {
            popupPricePerUnit.textContent = '';
        }
        
        if (item.precioMedio) {
            popupAveragePrice.textContent = formatPrice(item.precioMedio);
        } else {
            popupAveragePrice.textContent = '';
        }
        
        // Aplicar el color del supermercado como etiqueta
        Object.values(supermarketColorClasses).forEach(cls => popupSupermarket.classList.remove(cls));
        popupSupermarket.classList.add(supermarketColorClasses[item.supermercado] || '');
        
        // Resetear la imagen al estado inicial
        const placeholder = document.getElementById('image-placeholder');
        const selectedImage = document.getElementById('selected-image');
        const carousel = document.getElementById('image-carousel');
        const imageSection = document.getElementById('image-section');
        
        if (placeholder) placeholder.style.display = 'flex';
        if (selectedImage) selectedImage.style.display = 'none';
        if (carousel) carousel.style.display = 'none';
        if (imageSection) imageSection.classList.remove('has-image');
        
        // Cargar imagen existente si la tiene
        loadProductImage(item);
        
        // Mostrar el popup
        productInfoPopup.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevenir scroll del fondo
    };

    // Función para ocultar el popup de información del producto
    const hideProductInfoPopup = () => {
        console.log('🚪 Cerrando popup de información');
        productInfoPopup.style.display = 'none';
        document.body.style.overflow = ''; // Restaurar scroll del fondo
        
        // Limpiar el producto actual
        currentEditingItem = null;
        console.log('🧹 currentEditingItem limpiado');
    };

    // Event listeners para cerrar el popup
    closeProductInfo.addEventListener('click', hideProductInfoPopup);
    
    // Cerrar popup al hacer click en el fondo
    productInfoPopup.addEventListener('click', (e) => {
        if (e.target === productInfoPopup) {
            hideProductInfoPopup();
        }
    });

    // Cerrar popup con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && productInfoPopup.style.display === 'flex') {
            hideProductInfoPopup();
        }
    });

    // Event listeners para búsqueda de imágenes
    const addImageSearchListeners = () => {
        const placeholder = document.getElementById('image-placeholder');
        const selectedImage = document.getElementById('selected-image');
        
        if (placeholder) {
            placeholder.addEventListener('click', () => {
                console.log('Click en placeholder - iniciando búsqueda');
                if (typeof window.searchProductImages === 'function') {
                    window.searchProductImages();
                } else {
                    console.error('Función window.searchProductImages no encontrada');
                }
            });
        }
        
        if (selectedImage) {
            selectedImage.addEventListener('click', () => {
                console.log('Click en imagen seleccionada - iniciando búsqueda');
                if (typeof window.searchProductImages === 'function') {
                    window.searchProductImages();
                } else {
                    console.error('Función window.searchProductImages no encontrada');
                }
            });
        }
    };

    // Llamar la función para agregar los listeners
    // (Se llama al final después de definir todas las funciones)

    // Función para calcular el precio por unidad
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
        } else if (lowerCaseUnit === 'l') {
            pricePerUnit = price / quantity;
            unitPerUnit = '€/l';
        } else if (lowerCaseUnit === 'kg') {
            pricePerUnit = price / quantity;
            unitPerUnit = '€/kg';
        } else if (lowerCaseUnit === 'ud' || lowerCaseUnit === 'uds' || lowerCaseUnit === 'paq' || lowerCaseUnit === 'lata' || lowerCaseUnit === 'caja') {
            pricePerUnit = price / quantity;
            unitPerUnit = '€/ud';
        } else {
            // Para otras unidades no estándar, simplemente dividimos
            pricePerUnit = price / quantity;
            unitPerUnit = `€/${unit || '?'}`;
        }
        // Redondear a 2 decimales para precios
        return { value: pricePerUnit ? parseFloat(pricePerUnit.toFixed(2)) : null, unit: unitPerUnit };
    };

    // Mapeo de supermercados a clases CSS para colores
    const supermarketColorClasses = {
        'Mercadona': 'color-mercadona',
        'Hiperdino': 'color-hiperdino',
        'Alcampo': 'color-alcampo',
        'Lidl': 'color-lidl',
        'Spar': 'color-spar',
        'Primor': 'color-primor',
        'Druni': 'color-druni',
    };

    // --- Lógica de Scroll Infinito ---

    // Función para AÑADIR items a la tabla
    const appendItems = (itemsToAppend) => {
        itemsToAppend.forEach(item => {
            const row = document.createElement('tr');
            row.dataset.itemId = item.id;
            row.className = 'product-row'; // Clase para identificar las filas con gestos

            // Columna 3 y 4: Precio por unidad con la unidad limpia (ej: "13,8 l")
            const cleanUnit = (item.unidadPrecioPorUnidad || '').replace('€/', '');

            row.innerHTML = `
                <td class="product-name-cell">
                    <div class="d-flex align-items-center">
                        <div class="product-row-color-indicator ${supermarketColorClasses[item.supermercado] || ''}"></div>
                        <span class="product-name">${item.producto}</span>
                    </div>
                </td>
                <td class="text-end price-cell">${formatPriceTwoDecimals(parsePrice(item.precio))}</td>
                <td class="text-end price-per-unit price-cell">${formatPrice(item.precioPorUnidad)} ${cleanUnit}</td>
                <td class="text-end price-cell">${formatPrice(item.precioMedio)} ${cleanUnit}</td>
            `;
            itemList.appendChild(row);

            // Hacer toda la celda del nombre clickeable para filtrado
            const nombreCell = row.querySelector('.product-name-cell');
            nombreCell.addEventListener('click', (e) => {
                const itemId = item.id;
                productoSeleccionadoParaClonar = allItems.find(item => item.id === itemId);
                const productName = item.producto;
                searchInput.value = productName;
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            });
            nombreCell.style.cursor = 'pointer';

            // Hacer las columnas de precios clickeables para mostrar info del producto
            const priceCells = row.querySelectorAll('.price-cell');
            priceCells.forEach(priceCell => {
                priceCell.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevenir interferencia con otros eventos
                    showProductInfoPopup(item);
                });
                priceCell.style.cursor = 'pointer';
            });

            // --- Lógica de Click Derecho para Ordenadores ---
            row.addEventListener('contextmenu', (e) => {
                e.preventDefault(); // Prevenir el menú contextual del navegador
                
                // Crear menú contextual
                const contextMenu = document.createElement('div');
                contextMenu.style.cssText = `
                    position: fixed;
                    top: ${e.clientY}px;
                    left: ${e.clientX}px;
                    background: white;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                    z-index: 9999;
                    min-width: 120px;
                `;
                
                contextMenu.innerHTML = `
                    <div style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;" data-action="edit">
                        ✏️ Editar
                    </div>
                    <div style="padding: 8px 12px; cursor: pointer; color: #dc3545;" data-action="delete">
                        🗑️ Borrar
                    </div>
                `;
                
                // Añadir el menú al body
                document.body.appendChild(contextMenu);
                
                // Manejar clicks en el menú
                contextMenu.addEventListener('click', (e) => {
                    const action = e.target.dataset.action;
                    if (action === 'edit') {
                        populateFormForEdit(item.id);
                    } else if (action === 'delete') {
                        itemIdToDelete = item.id;
                        itemToDeleteData = item;
                        
                        // Rellenar el modal con la información del producto
                        deleteProductName.textContent = itemToDeleteData.producto;
                        deleteProductDate.textContent = formatDisplayDate(itemToDeleteData.fecha);
                        // Limpiar clases de color anteriores y añadir la nueva
                        Object.values(supermarketColorClasses).forEach(cls => deleteProductColorIndicator.classList.remove(cls));
                        deleteProductColorIndicator.classList.add(supermarketColorClasses[itemToDeleteData.supermercado] || '');
                        
                        deleteConfirmModal.show();
                    }
                    document.body.removeChild(contextMenu);
                });
                
                // Cerrar menú al hacer click fuera
                setTimeout(() => {
                    const closeMenu = (e) => {
                        if (!contextMenu.contains(e.target)) {
                            document.body.removeChild(contextMenu);
                            document.removeEventListener('click', closeMenu);
                        }
                    };
                    document.addEventListener('click', closeMenu);
                }, 10);
            });

            // --- Lógica de Swipe para Borrar y Editar (Vanilla JS) ---
            let startX = 0;
            let currentX = 0;
            let isSwiping = false;
            let initialTouchRightZone = false;
            let initialTouchLeftZone = false; // Nueva variable para swipe a la izquierda

            const BORDER_ZONE_PERCENTAGE = 0.12; // 12% de la anchura de la fila
            const SWIPE_THRESHOLD = 50; // Píxeles para considerar un swipe
            const DELETE_THRESHOLD = -150; // Píxeles para confirmar el borrado (swipe izquierda)
            const EDIT_THRESHOLD = 150; // Píxeles para confirmar la edición (swipe derecha)

            // Gestión del touchstart para el swipe
            row.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                const rowWidth = row.offsetWidth;
                const rowRect = row.getBoundingClientRect();
                const relativeTouchX = startX - rowRect.left;

                // Determinar si el toque está en la zona derecha o izquierda
                initialTouchRightZone = relativeTouchX > rowWidth * (1 - BORDER_ZONE_PERCENTAGE);
                initialTouchLeftZone = relativeTouchX < rowWidth * BORDER_ZONE_PERCENTAGE; // Detectar zona izquierda

                isSwiping = false; // Resetear estado de swipe
                row.style.transition = 'none'; // Deshabilitar transición durante el arrastre
            });

            row.addEventListener('touchmove', (e) => {
                // Ignorar si no se inició en ninguna zona de swipe válida
                if (!initialTouchRightZone && !initialTouchLeftZone) return;

                currentX = e.touches[0].clientX;
                const deltaX = currentX - startX;

                // Lógica para swipe hacia la izquierda (borrar)
                if (initialTouchRightZone && deltaX < 0 && Math.abs(deltaX) > SWIPE_THRESHOLD) {
                    isSwiping = true;
                    e.preventDefault(); // Prevenir scroll vertical/horizontal del navegador
                    row.style.transform = `translateX(${Math.max(-150, deltaX)}px)`; // Limitar movimiento
                }
                // Lógica para swipe hacia la derecha (editar)
                else if (initialTouchLeftZone && deltaX > 0 && Math.abs(deltaX) > SWIPE_THRESHOLD) {
                    isSwiping = true;
                    e.preventDefault(); // Prevenir scroll vertical/horizontal del navegador
                    row.style.transform = `translateX(${Math.min(150, deltaX)}px)`; // Limitar movimiento
                } else {
                    // Si el movimiento no es un swipe válido en ninguna dirección, o es hacia la dirección opuesta
                    isSwiping = false;
                    row.style.transform = 'translateX(0px)';
                }
            });

            row.addEventListener('touchend', () => {
                row.style.transition = 'transform 0.3s ease-out'; // Habilitar transición para el reseteo

                const deltaX = currentX - startX;

                if (isSwiping) {
                    if (initialTouchRightZone && deltaX < DELETE_THRESHOLD) {
                        itemIdToDelete = item.id; // Guardar el ID del item a borrar
                        itemToDeleteData = item; // Guardar los datos completos del item

                        // Rellenar el modal con la información del producto
                        deleteProductName.textContent = itemToDeleteData.producto;
                        deleteProductDate.textContent = formatDisplayDate(itemToDeleteData.fecha);
                        // Limpiar clases de color anteriores y añadir la nueva
                        Object.values(supermarketColorClasses).forEach(cls => deleteProductColorIndicator.classList.remove(cls));
                        deleteProductColorIndicator.classList.add(supermarketColorClasses[itemToDeleteData.supermercado] || '');

                        deleteConfirmModal.show();
                        row.style.transform = 'translateX(0px)'; // Volver a la posición original inmediatamente
                    } else if (initialTouchLeftZone && deltaX > EDIT_THRESHOLD) {
                        // Editar
                        populateFormForEdit(item.id);
                        row.style.transform = 'translateX(0px)'; // Volver a la posición original
                    } else {
                        // Si no se alcanzó el umbral, volver a la posición original
                        row.style.transform = 'translateX(0px)';
                    }
                } else {
                    // Si no fue un swipe válido, volver a la posición original
                    row.style.transform = 'translateX(0px)';
                }

                // Resetear variables de estado
                startX = 0;
                currentX = 0;
                isSwiping = false;
                initialTouchRightZone = false;
                initialTouchLeftZone = false;
            });
            // --- Fin Lógica de Swipe ---
        });
        
    };

    // Función para cargar la siguiente "página" de items
    const loadMoreItems = () => {
        if (isLoading) return;
        isLoading = true;

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const itemsToLoad = sortedAndFilteredItems.slice(startIndex, endIndex);

        if (currentPage === 1) {
            itemList.innerHTML = ''; // Limpiar la lista
            if (itemsToLoad.length === 0) {
                itemList.innerHTML = '<tr><td colspan="4" class="text-center p-3">No hay productos en la lista.</td></tr>';
            } else {
                appendItems(itemsToLoad);
            }
        } else {
            appendItems(itemsToLoad);
        }
        
        currentPage++;
        
        if (endIndex >= sortedAndFilteredItems.length) {
            isLoading = true; // Bloquear cargas futuras al llegar al final
        } else {
            isLoading = false; // Permitir la siguiente carga
        }
    };

    // Listener para el scroll
    const listContainer = document.getElementById('product-list-container');
    listContainer.addEventListener('scroll', () => {
        // Comprobar si el usuario ha llegado al final del contenedor de la lista
        if (listContainer.scrollTop + listContainer.clientHeight >= listContainer.scrollHeight - 200) {
            loadMoreItems();
        }
    });

    

    

    

    const editItemModal = new bootstrap.Modal(document.getElementById('edit-item-modal'));

    // Función para poblar el formulario para la edición
    const populateFormForEdit = (itemId) => {
        const itemToEdit = allItems.find(item => item.id === itemId);
        if (!itemToEdit) return;
        
        // Establecer el producto actual para la edición
        currentEditingItem = itemToEdit;

        // Rellenar los campos del formulario del modal
        document.getElementById('edit-modal-item-id').value = itemId;
        document.getElementById('edit-producto').value = itemToEdit.producto;
        document.getElementById('edit-precio').value = parsePrice(itemToEdit.precio);
        document.getElementById('edit-cantidad').value = itemToEdit.cantidad;
        document.getElementById('edit-unidad').value = itemToEdit.unidad;
        document.getElementById('edit-supermercado').value = itemToEdit.supermercado;
        // Formatear la fecha para el input type="date" (YYYY-MM-DD)
        document.getElementById('edit-fecha').value = new Date(itemToEdit.fecha).toISOString().split('T')[0];

        // Mostrar el modal
        editItemModal.show();
        
        // Cargar imagen guardada si existe
        loadProductImage(itemToEdit);
    };

    // Listener para el botón de guardar cambios en el modal
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
            fecha: fecha, // Usar la nueva fecha del formulario
            precioPorUnidad: pricePerUnitValue,
            unidadPrecioPorUnidad: pricePerUnitUnit,
            userId: auth.currentUser.uid // Mantener el ID del usuario actual
        };

        itemsRef.child(itemId).update(updatedData);
        
        // Si hay una imagen seleccionada en el popup, guardarla
        const imageElement = document.getElementById('selected-image');
        if (imageElement && imageElement.src && !imageElement.src.includes('placeholder') && !imageElement.src.includes('data:image/svg+xml')) {
            saveProductImage(itemId, imageElement.src);
        }

        editItemModal.hide();
        
        // Limpiar el producto en edición
        currentEditingItem = null;
    });

    const deleteConfirmModal = new bootstrap.Modal(document.getElementById('delete-confirm-modal'));
    let itemIdToDelete = null; // Variable para almacenar el ID del item a borrar
    let itemToDeleteData = null; // Variable para almacenar los datos completos del item a borrar

    // Referencias a los elementos del modal de confirmación
    const deleteProductName = document.getElementById('delete-product-name');
    const deleteProductDate = document.getElementById('delete-product-date');
    const deleteProductColorIndicator = document.getElementById('delete-product-color-indicator');

    // Función para borrar un item de Firebase
    const deleteItem = (itemId) => {
        if (!itemId) return;
        itemsRef.child(itemId).remove()
            .catch((error) => {
                console.error("Error al eliminar el item:", error);
            });
    };

    // Listener para el botón de confirmar eliminación en el modal
    document.getElementById('confirm-delete-btn').addEventListener('click', () => {
        if (itemIdToDelete) {
            // Animación de salida antes de borrar (opcional, si se quiere mantener)
            const rowToDelete = document.querySelector(`[data-item-id="${itemIdToDelete}"]`);
            if (rowToDelete) {
                rowToDelete.style.transform = `translateX(-${rowToDelete.offsetWidth}px)`;
                rowToDelete.style.opacity = '0';
                setTimeout(() => {
                    deleteItem(itemIdToDelete);
                    itemIdToDelete = null; // Resetear la variable
                    itemToDeleteData = null; // Resetear la variable
                }, 300);
            } else {
                deleteItem(itemIdToDelete);
                itemIdToDelete = null; // Resetear la variable
                itemToDeleteData = null; // Resetear la variable
            }
        }
        deleteConfirmModal.hide();
    });

    // Función para cargar y procesar los datos
    const loadData = (snapshot) => {
        const data = snapshot.val();
        // Resetear el array de items
        allItems = [];
        if (data) {
            // Convertir objeto a array y ordenar por fecha para obtener la unidad más reciente
            allItems = Object.keys(data).map(key => ({
                id: key, // Guardar la clave de Firebase como ID
                ...data[key]
            })).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            
            // --- Nuevo cálculo de precios medios ---
            const productPrices = {}; // { "producto-unidad": { total: 0, count: 0 } }
            productUnits = {};
            const productNames = new Set();

            allItems.forEach(item => {
                productNames.add(item.producto);
                // Guardar la unidad solo si no ha sido guardada antes (la primera que encuentra es la más reciente)
                if (item.unidad && !productUnits[item.producto]) {
                    productUnits[item.producto] = item.unidad;
                }

                // Acumular precios por unidad, agrupando por producto Y unidad
                if (item.precioPorUnidad !== null && item.precioPorUnidad > 0) {
                    const groupKey = `${item.producto}-${item.unidadPrecioPorUnidad}`;
                    if (!productPrices[groupKey]) {
                        productPrices[groupKey] = { total: 0, count: 0 };
                    }
                    productPrices[groupKey].total += item.precioPorUnidad;
                    productPrices[groupKey].count++;
                }
            });

            // Añadir el precio medio a cada item
            allItems.forEach(item => {
                const groupKey = `${item.producto}-${item.unidadPrecioPorUnidad}`;
                if (productPrices[groupKey] && productPrices[groupKey].count > 0) {
                    item.precioMedio = parseFloat((productPrices[groupKey].total / productPrices[groupKey].count).toFixed(2));
                } else {
                    item.precioMedio = null;
                }
            });

            // Rellenar datalist
            productSuggestions.innerHTML = '';
            productNames.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                productSuggestions.appendChild(option);
            });
        } else {
            allItems = [];
            productUnits = {};
        }
        // Al cargar, los items mostrados son todos los items
        itemsMostrados = [...allItems];
        // Renderizar los items iniciales (sin filtro)
        sortedAndFilteredItems = [...allItems];
        currentPage = 1;
        isLoading = false;
        sortAndRenderItems(); // Llamar a la función de ordenación para renderizar
    };

    // Lógica de autocompletado de producto y relleno de unidad
    productInput.addEventListener('input', () => {
        const selectedProduct = productInput.value;
        if (productUnits[selectedProduct]) {
            unitSelect.value = productUnits[selectedProduct];
        }
    });

    // Función para añadir un nuevo producto
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const rawPrice = document.getElementById('precio').value;
        const parsedPrice = parsePrice(rawPrice);
        const quantity = parseFloat(document.getElementById('cantidad').value);
        const unit = unitSelect.value; // Usar el valor actual del select

        const { value: pricePerUnitValue, unit: pricePerUnitUnit } = calculatePricePerUnit(parsedPrice, quantity, unit);

        const newItem = {
            producto: productInput.value,
            supermercado: supermarketSelect.value, // Leer del select oculto
            precio: rawPrice, // Guardamos el precio original como string
            cantidad: quantity,
            unidad: unit,
            fecha: new Date().toISOString(), // Fecha en formato ISO
            precioPorUnidad: pricePerUnitValue,
            unidadPrecioPorUnidad: pricePerUnitUnit,
            userId: auth.currentUser.uid // Añadir el ID del usuario actual
        };

        // Guardar el nuevo item en Firebase
        const newItemRef = itemsRef.push(newItem);
        
        // Si hay una imagen seleccionada, guardarla
        const imageElement = document.getElementById('selected-image');
        if (imageElement && imageElement.src && !imageElement.src.includes('placeholder') && !imageElement.src.includes('data:image/svg+xml')) {
            // Usar el ID del nuevo item para guardar la imagen
            const itemId = newItemRef.key;
            // La imagen ya está comprimida y en base64, solo necesitamos guardarla
            saveProductImage(itemId, imageElement.src);
        }

        form.reset(); // Limpiamos el formulario
        
        // Limpiar la imagen seleccionada
        const imageDisplay = document.getElementById('selected-image');
        const imagePlaceholder = document.getElementById('image-placeholder');
        const imageSection = document.getElementById('image-section');
        
        if (imageDisplay) {
            imageDisplay.src = '';
            imageDisplay.style.display = 'none';
        }
        if (imagePlaceholder) {
            imagePlaceholder.style.display = 'block';
        }
        if (imageSection) {
            imageSection.classList.remove('has-image');
        }
        unitSelect.value = 'ud'; // Restablecer la unidad a 'ud'
        validateForm(); // Validar el formulario después de resetear
        addItemCard.style.display = 'none'; // Ocultar el formulario después de añadir
        toggleFormBtn.style.display = 'flex'; // Mostrar el botón FAB

        // Deseleccionar el botón de supermercado
        supermarketButtons.forEach(btn => btn.classList.remove('selected'));
    });

    // Lógica para mostrar/ocultar el formulario
    toggleFormBtn.addEventListener('click', () => {
        if (productoSeleccionadoParaClonar) {
            // Rellenar el formulario con los datos del producto clonado
            productInput.value = productoSeleccionadoParaClonar.producto;
            document.getElementById('precio').value = parsePrice(productoSeleccionadoParaClonar.precio);
            document.getElementById('cantidad').value = productoSeleccionadoParaClonar.cantidad;
            unitSelect.value = productoSeleccionadoParaClonar.unidad;
            supermarketSelect.value = productoSeleccionadoParaClonar.supermercado;

            // Marcar el botón de supermercado correcto
            supermarketButtons.forEach(btn => {
                if (btn.dataset.supermercado === productoSeleccionadoParaClonar.supermercado) {
                    btn.classList.add('selected');
                } else {
                    btn.classList.remove('selected');
                }
            });
        }
        
        addItemCard.style.display = 'block'; // Siempre abre el formulario
        toggleFormBtn.style.display = 'none'; // Oculta el botón FAB
        validateForm(); // Validar por si el formulario ya es válido
    });

    // Lógica para cerrar el formulario con el botón 'x'
    closeFormBtn.addEventListener('click', () => {
        form.reset(); // Limpiar los campos del formulario
        unitSelect.value = 'ud'; // Asegurar que la unidad por defecto se restablece
        validateForm(); // Revalidar el formulario (lo deshabilitará)
        addItemCard.style.display = 'none';
        toggleFormBtn.style.display = 'flex'; // Muestra el botón FAB
        productoSeleccionadoParaClonar = null; // Limpiar el producto clonado
        // Deseleccionar el botón de supermercado
        supermarketButtons.forEach(btn => btn.classList.remove('selected'));
    });

    // Lógica de búsqueda/filtrado
    searchInput.addEventListener('input', (e) => {
        updateAndRender();
    });

    // Lógica para los botones de supermercado
    supermarketButtons.forEach(button => {
        button.addEventListener('click', () => {
            const selectedSupermarket = button.dataset.supermercado;
            supermarketSelect.value = selectedSupermarket; // Actualizar el select

            // Marcar el botón seleccionado
            supermarketButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');

            // Guardar en localStorage
            localStorage.setItem('lastSupermarket', selectedSupermarket);

            // Validar el formulario para habilitar el botón si todo está completo
            validateForm();

            // Mover el foco al siguiente campo (producto)
            productInput.focus();
        });
    });

    // Listener removido - ahora cada celda tiene su propio listener

    

    // Lógica para la navegación con Enter en el formulario
    form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevenir el envío del formulario por defecto
            
            const currentElement = document.activeElement;

            // Si el foco está en el campo de precio
            if (currentElement.id === 'precio') {
                const selectedProduct = productInput.value;
                if (productUnits[selectedProduct]) {
                    // Si la unidad se autocompletó, pasar a Cantidad
                    document.getElementById('cantidad').focus();
                } else {
                    // Si no se autocompletó, pasar a Unidad
                    document.getElementById('unidad').focus();
                }
            } else {
                // Para otros campos, seguir la lógica existente de mover al siguiente
                const formElements = Array.from(form.querySelectorAll('input:not([type="hidden"]), select, textarea')).filter(el => 
                    !el.disabled && el.offsetParent !== null // offsetParent !== null verifica si el elemento es visible
                );
                
                const currentIndex = formElements.indexOf(currentElement);

                if (currentIndex > -1 && currentIndex < formElements.length - 1) {
                    // Mover el foco al siguiente campo
                    formElements[currentIndex + 1].focus();
                } else if (currentIndex === formElements.length - 1) {
                    // Si es el último campo, enviar el formulario
                    form.requestSubmit();
                }
            }
        }
    });

        // Lógica del botón de borrar del buscador
    const clearSearchBtn = document.getElementById('clear-search-btn');
    searchInput.addEventListener('input', () => {
        if (searchInput.value.length > 0) {
            clearSearchBtn.style.display = 'block';
        } else {
            clearSearchBtn.style.display = 'none';
        }
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        productoSeleccionadoParaClonar = null; // Limpiar el producto clonado
        searchInput.dispatchEvent(new Event('input')); // Disparar evento input para actualizar la lista y ocultar la X
    });

    // Cargar el último supermercado seleccionado o establecer Mercadona por defecto
    let lastSupermarket = localStorage.getItem('lastSupermarket');
    if (!lastSupermarket) {
        lastSupermarket = 'Mercadona'; // Establecer Mercadona como valor por defecto
    }

    supermarketSelect.value = lastSupermarket;
    // Marcar el botón correspondiente
    supermarketButtons.forEach(btn => {
        if (btn.dataset.supermercado === lastSupermarket) {
            btn.classList.add('selected');
        }
    });
    // Validar el formulario por si acaso la selección por defecto ya lo hace válido
    validateForm();

    // --- NUEVO: Cargar hash de commit desde Firebase ---
    const versionRef = database.ref('config/versionHash');
    const commitHashDisplay = document.getElementById('commit-hash-display');

    versionRef.on('value', (snapshot) => {
        const commitHash = snapshot.val();
        if (commitHash && commitHashDisplay) {
            commitHashDisplay.textContent = `v: ${commitHash}`;
            
            // --- NUEVO: Cache Busting para CSS ---
            const stylesheet = document.getElementById('main-stylesheet');
            if (stylesheet) {
                stylesheet.href = `style.css?v=${commitHash}`;
            }
        }
    });

    // Lógica de ordenación
    let currentSortColumn = 'fecha'; // Por defecto, ordenar por fecha
    let currentSortDirection = 'desc'; // Por defecto, descendente

    const updateAndRender = () => {
        // 1. Filtrar
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            itemsMostrados = allItems.filter(item => 
                item.producto.toLowerCase().includes(searchTerm) ||
                (item.supermercado && item.supermercado.toLowerCase().includes(searchTerm))
            );
        } else {
            itemsMostrados = [...allItems];
        }

        // 2. Ordenar
        sortedAndFilteredItems = [...itemsMostrados].sort((a, b) => {
            let valA = a[currentSortColumn];
            let valB = b[currentSortColumn];

            if (typeof valA === 'string' && !isNaN(parseFloat(valA))) { valA = parseFloat(valA); }
            if (typeof valB === 'string' && !isNaN(parseFloat(valB))) { valB = parseFloat(valB); }

            if (valA < valB) { return currentSortDirection === 'asc' ? -1 : 1; }
            if (valA > valB) { return currentSortDirection === 'asc' ? 1 : -1; }
            return 0;
        });

        // 3. Resetear y renderizar primera página
        itemList.innerHTML = '';
        currentPage = 1;
        isLoading = false; // Permitir la carga inicial
        loadMoreItems();
    };

    const headerCells = document.querySelectorAll('.header-cell');
    headerCells.forEach(header => {
        header.addEventListener('click', () => {
            const sortColumn = header.dataset.sort;

            if (sortColumn === currentSortColumn) {
                currentSortDirection = (currentSortDirection === 'asc') ? 'desc' : 'asc';
            } else {
                currentSortColumn = sortColumn;
                currentSortDirection = 'asc';
            }

            headerCells.forEach(h => { h.classList.remove('asc', 'desc'); });
            header.classList.add(currentSortDirection);

            updateAndRender();
        });
    });

    // Función para ordenar y renderizar los items (ahora llama a la función central)
    const sortAndRenderItems = () => {
        updateAndRender();
    };

    // Llamar a sortAndRenderItems inicialmente para aplicar la ordenación por defecto
    sortAndRenderItems();

    // === FUNCIONES DE BÚSQUEDA DE IMÁGENES ===
    
    // Variable global para almacenar el producto actual
    let currentProductForImageSearch = null;
    
    // Función para buscar imágenes del producto
    window.searchProductImages = async () => {
        const productName = document.getElementById('popup-product-name').textContent;
        const quantity = document.getElementById('popup-quantity').textContent;
        const unit = document.getElementById('popup-unit').textContent;
        
        // Crear el término de búsqueda combinando nombre, cantidad y unidad
        const searchTerm = `${productName} ${quantity} ${unit}`.trim();
        currentProductForImageSearch = { productName, quantity, unit, searchTerm };
        
        console.log('Buscando imágenes para:', searchTerm);
        
        // Mostrar el carrusel y loading
        const carousel = document.getElementById('image-carousel');
        const loading = document.getElementById('search-loading');
        const results = document.getElementById('search-results');
        
        if (!carousel || !loading || !results) {
            console.error('No se encontraron elementos del DOM para el carrusel');
            return;
        }
        
        carousel.style.display = 'block';
        loading.style.display = 'flex';
        results.innerHTML = '';
        
        try {
            // Usar la búsqueda real de Google Images con SerpAPI
            const images = await searchGoogleImages(searchTerm);
            console.log('Imágenes obtenidas:', images.length);
            if (images.length > 0) {
                displayImageResults(images);
            } else {
                const placeholderImages = generatePlaceholderImages(searchTerm);
                displayImageResults(placeholderImages);
            }
        } catch (error) {
            console.error('Error buscando imágenes:', error);
            const placeholderImages = generatePlaceholderImages(searchTerm);
            displayImageResults(placeholderImages);
        } finally {
            loading.style.display = 'none';
        }
    };
    
    // Función para buscar en Google Images usando SerpAPI
    // Función para obtener API keys desde Firebase Database (seguro)
    const getApiKey = async (keyName) => {
        try {
            const database = firebase.database();
            const snapshot = await database.ref(`config/apiKeys/${keyName}`).once('value');
            const apiKey = snapshot.val();
            
            if (!apiKey) {
                throw new Error(`API key '${keyName}' no encontrada en Firebase Database`);
            }
            
            return apiKey;
        } catch (error) {
            console.error(`Error obteniendo API key '${keyName}':`, error);
            throw new Error(`No se pudo obtener la API key: ${error.message}`);
        }
    };

    const searchGoogleImages = async (searchTerm) => {
        try {
            // Obtener API key de forma segura desde Firebase Database
            const SERPAPI_KEY = await getApiKey('serpapi');
            
            // Probar con diferentes proxies CORS
            const PROXY_URLS = [
                'https://corsproxy.io/?',
                'https://api.codetabs.com/v1/proxy?quest=',
                'https://cors-anywhere.herokuapp.com/'
            ];
            
            const API_URL = 'https://serpapi.com/search.json';
        
        const params = new URLSearchParams({
            engine: 'google_images',
            q: searchTerm,
            api_key: SERPAPI_KEY,
            num: 7,
            safe: 'active',
            ijn: 0
        });
        
        // Probar cada proxy
        for (let i = 0; i < PROXY_URLS.length; i++) {
            try {
                console.log(`Intentando con proxy ${i + 1}:`, PROXY_URLS[i]);
                const proxyUrl = `${PROXY_URLS[i]}${encodeURIComponent(`${API_URL}?${params}`)}`;
                
                const response = await fetch(proxyUrl);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Respuesta de SerpAPI:', data);
                
                if (data.images_results && data.images_results.length > 0) {
                    return data.images_results.slice(0, 7).map((result, index) => ({
                        url: result.original || result.link,
                        thumbnail: result.thumbnail,
                        title: result.title || `${searchTerm} - Imagen ${index + 1}`
                    }));
                }
            } catch (error) {
                console.error(`Error con proxy ${i + 1}:`, error);
                // Continúa con el siguiente proxy
            }
        }
        
        console.log('Todos los proxies fallaron, usando imágenes alternativas');
        return await searchWithAlternativeAPI(searchTerm);
        
        } catch (error) {
            console.error('Error obteniendo API key para búsqueda de imágenes:', error);
            // Si falla obtener la API key, usar API alternativa
            console.log('Usando API alternativa debido a error con API key');
            return await searchWithAlternativeAPI(searchTerm);
        }
    };

    // API alternativa usando imágenes aleatorias
    const searchWithAlternativeAPI = async (searchTerm) => {
        console.log('Usando API alternativa para:', searchTerm);
        
        // Generar URLs de imágenes temáticas usando Picsum con IDs específicos
        const imageIds = [100, 200, 300, 400, 500, 600, 700];
        
        return imageIds.map((id, index) => ({
            url: `https://picsum.photos/400/300?random=${id}`,
            thumbnail: `https://picsum.photos/120/80?random=${id}`,
            title: `${searchTerm} - Resultado ${index + 1}`
        }));
    };

    // Función temporal para generar imágenes de placeholder
    const generatePlaceholderImages = (searchTerm) => {
        // Usar diferentes servicios de placeholder para simular variedad
        const colors = ['FF6B6B', '4ECDC4', '45B7D1', 'F9CA24', '6C5CE7', 'A8E6CF', 'FFB4B4'];
        const encodedTerm = encodeURIComponent('Producto');
        
        return colors.map((color, index) => ({
            url: `https://placehold.co/400x300/${color}/FFFFFF/png?text=Imagen+${index + 1}`,
            thumbnail: `https://placehold.co/120x80/${color}/FFFFFF/png?text=${index + 1}`,
            title: `${searchTerm} - Resultado ${index + 1}`
        }));
    };
    
    // Función para mostrar los resultados de búsqueda
    const displayImageResults = (images) => {
        console.log('Mostrando resultados de imágenes:', images.length);
        const results = document.getElementById('search-results');
        
        if (!results) {
            console.error('Elemento search-results no encontrado');
            return;
        }
        
        results.innerHTML = '';
        
        if (images.length === 0) {
            results.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No se encontraron imágenes.</div>';
            return;
        }
        
        images.forEach((image, index) => {
            console.log(`Creando imagen ${index + 1}:`, image.thumbnail || image.url);
            const img = document.createElement('img');
            img.src = image.thumbnail || image.url;
            img.className = 'image-search-item';
            img.alt = image.title || `Imagen ${index + 1}`;
            img.title = image.title || `Imagen ${index + 1}`;
            // Guardar la URL original como data attribute
            img.dataset.originalUrl = image.url;
            
            img.addEventListener('click', () => {
                // Usar el thumbnail que ya funciona en lugar de la URL original que tiene CORS
                const imageUrlToUse = image.thumbnail || image.url;
                console.log('Imagen seleccionada (usando thumbnail):', imageUrlToUse);
                selectImage(imageUrlToUse);
            });
            
            // Manejar errores de carga de imagen
            img.addEventListener('error', (e) => {
                console.error('Error cargando imagen:', e.target.src);
                img.style.display = 'none';
            });
            
            img.addEventListener('load', () => {
                console.log('Imagen cargada correctamente:', img.src);
            });
            
            results.appendChild(img);
        });
        
        console.log('Imágenes añadidas al DOM');
    };
    
    // Función para comprimir imagen a base64 con umbral inteligente
    const compressImageToBase64 = (imageUrl, maxWidth = 300, maxHeight = 200, quality = 0.85) => {
        return new Promise((resolve, reject) => {
            // Intentar usar proxy CORS para descargar la imagen limpiamente
            console.log('🌐 Usando proxy CORS para descargar imagen...');
            
            const img = new Image();
            
            // Usar proxy CORS específico que maneja mejor las imágenes
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`;
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                processImage(img);
            };
            
            img.onerror = () => {
                console.log('� Proxy falló, intentando con imagen directa...');
                // Fallback: intentar imagen directa
                const imgDirect = new Image();
                imgDirect.crossOrigin = 'anonymous';
                
                imgDirect.onload = () => {
                    processImage(imgDirect);
                };
                
                imgDirect.onerror = () => reject(new Error('Error cargando imagen'));
                imgDirect.src = imageUrl;
            };
            
            img.src = proxyUrl;
            
            function processImage(img) {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Obtener dimensiones originales
                let { width, height } = img;
                console.log(`📐 Dimensiones originales: ${width}x${height}`);
                
                // Umbral: solo comprimir si es mayor a 400x300 píxeles
                const COMPRESS_THRESHOLD_WIDTH = 400;
                const COMPRESS_THRESHOLD_HEIGHT = 300;
                
                let needsCompression = width > COMPRESS_THRESHOLD_WIDTH || height > COMPRESS_THRESHOLD_HEIGHT;
                
                if (!needsCompression) {
                    console.log('📏 Imagen pequeña, no necesita compresión - usando original');
                    // Para imágenes pequeñas, convertir sin redimensionar
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0);
                    const base64 = canvas.toDataURL('image/jpeg', 0.95); // Mayor calidad para imágenes pequeñas
                    resolve(base64);
                    return;
                }
                
                console.log('🗜️ Imagen grande, aplicando compresión...');
                
                // Calcular dimensiones manteniendo proporción
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }
                
                console.log(`📐 Dimensiones comprimidas: ${width}x${height}`);
                
                canvas.width = width;
                canvas.height = height;
                
                // Dibujar imagen redimensionada
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convertir a base64
                const base64 = canvas.toDataURL('image/jpeg', quality);
                resolve(base64);
            }
            
            img.onerror = () => reject(new Error('Error cargando imagen'));
            img.src = imageUrl;
        });
    };

    // Función para seleccionar una imagen
    const selectImage = async (imageUrl) => {
        console.log('🖼️ === INICIO selectImage ===');
        console.log('URL de imagen recibida:', imageUrl);
        
        const placeholder = document.getElementById('image-placeholder');
        const selectedImage = document.getElementById('selected-image');
        
        console.log('Elementos DOM:', {
            placeholder: placeholder ? 'Encontrado' : 'NO ENCONTRADO',
            selectedImage: selectedImage ? 'Encontrado' : 'NO ENCONTRADO'
        });
        
        console.log('Estado de currentEditingItem:', {
            exists: !!currentEditingItem,
            id: currentEditingItem?.id || 'Sin ID',
            producto: currentEditingItem?.producto || 'Sin nombre'
        });
        
        try {
            console.log('Iniciando compresión de imagen...');
            // Comprimir imagen
            const compressedBase64 = await compressImageToBase64(imageUrl);
            console.log('✅ Imagen comprimida exitosamente (tamaño en chars):', compressedBase64.length);
            
            // Mostrar imagen inmediatamente
            const imageSection = document.getElementById('image-section');
            placeholder.style.display = 'none';
            selectedImage.src = compressedBase64;
            selectedImage.style.display = 'block';
            if (imageSection) imageSection.classList.add('has-image');
            console.log('✅ Imagen mostrada en UI');
            
            // Guardar en Firebase solo si tenemos el producto actual (edición)
            if (currentEditingItem && currentEditingItem.id) {
                console.log('📝 Producto en edición detectado - guardando en Firebase...');
                await saveProductImage(currentEditingItem.id, compressedBase64);
                console.log('✅ Imagen guardada en Firebase para producto existente:', currentEditingItem.id);
                
                // Actualizar el producto en el array local
                currentEditingItem.image = compressedBase64;
                console.log('✅ Producto local actualizado con imagen');
            } else {
                // Para productos nuevos, solo guardamos la imagen temporalmente en el DOM
                // Se guardará cuando se cree el producto
                console.log('📋 Producto nuevo detectado - imagen se guardará al crear el producto');
            }
            
        } catch (error) {
            console.error('❌ Error procesando imagen:', error);
            // Mostrar imagen original si falla la compresión
            placeholder.style.display = 'none';
            selectedImage.src = imageUrl;
            selectedImage.style.display = 'block';
        }
        
        // Cerrar el carrusel
        console.log('🚪 Cerrando carrusel de imágenes');
        closeImageSearch();
        console.log('🖼️ === FIN selectImage ===');
    };

    // Función para guardar imagen en Firebase
    const saveProductImage = async (productId, imageBase64) => {
        console.log('=== INICIO saveProductImage ===');
        console.log('ProductId recibido:', productId);
        console.log('ImageBase64 recibido (primeros 50 chars):', imageBase64 ? imageBase64.substring(0, 50) + '...' : 'null/undefined');
        
        if (!productId) {
            console.error('ERROR: No se proporcionó productId');
            return;
        }
        
        if (!imageBase64) {
            console.error('ERROR: No se proporcionó imageBase64');
            return;
        }
        
        try {
            console.log('Obteniendo referencia a Firebase database...');
            const database = firebase.database();
            
            console.log('Guardando imagen en ruta:', `items/${productId}/image`);
            await database.ref(`items/${productId}/image`).set(imageBase64);
            
            console.log('✅ ÉXITO: Imagen guardada en Firebase para producto:', productId);
            
            // Verificar que se guardó
            console.log('Verificando que se guardó...');
            const verification = await database.ref(`items/${productId}/image`).once('value');
            const savedImage = verification.val();
            console.log('Imagen verificada en Firebase:', savedImage ? 'Imagen encontrada' : 'No se encontró imagen');
            
        } catch (error) {
            console.error('❌ ERROR guardando imagen en Firebase:', error);
            console.error('Error details:', error.message);
            throw error;
        }
        
        console.log('=== FIN saveProductImage ===');
    };
    
    // FUNCIÓN DE PRUEBA - TEMPORAL
    window.testSaveImage = async () => {
        console.log('🧪 Iniciando prueba de guardado de imagen...');
        
        // Imagen de prueba pequeña en base64 (1x1 pixel rojo)
        const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        const testProductId = 'test-' + Date.now();
        
        console.log('Usando productId de prueba:', testProductId);
        
        try {
            await saveProductImage(testProductId, testImageBase64);
            console.log('✅ Prueba completada exitosamente');
            alert('Prueba de guardado completada. Revisa la consola y Firebase.');
        } catch (error) {
            console.error('❌ Error en la prueba:', error);
            alert('Error en la prueba: ' + error.message);
        }
    };

    // Función para cargar imagen guardada del producto
    const loadProductImage = async (product) => {
        const placeholder = document.getElementById('image-placeholder');
        const selectedImage = document.getElementById('selected-image');
        const imageSection = document.getElementById('image-section');
        
        if (!product || !product.id) {
            // Mostrar placeholder si no hay producto
            if (placeholder) placeholder.style.display = 'flex';
            if (selectedImage) selectedImage.style.display = 'none';
            if (imageSection) imageSection.classList.remove('has-image');
            console.log('Mostrando placeholder - no hay producto');
            return;
        }
        
        try {
            console.log('Cargando imagen para producto:', product.id);
            const database = firebase.database();
            const snapshot = await database.ref(`items/${product.id}/image`).once('value');
            const imageData = snapshot.val();
            
            if (imageData) {
                // Mostrar imagen guardada
                if (placeholder) placeholder.style.display = 'none';
                if (selectedImage) {
                    selectedImage.src = imageData;
                    selectedImage.style.display = 'block';
                }
                if (imageSection) imageSection.classList.add('has-image');
                console.log('✅ Imagen cargada desde Firebase para producto:', product.id);
            } else {
                // Mostrar placeholder si no hay imagen
                if (placeholder) placeholder.style.display = 'flex';
                if (selectedImage) selectedImage.style.display = 'none';
                if (imageSection) imageSection.classList.remove('has-image');
                console.log('Mostrando placeholder - sin imagen guardada para producto:', product.id);
            }
        } catch (error) {
            console.error('Error cargando imagen desde Firebase:', error);
            // Mostrar placeholder en caso de error
            if (placeholder) placeholder.style.display = 'flex';
            if (selectedImage) selectedImage.style.display = 'none';
            if (imageSection) imageSection.classList.remove('has-image');
        }
    };
    
    // Función para cerrar la búsqueda de imágenes
    window.closeImageSearch = () => {
        console.log('Cerrando búsqueda de imágenes');
        const carousel = document.getElementById('image-carousel');
        if (carousel) {
            carousel.style.display = 'none';
        }
        currentProductForImageSearch = null;
    };

    // Logging de inicialización
    console.log('=== FIREBASE INICIALIZADO ===');
    console.log('Firebase Config cargado:', typeof firebaseConfig !== 'undefined');
    console.log('Proyecto Firebase:', firebaseConfig?.projectId || 'No disponible');
    console.log('Auth domain:', firebaseConfig?.authDomain || 'No disponible');
    console.log('Firebase y FirebaseUI inicializados');
    
    // Agregar event listeners para búsqueda de imágenes después de que todo esté inicializado
    addImageSearchListeners();

});