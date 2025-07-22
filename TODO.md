# TODO para el Proyecto lo-compro

## Resumen de lo Realizado hasta Ahora:

*   **Rama Git:** Hemos creado y trabajado en la rama `feat/firebase-auth`.
*   **Autenticación en `index.html`:**
    *   Se añadió el SDK de Firebase Authentication.
    *   Se incluyeron botones de "Login" y "Logout" y un espacio para mostrar el nombre del usuario.
*   **Lógica de Autenticación en `script.js`:**
    *   Se implementó el inicio de sesión con Google (`signInWithRedirect`) para evitar problemas de seguridad (COOP) en GitHub Pages.
    *   Se añadió lógica para manejar la redirección y el estado de autenticación (`onAuthStateChanged`).
*   **Documentación:** Se añadió una sección detallada en `GEMINI.md` explicando la configuración de seguridad y el flujo de autenticación.
*   **Reglas de Seguridad de Firebase:**
    *   Se actualizaron las reglas de la Realtime Database para permitir la lectura solo a usuarios autenticados (`.read: "auth != null"`).
    *   Se restringió la escritura a un UID específico (`.write: "auth != null && auth.uid === 'xid7ffAvNHWiIoqpc7dKl6CnhK73'"`).
*   **Problema Identificado:** La lógica actual en `script.js` intenta cargar datos de Firebase al inicio, lo cual falla con las nuevas reglas de seguridad si el usuario no está autenticado.
*   **Aclaración de UID:** Se confirmó que el UID `xid7ffAvNHWiIoqpc7dKl6CnhK73` está asociado al correo electrónico `alex@artiles.org` (usado para la creación manual). Sin embargo, la cuenta de Google que se usará para el login en la web es `alejandro.artiles@gmail.com`. Esto significa que cuando se inicie sesión con la cuenta de Google, se generará un **UID distinto** que será el que necesitemos para las reglas de escritura.

## Próximos Pasos:

1.  **Modificar `script.js` para Adaptarse a las Nuevas Reglas de Firebase:**
    *   Mover la inicialización de los listeners de datos de Firebase (`itemsRef.on('value', ...)`, `versionRef.on('value', ...)`) a funciones que solo se llamen cuando un usuario esté autenticado.
    *   Implementar funciones para iniciar (`startDataListeners()`) y detener (`stopDataListeners()`) estos listeners.
    *   Ajustar el callback `auth.onAuthStateChanged` para:
        *   Llamar a `startDataListeners()` cuando un usuario inicia sesión.
        *   Llamar a `stopDataListeners()` y limpiar la interfaz (lista de productos, formulario de añadir) cuando un usuario cierra sesión.
        *   Asegurar que la interfaz de usuario (lista de productos, formulario de añadir, buscador) se muestre u oculte apropiadamente según el estado de autenticación.
    *   **MUY IMPORTANTE:** Asegurarse de que el `console.log("Usuario autenticado. UID:", user.uid);` en `script.js` esté funcionando y sea visible en la consola del navegador cuando un usuario inicie sesión con Google. Este será el UID que necesitaremos.
2.  **Desplegar los Cambios de `script.js` a GitHub Pages.**
3.  **Usuario Inicia Sesión con Google y Proporciona el Nuevo UID:** Una vez desplegado, el usuario deberá iniciar sesión en la aplicación web con su cuenta de Google (`alejandro.artiles@gmail.com`) y copiar el UID que aparezca en la consola del navegador.
4.  **Actualizar Reglas de Firebase con el Nuevo UID:** Con el UID obtenido del login de Google, se actualizarán las reglas de escritura en la Realtime Database de Firebase para que solo ese UID tenga permisos de escritura.
5.  **Limpieza de Git:** Una vez que todo funcione correctamente, fusionar la rama `feat/firebase-auth` con la rama principal (`main` o `master`) y eliminar la rama de la característica.
