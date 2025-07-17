# Proyecto "lo-compro"

Este proyecto se gestionará utilizando un repositorio en GitHub. El usuario tiene una cuenta de GitHub para este propósito.

## Descripción del Proyecto

El objetivo es desarrollar una aplicación web sencilla, diseñada con un enfoque "mobile-first" para asegurar una excelente visualización y funcionalidad en dispositivos móviles. La aplicación permite llevar un registro de precios de productos de supermercado.

## Arquitectura y Flujo de Datos

*   **Frontend:** La aplicación está construida con HTML, CSS (utilizando Bootstrap para el diseño responsivo) y JavaScript nativo. La interfaz es una Single Page Application (SPA) que se actualiza dinámicamente.
*   **Backend (Base de Datos):** Se utiliza **Firebase Realtime Database** para almacenar y sincronizar los datos de los productos en tiempo real.
*   **Configuración:** Las credenciales y la configuración de la conexión a Firebase se encuentran en el archivo `config.js`.
*   **Lógica de la Aplicación:** El archivo `script.js` contiene toda la lógica para inicializar Firebase, gestionar los datos (añadir, leer, eliminar), renderizar la interfaz y manejar toda la interacción del usuario.
*   **Gestos Táctiles:** Se utiliza la librería **Hammer.js** para la detección de gestos de deslizamiento (swipe) en la lista de productos, permitiendo acciones como editar o borrar.

## Despliegue

*   **Despliegue:** La aplicación se despliega en GitHub Pages y está disponible en https://locompro.artiles.org/

## Flujo de Trabajo para Subir Cambios

Para asegurar que la versión visible en la aplicación siempre corresponde al último cambio subido, se sigue un proceso en dos pasos:

1.  **Subir el cambio principal:**
    *   Añadir los archivos modificados (`git add`).
    *   Crear un commit descriptivo (ej. `fix: Corregir error X`) (`git commit`).
    *   Subir los cambios a GitHub (`git push`).

2.  **Actualizar el hash de la versión en Firebase:**
    *   Justo después del `push`, obtener el identificador corto del commit recién subido (ej. `a1b2c3d`).
    *   Actualizar el hash en la base de datos de Firebase ejecutando un comando `curl` para escribir el nuevo hash en la ruta `/config/versionHash`.

## Gestión de Datos de Prueba

El repositorio incluye dos scripts de Python para gestionar datos de prueba en la base de datos de Firebase. Estos scripts requieren que las dependencias del archivo `requirements.txt` estén instaladas en un entorno virtual.

*   **`add_dummy_data.py`**: Genera y añade un conjunto de ~70-80 productos de prueba realistas. Los datos se crean en grupos (ej. múltiples registros para "Leche Entera" con precios y fechas variables) para permitir la prueba de funcionalidades como el cálculo del precio medio.
    *   **Uso**: `venv/bin/python3 add_dummy_data.py`

*   **`delete_dummy_data.py`**: Busca y elimina todos los productos de la base de datos cuyo nombre comience con el prefijo "Dummy".
    *   **Uso**: `venv/bin/python3 delete_dummy_data.py`

## Problemas Recurrentes y Lecciones Aprendidas

- **Botón Flotante (FAB) y conflictos de CSS:** Se ha perdido el estilo del botón flotante (`.fab-button`) en múltiples ocasiones, especialmente tras resoluciones de conflictos en `style.css`. Es crucial verificar siempre que los estilos de `position: fixed`, `bottom`, `right`, `width`, `height`, `border-radius`, `background-color`, `color`, `font-size`, `padding`, `display`, `justify-content`, `align-items`, `border`, `box-shadow` y `z-index` para `.fab-button` estén presentes y correctos después de cualquier operación de Git que afecte a `style.css`.

- **Caché de CSS:** Los cambios en `style.css` a veces no se reflejan inmediatamente debido a la caché del navegador. Es fundamental añadir un parámetro de versión (`?v=HASH_DEL_COMMIT`) al enlace de `style.css` en `index.html` para forzar la recarga del archivo y asegurar que los estilos más recientes se apliquen correctamente.

- **Estilos de botones de supermercado (círculos):** Los botones de selección de supermercado (clase `.supermarket-btn`) pierden su forma circular y estilos de tamaño/color. Esto puede deberse a conflictos de especificidad con las reglas de Bootstrap o a la sobrescritadura por otras reglas CSS. Es vital asegurar que las propiedades `width`, `height`, `border-radius`, `display`, `justify-content`, `align-items`, `font-weight`, `color`, `border`, `transition` y `font-size` se apliquen correctamente, posiblemente requiriendo mayor especificidad o el uso de `!important` como medida temporal para diagnóstico.