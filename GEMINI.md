# Proyecto "lo-compro"

Este proyecto se gestionará utilizando un repositorio en GitHub. El usuario tiene una cuenta de GitHub para este propósito.

## Descripción del Proyecto

El objetivo es desarrollar una aplicación web sencilla, diseñada con un enfoque "mobile-first" para asegurar una excelente visualización y funcionalidad en dispositivos móviles.

### Tecnologías Propuestas

*   **Frontend:** HTML, CSS (con Bootstrap para diseño responsivo), JavaScript.
*   **Backend:** Hoja de cálculo de Google (Google Sheet).
*   **Conectividad Backend:** Google Apps Script para lectura y escritura.
*   **Diseño:** Prioridad en la adaptabilidad y la experiencia de usuario en pantallas pequeñas.

## Problemas Recurrentes y Lecciones Aprendidas

- **Botón Flotante (FAB) y conflictos de CSS:** Se ha perdido el estilo del botón flotante (`.fab-button`) en múltiples ocasiones, especialmente tras resoluciones de conflictos en `style.css`. Es crucial verificar siempre que los estilos de `position: fixed`, `bottom`, `right`, `width`, `height`, `border-radius`, `background-color`, `color`, `font-size`, `padding`, `display`, `justify-content`, `align-items`, `border`, `box-shadow` y `z-index` para `.fab-button` estén presentes y correctos después de cualquier operación de Git que afecte a `style.css`.

- **Caché de CSS:** Los cambios en `style.css` a veces no se reflejan inmediatamente debido a la caché del navegador. Es fundamental añadir un parámetro de versión (`?v=HASH_DEL_COMMIT`) al enlace de `style.css` en `index.html` para forzar la recarga del archivo y asegurar que los estilos más recientes se apliquen correctamente.