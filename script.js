// 1. Seleccionar los elementos de la pantalla que vamos a escuchar o cambiar
const inputMonto = document.getElementById('monto-compra');
const textoInicial = document.getElementById('pago-inicial');
const textoCuota = document.getElementById('monto-cuota');

// 2. Crear la función que hace el cálculo matemático (Estilo Cashea: 40% inicial, 60% en 3 cuotas)
function calcularCuotas() {
    // Obtener el valor que el usuario escribió y transformarlo a número
    let montoTotal = parseFloat(inputMonto.value);

    // Si el usuario borra todo el número, evitamos que salga un error en pantalla
    if (isNaN(montoTotal) || montoTotal <= 0) {
        textoInicial.innerText = "$0.00";
        textoCuota.innerText = "$0.00";
        return;
    }

    // Cashea cobra el 40% de pago inicial en el momento de la compra
    let inicial = montoTotal * 0.40;
    
    // El 60% restante se divide en 3 cuotas iguales
    let restante por cuota = (montoTotal * 0.60) / 3;

    // Actualizar los textos en la pantalla con el formato de dos decimales (.toFixed(2))
    textoInicial.innerText = `$${inicial.toFixed(2)}`;
    textoCuota.innerText = `$${restante por cuota.toFixed(2)}`;
}

// 3. Escuchar activamente cuando el usuario teclee o cambie el número
inputMonto.addEventListener('input', calcularCuotas);