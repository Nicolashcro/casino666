document.addEventListener('DOMContentLoaded', () => {
    // ... (resto de tus selectores y variables existentes)
    const spinButton = document.getElementById('spin-button'); // Asegúrate que este selector es correcto
    // ...

    // --- Lógica Simplificada de la Tragamonedas ---
    // ... (tus símbolos y funciones existentes)

    if (spinButton) {
        const originalSpinButtonText = spinButton.textContent; // Guardar el texto original

        spinButton.addEventListener('click', () => {
            // --- INICIO: LÓGICA PARA ESTADO DE CARGA/ENFRIAMIENTO ---
            if (spinButton.disabled) { // Prevenir acciones si ya está deshabilitado
                return;
            }

            // Aplicar estado de "cooldown" / "girando"
            spinButton.classList.add('spin-button-cooldown');
            spinButton.disabled = true;
            spinButton.textContent = "GIRANDO..."; // Cambiar texto del botón
            // --- FIN: LÓGICA PARA ESTADO DE CARGA/ENFRIAMIENTO ---

            const selectedMultiplier = parseInt(multiplierSelect.value);

            if (currentSpins <= 0 /* || Lógica de costo de giro */) {
                spinResultMessage.textContent = "¡No tienes suficientes giros!";
                // Revertir estado del botón si no hay giros
                spinButton.classList.remove('spin-button-cooldown');
                spinButton.disabled = false;
                spinButton.textContent = originalSpinButtonText;
                return;
            }

            currentSpins -= 1; // Asumimos costo de 1 giro por ahora
            spinCountDisplay.textContent = Math.floor(currentSpins);

            reels.forEach(reel => reel.textContent = '...'); 
            spinResultMessage.textContent = "Girando...";

            // Simular tiempo de giro
            setTimeout(() => {
                const result = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
                reels[0].textContent = result[0];
                reels[1].textContent = result[1];
                reels[2].textContent = result[2];

                let winnings = 0;
                if (result[0] === result[1] && result[1] === result[2]) {
                    winnings = 100 * selectedMultiplier;
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

                // --- INICIO: REVERTIR ESTADO DEL BOTÓN TRAS EL GIRO ---
                spinButton.classList.remove('spin-button-cooldown');
                spinButton.disabled = false;
                spinButton.textContent = originalSpinButtonText; // Restaurar texto original
                // --- FIN: REVERTIR ESTADO DEL BOTÓN TRAS EL GIRO ---

            }, 2000); // Aumentado el tiempo para apreciar el estado de "girando"
        });
    }

    // ... (resto de tu código JavaScript existente)
});
