async function cargarComponente(idContenedor, rutaComponente) {
    const contenedor = document.getElementById(idContenedor);

    if (!contenedor) {
        return;
    }

    try {
        const respuesta = await fetch(rutaComponente);

        if (!respuesta.ok) {
            throw new Error(`No se pudo cargar ${rutaComponente}`);
        }

        contenedor.innerHTML = await respuesta.text();
    } catch (error) {
        console.error(`Error cargando componente ${rutaComponente}:`, error);
    }
}

function actualizarContadorCarrito() {
    const badge = document.getElementById("cartCounterNavBar");
    if (!badge) return;

    try {
        const carrito = JSON.parse(localStorage.getItem("androvix_carrito") || "[]");
        const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
        badge.textContent = total;
        badge.hidden = total === 0;
    } catch {
        badge.hidden = true;
    }
}

function actualizarIconoUsuario() {
    const icono = document.getElementById("icono-usuario");
    if (!icono) return;

    const sesion = sessionStorage.getItem("androvix_sesion");

    if (sesion) {
        icono.setAttribute("aria-label", "Cerrar sesión");
        icono.querySelector("i").className = "fa-solid fa-right-from-bracket fs-5";
        icono.addEventListener("click", (e) => {
            e.preventDefault();
            sessionStorage.removeItem("androvix_sesion");
            window.location.href = "login.html";
        });
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await cargarComponente("contenedor-navbar", "../componentes/navbar.html");
    actualizarIconoUsuario();
    actualizarContadorCarrito();
    cargarComponente("contenedor-footer", "../componentes/footer.html");
});
