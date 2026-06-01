/**
 * =========================================================
 *  ANDROVIX-J | contacto.js
 *  Validación del formulario de contacto + envío a Formspree
 * =========================================================
 *
 *  Flujo general:
 *  1. El usuario hace clic en "Enviar".
 *  2. Se validan todos los campos con validarFormulario().
 *  3. Si hay errores, se muestran junto al campo correspondiente
 *     y NO se envía nada.
 *  4. Si todo es válido, se envía via fetch() a Formspree
 *     (sin redirigir al usuario fuera del sitio).
 *  5. Se muestra un mensaje de éxito o error de red.
 * =========================================================
 */

/* ─────────────────────────────────────────────────────────
   REFERENCIAS AL DOM
   Se obtienen una sola vez al cargar el script para no
   consultar el DOM en cada validación.
───────────────────────────────────────────────────────── */
const formulario = document.getElementById('formulario-contacto');
const btnEnviar = document.getElementById('btn-enviar');
const alertaEnvio = document.getElementById('alerta-envio');

const campoNombre = document.getElementById('inputNombre');
const campoCorreo = document.getElementById('inputCorreo');
const campoTelefono = document.getElementById('inputTelefono');
const campoAsunto = document.getElementById('inputAsunto');
const campoMensaje = document.getElementById('inputMensaje');

/* ─────────────────────────────────────────────────────────
   EXPRESIONES REGULARES
───────────────────────────────────────────────────────── */

/** Solo letras (incluye acentos, ñ) y espacios. Mínimo 2 caracteres. */
const REGEX_NOMBRE = /^[a-zA-ZÀ-ÿñÑ\s]{2,80}$/;

/**
 * Correo electrónico estándar.
 * Ejemplo válido: usuario@dominio.com
 */
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Teléfono: acepta formatos internacionales y locales.
 * Ejemplos válidos: +57 300 123 4567 | 3001234567 | +1-800-555-0100
 */
const REGEX_TELEFONO = /^\+?[\d\s\-().]{7,20}$/;

/* ─────────────────────────────────────────────────────────
   FUNCIONES AUXILIARES DE UI
───────────────────────────────────────────────────────── */

/**
 * Muestra un mensaje de error bajo el campo indicado.
 * @param {HTMLElement} campo   - Input o textarea que falló.
 * @param {HTMLElement} spanError - Elemento <span> donde se escribe el error.
 * @param {string}      mensaje - Texto que verá el usuario.
 */
function mostrarError(campo, spanError, mensaje) {
    campo.classList.remove('campo-valido');
    campo.classList.add('campo-error');
    spanError.textContent = mensaje;
    spanError.classList.add('visible');
}

/**
 * Limpia el estado de error de un campo.
 * @param {HTMLElement} campo
 * @param {HTMLElement} spanError
 */
function limpiarError(campo, spanError) {
    campo.classList.remove('campo-error');
    campo.classList.add('campo-valido');
    spanError.textContent = '';
    spanError.classList.remove('visible');
}

/**
 * Resetea todos los campos al estado neutro (sin color de borde).
 */
function resetearEstadosCampos() {
    [campoNombre, campoCorreo, campoTelefono, campoAsunto, campoMensaje].forEach(function (campo) {
        campo.classList.remove('campo-error', 'campo-valido');
    });
}

/* ─────────────────────────────────────────────────────────
   FUNCIÓN PRINCIPAL DE VALIDACIÓN
   Retorna `true` si el formulario es válido, `false` si no.
───────────────────────────────────────────────────────── */

/**
 * Valida todos los campos del formulario.
 * Muestra mensajes de error individuales por campo.
 * @returns {boolean} - true si todo es válido.
 */
function validarFormulario() {
    let esValido = true;

    /* --- Validar Nombre --- */
    const valorNombre = campoNombre.value.trim();
    const errorNombre = document.getElementById('error-nombre');

    if (valorNombre === '') {
        mostrarError(campoNombre, errorNombre, '⚠ El nombre es obligatorio.');
        esValido = false;
    } else if (!REGEX_NOMBRE.test(valorNombre)) {
        mostrarError(campoNombre, errorNombre, '⚠ Solo se permiten letras y espacios (mín. 2 caracteres).');
        esValido = false;
    } else {
        limpiarError(campoNombre, errorNombre);
    }

    /* --- Validar Correo electrónico --- */
    const valorCorreo = campoCorreo.value.trim();
    const errorCorreo = document.getElementById('error-correo');

    if (valorCorreo === '') {
        mostrarError(campoCorreo, errorCorreo, '⚠ El correo electrónico es obligatorio.');
        esValido = false;
    } else if (!REGEX_CORREO.test(valorCorreo)) {
        mostrarError(campoCorreo, errorCorreo, '⚠ Ingresa un correo válido. Ej: usuario@dominio.com');
        esValido = false;
    } else {
        limpiarError(campoCorreo, errorCorreo);
    }

    /* --- Validar Teléfono --- */
    const valorTelefono = campoTelefono.value.trim();
    const errorTelefono = document.getElementById('error-telefono');

    if (valorTelefono === '') {
        mostrarError(campoTelefono, errorTelefono, '⚠ El teléfono es obligatorio.');
        esValido = false;
    } else if (!REGEX_TELEFONO.test(valorTelefono)) {
        mostrarError(campoTelefono, errorTelefono, '⚠ Ingresa un teléfono válido. Ej: +57 300 123 4567');
        esValido = false;
    } else {
        limpiarError(campoTelefono, errorTelefono);
    }

    /* --- Validar Asunto --- */
    const valorAsunto = campoAsunto.value.trim();
    const errorAsunto = document.getElementById('error-asunto');

    if (valorAsunto === '') {
        mostrarError(campoAsunto, errorAsunto, '⚠ El asunto es obligatorio.');
        esValido = false;
    } else if (valorAsunto.length < 4) {
        mostrarError(campoAsunto, errorAsunto, '⚠ El asunto debe tener al menos 4 caracteres.');
        esValido = false;
    } else {
        limpiarError(campoAsunto, errorAsunto);
    }

    /* --- Validar Mensaje --- */
    const valorMensaje = campoMensaje.value.trim();
    const errorMensaje = document.getElementById('error-mensaje');

    if (valorMensaje === '') {
        mostrarError(campoMensaje, errorMensaje, '⚠ El mensaje es obligatorio.');
        esValido = false;
    } else if (valorMensaje.length < 10) {
        mostrarError(campoMensaje, errorMensaje, '⚠ El mensaje debe tener al menos 10 caracteres.');
        esValido = false;
    } else {
        limpiarError(campoMensaje, errorMensaje);
    }

    return esValido;
}

/* ─────────────────────────────────────────────────────────
   VALIDACIÓN EN TIEMPO REAL (al salir de cada campo)
   Mejora la UX mostrando errores sin esperar al submit.
───────────────────────────────────────────────────────── */
[campoNombre, campoCorreo, campoTelefono, campoAsunto, campoMensaje].forEach(function (campo) {
    campo.addEventListener('blur', function () {
        validarFormulario();
        /* Ocultamos la alerta de envío si el usuario corrige el formulario */
        alertaEnvio.className = '';
        alertaEnvio.textContent = '';
        alertaEnvio.style.display = 'none';
    });
});

/* ─────────────────────────────────────────────────────────
   ENVÍO DEL FORMULARIO
   Se intercepta el submit nativo para:
     1. Validar primero.
     2. Enviar via fetch() a Formspree (AJAX, sin redirección).
     3. Mostrar alerta de resultado.
───────────────────────────────────────────────────────── */
formulario.addEventListener('submit', function (evento) {
    /* Siempre prevenimos el envío nativo del formulario */
    evento.preventDefault();

    /* Ocultamos alertas previas */
    alertaEnvio.className = '';
    alertaEnvio.textContent = '';
    alertaEnvio.style.display = 'none';

    /* Si la validación falla, detenemos aquí */
    if (!validarFormulario()) {
        return;
    }

    /* ── Preparamos el envío ── */
    btnEnviar.disabled = true;
    btnEnviar.textContent = 'Enviando...';

    const datos = new FormData(formulario);

    fetch(formulario.action, {
        method: 'POST',
        body: datos,
        headers: {
            'Accept': 'application/json'
        }
    })
        .then(function (respuesta) {
            if (respuesta.ok) {
                /* ✅ Envío exitoso */
                alertaEnvio.textContent = '✅ Mensaje enviado con éxito. ¡Nos pondremos en contacto pronto!';
                alertaEnvio.className = 'exito';

                /* Limpiamos el formulario y los estados visuales */
                formulario.reset();
                resetearEstadosCampos();
            } else {
                /* ❌ Formspree devolvió un error HTTP */
                return respuesta.json().then(function (datos) {
                    const mensajeFormspree = (datos && datos.errors)
                        ? datos.errors.map(function (e) { return e.message; }).join(', ')
                        : 'Error al enviar. Intenta de nuevo.';
                    alertaEnvio.textContent = '❌ ' + mensajeFormspree;
                    alertaEnvio.className = 'error-envio';
                });
            }
        })
        .catch(function () {
            /* ❌ Error de red (sin conexión, CORS, etc.) */
            alertaEnvio.textContent = '❌ Error de conexión. Verifica tu internet e intenta de nuevo.';
            alertaEnvio.className = 'error-envio';
        })
        .finally(function () {
            btnEnviar.disabled = false;
            btnEnviar.textContent = 'Enviar';

            /* Desplazamos suavemente hasta la alerta para que el usuario la vea */
            alertaEnvio.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
});