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
 *  - Finalizar compra via API REST.
 * =========================================================
 */

// mostrarAlertaModal() y mostrarConfirmacionModal() vienen de components.js

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
        const imagen      = tarjetaProducto.querySelector("img")?.getAttribute("src") || "";
        const categoria   = tarjetaProducto.querySelector(".categoria-producto")?.textContent.trim() || "Producto";
        const nombre      = tarjetaProducto.querySelector(".nombre-producto")?.textContent.trim() || "Producto sin nombre";
        const descripcion = tarjetaProducto.querySelector(".descripcion-producto")?.textContent.trim() || "";
        const precioTexto = tarjetaProducto.querySelector(".precio-producto")?.textContent.trim() || "$ 0";
        const precio      = convertirPrecioANumero(precioTexto);

        // idProducto es el ID real de la BD, embebido en la tarjeta por catalogo.js.
        // Es necesario para crear el ProductoPedido al finalizar la compra.
        // Los productos hardcodeados en el HTML no tienen este atributo (serán null).
        const idProducto  = tarjetaProducto.dataset.productoId
            ? parseInt(tarjetaProducto.dataset.productoId)
            : null;

        return {
            id: crearIdProducto(nombre, categoria),  // clave local para deduplicar
            idProducto,                               // ID real de la BD para la API
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

    async function finalizarCompra() {
        if (carrito.length === 0) {
            await mostrarAlertaModal("Tu carrito está vacío.", "warning");
            return;
        }

        // 1. Verificar que el usuario haya iniciado sesión
        const token = localStorage.getItem(CLAVE_TOKEN);
        if (!token) {
            await mostrarAlertaModal(
                "Debes iniciar sesión para finalizar tu compra.",
                "warning"
            );
            window.location.href = "login.html";
            return;
        }

        const sesion = JSON.parse(localStorage.getItem(CLAVE_SESION) || "{}");

        // 2. Filtrar solo productos que tienen ID real de la BD
        const itemsValidos = carrito.filter(item => item.idProducto !== null);
        if (itemsValidos.length === 0) {
            await mostrarAlertaModal(
                "Los productos del carrito no están disponibles para compra en este momento.",
                "warning"
            );
            return;
        }

        // 3. Pedir confirmación al usuario con el modal personalizado
        const totalItems = itemsValidos.reduce((sum, i) => sum + i.cantidad, 0);
        const totalPrecio = itemsValidos.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
        const confirmado = await mostrarConfirmacionModal(
            `Estás a punto de realizar un pedido con <strong>${totalItems} artículo${totalItems !== 1 ? "s" : ""}</strong>
             por un total de <strong>$ ${totalPrecio.toLocaleString("es-CO")}</strong>.<br><br>
             ¿Deseas continuar?`
        );
        if (!confirmado) return;

        botonFinalizarCompra.disabled = true;
        botonFinalizarCompra.textContent = "Procesando...";

        try {
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            };

            // 4. Crear el pedido en el backend
            const pedidoResponse = await fetch(`${API_URL}/pedidos`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    fecha:     new Date().toISOString().slice(0, 19),
                    total:     totalPrecio,
                    estado:    "PENDIENTE",
                    usuarioId: parseInt(sesion.idUsuario)
                })
            });

            if (!pedidoResponse.ok) {
                throw new Error(`Error al crear el pedido: ${pedidoResponse.status}`);
            }

            const pedido = await pedidoResponse.json();

            // 5. Registrar cada producto del carrito en el pedido
            for (const item of itemsValidos) {
                const itemResponse = await fetch(`${API_URL}/producto-pedido`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        cantidad:       item.cantidad,
                        precioUnitario: item.precio,
                        productoId:     item.idProducto,
                        pedidoId:       pedido.idPedido
                    })
                });

                if (!itemResponse.ok) {
                    console.warn(`No se pudo registrar el producto ${item.nombre} en el pedido.`);
                }
            }

            // 6. Confirmar al usuario y limpiar el carrito
            await mostrarAlertaModal(
                "Tu pedido ha sido registrado con éxito.<br>Pronto recibirás información sobre el envío.",
                "success"
            );
            carrito = [];
            guardarCarrito();
            renderizarCarrito();

        } catch (error) {
            console.error("Error al finalizar compra:", error);
            await mostrarAlertaModal(
                "Hubo un error al procesar tu compra. Por favor intenta de nuevo.",
                "error"
            );

        } finally {
            botonFinalizarCompra.disabled = false;
            botonFinalizarCompra.textContent = "Finalizar compra";
        }
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