/*
 * =========================================================
 *  ANDROVIX-J | CATÁLOGO DE PRODUCTOS
 * =========================================================
 *  - Carga productos desde GET /productos (API REST).
 *  - Los inserta en el catálogo con sus datos reales.
 *  - Gestiona los filtros por categoría.
 *
 *  El carrito sigue viviendo en carrito.js (sin cambios en
 *  esa lógica, salvo que finalizarCompra ya llama a la API).
 *
 *  Constantes globales: API_URL viene de config.js
 * =========================================================
 */

// ── Utilidades ───────────────────────────────────────────────────────────────

/**
 * La API puede devolver una URL completa o solo el nombre del archivo.
 * Esta función normaliza ambos casos.
 */
function obtenerRutaImagen(imagenUrl) {
    if (!imagenUrl) return "../assets/img/placeholder.jpg";
    if (imagenUrl.startsWith("http")) return imagenUrl;
    return `../assets/img/productos/${imagenUrl}`;
}

function formatearPrecio(precio) {
    return `$ ${Number(precio).toLocaleString("es-CO")}`;
}

// ── Construcción de tarjetas ─────────────────────────────────────────────────

/**
 * Genera el HTML de una tarjeta de producto.
 *
 * Se agrega data-producto-id con el ID real de la BD.
 * carrito.js lo lee para asociar cada ítem del carrito
 * con su producto real al momento de finalizar la compra.
 */
function crearCardProducto(producto) {
    const rutaImagen = obtenerRutaImagen(producto.imagenUrl);

    return `
        <div class="col-12 col-md-6 col-xl-4" data-categoria="${producto.categoria}">
            <article class="tarjeta-producto" data-producto-id="${producto.idProducto}">
                <img src="${rutaImagen}" alt="${producto.nombre}">
                <div class="contenido-tarjeta-producto">
                    <span class="categoria-producto">${producto.categoria}</span>
                    <h3 class="nombre-producto">${producto.nombre}</h3>
                    <p class="descripcion-producto">${producto.descripcion}</p>
                    <div class="pie-producto">
                        <span class="precio-producto">${formatearPrecio(producto.precio)}</span>
                        <button class="boton-carrito" type="button">Agregar al carrito</button>
                    </div>
                </div>
            </article>
        </div>
    `;
}

// ── Carga de productos desde la API ─────────────────────────────────────────

async function renderizarProductos() {
    const contenedor = document.getElementById("contenedor-productos-catalogo");
    if (!contenedor) return;

    // Estado de carga: le avisamos al usuario que estamos trayendo los productos
    contenedor.insertAdjacentHTML("beforeend", `
        <div id="cargando-productos" class="col-12 text-center py-4">
            <p class="text-secondary">Cargando productos...</p>
        </div>
    `);

    try {
        const response = await fetch(`${API_URL}/productos`);

        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
        }

        const productos = await response.json();

        // Removemos el indicador de carga antes de insertar las tarjetas
        document.getElementById("cargando-productos")?.remove();

        if (productos.length === 0) {
            contenedor.insertAdjacentHTML("beforeend", `
                <div class="col-12 text-center py-4">
                    <p class="text-secondary">No hay productos disponibles por el momento.</p>
                </div>
            `);
            return;
        }

        contenedor.insertAdjacentHTML(
            "beforeend",
            productos.map(crearCardProducto).join("")
        );

    } catch (error) {
        document.getElementById("cargando-productos")?.remove();
        console.error("Error al cargar productos:", error);

        contenedor.insertAdjacentHTML("beforeend", `
            <div class="col-12 text-center py-4">
                <p class="text-danger">No se pudieron cargar los productos. ¿Está corriendo el backend?</p>
            </div>
        `);
    }
}

// ── Filtros por categoría ────────────────────────────────────────────────────

function aplicarFiltro(categoria) {
    const cols = document.querySelectorAll("#contenedor-productos-catalogo > [data-categoria]");
    let visibles = 0;

    cols.forEach(col => {
        const visible = categoria === "Todos" || col.dataset.categoria === categoria;
        col.hidden = !visible;
        if (visible) visibles++;
    });

    const sinResultados = document.getElementById("sin-resultados");
    if (sinResultados) {
        sinResultados.textContent = visibles === 0
            ? `No hay productos en la categoría "${categoria}".`
            : "";
        sinResultados.hidden = visibles > 0;
    }
}

function inicializarFiltros() {
    const botones = document.querySelectorAll(".filtro-btn");

    botones.forEach(boton => {
        boton.addEventListener("click", () => {
            botones.forEach(b => {
                b.classList.remove("filtro-btn--activo");
                b.setAttribute("aria-pressed", "false");
            });
            boton.classList.add("filtro-btn--activo");
            boton.setAttribute("aria-pressed", "true");
            aplicarFiltro(boton.dataset.categoria);
        });
    });

    // Activar filtro automático si viene ?categoria= en la URL
    const params       = new URLSearchParams(window.location.search);
    const categoriaUrl = params.get("categoria");

    if (categoriaUrl) {
        const botonTarget = [...botones].find(b => b.dataset.categoria === categoriaUrl);
        if (botonTarget) {
            botonTarget.click();
            return;
        }
    }

    aplicarFiltro("Todos");
}

// ── Inicialización ───────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
    await renderizarProductos();  // esperar a que los productos estén en el DOM
    inicializarFiltros();          // luego aplicar el filtro (necesita las tarjetas ya renderizadas)
});
