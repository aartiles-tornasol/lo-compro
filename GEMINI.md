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

Para asegurar que la versión visible en la aplicación siempre corresponde al último cambio subido, se debe seguir el siguiente proceso **obligatorio** en dos fases:

**Fase 1: Subir el cambio principal**
1.  Añadir los archivos modificados (`git add`).
2.  Crear un commit descriptivo (ej. `fix: Corregir error X`) (`git commit`).
3.  Subir los cambios a GitHub (`git push`).

**Fase 2: Actualizar y subir el hash de la versión**
4.  **Obtener el hash del último commit:** Justo después del `push`, obtener el identificador corto del commit recién subido.
5.  **Actualizar `script.js`:** Reemplazar el valor de la constante `commitHash` en el archivo `script.js` con el nuevo hash.
6.  **Subir la actualización del hash:** Crear un segundo commit (ej. `chore: Actualizar hash de commit`) y subirlo (`git add script.js && git commit ... && git push`).

## Problemas Recurrentes y Lecciones Aprendidas

- **Botón Flotante (FAB) y conflictos de CSS:** Se ha perdido el estilo del botón flotante (`.fab-button`) en múltiples ocasiones, especialmente tras resoluciones de conflictos en `style.css`. Es crucial verificar siempre que los estilos de `position: fixed`, `bottom`, `right`, `width`, `height`, `border-radius`, `background-color`, `color`, `font-size`, `padding`, `display`, `justify-content`, `align-items`, `border`, `box-shadow` y `z-index` para `.fab-button` estén presentes y correctos después de cualquier operación de Git que afecte a `style.css`.

- **Caché de CSS:** Los cambios en `style.css` a veces no se reflejan inmediatamente debido a la caché del navegador. Es fundamental añadir un parámetro de versión (`?v=HASH_DEL_COMMIT`) al enlace de `style.css` en `index.html` para forzar la recarga del archivo y asegurar que los estilos más recientes se apliquen correctamente.

- **Estilos de botones de supermercado (círculos):** Los botones de selección de supermercado (clase `.supermarket-btn`) pierden su forma circular y estilos de tamaño/color. Esto puede deberse a conflictos de especificidad con las reglas de Bootstrap o a la sobrescritadura por otras reglas CSS. Es vital asegurar que las propiedades `width`, `height`, `border-radius`, `display`, `justify-content`, `align-items`, `font-weight`, `color`, `border`, `transition` y `font-size` se apliquen correctamente, posiblemente requiriendo mayor especificidad o el uso de `!important` como medida temporal para diagnóstico.