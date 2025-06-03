document.addEventListener('DOMContentLoaded', () => {
    // ... (selectores existentes)
    const spinResultMessageContainer = document.getElementById('spin-result-message-container');
    const spinResultTextElement = document.getElementById('spin-result-text');
    const spinWinningsAmountElement = document.getElementById('spin-winnings-amount');
    const coinBurstContainer = document.getElementById('coin-burst-container');


    // --- FUNCIONES DE ANIMACIÓN ---

    // 1. Animación de "Máquina de Escribir" para el texto
    function typeWriterEffect(element, text, speed = 50) {
        element.textContent = ""; // Limpiar contenido previo
        element.style.opacity = 1; // Hacer visible
        let i = 0;
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        type();
    }

    // 2. Animación de Conteo de Números para las ganancias
    function countUpNumber(element, targetAmount, duration = 1000) {
        let currentAmount = 0;
        const stepTime = Math.abs(Math.floor(duration / targetAmount)) || 20; // Evitar división por cero
        const increment = targetAmount > 0 ? 1 : 0; // Solo contar si hay ganancias

        if (targetAmount === 0) {
            element.textContent = "0";
            return;
        }

        const timer = setInterval(() => {
            currentAmount += increment * Math.ceil(targetAmount / (duration / stepTime)); // Ajustar incremento
            if (currentAmount >= targetAmount) {
                currentAmount = targetAmount;
                clearInterval(timer);
            }
            element.textContent = Math.floor(currentAmount);
        }, stepTime);
    }

    // 3. Simulación de Explosión de Monedas (Simplificado)
    function createCoinBurst(count = 10, isBigWin = false) {
        coinBurstContainer.innerHTML = ''; // Limpiar explosiones anteriores
        if (!isBigWin) return; // Solo para grandes premios

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.classList.add('coin-burst-particle');
            
            // Posición inicial aleatoria dentro del contenedor de explosión
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.bottom = `${Math.random() * 20}%`; // Empezar desde abajo

            // Variables CSS para movimiento horizontal aleatorio
            const randomX = (Math.random() - 0.5) * 100; // -50px a 50px
            particle.style.setProperty('--tx', `${randomX}px`);

            // Duración y retraso aleatorios para la animación
            const animDuration = 0.5 + Math.random() * 0.5; // 0.5s a 1s
            const animDelay = Math.random() * 0.2; // Retraso pequeño

            particle.style.animation = `coinBurstAnimation ${animDuration}s ${animDelay}s forwards ease-out`;
            
            coinBurstContainer.appendChild(particle);

            // Eliminar la partícula después de la animación para limpiar el DOM
            setTimeout(() => {
                particle.remove();
            }, (animDuration + animDelay) * 1000 + 100);
        }
    }


    // --- Lógica Simplificada de la Tragamonedas ---
    if (spinButton) {
        const originalSpinButtonText = spinButton.textContent;

        spinButton.addEventListener('click', () => {
            if (spinButton.disabled) return;

            spinButton.classList.add('spin-button-cooldown');
            spinButton.disabled = true;
            spinButton.textContent = "GIRANDO...";

            // Ocultar mensaje de ganancias anterior
            spinResultMessageContainer.style.opacity = 0;
            spinResultTextElement.textContent = "";
            spinWinningsAmountElement.textContent = "0";


            const selectedMultiplier = parseInt(multiplierSelect.value);

            if (currentSpins <= 0) {
                // Usar typewriter para mensaje de no giros
                typeWriterEffect(spinResultTextElement, "¡No tienes suficientes giros!", 30);
                spinResultMessageContainer.style.opacity = 1;
                spinWinningsAmountElement.parentElement.style.display = 'none'; // Ocultar línea de "Ganaste:"

                spinButton.classList.remove('spin-button-cooldown');
                spinButton.disabled = false;
                spinButton.textContent = originalSpinButtonText;
                return;
            }
            spinWinningsAmountElement.parentElement.style.display = 'block'; // Mostrar línea de "Ganaste:"

            currentSpins -= 1;
            spinCountDisplay.textContent = Math.floor(currentSpins);

            reels.forEach(reel => reel.textContent = '...');
            // No mostramos "Girando..." en el mensaje principal, ya está en el botón

            setTimeout(() => {
                const result = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
                reels[0].textContent = result[0];
                reels[1].textContent = result[1];
                reels[2].textContent = result[2];

                let messageText = "";
                let winnings = 0;
                let isBigWin = false;

                if (result[0] === result[1] && result[1] === result[2]) {
                    winnings = 100 * selectedMultiplier;
                    messageText = "¡¡¡JACKPOT!!!";
                    isBigWin = true; 
                } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
                    winnings = 10 * selectedMultiplier;
                    messageText = "¡Buen Tiro!";
                    if (winnings > 50 * selectedMultiplier) isBigWin = true; // Considerar "gran premio" si es significativo
                } else {
                    messageText = "¡Sigue Intentando!";
                }
                
                cc6Token += winnings;
                updateCurrencyDisplay();

                // Mostrar mensaje de resultado con animación
                spinResultMessageContainer.style.opacity = 1;
                typeWriterEffect(spinResultTextElement, messageText, 70); // Animación de máquina de escribir
                countUpNumber(spinWinningsAmountElement, winnings, winnings > 0 ? 1000 : 0); // Animación de conteo

                // Simular explosión de monedas para grandes premios
                if (winnings > 0) { // O una condición más específica para "gran premio"
                    createCoinBurst(15 + Math.min(Math.floor(winnings / (10 * selectedMultiplier)), 30), isBigWin); // Más monedas para premios mayores
                }


                spinButton.classList.remove('spin-button-cooldown');
                spinButton.disabled = false;
                spinButton.textContent = originalSpinButtonText;

            }, 2000);
        });
    }

    // ... (resto de tu código JavaScript)
});
