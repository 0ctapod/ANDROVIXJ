// =========================================================
// mi-cuenta.js — ANDROVIX-J
// ---------------------------------------------------------
// Panel de usuario: muestra datos de sesión e historial
// de pedidos con sus ítems.
//
// Endpoints:
//   GET /pedidos/usuario/{usuarioId}        → lista de pedidos
//   GET /producto-pedido/pedido/{pedidoId}  → ítems de cada pedido
//
// Constantes globales: API_URL, CLAVE_TOKEN, CLAVE_SESION → config.js
// Modales: mostrarAlertaModal → components.js
// =========================================================

// ── Protección de página ─────────────────────────────────

function protegerPagina() {
    const token  = localStorage.getItem(CLAVE_TOKEN);
    const sesion = obtenerSesion();
    if (!token || !sesion) {
        window.location.href = "login.html";
    }
}

// ── Datos del usuario ────────────────────────────────────

function mostrarDatosUsuario() {
    const sesion = obtenerSesion();
    if (!sesion) return;

    document.getElementById("cuenta-nombre").textContent    = sesion.nombreCompleto;
    document.getElementById("cuenta-email").textContent     = sesion.email;
    document.getElementById("cuenta-telefono").textContent  = sesion.telefono ?? "—";
    document.getElementById("cuenta-rol").textContent       = sesion.rol === "ADMIN" ? "Administrador" : "Cliente";
}

// ── Formateo ─────────────────────────────────────────────

function formatearPrecio(precio) {
    return `$ ${Number(precio).toLocaleString("es-CO")}`;
}

function formatearFecha(fechaStr) {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });
}

// ── Ítems de un pedido ───────────────────────────────────

async function cargarItemsPedido(pedidoId, contenedor) {
    const token = localStorage.getItem(CLAVE_TOKEN);

    try {
        const response = await fetch(`${API_URL}/producto-pedido/pedido/${pedidoId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(response.status);

        const items = await response.json();

        if (items.length === 0) {
            contenedor.innerHTML = `<p class="pedido-item__cargando">Sin productos registrados.</p>`;
            return;
        }

        contenedor.innerHTML = items.map(item => `
            <div class="pedido-producto">
                <span class="pedido-producto__nombre">${item.productoNombre ?? "Producto"}</span>
                <span class="pedido-producto__cantidad">x${item.cantidad}</span>
                <span class="pedido-producto__precio">${formatearPrecio(item.precioUnitario)}</span>
            </div>
        `).join("");

    } catch {
        contenedor.innerHTML = `<p class="pedido-item__cargando">No se pudieron cargar los productos.</p>`;
    }
}

// ── Renderizado de un pedido ─────────────────────────────

function crearTarjetaPedido(pedido) {
    const article = document.createElement("article");
    article.className = "pedido-item";
    article.innerHTML = `
        <div class="pedido-item__cabecera">
            <span class="pedido-item__id">Pedido #${pedido.idPedido}</span>
            <span class="pedido-item__fecha">${formatearFecha(pedido.fecha)}</span>
            <span class="pedido-item__estado estado--${pedido.estado}">${pedido.estado}</span>
            <span class="pedido-item__total">${formatearPrecio(pedido.total)}</span>
        </div>
        <div class="pedido-item__productos">
            <p class="pedido-item__cargando">Cargando productos...</p>
        </div>
    `;

    const contenedorProductos = article.querySelector(".pedido-item__productos");
    cargarItemsPedido(pedido.idPedido, contenedorProductos);

    return article;
}

// ── Lista de pedidos ─────────────────────────────────────

async function cargarPedidos() {
    const contenedor = document.getElementById("lista-pedidos");
    const sesion     = obtenerSesion();
    const token      = localStorage.getItem(CLAVE_TOKEN);

    try {
        const response = await fetch(`${API_URL}/pedidos/usuario/${sesion.idUsuario}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(response.status);

        const pedidos = await response.json();
        contenedor.innerHTML = "";

        if (pedidos.length === 0) {
            contenedor.innerHTML = `<p class="lista-pedidos__estado">Aún no tienes pedidos registrados.</p>`;
            return;
        }

        // Ordenar del más reciente al más antiguo
        pedidos
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .forEach(pedido => contenedor.appendChild(crearTarjetaPedido(pedido)));

    } catch {
        contenedor.innerHTML = `<p class="lista-pedidos__estado" style="color:var(--color-neon-rosa)">
            No se pudieron cargar los pedidos. Intenta más tarde.
        </p>`;
    }
}

// ── Arranque ─────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
    protegerPagina();
    mostrarDatosUsuario();
    cargarPedidos();
});
