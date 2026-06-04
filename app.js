// 1. Variables globales para las tasas
let TASAS_DEL_DIA = { bcv: 0, paralelo: 0, usdt: 0 };

// 2. Referencias a los elementos del HTML
const montoBaseInput = document.getElementById('monto-base');
const metodoPagoSelect = document.getElementById('metodo-pago');
const montoCobrarEl = document.getElementById('monto-cobrar');
const textoReciboEl = document.getElementById('texto-recibo');
const btnCopiar = document.getElementById('btn-copiar');

// Referencias para el panel de ajustes
const btnAjustes = document.getElementById('btn-ajustes');
const panelAjustes = document.getElementById('panel-ajustes');
const btnGuardarAjustes = document.getElementById('btn-guardar-ajustes');

// Inputs de los ajustes
const cfgBanco = document.getElementById('cfg-banco');
const cfgCedula = document.getElementById('cfg-cedula');
const cfgTelefono = document.getElementById('cfg-telefono');
const cfgPaypal = document.getElementById('cfg-paypal');
const cfgBinance = document.getElementById('cfg-binance');
const cfgZelle = document.getElementById('cfg-zelle');

// =====================================================================
// 3. Sistema de Persistencia y Estado de Configuración (Sin Onboarding Invasivo)
// =====================================================================
const statusAjustes = document.getElementById('status-ajustes');

const camposAjustes = [
    { el: cfgBanco, llave: 'pago_claro_banco' },
    { el: cfgCedula, llave: 'pago_claro_cedula' },
    { el: cfgTelefono, llave: 'pago_claro_telefono' },
    { el: cfgPaypal, llave: 'pago_claro_paypal' },
    { el: cfgBinance, llave: 'pago_claro_binance' },
    { el: cfgZelle, llave: 'pago_claro_zelle' }
];

// Función para evaluar si el usuario ya configuró sus datos
function actualizarBadgeEstado() {
    const tieneDatos = camposAjustes.some(campo => campo.el.value.trim() !== "");
    
    if (tieneDatos) {
        statusAjustes.textContent = "🟢 Configurado";
        statusAjustes.className = "badge-status listo";
    } else {
        statusAjustes.textContent = "⚠️ Sin Datos";
        statusAjustes.className = "badge-status pendiente";
    }
}

// Inicializar ajustes cargando desde la memoria del navegador
camposAjustes.forEach(campo => {
    const valorGuardado = localStorage.getItem(campo.llave);
    if (valorGuardado) {
        campo.el.value = valorGuardado;
    }
    
    // Auto-guardado en tiempo real sin romper el flujo de tipeo
    campo.el.addEventListener('input', () => {
        localStorage.setItem(campo.llave, campo.el.value);
        actualizarBadgeEstado();
        actualizarCalculadora();
    });
});

// Ejecutar el chequeo de estado inicial (mantiene el panel oculto al cargar)
actualizarBadgeEstado();

// Interruptor manual para abrir y cerrar el panel de ajustes abajo
btnAjustes.addEventListener('click', () => {
    panelAjustes.classList.toggle('oculto');
});

// ACCIÓN DEL BOTÓN "APLICAR Y CERRAR"
btnGuardarAjustes.addEventListener('click', () => {
    panelAjustes.classList.add('oculto');
    actualizarCalculadora();
    // Enfoca el input principal sin generar saltos bruscos de pantalla
    montoBaseInput.focus();
});

// =====================================================================
// 4. Conexión a la API de Tasas en Vivo
// =====================================================================
async function obtenerTasasEnVivo() {
    try {
        const resBCV = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        const datosBCV = await resBCV.json();

        const resParalelo = await fetch('https://ve.dolarapi.com/v1/dolares/paralelo');
        const datosParalelo = await resParalelo.json();

        TASAS_DEL_DIA.bcv = datosBCV.promedio;
        TASAS_DEL_DIA.paralelo = datosParalelo.promedio;
        TASAS_DEL_DIA.usdt = datosParalelo.promedio;

        document.getElementById('tasa-bcv').textContent = `${TASAS_DEL_DIA.bcv.toFixed(2)} Bs`;
        document.getElementById('tasa-paralelo').textContent = `${TASAS_DEL_DIA.paralelo.toFixed(2)} Bs`;
        document.getElementById('tasa-usdt').textContent = `${TASAS_DEL_DIA.usdt.toFixed(2)} Bs`;

        const difBs = TASAS_DEL_DIA.paralelo - TASAS_DEL_DIA.bcv;
        const porcentaje = (difBs / TASAS_DEL_DIA.bcv) * 100;

        document.getElementById('brecha-badge').innerText = `+${porcentaje.toFixed(1)}%`;
        document.getElementById('brecha-bs').innerText = difBs.toFixed(2);

        actualizarCalculadora();

    } catch (error) {
        console.error("Error en API, usando respaldo de seguridad:", error);
        TASAS_DEL_DIA = { bcv: 46.50, paralelo: 55.20, usdt: 55.20 };
        
        document.getElementById('tasa-bcv').textContent = `${TASAS_DEL_DIA.bcv.toFixed(2)} Bs`;
        document.getElementById('tasa-paralelo').textContent = `${TASAS_DEL_DIA.paralelo.toFixed(2)} Bs`;
        document.getElementById('tasa-usdt').textContent = `${TASAS_DEL_DIA.usdt.toFixed(2)} Bs`;
        actualizarCalculadora();
    }
}

// Inicializador dinámico de la fecha actual
function inicializarBarraEstado() {
    const metaFecha = document.getElementById('meta-fecha');
    if (metaFecha) {
        const hoy = new Date();
        const dia = String(hoy.getDate()).padStart(2, '0');
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const anio = hoy.getFullYear();
        metaFecha.textContent = `${dia}/${mes}/${anio}`;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    inicializarBarraEstado();
    obtenerTasasEnVivo();
});

// =====================================================================
// 5. Motor de Cálculo y Renderizado de Recibo Textual
// =====================================================================
function actualizarCalculadora() {
    const montoNeto = parseFloat(montoBaseInput.value);
    const metodo = metodoPagoSelect.value;

    if (isNaN(montoNeto) || montoNeto <= 0) {
        montoCobrarEl.textContent = "$0.00";
        textoReciboEl.value = "Ingresa un monto para generar tu recibo...";
        return;
    }

    let montoCobrar = 0;
    let simbolo = "$";
    let recibo = "";

    const miBanco = cfgBanco.value.trim() || "(Falta configurar Banco)";
    const miCedula = cfgCedula.value.trim() || "(Falta configurar Cédula)";
    const miTelefono = cfgTelefono.value.trim() || "(Falta configurar Teléfono)";
    const miPaypal = cfgPaypal.value.trim() || "(Falta configurar Correo)";
    const miBinance = cfgBinance.value.trim() || "(Falta configurar Binance ID)";
    const miZelle = cfgZelle.value.trim() || "(Falta configurar Zelle)";

    switch (metodo) {
        case 'bcv':
            montoCobrar = montoNeto * TASAS_DEL_DIA.bcv;
            simbolo = "Bs";
            recibo = `Hola 👋\n\n📄 *Detalle de tu compra*\n\nSubtotal: $${montoNeto.toFixed(2)}\nTasa del día (BCV): ${TASAS_DEL_DIA.bcv.toFixed(2)} Bs\n\n*🟢 TOTAL A PAGAR: ${montoCobrar.toFixed(2)} Bs*\n\nDatos de Pago Móvil:\n🏛️ Banco: ${miBanco}\n🆔 CI: ${miCedula}\n📱 Teléfono: ${miTelefono}`;
            break;
            
        case 'paypal':
            montoCobrar = (montoNeto + 0.30) / (1 - 0.054);
            simbolo = "$";
            recibo = `Hola 👋\n\n📄 *Detalle de tu compra (Vía PayPal)*\n\nMonto de los productos: $${montoNeto.toFixed(2)}\n(La comisión de PayPal es cubierta por el comprador)\n\n*🟢 TOTAL A ENVIAR: $${montoCobrar.toFixed(2)}*\n\nPor favor envía el pago a este correo:\n📩 ${miPaypal}`;
            break;
            
        case 'usdt':
            montoCobrar = montoNeto; 
            simbolo = "USDT ";
            recibo = `Hola 👋\n\n📄 *Detalle de tu compra (Binance)*\n\n*🟢 TOTAL A ENVIAR: ${montoCobrar.toFixed(2)} USDT*\n\nMi Binance Pay ID es:\n🆔 ${miBinance}`;
            break;
            
        case 'zelle':
            montoCobrar = montoNeto;
            simbolo = "$";
            recibo = `Hola 👋\n\n📄 *Detalle de tu compra*\n\n*🟢 TOTAL A ENVIAR: $${montoCobrar.toFixed(2)}*\n\nDatos de Zelle:\n📩 ${miZelle}`;
            break;
    }

    if (simbolo === "Bs" || simbolo === "USDT ") {
        montoCobrarEl.textContent = `${montoCobrar.toFixed(2)} ${simbolo.trim()}`;
    } else {
        montoCobrarEl.textContent = `${simbolo}${montoCobrar.toFixed(2)}`;
    }
    
    textoReciboEl.value = recibo;
}

montoBaseInput.addEventListener('input', actualizarCalculadora);
metodoPagoSelect.addEventListener('change', actualizarCalculadora);

// =====================================================================
// 6. Copiar para WhatsApp con Validación Contextual de UX Inteligente
// =====================================================================
btnCopiar.addEventListener('click', () => {
    if (!montoBaseInput.value || montoBaseInput.value <= 0) return;

    const metodo = metodoPagoSelect.value;
    let datosIncompletos = false;

    // Analiza únicamente si faltan los datos requeridos por el método de cobro activo
    if (metodo === 'bcv' && (!cfgBanco.value.trim() || !cfgCedula.value.trim() || !cfgTelefono.value.trim())) datosIncompletos = true;
    if (metodo === 'paypal' && !cfgPaypal.value.trim()) datosIncompletos = true;
    if (metodo === 'usdt' && !cfgBinance.value.trim()) datosIncompletos = true;
    if (metodo === 'zelle' && !cfgZelle.value.trim()) datosIncompletos = true;

    // Si faltan datos clave, despliega el panel inferior de forma nativa sin romper la pantalla
    if (datosIncompletos) {
        panelAjustes.classList.remove('oculto');
        panelAjustes.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        const textoOriginal = btnCopiar.innerHTML;
        btnCopiar.innerHTML = "⚠️ ¡Configura tus datos primero!";
        btnCopiar.style.background = "#eab308";
        btnCopiar.style.color = "#0f172a";
        
        setTimeout(() => {
            btnCopiar.innerHTML = textoOriginal;
            btnCopiar.style.background = "";
            btnCopiar.style.color = "";
        }, 2500);
        return; 
    }

    // Si los campos requeridos están listos, copia el texto directo al portapapeles
    navigator.clipboard.writeText(textoReciboEl.value).then(() => {
        const textoOriginal = btnCopiar.innerHTML;
        btnCopiar.innerHTML = "¡Copiado con éxito! ✅";
        btnCopiar.style.background = "#10b981"; 
        btnCopiar.style.color = "#ffffff";
        
        setTimeout(() => {
            btnCopiar.innerHTML = textoOriginal;
            btnCopiar.style.background = ""; 
            btnCopiar.style.color = ""; 
        }, 2000);
    }).catch(err => {
        console.error('Error al ejecutar portapapeles: ', err);
        alert("Tu navegador no soporta la función de copiar automáticamente.");
    });
});