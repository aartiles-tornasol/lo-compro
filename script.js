document.addEventListener('DOMContentLoaded', () => {
    // Inicializar Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    const itemsRef = database.ref('items');

    const form = document.getElementById('add-item-form');
    const itemList = document.getElementById('item-list');

    // Función para mostrar los productos en la lista
    const renderItems = (items) => {
        itemList.innerHTML = ''; // Limpiar la lista actual
        if (!items) {
            itemList.innerHTML = '<li class="list-group-item">No hay productos en la lista.</li>';
            return;
        }
        Object.values(items).forEach(item => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = `${item.producto} - ${item.cantidad} ${item.unidad || ''} (${item.supermercado || 'N/A'}) - ${item.precio ? item.precio + '€' : 'Sin precio'}`;
            itemList.appendChild(li);
        });
    };

    // Escuchar cambios en la base de datos en tiempo real
    itemsRef.on('value', (snapshot) => {
        const data = snapshot.val();
        renderItems(data);
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
            fecha: new Date().toLocaleDateString('es-ES')
        };

        // Guardar el nuevo item en Firebase
        itemsRef.push(newItem);

        form.reset(); // Limpiamos el formulario
    });
});