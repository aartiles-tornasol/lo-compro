document.addEventListener('DOMContentLoaded', () => {
    // Inicializar Firebase
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const database = firebase.database();
    const itemsRef = database.ref('items');

    // Referencias a elementos de autenticación y contenido
    const authenticatedContent = document.getElementById('authenticated-content');
    const unauthenticatedMessage = document.getElementById('unauthenticated-message');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const form = document.getElementById('add-item-form');

    // Manejar el estado de autenticación
    auth.onAuthStateChanged((user) => {
        if (user) {
            // Usuario autenticado
            authenticatedContent.style.display = 'block';
            unauthenticatedMessage.style.display = 'none';
            toggleFormBtn.style.display = 'flex';
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'block';
            // Cargar los datos cuando el usuario está autenticado
            itemsRef.on('value', loadData);
        } else {
            // Usuario no autenticado
            authenticatedContent.style.display = 'none';
            unauthenticatedMessage.style.display = 'block';
            toggleFormBtn.style.display = 'none';
            loginBtn.style.display = 'block';
            logoutBtn.style.display = 'none';
            // Desconectar el listener cuando el usuario no está autenticado
            itemsRef.off('value', loadData);
            // Limpiar los datos
            allItems = [];
            itemList.innerHTML = '';
        }
    });

    // Manejar clic en login
    loginBtn.addEventListener('click', async () => {
        const ui = new firebaseui.auth.AuthUI(auth);
        const uiConfig = {
            signInOptions: [
                {
                    provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
                    requireDisplayName: false,
                    signInMethod: firebase.auth.EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD,
                    disableSignUp: {
                        status: true
                    }
                }
            ],
            signInFlow: 'popup',
            callbacks: {
                signInSuccessWithAuthResult: () => false
            }
        };
        ui.start('#firebaseui-auth-container', uiConfig);
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
                <td><div class="product-row-color-indicator ${supermarketColorClasses[item.supermercado] || ''}"></div><span class="product-name">${item.producto}</span></td>
                <td class="text-end">${formatPriceTwoDecimals(parsePrice(item.precio))}</td>
                <td class="text-end price-per-unit">${formatPrice(item.precioPorUnidad)} ${cleanUnit}</td>
                <td class="text-end">${formatPrice(item.precioMedio)} ${cleanUnit}</td>
            `;
            itemList.appendChild(row);

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
            unidadPrecioPorUnidad: pricePerUnitUnit
        };

        itemsRef.child(itemId).update(updatedData);

        editItemModal.hide();
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
            unidadPrecioPorUnidad: pricePerUnitUnit
        };

        // Guardar el nuevo item en Firebase
        itemsRef.push(newItem);

        form.reset(); // Limpiamos el formulario
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

    // Listener para hacer clic en el nombre de un producto y filtrarlo
    itemList.addEventListener('click', (e) => {
        const target = e.target;
        // Comprobar si el clic fue en el nombre del producto
        if (target && target.classList.contains('product-name')) {
            const productRow = target.closest('.product-row');
            const itemId = productRow.dataset.itemId;
            productoSeleccionadoParaClonar = allItems.find(item => item.id === itemId);

            const productName = target.textContent;
            searchInput.value = productName;
            // Disparar un evento 'input' para que se active la lógica de filtrado
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });

    

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

});