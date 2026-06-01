/*
 * =========================================================
 *  ANDROVIX-J | PRODUCTOS DINÁMICOS DEL CATÁLOGO
 * =========================================================
 *  Este archivo solo se encarga de:
 *  - Leer productos creados desde administrador.
 *  - Insertarlos en el catálogo.
 *
 *  La lógica del carrito vive en carrito.js.
 * =========================================================
 */

const CLAVE_PRODUCTOS = "androvix_productos";

function obtenerProductosGuardados() {
    const productosGuardados = localStorage.getItem(CLAVE_PRODUCTOS);

    if (!productosGuardados) {
        return [];
    }

    try {
        return JSON.parse(productosGuardados);
    } catch (error) {
        console.error("Error al leer productos desde localStorage:", error);
        return [];
    }
}

function formatearPrecio(precio) {
    return `$ ${Number(precio).toLocaleString("es-CO")}`;
}

function crearCardProducto(producto) {
    return `
        <div class="col-12 col-md-6 col-xl-4" data-categoria="${producto.categoria}">
            <article class="tarjeta-producto">
                <img src="../assets/img/productos/${producto.imagen}" alt="${producto.nombre}">
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

function renderizarProductosDinamicos() {
    const contenedor = document.getElementById("contenedor-productos-catalogo");

    if (!contenedor) {
        return;
    }

    const productos = obtenerProductosGuardados();

    if (productos.length === 0) {
        return;
    }

    contenedor.insertAdjacentHTML("beforeend", productos.map(crearCardProducto).join(""));
}

// ---------------------------------------------------------
// FILTRO DE CATEGORÍAS
// ---------------------------------------------------------

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

    // Leer ?categoria= de la URL para activar filtro automáticamente
    const params = new URLSearchParams(window.location.search);
    const categoriaParam = params.get("categoria");

    if (categoriaParam) {
        const botonTarget = [...botones].find(b => b.dataset.categoria === categoriaParam);
        if (botonTarget) {
            botonTarget.click();
            return;
        }
    }

    aplicarFiltro("Todos");
}

document.addEventListener("DOMContentLoaded", () => {
    renderizarProductosDinamicos();
    inicializarFiltros();
});