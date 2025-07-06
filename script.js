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

    let allItems = []; // Para guardar todos los items y poder filtrar

    // Función para formatear la fecha para mostrar
    const formatDisplayDate = (isoDateString) => {
        if (!isoDateString) return '';
        const date = new Date(isoDateString);
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'numeric', day: 'numeric' });
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

        const newItem = {
            producto: document.getElementById('producto').value,
            supermercado: document.getElementById('supermercado').value,
            precio: document.getElementById('precio').value,
            cantidad: document.getElementById('cantidad').value,
            unidad: document.getElementById('unidad').value,
            categoria: document.getElementById('categoria').value,
            fecha: new Date().toISOString() // Fecha en formato ISO
        };

        // Guardar el nuevo item en Firebase
        itemsRef.push(newItem);

        form.reset(); // Limpiamos el formulario
        addItemCard.style.display = 'none'; // Ocultar el formulario después de añadir
    });

    // Lógica para mostrar/ocultar el formulario
    toggleFormBtn.addEventListener('click', () => {
        if (addItemCard.style.display === 'none') {
            addItemCard.style.display = 'block';
            toggleFormBtn.textContent = 'Ocultar Formulario';
        } else {
            addItemCard.style.display = 'none';
            toggleFormBtn.textContent = 'Añadir Producto';
        }
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
});