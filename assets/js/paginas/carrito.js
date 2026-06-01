/*
 * =========================================================
 *  ANDROVIX-J | FUNCIONALIDAD DEL CARRITO
 * =========================================================
 *  Funciones:
 *  - Agregar productos desde el catálogo.
 *  - Aumentar y disminuir cantidades.
 *  - Eliminar productos con ícono.
 *  - Calcular total automáticamente.
 *  - Persistir carrito con localStorage.
 *  - Restaurar carrito al recargar la página.
 * =========================================================
 */

document.addEventListener("DOMContentLoaded", () => {
    const CLAVE_CARRITO = "androvix_carrito";

    const listaProductosCarrito = document.getElementById("listAddProducts");
    const contadorCarrito = document.getElementById("cartCounter");
    const totalCarrito = document.getElementById("totalCounter");
    const botonFinalizarCompra = document.getElementById("completePurchase");
    const mensajeCarritoVacio = document.getElementById("emptyCartMessage");

    let carrito = obtenerCarritoGuardado();

    if (!listaProductosCarrito || !contadorCarrito || !totalCarrito || !botonFinalizarCompra) {
        console.warn("Faltan elementos necesarios para inicializar el carrito.");
        return;
    }

    renderizarCarrito();

    /*
     * Delegación de eventos:
     * Escuchamos clicks en todo el documento para que también funcionen
     * los productos agregados dinámicamente desde administrador.
     */
    document.addEventListener("click", (evento) => {
        const botonAgregar = evento.target.closest(".boton-carrito");
        const botonCantidad = evento.target.closest(".agregar__boton");
        const botonEliminar = evento.target.closest(".agregar__boton-eliminar");

        if (botonAgregar) {
            agregarProductoDesdeCatalogo(botonAgregar);
            return;
        }

        if (botonCantidad) {
            const idProducto = botonCantidad.dataset.id;
            const accion = botonCantidad.dataset.accion;

            cambiarCantidadProducto(idProducto, accion);
            return;
        }

        if (botonEliminar) {
            const idProducto = botonEliminar.dataset.id;

            eliminarProducto(idProducto);
        }
    });

    botonFinalizarCompra.addEventListener("click", finalizarCompra);

    function agregarProductoDesdeCatalogo(boton) {
        const tarjetaProducto = boton.closest(".tarjeta-producto");

        if (!tarjetaProducto) {
            console.warn("No se encontró la tarjeta del producto.");
            return;
        }

        const producto = obtenerDatosProducto(tarjetaProducto);
        const productoExistente = carrito.find((item) => item.id === producto.id);

        if (productoExistente) {
            productoExistente.cantidad++;
        } else {
            carrito.push(producto);
        }

        guardarCarrito();
        renderizarCarrito();
    }

    function obtenerDatosProducto(tarjetaProducto) {
        const imagen = tarjetaProducto.querySelector("img")?.getAttribute("src") || "";
        const categoria = tarjetaProducto.querySelector(".categoria-producto")?.textContent.trim() || "Producto";
        const nombre = tarjetaProducto.querySelector(".nombre-producto")?.textContent.trim() || "Producto sin nombre";
        const descripcion = tarjetaProducto.querySelector(".descripcion-producto")?.textContent.trim() || "";
        const precioTexto = tarjetaProducto.querySelector(".precio-producto")?.textContent.trim() || "$ 0";
        const precio = convertirPrecioANumero(precioTexto);

        return {
            id: crearIdProducto(nombre, categoria),
            imagen,
            categoria,
            nombre,
            descripcion,
            precio,
            cantidad: 1
        };
    }

    function renderizarCarrito() {
        listaProductosCarrito.innerHTML = "";

        if (carrito.length === 0) {
            if (mensajeCarritoVacio) {
                mensajeCarritoVacio.hidden = false;
            }

            actualizarResumenCarrito();
            return;
        }

        if (mensajeCarritoVacio) {
            mensajeCarritoVacio.hidden = true;
        }

        carrito.forEach((producto) => {
            const itemCarrito = crearItemCarrito(producto);
            listaProductosCarrito.appendChild(itemCarrito);
        });

        actualizarResumenCarrito();
    }

    function crearItemCarrito(producto) {
        const li = crearElemento("li", "agregar__contenedor");
        li.dataset.id = producto.id;

        const item = crearElemento("div", "agregar__item");

        const imagen = document.createElement("img");
        imagen.classList.add("agregar__img");
        imagen.src = producto.imagen;
        imagen.alt = producto.nombre;

        const info = crearElemento("div", "agregar__info");

        const categoria = crearElemento("span", "agregar__categoria", producto.categoria);
        const titulo = crearElemento("p", "agregar__titulo", producto.nombre);
        const descripcion = crearElemento("p", "agregar__descripcion", producto.descripcion);
        const precio = crearElemento("p", "agregar__precio", formatearPrecio(producto.precio));

        const cantidades = crearElemento("div", "agregar__cantidades");

        const botonMenos = crearElemento("button", "agregar__boton", "-");
        botonMenos.type = "button";
        botonMenos.dataset.id = producto.id;
        botonMenos.dataset.accion = "disminuir";
        botonMenos.disabled = producto.cantidad <= 1;
        botonMenos.setAttribute("aria-label", `Disminuir cantidad de ${producto.nombre}`);

        const contador = crearElemento("p", "agregar__contador", String(producto.cantidad));

        const botonMas = crearElemento("button", "agregar__boton", "+");
        botonMas.type = "button";
        botonMas.dataset.id = producto.id;
        botonMas.dataset.accion = "aumentar";
        botonMas.setAttribute("aria-label", `Aumentar cantidad de ${producto.nombre}`);

        const botonEliminar = crearElemento("button", "agregar__boton-eliminar");
        botonEliminar.type = "button";
        botonEliminar.dataset.id = producto.id;
        botonEliminar.title = "Eliminar producto";
        botonEliminar.setAttribute("aria-label", `Eliminar ${producto.nombre} del carrito`);

        const iconoEliminar = document.createElement("i");
        iconoEliminar.classList.add("fa-regular", "fa-trash-can");
        iconoEliminar.setAttribute("aria-hidden", "true");

        botonEliminar.appendChild(iconoEliminar);
        cantidades.append(botonMenos, contador, botonMas);

        info.append(categoria, titulo);

        if (producto.descripcion) {
            info.appendChild(descripcion);
        }

        info.append(precio, cantidades);
        item.append(imagen, info);
        li.append(item, botonEliminar);

        return li;
    }

    function cambiarCantidadProducto(idProducto, accion) {
        const producto = carrito.find((item) => item.id === idProducto);

        if (!producto) {
            return;
        }

        if (accion === "aumentar") {
            producto.cantidad++;
        }

        if (accion === "disminuir" && producto.cantidad > 1) {
            producto.cantidad--;
        }

        guardarCarrito();
        renderizarCarrito();
    }

    function eliminarProducto(idProducto) {
        carrito = carrito.filter((item) => item.id !== idProducto);

        guardarCarrito();
        renderizarCarrito();
    }

    function finalizarCompra() {
        if (carrito.length === 0) {
            alert("Tu carrito está vacío");
            return;
        }

        const confirmarCompra = confirm("¿Deseas finalizar la compra?");

        if (!confirmarCompra) {
            return;
        }

        alert("Compra finalizada con éxito");

        carrito = [];
        guardarCarrito();
        renderizarCarrito();
    }

    function actualizarResumenCarrito() {
        const cantidadTotal = carrito.reduce((total, producto) => {
            return total + producto.cantidad;
        }, 0);

        const precioTotal = carrito.reduce((total, producto) => {
            return total + producto.precio * producto.cantidad;
        }, 0);

        contadorCarrito.textContent = cantidadTotal;
        totalCarrito.textContent = precioTotal.toLocaleString("es-CO", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        const contadorNavbar = document.getElementById("cartCounterNavBar");
        if (contadorNavbar) {
            contadorNavbar.textContent = cantidadTotal;
            contadorNavbar.hidden = cantidadTotal === 0;
        }
    }

    function obtenerCarritoGuardado() {
        const carritoGuardado = localStorage.getItem(CLAVE_CARRITO);

        if (!carritoGuardado) {
            return [];
        }

        try {
            return JSON.parse(carritoGuardado);
        } catch (error) {
            console.error("Error al leer el carrito desde localStorage:", error);
            return [];
        }
    }

    function guardarCarrito() {
        localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
    }

    function crearElemento(tag, className, text) {
        const elemento = document.createElement(tag);
        elemento.classList.add(className);

        if (text) {
            elemento.textContent = text;
        }

        return elemento;
    }

    function convertirPrecioANumero(precioTexto) {
        const precioLimpio = precioTexto
            .replace("$", "")
            .replace(/\./g, "")
            .replace(",", ".")
            .trim();

        const precioConvertido = Number(precioLimpio);

        return Number.isNaN(precioConvertido) ? 0 : precioConvertido;
    }

    function formatearPrecio(precio) {
        return `$ ${Number(precio).toLocaleString("es-CO")}`;
    }

    function crearIdProducto(nombre, categoria) {
        return `${nombre}-${categoria}`
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }
});