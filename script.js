document.addEventListener('DOMContentLoaded', () => {
    // Inicializar Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
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

    // Función para mostrar los productos en la lista
    const renderItems = (itemsToRender) => {
        itemList.innerHTML = ''; // Limpiar la lista actual
        if (!itemsToRender || itemsToRender.length === 0) {
            itemList.innerHTML = '<div class="product-row loading-row">No hay productos en la lista.</div>';
            return;
        }

        itemsToRender.forEach(item => {
            const wrapper = document.createElement('div');
            wrapper.className = 'product-row-wrapper';

            const productRow = document.createElement('div');
            productRow.className = 'product-row';
            productRow.dataset.itemId = item.id; // Guardamos el ID para futuras acciones

            const colorClass = supermarketColorClasses[item.supermercado] || '';

            productRow.innerHTML = `
                <div class="product-row-color-indicator ${colorClass}"></div>
                <div class="product-cell name">${item.producto}</div>
                <div class="product-cell price">${formatPriceTwoDecimals(parsePrice(item.precio))}€</div>
                <div class="product-cell price-per-unit">${formatPrice(item.precioPorUnidad)}${item.unidadPrecioPorUnidad || ''}</div>
                <div class="product-cell avg-price">${formatPrice(item.precioMedio)}${item.unidadPrecioPorUnidad || ''}</div>
            `;

            const editButton = document.createElement('div');
            editButton.className = 'edit-button';
            editButton.innerHTML = '<i class="bi bi-pencil"></i> Edit';

            const deleteButton = document.createElement('div');
            deleteButton.className = 'delete-button';
            deleteButton.innerHTML = '<i class="bi bi-trash"></i> Delete';

            wrapper.appendChild(productRow);
            wrapper.appendChild(editButton);
            wrapper.appendChild(deleteButton);
            itemList.appendChild(wrapper);
        });

        initializeSwipeGestures(); // Inicializar gestos después de renderizar
    };

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

    // Función para inicializar los gestos de swipe en las filas
    const initializeSwipeGestures = () => {
        const rows = document.querySelectorAll('.product-row');
        rows.forEach(row => {
            if (row.hammer) return; // Prevenir reinicialización

            const wrapper = row.parentElement;
            const editButton = wrapper.querySelector('.edit-button');

            row.hammer = new Hammer.Manager(row);
            row.hammer.add(new Hammer.Pan({ direction: Hammer.DIRECTION_HORIZONTAL, threshold: 10 }));

            let lastPosX = 0;
            let swipeDirection = null; // 'left' o 'right'

            row.hammer.on('panstart', (ev) => {
                // Resetear otras filas abiertas
                document.querySelectorAll('.product-row-wrapper').forEach(otherWrapper => {
                    otherWrapper.classList.remove('show-edit', 'show-delete');
                });
                document.querySelectorAll('.product-row').forEach(otherRow => {
                    if (otherRow !== row) otherRow.style.transform = 'translateX(0)';
                });

                const rowWidth = row.offsetWidth;
                const startX = ev.srcEvent.clientX || ev.srcEvent.touches[0].clientX;
                const rowRect = row.getBoundingClientRect();

                if (startX - rowRect.left < rowWidth * 0.3) {
                    swipeDirection = 'right'; // Para editar
                    wrapper.classList.add('show-edit');
                } else if (rowRect.right - startX < rowWidth * 0.3) {
                    swipeDirection = 'left'; // Para borrar
                    wrapper.classList.add('show-delete');
                } else {
                    swipeDirection = null;
                }
                // Añadir una clase para deshabilitar transiciones durante el swipe
                if (swipeDirection) row.classList.add('swiping');
            });

            row.hammer.on('panmove', (ev) => {
                if (!swipeDirection) return;
                
                if (swipeDirection === 'right') {
                    lastPosX = Math.min(100, Math.max(0, ev.deltaX)); // Mover a la derecha
                } else { // 'left'
                    lastPosX = Math.max(-100, Math.min(0, ev.deltaX)); // Mover a la izquierda
                }
                row.style.transform = `translateX(${lastPosX}px)`;
            });

            row.hammer.on('panend', (ev) => {
                if (!swipeDirection) return;
                row.classList.remove('swiping');
                
                const buttonWidth = 100;

                if (swipeDirection === 'right') { // Lógica para Editar
                    if (lastPosX > buttonWidth / 2 || ev.velocityX > 0.5) {
                        populateFormForEdit(row.dataset.itemId);
                    }
                    row.style.transform = 'translateX(0)'; // Volver a la posición inicial
                } else { // Lógica para Borrar (la original)
                    if (lastPosX < -buttonWidth / 2 || ev.velocityX < -0.5) {
                        row.style.transform = `translateX(-${buttonWidth}px)`;
                        if (confirm('¿Estás seguro de que quieres borrar este registro?')) {
                            row.style.transition = 'transform 0.3s ease, opacity 0.5s ease';
                            row.style.opacity = '0';
                            setTimeout(() => {
                                deleteItem(row.dataset.itemId);
                            }, 500);
                        } else {
                            row.style.transform = 'translateX(0)';
                            row.style.opacity = '1';
                        }
                    } else {
                        row.style.transform = 'translateX(0)';
                        row.style.opacity = '1';
                    }
                }
                swipeDirection = null;
                // Quitar las clases de visibilidad al final del gesto
                setTimeout(() => wrapper.classList.remove('show-edit', 'show-delete'), 300);
            });
        });
    };

    // Función para borrar un item de Firebase
    const deleteItem = (itemId) => {
        if (!itemId) return;
        itemsRef.child(itemId).remove()
            .catch((error) => {
                console.error("Error al eliminar el item:", error);
            });
    };

    // Escuchar cambios en la base de datos en tiempo real
    itemsRef.on('value', (snapshot) => {
        const data = snapshot.val();
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
        sortAndRenderItems(); // Llamar a la función de ordenación para renderizar
    });

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
        const searchTerm = e.target.value.toLowerCase();
        if (searchTerm) {
            itemsMostrados = allItems.filter(item => 
                item.producto.toLowerCase().includes(searchTerm) ||
                (item.supermercado && item.supermercado.toLowerCase().includes(searchTerm))
            );
        } else {
            itemsMostrados = [...allItems]; // Si no hay búsqueda, mostrar todos
        }
        renderItems(itemsMostrados);
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
        // Comprobar si el clic fue en la celda del nombre
        if (target && target.classList.contains('name')) {
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

    // Mostrar el hash del commit
    const commitHash = 'e78abac'; // ESTE VALOR SE ACTUALIZARÁ AUTOMÁTICAMENTE EN CADA COMMIT
    const commitHashDisplay = document.getElementById('commit-hash-display');
    if (commitHashDisplay) {
        commitHashDisplay.textContent = `v: ${commitHash}`;
    }

    // Lógica de ordenación
    let currentSortColumn = 'fecha'; // Por defecto, ordenar por fecha
    let currentSortDirection = 'desc'; // Por defecto, descendente

    const headerCells = document.querySelectorAll('.header-cell');
    headerCells.forEach(header => {
        header.addEventListener('click', () => {
            const sortColumn = header.dataset.sort;

            // Si se hace clic en la misma columna, invertir la dirección
            if (sortColumn === currentSortColumn) {
                currentSortDirection = (currentSortDirection === 'asc') ? 'desc' : 'asc';
            } else {
                // Si se hace clic en una nueva columna, establecerla como ascendente
                currentSortColumn = sortColumn;
                currentSortDirection = 'asc';
            }

            // Eliminar clases de ordenación de todas las cabeceras
            headerCells.forEach(h => {
                h.classList.remove('asc', 'desc');
            });

            // Añadir clase de ordenación a la cabecera actual
            header.classList.add(currentSortDirection);

            // Re-renderizar los items con la nueva ordenación
            sortAndRenderItems();
        });
    });

    // Función para ordenar y renderizar los items
    const sortAndRenderItems = () => {
        const sortedItems = [...itemsMostrados].sort((a, b) => {
            let valA = a[currentSortColumn];
            let valB = b[currentSortColumn];

            // Manejar valores numéricos para ordenación correcta
            if (typeof valA === 'string' && !isNaN(parseFloat(valA))) {
                valA = parseFloat(valA);
            }
            if (typeof valB === 'string' && !isNaN(parseFloat(valB))) {
                valB = parseFloat(valB);
            }

            if (valA < valB) {
                return currentSortDirection === 'asc' ? -1 : 1;
            }
            if (valA > valB) {
                return currentSortDirection === 'asc' ? 1 : -1;
            }
            return 0;
        });
        renderItems(sortedItems);
    };

    // Llamar a sortAndRenderItems inicialmente para aplicar la ordenación por defecto
    sortAndRenderItems();

});