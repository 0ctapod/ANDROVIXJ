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

function guardarProductos(productos) {
    localStorage.setItem(CLAVE_PRODUCTOS, JSON.stringify(productos));
}

function crearProductoDesdeFormulario(formulario) {
    const datosFormulario = new FormData(formulario);

    return {
        id: `prod-${Date.now()}`,
        nombre: datosFormulario.get("nombre").trim(),
        categoria: datosFormulario.get("categoria").trim(),
        precio: Number(datosFormulario.get("precio")),
        stock: Number(datosFormulario.get("stock")),
        imagen: datosFormulario.get("imagen").trim(),
        descripcion: datosFormulario.get("descripcion").trim()
    };
}

function validarProducto(producto) {
    if (!producto.nombre || !producto.categoria || !producto.imagen || !producto.descripcion) {
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


function mostrarMensaje(mensaje, esError = false) {
    const contenedorMensaje = document.getElementById("mensaje-admin");

    if (!contenedorMensaje) {
        return;
    }

    contenedorMensaje.textContent = mensaje;
    contenedorMensaje.style.color = esError ? "#ff8ec8" : "var(--color-neon-cian)";
}

function agregarProductoALista(productoNuevo) {
    const productos = obtenerProductosGuardados();
    productos.push(productoNuevo);
    guardarProductos(productos);

    console.clear();
    console.log("Lista de productos en formato JSON:");
    console.log(JSON.stringify(productos, null, 2));

    return productos;
}

function inicializarFormularioAdministrador() {
    const formulario = document.getElementById("formulario-producto");

    if (!formulario) {
        return;
    }

    formulario.addEventListener("submit", (evento) => {
        evento.preventDefault();

        const productoNuevo = crearProductoDesdeFormulario(formulario);
        const errorValidacion = validarProducto(productoNuevo);

        if (errorValidacion) {
            mostrarMensaje(errorValidacion, true);
            return;
        }

        agregarProductoALista(productoNuevo);
        mostrarMensaje("Producto guardado correctamente.");
        formulario.reset();
    });
}

document.addEventListener("DOMContentLoaded", () => {
    inicializarFormularioAdministrador();
});
