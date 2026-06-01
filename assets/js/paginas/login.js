// =========================================================
// Login de usuarios ANDROVIX-J
// ---------------------------------------------------------
// Función: validar el formulario de login, buscar el usuario
// en localStorage y gestionar la sesión activa.
//
// Flujo:
// 1. El usuario envía el formulario.
// 2. Se validan email y contraseña (formato).
// 3. Se busca el email en "usuariosAndrovix" (localStorage).
// 4. Si existe, se compara la contraseña.
// 5. Si coincide → se guarda la sesión en sessionStorage
//    y se redirige al catálogo.
// 6. Si no coincide → se muestra un mensaje de error.
// =========================================================

// ---------------------------------------------------------
// CONSTANTES
// ---------------------------------------------------------

/** Clave usada en registro.js para guardar los usuarios. */
const CLAVE_USUARIOS = "usuariosAndrovix";

/**
 * Clave en sessionStorage para guardar el usuario activo.
 * sessionStorage se borra automáticamente al cerrar el tab,
 * lo que es más seguro que localStorage para sesiones.
 */
const CLAVE_SESION = "androvix_sesion";

/** Email del administrador — determina la redirección post-login. */
const EMAIL_ADMIN = "admin.androvixj@email.com";

// ---------------------------------------------------------
// REFERENCIAS AL DOM
// ---------------------------------------------------------
const formularioLogin  = document.getElementById("formularioLogin");
const alertaLogin      = document.getElementById("alertaLogin");

const campos = {
    email: {
        input: document.getElementById("email"),
        grupo: document.getElementById("grupoEmail"),
        error: document.getElementById("errorEmail")
    },
    password: {
        input: document.getElementById("password"),
        grupo: document.getElementById("grupoPassword"),
        error: document.getElementById("errorPassword")
    }
};

// ---------------------------------------------------------
// EXPRESIONES REGULARES
// ---------------------------------------------------------
const expresiones = {
    email:    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
};

// ---------------------------------------------------------
// FUNCIONES DE UI — ESTADOS DE CAMPO
// Estas funciones son idénticas a las de registro.js.
// En el futuro, podrían moverse a un utils.js compartido.
// ---------------------------------------------------------

function mostrarError(campo, mensaje) {
    campo.grupo.classList.remove("campo-correcto");
    campo.grupo.classList.add("campo-error");
    campo.error.textContent = mensaje;
    campo.error.classList.add("activo");
}

function mostrarCorrecto(campo) {
    campo.grupo.classList.remove("campo-error");
    campo.grupo.classList.add("campo-correcto");
    campo.error.textContent = "";
    campo.error.classList.remove("activo");
}

function limpiarEstadoCampo(campo) {
    campo.grupo.classList.remove("campo-error", "campo-correcto");
    campo.error.textContent = "";
    campo.error.classList.remove("activo");
}

// ---------------------------------------------------------
// FUNCIONES DE UI — ALERTA GENERAL
// ---------------------------------------------------------

function mostrarAlerta(mensaje, tipo = "danger") {
    alertaLogin.textContent = mensaje;
    alertaLogin.className = `alert alerta-${tipo} alerta-registro activo`;
}

function limpiarAlerta() {
    alertaLogin.textContent = "";
    alertaLogin.className = "alert alerta-registro";
}

// ---------------------------------------------------------
// FUNCIONES DE VALIDACIÓN DE FORMATO
// Solo verifican que el campo tenga el formato correcto.
// No comprueban si el usuario existe (eso es tarea del login).
// ---------------------------------------------------------

function validarEmail() {
    const valor = campos.email.input.value.trim();

    if (!valor) {
        mostrarError(campos.email, "El correo electrónico es obligatorio.");
        return false;
    }

    if (!expresiones.email.test(valor)) {
        mostrarError(campos.email, "Ingresa un correo electrónico válido.");
        return false;
    }

    mostrarCorrecto(campos.email);
    return true;
}

function validarPassword() {
    const valor = campos.password.input.value;

    if (!valor) {
        mostrarError(campos.password, "La contraseña es obligatoria.");
        return false;
    }

    if (!expresiones.password.test(valor)) {
        mostrarError(campos.password, "Usa mínimo 8 caracteres, una mayúscula, una minúscula y un número.");
        return false;
    }

    mostrarCorrecto(campos.password);
    return true;
}

function validarFormulario() {
    // Se evalúan los dos campos siempre (no con &&)
    // para que ambos muestren su error al mismo tiempo.
    const emailValido    = validarEmail();
    const passwordValida = validarPassword();

    return emailValido && passwordValida;
}

// ---------------------------------------------------------
// LÓGICA DE AUTENTICACIÓN
// ---------------------------------------------------------

/**
 * Lee el array de usuarios guardados en localStorage.
 * Devuelve [] si no hay nada o si el JSON está corrupto.
 */
function obtenerUsuarios() {
    const datos = localStorage.getItem(CLAVE_USUARIOS);

    if (!datos) {
        return [];
    }

    try {
        const usuarios = JSON.parse(datos);
        return Array.isArray(usuarios) ? usuarios : [];
    } catch (error) {
        console.error("Error al leer usuarios desde localStorage:", error);
        return [];
    }
}

/**
 * Busca un usuario por email (insensible a mayúsculas).
 * @param {string} email
 * @returns {object|undefined} El usuario encontrado o undefined.
 */
function buscarUsuarioPorEmail(email) {
    const usuarios = obtenerUsuarios();
    return usuarios.find(usuario => usuario.email.toLowerCase() === email.toLowerCase());
}

/**
 * Guarda los datos del usuario activo en sessionStorage.
 * NO guarda la contraseña — solo los datos necesarios
 * para identificar al usuario en otras páginas.
 * @param {object} usuario
 */
function guardarSesion(usuario) {
    const sesion = {
        nombreCompleto: usuario.nombreCompleto,
        email:          usuario.email
    };
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
}

// ---------------------------------------------------------
// MANEJADOR DEL SUBMIT
// ---------------------------------------------------------

function manejarLogin(evento) {
    evento.preventDefault();
    limpiarAlerta();

    // 1. Validar formato de los campos
    if (!validarFormulario()) {
        mostrarAlerta("Revisa los campos marcados antes de continuar.", "danger");
        return;
    }

    const emailIngresado    = campos.email.input.value.trim().toLowerCase();
    const passwordIngresada = campos.password.input.value;

    // 2. Buscar el usuario en localStorage
    const usuarioEncontrado = buscarUsuarioPorEmail(emailIngresado);

    if (!usuarioEncontrado) {
        // El email no existe — mensaje genérico por seguridad
        // (no decimos si es el email o la contraseña lo que falló)
        mostrarAlerta("Credenciales incorrectas. Verifica tu email y contraseña.", "danger");
        return;
    }

    // 3. Comparar contraseña
    if (usuarioEncontrado.password !== passwordIngresada) {
        mostrarAlerta("Credenciales incorrectas. Verifica tu email y contraseña.", "danger");
        return;
    }

    // 4. Login exitoso — guardar sesión y redirigir
    guardarSesion(usuarioEncontrado);

    const esAdmin = usuarioEncontrado.email === EMAIL_ADMIN;
    const destino  = esAdmin ? "administrador.html" : "../index.html";
    const mensaje  = esAdmin
        ? `Acceso de administrador concedido. Redirigiendo...`
        : `¡Bienvenido de vuelta, ${usuarioEncontrado.nombreCompleto}! Redirigiendo...`;

    mostrarAlerta(mensaje, "success");

    setTimeout(() => {
        window.location.href = destino;
    }, 1800);
}

// ---------------------------------------------------------
// VALIDACIÓN EN TIEMPO REAL (al salir de cada campo)
// ---------------------------------------------------------
campos.email.input.addEventListener("blur", validarEmail);
campos.password.input.addEventListener("blur", validarPassword);

// ---------------------------------------------------------
// TOGGLE DE VISIBILIDAD DE CONTRASEÑA
// Mismo patrón que registro.js
// ---------------------------------------------------------
document.querySelectorAll("[data-password-toggle]").forEach(boton => {
    boton.addEventListener("click", () => {
        const idInput     = boton.dataset.passwordToggle;
        const inputTarget = document.getElementById(idInput);
        const icono       = boton.querySelector("i");
        const estaOculta  = inputTarget.type === "password";

        inputTarget.type = estaOculta ? "text" : "password";
        icono.classList.toggle("fa-eye",       !estaOculta);
        icono.classList.toggle("fa-eye-slash",  estaOculta);
        boton.setAttribute("aria-label", estaOculta ? "Ocultar contraseña" : "Mostrar contraseña");
    });
});

// ---------------------------------------------------------
// INICIALIZACIÓN
// ---------------------------------------------------------

/**
 * Si el usuario ya tiene sesión activa, lo mandamos
 * directamente al catálogo sin mostrarle el login.
 */
function redirigirSiHaySesion() {
    const sesion = sessionStorage.getItem(CLAVE_SESION);

    if (sesion) {
        window.location.href = "../index.html";
    }
}

// ---------------------------------------------------------
// USUARIO ADMINISTRADOR — SEED
// ---------------------------------------------------------

/**
 * Inserta el usuario admin en localStorage si todavía no existe.
 * Se ejecuta una sola vez; no sobreescribe si ya está registrado.
 */
function sembrarUsuarioAdmin() {
    const usuarios = obtenerUsuarios();
    const adminExiste = usuarios.some(u => u.email === EMAIL_ADMIN);
    if (adminExiste) return;

    usuarios.push({
        nombreCompleto: "Admin ANDROVIX-J",
        telefono: "0000000000",
        email: EMAIL_ADMIN,
        password: "PaseDeAdministrador100"
    });
    localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(usuarios));
}

// Ejecutamos al cargar la página
sembrarUsuarioAdmin();
redirigirSiHaySesion();

formularioLogin.addEventListener("submit", manejarLogin);