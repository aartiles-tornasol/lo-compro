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

    let allItems = []; // Para guardar todos los items y poder filtrar
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
                <div class="product-cell price">${item.precio ? item.precio + '€' : '-'}</div>
                <div class="product-cell price-per-unit">${item.precioPorUnidad ? item.precioPorUnidad + item.unidadPrecioPorUnidad : '-'}</div>
                <div class="product-cell avg-price">${item.precioMedio ? item.precioMedio + '€' : '-'}</div>
            `;

            const deleteButton = document.createElement('div');
            deleteButton.className = 'delete-button';
            deleteButton.innerHTML = '<i class="bi bi-trash"></i> Delete';

            wrapper.appendChild(productRow);
            wrapper.appendChild(deleteButton);
            itemList.appendChild(wrapper);
        });

        initializeSwipeGestures(); // Inicializar gestos después de renderizar
    };

    // Función para inicializar los gestos de swipe en las filas
    const initializeSwipeGestures = () => {
        const rows = document.querySelectorAll('.product-row');
        rows.forEach(row => {
            // Prevenir inicialización múltiple si ya existe un manejador
            if (row.hammer) return;
            row.hammer = new Hammer.Manager(row);
            row.hammer.add(new Hammer.Pan({ direction: Hammer.DIRECTION_HORIZONTAL, threshold: 10 }));

            let lastPosX = 0;
            let isSwipeActive = false;

            row.hammer.on('panstart', (ev) => {
                // Activar el swipe solo si se inicia en el 30% derecho de la fila
                const rowWidth = row.offsetWidth;
                const startX = ev.srcEvent.clientX || ev.srcEvent.touches[0].clientX;
                const rowRightEdge = row.getBoundingClientRect().right;
                
                if (rowRightEdge - startX > rowWidth * 0.3) {
                    isSwipeActive = false;
                    return;
                }
                isSwipeActive = true;
                row.classList.add('swiping');
            });

            row.hammer.on('panleft panright', (ev) => {
                if (!isSwipeActive) return;
                // Mover la fila con el dedo/ratón, pero solo hacia la izquierda
                const newPosX = Math.min(0, ev.deltaX);
                row.style.transform = `translateX(${newPosX}px)`;
                lastPosX = newPosX;
            });

            row.hammer.on('panend', (ev) => {
                if (!isSwipeActive) return;
                row.classList.remove('swiping');
                
                const deleteButtonWidth = 100; // Ancho del botón de borrado

                // Si el swipe es suficientemente largo y rápido, se considera borrado
                if (lastPosX < -deleteButtonWidth * 0.5 || ev.velocityX < -0.5) {
                    // Animar hasta el final para mostrar el botón de borrado
                    row.style.transform = `translateX(-${deleteButtonWidth}px)`;

                    // Preguntar al usuario antes de borrar
                    if (confirm('¿Estás seguro de que quieres borrar este registro?')) {
                        // Si el usuario confirma, aplicar fade-out y borrar
                        row.style.transition = 'transform 0.3s ease, opacity 0.5s ease';
                        row.style.opacity = '0';

                        // Esperar a que la animación de fade-out termine antes de borrar
                        setTimeout(() => {
                            deleteItem(row.dataset.itemId);
                        }, 500); // Coincide con la duración de la animación de opacidad
                    } else {
                        // Si el usuario cancela, rebotar a la posición original y restablecer opacidad
                        row.style.transition = 'transform 0.3s ease'; // Solo transform para el rebote
                        row.style.transform = 'translateX(0)';
                        row.style.opacity = '1'; // Asegurar que la opacidad vuelve a 1
                    }

                } else {
                    // Si no, rebotar a la posición original y restablecer opacidad
                    row.style.transition = 'transform 0.3s ease'; // Solo transform para el rebote
                    row.style.transform = 'translateX(0)';
                    row.style.opacity = '1'; // Asegurar que la opacidad vuelve a 1
                }
                isSwipeActive = false;
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
            
            // Calcular precios medios y actualizar sugerencias de productos y unidades
            const productPrices = {}; // { producto: { total: 0, count: 0 } }
            productUnits = {};
            const productNames = new Set();

            allItems.forEach(item => {
                productNames.add(item.producto);
                // Guardar la unidad solo si no ha sido guardada antes (la primera que encuentra es la más reciente)
                if (item.unidad && !productUnits[item.producto]) {
                    productUnits[item.producto] = item.unidad;
                }

                // Acumular precios para el cálculo del precio medio
                const parsedPrice = parsePrice(item.precio);
                if (parsedPrice !== null) {
                    if (!productPrices[item.producto]) {
                        productPrices[item.producto] = { total: 0, count: 0 };
                    }
                    productPrices[item.producto].total += parsedPrice;
                    productPrices[item.producto].count++;
                }
            });

            // Añadir el precio medio a cada item
            allItems.forEach(item => {
                if (productPrices[item.producto] && productPrices[item.producto].count > 0) {
                    item.precioMedio = parseFloat((productPrices[item.producto].total / productPrices[item.producto].count).toFixed(2));
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
        addItemCard.style.display = 'none'; // Ocultar el formulario después de añadir
        toggleFormBtn.style.display = 'flex'; // Mostrar el botón FAB

        // Deseleccionar el botón de supermercado
        supermarketButtons.forEach(btn => btn.classList.remove('selected'));
    });

    // Lógica para mostrar/ocultar el formulario
    toggleFormBtn.addEventListener('click', () => {
        addItemCard.style.display = 'block'; // Siempre abre el formulario
        toggleFormBtn.style.display = 'none'; // Oculta el botón FAB
    });

    // Lógica para cerrar el formulario con el botón 'x'
    closeFormBtn.addEventListener('click', () => {
        addItemCard.style.display = 'none';
        toggleFormBtn.style.display = 'flex'; // Muestra el botón FAB
        // Deseleccionar el botón de supermercado
        supermarketButtons.forEach(btn => btn.classList.remove('selected'));
    });

    // Lógica de búsqueda/filtrado
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredItems = allItems.filter(item => 
            item.producto.toLowerCase().includes(searchTerm) ||
            (item.supermercado && item.supermercado.toLowerCase().includes(searchTerm))
        );
        renderItems(filteredItems);
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

            // Mover el foco al siguiente campo (producto)
            productInput.focus();
        });
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
        searchInput.dispatchEvent(new Event('input')); // Disparar evento input para actualizar la lista y ocultar la X
    });

    // Cargar el último supermercado seleccionado al iniciar
    const lastSupermarket = localStorage.getItem('lastSupermarket');
    if (lastSupermarket) {
        supermarketSelect.value = lastSupermarket;
        // Marcar el botón correspondiente
        supermarketButtons.forEach(btn => {
            if (btn.dataset.supermercado === lastSupermarket) {
                btn.classList.add('selected');
            }
        });
    }

    // Mostrar el hash del commit
    const commitHash = '0e6d95c'; // ESTE VALOR SE ACTUALIZARÁ AUTOMÁTICAMENTE EN CADA COMMIT
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
        const sortedItems = [...allItems].sort((a, b) => {
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