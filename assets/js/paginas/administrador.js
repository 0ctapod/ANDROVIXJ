// =========================================================
// administrador.js — ANDROVIX-J
// ---------------------------------------------------------
// Gestión de productos desde el panel de administrador.
//
// Funciones:
//   - Proteger la página: solo accesible con rol ADMIN.
//   - Crear producto   → POST /productos
//   - Editar producto  → PUT  /productos/{id}
//   - Listar productos → GET  /productos
//   - Eliminar producto → DELETE /productos/{id}
//   - Previsualización de tarjeta en tiempo real
//
// Constantes globales: API_URL, CLAVE_TOKEN, CLAVE_SESION → config.js
// Modales: mostrarAlertaModal, mostrarConfirmacionModal → components.js
// =========================================================


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

// ── Cache de productos en memoria ────────────────────────────────────────────
// Evita guardar datos con comillas u otros caracteres especiales en atributos HTML.

const cachProductos = new Map();

// ── Lista de productos ───────────────────────────────────────────────────────

function crearFilaProducto(producto) {
    cachProductos.set(String(producto.idProducto), producto);
    const categoria = producto.categoria;
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
            <div class="producto-admin-acciones">
                <button
                    class="boton-editar-producto"
                    data-id="${producto.idProducto}"
                    aria-label="Editar ${producto.nombre}">
                    <i class="fa-regular fa-pen-to-square" aria-hidden="true"></i>
                </button>
                <button
                    class="boton-eliminar-producto"
                    data-id="${producto.idProducto}"
                    aria-label="Eliminar ${producto.nombre}">
                    <i class="fa-regular fa-trash-can" aria-hidden="true"></i>
                </button>
            </div>
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
        contenedor.innerHTML = `<p class="lista-productos-admin__vacio">No hay productos registrados aún.</p>`;
        return;
    }

    contenedor.innerHTML = `
        <p class="lista-productos-admin__contador">${productos.length} producto${productos.length !== 1 ? "s" : ""}</p>
        ${productos.map(crearFilaProducto).join("")}`;
}

// ── Modo edición ─────────────────────────────────────────────────────────────

let productoEnEdicion = null;

function activarModoEdicion(boton) {
    const producto = cachProductos.get(boton.dataset.id);
    if (!producto) return;
    productoEnEdicion = { id: producto.idProducto };

    document.getElementById("inputNombreProducto").value      = producto.nombre;
    document.getElementById("inputCategoriaProducto").value   = producto.categoria;
    document.getElementById("inputPrecioProducto").value      = producto.precio;
    document.getElementById("inputStockProducto").value       = producto.stock;
    document.getElementById("inputImagenProducto").value      = producto.imagenUrl;
    document.getElementById("inputDescripcionProducto").value = producto.descripcion;

    document.getElementById("boton-submit-admin").textContent       = "Actualizar producto";
    document.getElementById("boton-cancelar-edicion").hidden        = false;
    document.getElementById("formulario-producto").scrollIntoView({ behavior: "smooth", block: "start" });

    actualizarPrevia();
    mostrarMensajeFormulario("Editando: " + producto.nombre);
}

function cancelarEdicion() {
    productoEnEdicion = null;
    document.getElementById("formulario-producto").reset();
    document.getElementById("boton-submit-admin").textContent = "Guardar producto";
    document.getElementById("boton-cancelar-edicion").hidden  = true;
    mostrarMensajeFormulario("");
    actualizarPrevia();
}

// ── Eliminación ──────────────────────────────────────────────────────────────

async function eliminarProducto(id) {
    const producto = cachProductos.get(id);
    const nombre   = producto?.nombre ?? "este producto";
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

        if (response.status === 409) {
            await mostrarAlertaModal(
                `<strong>${nombre}</strong> no puede eliminarse porque tiene pedidos asociados.`,
                "warning"
            );
            return;
        }

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

        const esEdicion = productoEnEdicion !== null;
        const url       = esEdicion ? `${API_URL}/productos/${productoEnEdicion.id}` : `${API_URL}/productos`;
        const metodo    = esEdicion ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method:  metodo,
                headers: obtenerHeaders(),
                body:    JSON.stringify(producto)
            });

            if (response.ok || response.status === 201) {
                const mensaje = esEdicion ? "Producto actualizado correctamente." : "Producto guardado correctamente.";
                mostrarMensajeFormulario(mensaje);
                cancelarEdicion();
                cargarListaProductos();

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
            boton.textContent = esEdicion ? "Actualizar producto" : "Guardar producto";
        }
    });
}

// ── Delegación de eventos para eliminar ─────────────────────────────────────

function inicializarListaProductos() {
    const contenedor = document.getElementById("lista-productos-admin");
    if (!contenedor) return;

    contenedor.addEventListener("click", (evento) => {
        const botonEliminar = evento.target.closest(".boton-eliminar-producto");
        const botonEditar   = evento.target.closest(".boton-editar-producto");

        if (botonEliminar) {
            eliminarProducto(botonEliminar.dataset.id);
        }
        if (botonEditar) {
            activarModoEdicion(botonEditar);
        }
    });

    document.getElementById("boton-cancelar-edicion")
        ?.addEventListener("click", cancelarEdicion);
}

// ── Previsualización de tarjeta ──────────────────────────────────────────────

function actualizarPrevia() {
    const nombre      = document.getElementById("inputNombreProducto").value.trim();
    const categoria   = document.getElementById("inputCategoriaProducto").value;
    const precio      = Number(document.getElementById("inputPrecioProducto").value);
    const imagen      = document.getElementById("inputImagenProducto").value.trim();
    const descripcion = document.getElementById("inputDescripcionProducto").value.trim();

    const contenedor = document.getElementById("previa-tarjeta");
    const vacio      = document.getElementById("previa-vacio");

    const hayDatos = nombre || categoria || imagen || descripcion || precio;

    if (!hayDatos) {
        contenedor.hidden = true;
        vacio.hidden      = false;
        return;
    }

    contenedor.hidden = false;
    vacio.hidden      = true;

    const categoriaFormateada = categoria || "Categoría";
    const precioFormateado    = precio > 0 ? formatearPrecio(precio) : "$ —";
    const rutaImagen          = imagen
        ? `../assets/img/productos/${imagen}`
        : null;

    contenedor.innerHTML = `
        <article class="tarjeta-producto">
            ${rutaImagen
                ? `<img src="${rutaImagen}" alt="${nombre || 'Producto'}"
                        onerror="this.style.display='none';this.nextElementSibling.hidden=false">`
                : ""}
            <div class="previa-sin-imagen" ${rutaImagen ? "hidden" : ""}>
                <i class="fa-regular fa-image" aria-hidden="true"></i>
            </div>
            <div class="contenido-tarjeta-producto">
                <span class="categoria-producto">${categoriaFormateada}</span>
                <h3 class="nombre-producto">${nombre || "Nombre del producto"}</h3>
                <p class="descripcion-producto">${descripcion || "Descripción del producto..."}</p>
                <div class="pie-producto">
                    <span class="precio-producto">${precioFormateado}</span>
                    <button class="boton-carrito" type="button" disabled>
                        <i class="fa-solid fa-cart-shopping me-2" aria-hidden="true"></i>
                        Agregar al carrito
                    </button>
                </div>
            </div>
        </article>`;
}

function inicializarPrevia() {
    const campos = [
        "inputNombreProducto",
        "inputCategoriaProducto",
        "inputPrecioProducto",
        "inputImagenProducto",
        "inputDescripcionProducto"
    ];
    campos.forEach(id => {
        document.getElementById(id)?.addEventListener("input", actualizarPrevia);
    });
}

// ── Arranque ─────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
    protegerPagina();
    inicializarFormulario();
    inicializarListaProductos();
    inicializarPrevia();
    cargarListaProductos();
});
