// =========================================================
// Login de usuarios ANDROVIX-J
// ---------------------------------------------------------
// Flujo:
// 1. Si ya hay token en localStorage → redirigir directo.
// 2. El usuario envía el formulario.
// 3. Se validan email y contraseña (formato local).
// 4. POST /auth/login → { token, idUsuario, nombreCompleto, telefono, rol }
// 5. Se guarda el token y los datos de sesión en localStorage.
// 6. Se redirige según el rol: ADMIN → administrador, CLIENTE → inicio.
// =========================================================

// API_URL, CLAVE_TOKEN y CLAVE_SESION vienen de config.js

// ── Referencias al DOM ───────────────────────────────────────────────────────

const formularioLogin = document.getElementById("formularioLogin");
const alertaLogin     = document.getElementById("alertaLogin");

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

const expresiones = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    // No se valida formato de password en login —
    // el backend responde 403 si las credenciales son incorrectas.
};

// ── Utilidades de UI ─────────────────────────────────────────────────────────

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

function mostrarAlerta(mensaje, tipo = "danger") {
    alertaLogin.textContent = mensaje;
    alertaLogin.className = `alert alerta-${tipo} alerta-registro activo`;
}

function limpiarAlerta() {
    alertaLogin.textContent = "";
    alertaLogin.className = "alert alerta-registro";
}

// ── Validaciones de formato ───────────────────────────────────────────────────
// Solo verifican formato local — si las credenciales son correctas
// lo decide el backend, no el frontend.

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

    // En login NO validamos el formato de la contraseña.
    // Si el formato es incorrecto, el backend responde 403 y
    // mostramos "credenciales incorrectas" — sin dar pistas al usuario.
    mostrarCorrecto(campos.password);
    return true;
}

function validarFormulario() {
    // Se evalúan los dos siempre (no con &&) para mostrar
    // ambos errores al mismo tiempo si los dos fallan.
    const emailValido    = validarEmail();
    const passwordValida = validarPassword();
    return emailValido && passwordValida;
}

// ── Gestión de sesión ────────────────────────────────────────────────────────

/**
 * Guarda el token JWT y los datos del usuario en localStorage.
 * El token se usa en los headers de cada request autenticado.
 * Los datos (nombre, rol) se usan en la UI sin volver a llamar al backend.
 */
function guardarSesion(data) {
    localStorage.setItem(CLAVE_TOKEN, data.token);
    localStorage.setItem(CLAVE_SESION, JSON.stringify({
        idUsuario:      data.idUsuario,
        nombreCompleto: data.nombreCompleto,
        email:          campos.email.input.value.trim().toLowerCase(),
        telefono:       data.telefono,
        rol:            data.rol
    }));
}

/**
 * Si ya hay un token guardado, el usuario ya inició sesión.
 * Lo mandamos directo según su rol sin mostrar el formulario.
 */
function redirigirSiHaySesion() {
    const token = localStorage.getItem(CLAVE_TOKEN);
    if (!token) return;

    const sesion = JSON.parse(localStorage.getItem(CLAVE_SESION) || "{}");
    const destino = sesion.rol === "ADMIN" ? "administrador.html" : "../index.html";
    window.location.href = destino;
}

// ── Login contra la API ──────────────────────────────────────────────────────

async function manejarLogin(evento) {
    evento.preventDefault();
    limpiarAlerta();

    if (!validarFormulario()) {
        mostrarAlerta("Revisa los campos marcados antes de continuar.", "danger");
        return;
    }

    const botonEnviar = formularioLogin.querySelector('[type="submit"]');
    botonEnviar.disabled = true;
    botonEnviar.textContent = "Ingresando...";

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email:    campos.email.input.value.trim().toLowerCase(),
                password: campos.password.input.value
            })
        });

        if (response.ok) {
            // 200 OK: credenciales correctas, el backend devuelve token + datos
            const data = await response.json();
            guardarSesion(data);

            const esAdmin = data.rol === "ADMIN";
            const destino = esAdmin ? "administrador.html" : "../index.html";
            const mensaje = esAdmin
                ? "Acceso de administrador concedido. Redirigiendo..."
                : `¡Bienvenido de vuelta, ${data.nombreCompleto}! Redirigiendo...`;

            mostrarAlerta(mensaje, "success");

            setTimeout(() => {
                window.location.href = destino;
            }, 1800);

        } else if (response.status === 403 || response.status === 401) {
            // Credenciales incorrectas — mensaje genérico por seguridad
            // (no decimos si es el email o la password lo que falló)
            mostrarAlerta("Credenciales incorrectas. Verifica tu email y contraseña.", "danger");

        } else {
            mostrarAlerta("Error inesperado. Intenta de nuevo más tarde.", "danger");
        }

    } catch (error) {
        // Solo llega aquí si hay fallo de red (backend apagado, sin internet)
        console.error("Error de red al iniciar sesión:", error);
        mostrarAlerta("No se pudo conectar con el servidor. ¿Está corriendo el backend en el puerto 8080?", "danger");

    } finally {
        botonEnviar.disabled = false;
        botonEnviar.textContent = "Ingresar";
    }
}

// ── Toggle de visibilidad de contraseña ──────────────────────────────────────

document.querySelectorAll("[data-password-toggle]").forEach(boton => {
    boton.addEventListener("click", () => {
        const idInput     = boton.dataset.passwordToggle;
        const inputTarget = document.getElementById(idInput);
        const icono       = boton.querySelector("i");
        const estaOculta  = inputTarget.type === "password";

        inputTarget.type = estaOculta ? "text" : "password";
        icono.classList.toggle("fa-eye",      !estaOculta);
        icono.classList.toggle("fa-eye-slash", estaOculta);
        boton.setAttribute("aria-label", estaOculta ? "Ocultar contraseña" : "Mostrar contraseña");
    });
});

// ── Validación en tiempo real ─────────────────────────────────────────────────

campos.email.input.addEventListener("blur", validarEmail);
campos.password.input.addEventListener("blur", validarPassword);

// ── Inicialización ───────────────────────────────────────────────────────────

formularioLogin.addEventListener("submit", manejarLogin);
redirigirSiHaySesion();
