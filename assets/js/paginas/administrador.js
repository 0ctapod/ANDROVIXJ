// =========================================================
// administrador.js — ANDROVIX-J
// ---------------------------------------------------------
// Gestión de productos desde el panel de administrador.
//
// Funciones:
//   - Proteger la página: solo accesible con rol ADMIN.
//   - Crear producto → POST /productos
//   - Listar productos → GET /productos
//   - Eliminar producto → DELETE /productos/{id}
//
// Constantes globales: API_URL, CLAVE_TOKEN, CLAVE_SESION → config.js
// Modales: mostrarAlertaModal, mostrarConfirmacionModal → components.js
// =========================================================

// ── Mapa de categoría para mostrar en la lista ───────────────────────────────
const FORMATO_CATEGORIA = {
    CAMISETAS:  "Camisetas",
    CHAQUETAS:  "Chaquetas",
    PANTALONES: "Pantalones",
    CALZADO:    "Calzado",
    ACCESORIOS: "Accesorios"
};

function formatearCategoria(categoria) {
    return FORMATO_CATEGORIA[categoria] || categoria;
}

function formatearPrecio(precio) {
    return `$ ${Number(precio).toLocaleString("es-CO")}`;
}

// ── Protección de página ─────────────────────────────────────────────────────

/**
 * Verifica que haya sesión activa con rol ADMIN.
 * Si no, redirige al login. Así protegemos la ruta en el frontend.
 *
 * Nota: el backend también requiere JWT con ROLE_ADMIN para los
 * endpoints de escritura, así que hay doble protección.
 */
function protegerPagina() {
    const token  = localStorage.getItem(CLAVE_TOKEN);
    const sesion = JSON.parse(localStorage.getItem(CLAVE_SESION) || "{}");

    if (!token || sesion.rol !== "ADMIN") {
        window.location.href = "login.html";
    }
}

// ── Cabeceras comunes para requests autenticados ─────────────────────────────

function obtenerHeaders() {
    const token = localStorage.getItem(CLAVE_TOKEN);
    return {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${token}`
    };
}

// ── Lista de productos ───────────────────────────────────────────────────────

function crearFilaProducto(producto) {
    const categoria = formatearCategoria(producto.categoria);
    return `
        <div class="producto-admin-item" data-id="${producto.idProducto}">
            <div class="producto-admin-info">
                <span class="producto-admin-categoria">${categoria}</span>
                <p class="producto-admin-nombre">${producto.nombre}</p>
                <div class="producto-admin-meta">
                    <span class="producto-admin-precio">${formatearPrecio(producto.precio)}</span>
                    <span class="producto-admin-stock">Stock: ${producto.stock}</span>
                </div>
            </div>
            <button
                class="boton-eliminar-producto"
                data-id="${producto.idProducto}"
                data-nombre="${producto.nombre}"
                aria-label="Eliminar ${producto.nombre}">
                <i class="fa-regular fa-trash-can" aria-hidden="true"></i>
            </button>
        </div>
    `;
}

async function cargarListaProductos() {
    const contenedor = document.getElementById("lista-productos-admin");
    if (!contenedor) return;

    try {
        const response = await fetch(`${API_URL}/productos`);
        if (!response.ok) throw new Error(response.status);

        const productos = await response.json();
        renderizarListaProductos(contenedor, productos);

    } catch (error) {
        console.error("Error al cargar productos:", error);
        contenedor.innerHTML = `
            <p class="lista-productos-admin__vacio" style="color:var(--color-neon-rosa)">
                No se pudieron cargar los productos.
            </p>`;
    }
}

function renderizarListaProductos(contenedor, productos) {
    if (productos.length === 0) {
        contenedor.innerHTML = `
            <h3 class="lista-productos-admin__titulo">Productos registrados</h3>
            <p class="lista-productos-admin__vacio">No hay productos registrados aún.</p>`;
        return;
    }

    contenedor.innerHTML = `
        <h3 class="lista-productos-admin__titulo">
            Productos registrados
            <span style="font-size:0.8rem;font-weight:400;color:var(--color-texto-secundario);margin-left:0.5rem">
                (${productos.length})
            </span>
        </h3>
        ${productos.map(crearFilaProducto).join("")}`;
}

// ── Eliminación ──────────────────────────────────────────────────────────────

async function eliminarProducto(id, nombre) {
    const confirmado = await mostrarConfirmacionModal(
        `¿Seguro que deseas eliminar <strong>${nombre}</strong>?<br>
         Esta acción no se puede deshacer.`,
        "Eliminar producto",
        "fa-solid fa-triangle-exclamation"
    );
    if (!confirmado) return;

    try {
        const response = await fetch(`${API_URL}/productos/${id}`, {
            method:  "DELETE",
            headers: obtenerHeaders()
        });

        if (!response.ok) throw new Error(response.status);

        await mostrarAlertaModal(
            `El producto <strong>${nombre}</strong> fue eliminado correctamente.`,
            "success"
        );
        cargarListaProductos();

    } catch (error) {
        console.error("Error al eliminar producto:", error);
        await mostrarAlertaModal("No se pudo eliminar el producto. Intenta de nuevo.", "error");
    }
}

// ── Creación de producto ─────────────────────────────────────────────────────

function construirBodyProducto(formulario) {
    const datos = new FormData(formulario);
    return {
        nombre:      datos.get("nombre").trim(),
        descripcion: datos.get("descripcion").trim(),
        precio:      Number(datos.get("precio")),
        stock:       Number(datos.get("stock")),
        categoria:   datos.get("categoria"),   // ya llega en MAYÚSCULAS desde el select
        imagenUrl:   datos.get("imagen").trim()
    };
}

function validarProducto(producto) {
    if (!producto.nombre || !producto.categoria || !producto.imagenUrl || !producto.descripcion) {
        return "Todos los campos son obligatorios.";
    }
    if (Number.isNaN(producto.precio) || producto.precio < 0) {
        return "El precio debe ser un número válido mayor o igual a 0.";
    }
    if (Number.isNaN(producto.stock) || producto.stock < 0) {
        return "El stock debe ser un número válido mayor o igual a 0.";
    }
    return "";
}

function mostrarMensajeFormulario(mensaje, esError = false) {
    const el = document.getElementById("mensaje-admin");
    if (!el) return;
    el.textContent = mensaje;
    el.style.color = esError ? "var(--color-neon-rosa)" : "var(--color-neon-cian)";
}

// ── Inicialización del formulario ────────────────────────────────────────────

function inicializarFormulario() {
    const formulario = document.getElementById("formulario-producto");
    if (!formulario) return;

    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        mostrarMensajeFormulario("");

        const producto = construirBodyProducto(formulario);
        const error    = validarProducto(producto);

        if (error) {
            mostrarMensajeFormulario(error, true);
            return;
        }

        const boton = formulario.querySelector('[type="submit"]');
        boton.disabled     = true;
        boton.textContent  = "Guardando...";

        try {
            const response = await fetch(`${API_URL}/productos`, {
                method:  "POST",
                headers: obtenerHeaders(),
                body:    JSON.stringify(producto)
            });

            if (response.status === 201 || response.ok) {
                mostrarMensajeFormulario("Producto guardado correctamente.");
                formulario.reset();
                cargarListaProductos();   // actualizar la lista automáticamente

            } else if (response.status === 403) {
                mostrarMensajeFormulario("Sin permisos. ¿Tu sesión sigue activa?", true);
            } else {
                mostrarMensajeFormulario(`Error del servidor: ${response.status}`, true);
            }

        } catch (err) {
            console.error("Error al guardar producto:", err);
            mostrarMensajeFormulario("No se pudo conectar con el servidor.", true);

        } finally {
            boton.disabled    = false;
            boton.textContent = "Guardar producto";
        }
    });
}

// ── Delegación de eventos para eliminar ─────────────────────────────────────

function inicializarListaProductos() {
    const contenedor = document.getElementById("lista-productos-admin");
    if (!contenedor) return;

    // Event delegation: un solo listener para todos los botones de eliminar,
    // incluyendo los que se crean después de cargar la lista.
    contenedor.addEventListener("click", (evento) => {
        const boton = evento.target.closest(".boton-eliminar-producto");
        if (!boton) return;

        const id     = boton.dataset.id;
        const nombre = boton.dataset.nombre;
        eliminarProducto(id, nombre);
    });
}

// ── Arranque ─────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
    protegerPagina();
    inicializarFormulario();
    inicializarListaProductos();
    cargarListaProductos();
});
