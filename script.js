document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.nav-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const spinButton = document.getElementById('spin-button');
    const reels = [
        document.getElementById('reel1'),
        document.getElementById('reel2'),
        document.getElementById('reel3')
    ];
    const spinResultMessage = document.getElementById('spin-result-message');
    const spinCountDisplay = document.getElementById('spin-count');
    const multiplierSelect = document.getElementById('multiplier-select');

    const cc6TokenDisplay = document.getElementById('cc6-token-balance');
    const cc6GoldDisplay = document.getElementById('cc6-gold-balance');

    // --- Estado Inicial del Juego (Simulado) ---
    let cc6Token = 1000;
    let cc6Gold = 50;
    let currentSpins = 100; // Giros disponibles

    function updateCurrencyDisplay() {
        cc6TokenDisplay.textContent = `CC6 TOKEN: ${cc6Token}`;
        cc6GoldDisplay.textContent = `CC6 GOLD: ${cc6Gold}`;
    }

    // --- Lógica de Navegación por Pestañas ---
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Quitar 'active' de todos los botones y contenidos
            navButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Añadir 'active' al botón clickeado y al contenido correspondiente
            button.classList.add('active');
            const targetTab = document.getElementById(button.dataset.tab);
            if (targetTab) {
                targetTab.classList.add('active');
            }
        });
    });

    // Establecer la pestaña de Ruleta como activa inicialmente
    document.querySelector('.nav-button[data-tab="tab-ruleta-hades"]').click();


    // --- Lógica Simplificada de la Tragamonedas ---
    // Símbolos posibles (podrían ser imágenes o iconos más elaborados)
    // Para la estética grotesca: Calavera (💀), Diablo (😈), 666, Fuego (🔥), Ojo (👁️), CartaMaldita (🃏)
    const slotSymbols = ['💀', '😈', '666', '🔥', '👁️', '🃏', 'BAR'];

    function getRandomSymbol() {
        return slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
    }

    if (spinButton) {
        spinButton.addEventListener('click', () => {
            const selectedMultiplier = parseInt(multiplierSelect.value);

            // Regla del 10% (simplificada: si no tienes suficientes giros para el costo base del multiplicador)
            // Una implementación real sería: costo_del_giro = apuesta_base * multiplicador.
            // Aquí, asumimos que cada "unidad" de multiplicador podría costar más giros o una apuesta mayor.
            // Esta lógica es muy básica y necesita refinamiento.
            const costPerSpin = 1; // Asumimos que cada giro simple cuesta 1 "giro disponible"
            const effectiveCost = costPerSpin * (selectedMultiplier > 1 ? (selectedMultiplier / 1000) : 1); // Estimación muy burda del costo del multiplicador

            // Validación simple del multiplicador (que no exceda el 10% de los giros disponibles)
            // Esto es conceptual. La mecánica real del multiplicador (x5k, x1M) se aplicaría a las GANANCIAS,
            // y el costo del giro podría ser una apuesta fija o variable de CC6 GOLD.
            // La restricción del 10% se refería a que no se puede seleccionar un multiplicador que represente
            // una apuesta que consuma más del 10% de tus "giros de energía". Aquí, la simplifico.
            if (selectedMultiplier > (currentSpins * 0.1) && selectedMultiplier > 1 && currentSpins < 50000) { // Evitar que un x5k se bloquee con pocos giros
                 // Esta lógica de bloqueo es un placeholder y necesitaría un diseño más robusto.
                 // spinResultMessage.textContent = `Multiplicador muy alto para tus giros disponibles. Máx: ${Math.floor(currentSpins * 0.1)}k (aprox)`;
                 // return;
            }


            if (currentSpins <= 0 || currentSpins < effectiveCost) {
                spinResultMessage.textContent = "¡No tienes suficientes giros!";
                return;
            }

            currentSpins -= effectiveCost; // Deducir costo del giro
            spinCountDisplay.textContent = Math.floor(currentSpins);

            // Simular giro de carretes
            reels.forEach(reel => reel.textContent = '...'); // Efecto de giro
            spinResultMessage.textContent = "Girando...";

            setTimeout(() => {
                const result = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
                reels[0].textContent = result[0];
                reels[1].textContent = result[1];
                reels[2].textContent = result[2];

                // Lógica de Ganancias (Muy Simplificada)
                let winnings = 0;
                if (result[0] === result[1] && result[1] === result[2]) {
                    winnings = 100 * selectedMultiplier; // Ganancia base x multiplicador
                    spinResultMessage.textContent = `¡JACKPOT! Ganaste ${winnings} CC6 TOKEN!`;
                    cc6Token += winnings;
                } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
                    winnings = 10 * selectedMultiplier;
                    spinResultMessage.textContent = `¡Casi! Ganaste ${winnings} CC6 TOKEN.`;
                    cc6Token += winnings;
                } else {
                    spinResultMessage.textContent = "¡Sigue intentando!";
                }
                updateCurrencyDisplay();

                // Aquí iría la lógica para misiones tipo "Juega X giros"
            }, 1000); // Simular tiempo de giro
        });
    }

    // --- Lógica de Otras Pestañas (Placeholders) ---

    // Pestaña Ascensión
    const sendToMoonButton = document.getElementById('send-to-moon');
    if (sendToMoonButton) {
        sendToMoonButton.addEventListener('click', () => {
            const cost = 10000; // Ejemplo de costo alto en CC6 GOLD
            if (cc6Gold >= cost) {
                cc6Gold -= cost;
                alert("¡Tu Alter Ego ha sido enviado A LA LUNA! (Implementar bonificaciones)");
                // Aquí iría la lógica de mejora y bonificaciones pasivas.
                updateCurrencyDisplay();
            } else {
                alert("No tienes suficiente CC6 GOLD para esta ascensión.");
            }
        });
    }


    // Pestaña La Caída (Drop)
    const claimTokensButton = document.getElementById('claim-tokens');
    if (claimTokensButton) {
        // Simular acumulación pasiva (esto debería ser manejado con timestamps en un juego real)
        let dropBankTotal = 0;
        const dropRatePerHour = 50; // CC6 TOKEN por hora
        document.getElementById('drop-rate').textContent = dropRatePerHour;

        setInterval(() => {
            dropBankTotal += dropRatePerHour / 3600; // Acumular cada segundo
            document.getElementById('drop-bank-total').textContent = Math.floor(dropBankTotal);
        }, 1000);

        claimTokensButton.addEventListener('click', () => {
            if (dropBankTotal > 0) {
                cc6Token += Math.floor(dropBankTotal);
                alert(`Reclamaste ${Math.floor(dropBankTotal)} CC6 TOKEN.`);
                dropBankTotal = 0;
                document.getElementById('drop-bank-total').textContent = '0';
                updateCurrencyDisplay();
            } else {
                alert("No hay tokens para reclamar.");
            }
        });
    }

    // Conectar Billetera (Placeholder)
    document.querySelectorAll('#connect-wallet-header, #connect-wallet-drop').forEach(button => {
        button.addEventListener('click', () => {
            alert("Función 'Conectar Billetera' (Integración con TON pendiente)");
            // Aquí iría la lógica para conectar con la billetera de TON
        });
    });

    // Ofertas (Placeholder)
    const offersButton = document.getElementById('offers-button');
    if (offersButton) {
        offersButton.addEventListener('click', () => {
            alert("Mercado Negro: Aquí podrías comprar CC6 GOLD con TON. (Integración pendiente)");
        });
    }


    // Inicializar visualización de monedas
    updateCurrencyDisplay();

    // Aquí añadirías lógica para:
    // - Guardar y cargar el estado del juego (localStorage o backend)
    // - Lógica de misiones (Contratos del Averno)
    // - Lógica de referidos (Hermandad Oscura)
    // - Interacción con un backend si es necesario
    // - Integración real con la blockchain de TON
});
