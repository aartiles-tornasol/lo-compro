document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-item-form');
    const itemList = document.getElementById('item-list');

    // Función para cargar los productos desde la API
    const loadItems = async () => {
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            renderItems(data.items);
        } catch (error) {
            console.error('Error al cargar los productos:', error);
            itemList.innerHTML = '<li class="list-group-item list-group-item-danger">Error al cargar la lista.</li>';
        }
    };

    // Función para mostrar los productos en la lista
    const renderItems = (items) => {
        itemList.innerHTML = ''; // Limpiar la lista actual
        if (items.length === 0) {
            itemList.innerHTML = '<li class="list-group-item">No hay productos en la lista.</li>';
            return;
        }
        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = `${item.producto} - ${item.cantidad} ${item.unidad || ''} (${item.supermercado || 'N/A'}) - ${item.precio ? item.precio + '€' : 'Sin precio'}`;
            itemList.appendChild(li);
        });
    };

    // Función para añadir un nuevo producto
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newItem = {
            producto: document.getElementById('producto').value,
            supermercado: document.getElementById('supermercado').value,
            precio: document.getElementById('precio').value,
            cantidad: document.getElementById('cantidad').value,
            unidad: document.getElementById('unidad').value,
            categoria: document.getElementById('categoria').value,
            fecha: new Date().toLocaleDateString('es-ES') // Añadimos la fecha actual
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newItem)
            });
            
            // Después de añadir, recargamos la lista
            loadItems();
            form.reset(); // Limpiamos el formulario

        } catch (error) {
            console.error('Error al añadir el producto:', error);
        }
    });

    // Carga inicial de los productos
    loadItems();
});