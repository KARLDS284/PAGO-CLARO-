// 1. Simulación de tasas del día (En una app real se conectarían a una API)
const TASAS_DEL_DIA = {
   bcv: 549.37,
    paralelo:737.87  ,
    usdt: 737.87  
};

// 2. Referencias a los elementos del HTML
const montoBaseInput = document.getElementById('monto-base');
const metodoPagoSelect = document.getElementById('metodo-pago');
const montoCobrarEl = document.getElementById('monto-cobrar');
const textoReciboEl = document.getElementById('texto-recibo');
const btnCopiar = document.getElementById('btn-copiar');

// 3. Imprimir las tasas en las tarjetas superiores al cargar la página
document.getElementById('tasa-bcv').textContent = `${TASAS_DEL_DIA.bcv} Bs`;
document.getElementById('tasa-paralelo').textContent = `${TASAS_DEL_DIA.paralelo} Bs`;
document.getElementById('tasa-usdt').textContent = `${TASAS_DEL_DIA.usdt} Bs`;

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
            // Fórmula matemática para calcular cuánto cobrar en PayPal para que te llegue el neto
            // Fórmula: (MontoNeto + Fija) / (1 - Porcentaje) => Usualmente 5.4% + $0.30
            montoCobrar = (montoNeto + 0.30) / (1 - 0.054);
            simbolo = "$";
            recibo = `Hola 👋\n\n📄 *Detalle de tu compra (Vía PayPal)*\n\nMonto de los productos: $${montoNeto.toFixed(2)}\n(La comisión de PayPal es cubierta por el comprador)\n\n*🟢 TOTAL A ENVIAR: $${montoCobrar.toFixed(2)}*\n\nPor favor envía el pago a este correo:\ntucorreo@ejemplo.com`;
            break;
            
        case 'usdt':
            montoCobrar = montoNeto; // Asumimos relación 1 a 1 para criptos estables
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
    // Si no hay monto, no copiamos nada
    if (!montoBaseInput.value || montoBaseInput.value <= 0) return;

    // API moderna para copiar al portapapeles
    navigator.clipboard.writeText(textoReciboEl.value).then(() => {
        // Efecto visual de que se copió con éxito
        const textoOriginal = btnCopiar.innerHTML;
        btnCopiar.innerHTML = "¡Copiado con éxito! ✅";
        btnCopiar.style.backgroundColor = "#0ca678"; // Verde más brillante
        
        // Volver a la normalidad después de 2 segundos
        setTimeout(() => {
            btnCopiar.innerHTML = textoOriginal;
            btnCopiar.style.backgroundColor = "var(--accent-color)";
        }, 2000);
    }).catch(err => {
        console.error('Error al copiar: ', err);
        alert("Tu navegador no soporta la función de copiar automáticamente.");
    });
});