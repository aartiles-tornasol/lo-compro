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
    const categorySelect = document.getElementById('categoria');
    const supermarketButtons = document.querySelectorAll('.supermarket-btn');
    const closeFormBtn = document.getElementById('close-form-btn');

    let allItems = []; // Para guardar todos los items y poder filtrar

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

    // Función para mostrar los productos en la lista
    const renderItems = (itemsToRender) => {
        itemList.innerHTML = ''; // Limpiar la lista actual
        if (!itemsToRender || itemsToRender.length === 0) {
            itemList.innerHTML = '<li class="list-group-item">No hay productos en la lista.</li>';
            return;
        }

        // Ordenar por fecha (más reciente primero)
        itemsToRender.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        itemsToRender.forEach(item => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.innerHTML = `
                <div class="item-details">
                    <strong>${item.producto}</strong> - ${item.cantidad} ${item.unidad || ''}
                    <br>
                    <small>${item.supermercado || 'N/A'} - ${item.precio ? item.precio + '€' : 'Sin precio'}</small>
                    ${item.precioPorUnidad ? `<br><small>(${item.precioPorUnidad} ${item.unidadPrecioPorUnidad || ''})</small>` : ''}
                </div>
                <div class="item-date">${formatDisplayDate(item.fecha)}</div>
            `;
            itemList.appendChild(li);
        });
    };

    // Escuchar cambios en la base de datos en tiempo real
    itemsRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            allItems = Object.values(data); // Convertir objeto a array
        } else {
            allItems = [];
        }
        // Renderizar los items iniciales (sin filtro)
        renderItems(allItems);
    });

    // Función para añadir un nuevo producto
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const rawPrice = document.getElementById('precio').value;
        const parsedPrice = parsePrice(rawPrice);
        const quantity = parseFloat(document.getElementById('cantidad').value);
        const unit = document.getElementById('unidad').value;

        const { value: pricePerUnitValue, unit: pricePerUnitUnit } = calculatePricePerUnit(parsedPrice, quantity, unit);

        const newItem = {
            producto: document.getElementById('producto').value,
            supermercado: supermarketSelect.value, // Leer del select oculto
            precio: rawPrice, // Guardamos el precio original como string
            cantidad: quantity,
            unidad: unit,
            categoria: categorySelect.value, // Leer del select de categoría
            fecha: new Date().toISOString(), // Fecha en formato ISO
            precioPorUnidad: pricePerUnitValue,
            unidadPrecioPorUnidad: pricePerUnitUnit
        };

        // Guardar el nuevo item en Firebase
        itemsRef.push(newItem);

        form.reset(); // Limpiamos el formulario
        addItemCard.style.display = 'none'; // Ocultar el formulario después de añadir

        // Deseleccionar el botón de supermercado
        supermarketButtons.forEach(btn => btn.classList.remove('selected'));
    });

    // Lógica para mostrar/ocultar el formulario
    toggleFormBtn.addEventListener('click', () => {
        addItemCard.style.display = 'block'; // Siempre abre el formulario
    });

    // Lógica para cerrar el formulario con el botón 'x'
    closeFormBtn.addEventListener('click', () => {
        addItemCard.style.display = 'none';
        // Deseleccionar el botón de supermercado
        supermarketButtons.forEach(btn => btn.classList.remove('selected'));
    });

    // Lógica de búsqueda/filtrado
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredItems = allItems.filter(item => 
            item.producto.toLowerCase().includes(searchTerm) ||
            (item.supermercado && item.supermercado.toLowerCase().includes(searchTerm)) ||
            (item.categoria && item.categoria.toLowerCase().includes(searchTerm))
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
        });
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
});