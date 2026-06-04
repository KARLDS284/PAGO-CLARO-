// 1. Variables globales para las tasas (empiezan en 0 mientras se descargan de internet)
let TASAS_DEL_DIA = {
   bcv: 0,
   paralelo: 0,
   usdt: 0  
};

// 2. Referencias a los elementos del HTML
const montoBaseInput = document.getElementById('monto-base');
const metodoPagoSelect = document.getElementById('metodo-pago');
const montoCobrarEl = document.getElementById('monto-cobrar');
const textoReciboEl = document.getElementById('texto-recibo');
const btnCopiar = document.getElementById('btn-copiar');

// =====================================================================
// 3. NUEVO: Función para conectarse a internet y traer las tasas en vivo
// =====================================================================
async function obtenerTasasEnVivo() {
    try {
        // Consultamos el precio oficial del BCV
        const resBCV = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        const datosBCV = await resBCV.json();

        // Consultamos el precio del mercado Paralelo
        const resParalelo = await fetch('https://ve.dolarapi.com/v1/dolares/paralelo');
        const datosParalelo = await resParalelo.json();

        // Guardamos los datos reales dentro de nuestro objeto de tasas
        TASAS_DEL_DIA.bcv = datosBCV.promedio;
        TASAS_DEL_DIA.paralelo = datosParalelo.promedio;
        TASAS_DEL_DIA.usdt = datosParalelo.promedio; // Usamos el paralelo como base para USDT

        // Imprimimos los precios reales en las tarjetas superiores
        document.getElementById('tasa-bcv').textContent = `${TASAS_DEL_DIA.bcv.toFixed(2)} Bs`;
        document.getElementById('tasa-paralelo').textContent = `${TASAS_DEL_DIA.paralelo.toFixed(2)} Bs`;
        document.getElementById('tasa-usdt').textContent = `${TASAS_DEL_DIA.usdt.toFixed(2)} Bs`;

        // Calculamos la brecha cambiaria con los datos frescos de internet
        const difBs = TASAS_DEL_DIA.paralelo - TASAS_DEL_DIA.bcv;
        const porcentaje = (difBs / TASAS_DEL_DIA.bcv) * 100;

        // Pintamos los datos de la brecha en el HTML
        document.getElementById('brecha-badge').innerText = `+${porcentaje.toFixed(1)}%`;
        document.getElementById('brecha-bs').innerText = difBs.toFixed(2);

        console.log("¡Tasas actualizadas en vivo con éxito! 🚀");

    } catch (error) {
        console.error("Hubo un error al leer la API, usando tasas de respaldo:", error);
        
        // Tasas de auxilio por si el internet del usuario falla o la API se cae temporalmente
        TASAS_DEL_DIA = { bcv: 46.50, paralelo: 55.20, usdt: 55.20 };
        
        document.getElementById('tasa-bcv').textContent = `${TASAS_DEL_DIA.bcv} Bs`;
        document.getElementById('tasa-paralelo').textContent = `${TASAS_DEL_DIA.paralelo} Bs`;
        document.getElementById('tasa-usdt').textContent = `${TASAS_DEL_DIA.usdt} Bs`;
    }
}

// Le decimos a la página que ejecute la búsqueda apenas termine de cargar el diseño
window.addEventListener('DOMContentLoaded', obtenerTasasEnVivo);
// =====================================================================


// 4. Función principal: Calcula y genera el recibo en tiempo real
function actualizarCalculadora() {
    const montoNeto = parseFloat(montoBaseInput.value);
    const metodo = metodoPagoSelect.value;

    // Si el campo está vacío o es un número negativo, reiniciamos
    if (isNaN(montoNeto) || montoNeto <= 0) {
        montoCobrarEl.textContent = "$0.00";
        textoReciboEl.value = "Ingresa un monto para generar tu recibo...";
        return;
    }

    let montoCobrar = 0;
    let simbolo = "$";
    let recibo = "";

    // Lógica dependiendo del método de pago elegido
    switch (metodo) {
        case 'bcv':
            montoCobrar = montoNeto * TASAS_DEL_DIA.bcv;
            simbolo = "Bs";
            recibo = `Hola 👋\n\n📄 *Detalle de tu compra*\n\nSubtotal: $${montoNeto.toFixed(2)}\nTasa del día (BCV): ${TASAS_DEL_DIA.bcv} Bs\n\n*🟢 TOTAL A PAGAR: ${montoCobrar.toFixed(2)} Bs*\n\nDatos de Pago Móvil:\nBanco: (Tu Banco)\nCI: (Tu Cédula)\nTeléfono: (Tu Teléfono)`;
            break;
            
        case 'paypal':
            montoCobrar = (montoNeto + 0.30) / (1 - 0.054);
            simbolo = "$";
            recibo = `Hola 👋\n\n📄 *Detalle de tu compra (Vía PayPal)*\n\nMonto de los productos: $${montoNeto.toFixed(2)}\n(La comisión de PayPal es cubiertas por el comprador)\n\n*🟢 TOTAL A ENVIAR: $${montoCobrar.toFixed(2)}*\n\nPor favor envía el pago a este correo:\ntucorreo@ejemplo.com`;
            break;
            
        case 'usdt':
            montoCobrar = montoNeto; 
            simbolo = "USDT ";
            recibo = `Hola 👋\n\n📄 *Detalle de tu compra (Binance)*\n\n*🟢 TOTAL A ENVIAR: ${montoCobrar.toFixed(2)} USDT*\n\nMi Binance Pay ID es:\n123456789`;
            break;
            
        case 'zelle':
            montoCobrar = montoNeto;
            simbolo = "$";
            recibo = `Hola 👋\n\n📄 *Detalle de tu compra*\n\n*🟢 TOTAL A ENVIAR: $${montoCobrar.toFixed(2)}*\n\nZelle: tucorreo@ejemplo.com`;
            break;
    }

    // 5. Actualizar la interfaz (El texto grande y la caja del recibo)
    if (simbolo === "Bs" || simbolo === "USDT ") {
        montoCobrarEl.textContent = `${montoCobrar.toFixed(2)} ${simbolo.trim()}`;
    } else {
        montoCobrarEl.textContent = `${simbolo}${montoCobrar.toFixed(2)}`;
    }
    
    textoReciboEl.value = recibo;
}

// 6. Detectar cuando el usuario escribe o cambia el método de pago
montoBaseInput.addEventListener('input', actualizarCalculadora);
metodoPagoSelect.addEventListener('change', actualizarCalculadora);

// 7. Funcionalidad del botón de copiar
btnCopiar.addEventListener('click', () => {
    if (!montoBaseInput.value || montoBaseInput.value <= 0) return;

    navigator.clipboard.writeText(textoReciboEl.value).then(() => {
        const textoOriginal = btnCopiar.innerHTML;
        btnCopiar.innerHTML = "¡Copiado con éxito! ✅";
        btnCopiar.style.backgroundColor = "#0ca678"; 
        
        setTimeout(() => {
            btnCopiar.innerHTML = textoOriginal;
            btnCopiar.style.backgroundColor = "var(--accent-color)";
        }, 2000);
    }).catch(err => {
        console.error('Error al copiar: ', err);
        alert("Tu navegador no soporta la función de copiar automáticamente.");
    });
});