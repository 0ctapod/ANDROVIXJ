// =========================================================
// Registro de usuarios ANDROVIX-J
// Función: validar formulario y registrar usuario via API REST.
// POST /auth/register → { token } (201 Created)
// =========================================================

const API_URL = "http://localhost:8080";

const formularioRegistro = document.getElementById("formularioRegistro");
const alertaRegistro = document.getElementById("alertaRegistro");

const campos = {
    nombreCompleto: {
        input: document.getElementById("nombreCompleto"),
        grupo: document.getElementById("grupoNombre"),
        error: document.getElementById("errorNombre")
    },
    telefono: {
        input: document.getElementById("telefono"),
        grupo: document.getElementById("grupoTelefono"),
        error: document.getElementById("errorTelefono")
    },
    email: {
        input: document.getElementById("email"),
        grupo: document.getElementById("grupoEmail"),
        error: document.getElementById("errorEmail")
    },
    password: {
        input: document.getElementById("password"),
        grupo: document.getElementById("grupoPassword"),
        error: document.getElementById("errorPassword")
    },
    confirmarPassword: {
        input: document.getElementById("confirmarPassword"),
        grupo: document.getElementById("grupoConfirmarPassword"),
        error: document.getElementById("errorConfirmarPassword")
    }
};

const expresiones = {
    nombre: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]{3,60}$/,
    telefono: /^\d{10}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
};

// ── Utilidades visuales ──────────────────────────────────────────────────────

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

function mostrarAlerta(mensaje, tipo = "danger") {
    alertaRegistro.textContent = mensaje;
    alertaRegistro.className = `alert alerta-${tipo} alerta-registro activo`;
}

function limpiarAlerta() {
    alertaRegistro.textContent = "";
    alertaRegistro.className = "alert alerta-registro";
}

// ── Validaciones de campo ────────────────────────────────────────────────────

function validarNombre() {
    const valor = campos.nombreCompleto.input.value.trim();

    if (!valor) {
        mostrarError(campos.nombreCompleto, "El nombre completo es obligatorio.");
        return false;
    }

    if (!expresiones.nombre.test(valor)) {
        mostrarError(campos.nombreCompleto, "Ingresa solo letras y espacios. Mínimo 3 caracteres.");
        return false;
    }

    mostrarCorrecto(campos.nombreCompleto);
    return true;
}

function validarTelefono() {
    const valor = campos.telefono.input.value.trim();

    if (!valor) {
        mostrarError(campos.telefono, "El número de teléfono es obligatorio.");
        return false;
    }

    if (!expresiones.telefono.test(valor)) {
        mostrarError(campos.telefono, "El teléfono debe tener exactamente 10 dígitos numéricos.");
        return false;
    }

    mostrarCorrecto(campos.telefono);
    return true;
}

function validarEmail() {
    const valor = campos.email.input.value.trim().toLowerCase();

    if (!valor) {
        mostrarError(campos.email, "El correo electrónico es obligatorio.");
        return false;
    }

    if (!expresiones.email.test(valor)) {
        mostrarError(campos.email, "Ingresa un correo electrónico válido.");
        return false;
    }

    // La verificación de email duplicado la hace el backend.
    // Si el correo ya existe, el servidor responde con error y se muestra en la alerta.
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

function validarConfirmarPassword() {
    const password = campos.password.input.value;
    const confirmarPassword = campos.confirmarPassword.input.value;

    if (!confirmarPassword) {
        mostrarError(campos.confirmarPassword, "Confirma tu contraseña.");
        return false;
    }

    if (password !== confirmarPassword) {
        mostrarError(campos.confirmarPassword, "Las contraseñas no coinciden.");
        return false;
    }

    mostrarCorrecto(campos.confirmarPassword);
    return true;
}

function validarFormularioCompleto() {
    const nombreValido          = validarNombre();
    const telefonoValido        = validarTelefono();
    const emailValido           = validarEmail();
    const passwordValida        = validarPassword();
    const confirmarPasswordValida = validarConfirmarPassword();

    return nombreValido && telefonoValido && emailValido && passwordValida && confirmarPasswordValida;
}

// ── Construcción del cuerpo del request ─────────────────────────────────────

function crearUsuarioDesdeFormulario() {
    return {
        nombreCompleto: campos.nombreCompleto.input.value.trim(),
        telefono:       campos.telefono.input.value.trim(),
        email:          campos.email.input.value.trim().toLowerCase(),
        password:       campos.password.input.value,
        rol:            "CLIENTE"
        // rol siempre es CLIENTE desde el frontend.
        // Aunque el backend acepta el campo, nunca enviamos ADMIN desde aquí.
    };
}

// ── Registro contra la API ───────────────────────────────────────────────────

async function registrarUsuario(evento) {
    evento.preventDefault();
    limpiarAlerta();

    if (!validarFormularioCompleto()) {
        mostrarAlerta("Revisa los campos marcados antes de registrarte.", "danger");
        return;
    }

    const botonEnviar = formularioRegistro.querySelector('[type="submit"]');
    botonEnviar.disabled = true;
    botonEnviar.textContent = "Registrando...";

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(crearUsuarioDesdeFormulario())
        });

        if (response.status === 201) {
            mostrarAlerta("¡Registro exitoso! Redirigiendo al inicio de sesión...", "success");
            formularioRegistro.reset();
            Object.values(campos).forEach(limpiarEstadoCampo);

            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);

        } else if (response.status === 400) {
            mostrarAlerta("Datos inválidos. Revisa el formulario e intenta de nuevo.", "danger");

        } else {
            // 500 generalmente indica email duplicado (violación de constraint único en BD)
            mostrarAlerta("Este correo ya está registrado o hubo un error en el servidor.", "danger");
        }

    } catch (error) {
        // fetch lanza excepción solo si hay fallo de red (servidor apagado, sin conexión)
        console.error("Error de red al registrar:", error);
        mostrarAlerta("No se pudo conectar con el servidor. ¿Está corriendo el backend en el puerto 8080?", "danger");

    } finally {
        botonEnviar.disabled = false;
        botonEnviar.textContent = "Crear cuenta";
    }
}

// ── Toggle de contraseña ─────────────────────────────────────────────────────

function alternarVisibilidadPassword(boton) {
    const idInput = boton.dataset.passwordToggle;
    const inputPassword = document.getElementById(idInput);
    const icono = boton.querySelector("i");
    const passwordOculta = inputPassword.type === "password";

    inputPassword.type = passwordOculta ? "text" : "password";
    icono.classList.toggle("fa-eye", !passwordOculta);
    icono.classList.toggle("fa-eye-slash", passwordOculta);
    boton.setAttribute("aria-label", passwordOculta ? "Ocultar contraseña" : "Mostrar contraseña");
}

// ── Event listeners ──────────────────────────────────────────────────────────

campos.nombreCompleto.input.addEventListener("blur", validarNombre);
campos.telefono.input.addEventListener("blur", validarTelefono);
campos.email.input.addEventListener("blur", validarEmail);
campos.password.input.addEventListener("blur", () => {
    validarPassword();
    if (campos.confirmarPassword.input.value) {
        validarConfirmarPassword();
    }
});
campos.confirmarPassword.input.addEventListener("blur", validarConfirmarPassword);

campos.telefono.input.addEventListener("input", () => {
    campos.telefono.input.value = campos.telefono.input.value.replace(/\D/g, "").slice(0, 10);
});

document.querySelectorAll("[data-password-toggle]").forEach(boton => {
    boton.addEventListener("click", () => alternarVisibilidadPassword(boton));
});

formularioRegistro.addEventListener("submit", registrarUsuario);
