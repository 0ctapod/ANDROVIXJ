// =========================================================
// components.js — ANDROVIX-J
// Carga dinámica de navbar y footer, contador del carrito
// y gestión del icono de usuario (sesión / logout).
// =========================================================

// CLAVE_TOKEN y CLAVE_SESION vienen de config.js

// ── Carga de componentes HTML ────────────────────────────────────────────────

async function cargarComponente(idContenedor, rutaComponente) {
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;

    try {
        const respuesta = await fetch(rutaComponente);
        if (!respuesta.ok) throw new Error(`No se pudo cargar ${rutaComponente}`);
        contenedor.innerHTML = await respuesta.text();
    } catch (error) {
        console.error(`Error cargando componente ${rutaComponente}:`, error);
    }
}

// ── Contador del carrito ─────────────────────────────────────────────────────

function actualizarContadorCarrito() {
    const badge = document.getElementById("cartCounterNavBar");
    if (!badge) return;

    try {
        const carrito = JSON.parse(localStorage.getItem("androvix_carrito") || "[]");
        const total   = carrito.reduce((sum, item) => sum + item.cantidad, 0);
        badge.textContent = total;
        badge.hidden      = total === 0;
    } catch {
        badge.hidden = true;
    }
}

// ── Sesión ───────────────────────────────────────────────────────────────────

/**
 * Devuelve los datos de sesión guardados, o null si no hay sesión activa.
 */
function obtenerSesion() {
    const token = localStorage.getItem(CLAVE_TOKEN);
    if (!token) return null;

    try {
        return JSON.parse(localStorage.getItem(CLAVE_SESION));
    } catch {
        return null;
    }
}

/**
 * Elimina el token y los datos de sesión del localStorage.
 * Después redirige al login usando la ruta correcta según
 * en qué carpeta esté la página actual.
 */
function cerrarSesion() {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_SESION);

    // Detecta si estamos dentro de /paginas/ para usar la ruta relativa correcta.
    const enPaginas = window.location.pathname.includes("/paginas/");
    window.location.href = enPaginas ? "login.html" : "paginas/login.html";
}

// ── Icono de usuario en el navbar ────────────────────────────────────────────

/**
 * Actualiza el icono de usuario según el estado de la sesión:
 *   - Sin sesión: icono de persona → lleva al login.
 *   - Con sesión: muestra el nombre del usuario + icono de logout → cierra sesión.
 */
function actualizarIconoUsuario() {
    const icono = document.getElementById("icono-usuario");
    if (!icono) return;

    const sesion = obtenerSesion();

    if (!sesion) {
        // Sin sesión activa: el comportamiento por defecto del enlace (ir a login) se mantiene.
        icono.setAttribute("aria-label", "Iniciar sesión");
        return;
    }

    // Con sesión activa: cambiar el ícono a "cerrar sesión" y mostrar el nombre.
    icono.setAttribute("aria-label", `Cerrar sesión (${sesion.nombreCompleto})`);
    icono.setAttribute("title", `Sesión: ${sesion.nombreCompleto} · ${sesion.rol}`);

    const iconoEl = icono.querySelector("i");
    if (iconoEl) {
        iconoEl.className = "fa-solid fa-right-from-bracket fs-5";
    }

    // Al hacer clic se cierra la sesión en vez de navegar al href del enlace.
    icono.addEventListener("click", (e) => {
        e.preventDefault();
        cerrarSesion();
    });
}

// ── Inicialización ───────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
    await cargarComponente("contenedor-navbar", "../componentes/navbar.html");
    actualizarIconoUsuario();
    actualizarContadorCarrito();
    cargarComponente("contenedor-footer", "../componentes/footer.html");
});
