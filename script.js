document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.nav-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const spinButton = document.getElementById('spin-button');
    const reels = [document.getElementById('reel1'), document.getElementById('reel2'), document.getElementById('reel3')];
    
    const spinResultMessageContainer = document.getElementById('spin-result-message-container');
    const spinResultTextElement = document.getElementById('spin-result-text');
    const spinWinningsAmountElement = document.getElementById('spin-winnings-amount');
    const spinWinningsLineElement = document.getElementById('spin-winnings-line'); // Nuevo
    const coinBurstContainer = document.getElementById('coin-burst-container');

    const spinCountDisplay = document.getElementById('spin-count');
    const multiplierSelect = document.getElementById('multiplier-select');

    // --- Elementos de UI para Billetera y Tokens ---
    const cc6TokenBalanceDisplay = document.getElementById('cc6-token-balance');
    const cc6GoldBalanceDisplay = document.getElementById('cc6-gold-balance');
    const walletCc6TokenBalanceDisplay = document.getElementById('wallet-cc6-token-balance');
    const connectWalletButtons = document.querySelectorAll('.wallet-button'); // Todos los botones de conectar billetera
    const walletStatusDisplay = document.getElementById('wallet-status');
    const walletAddressDisplay = document.getElementById('wallet-address-display');
    const playerNameDisplay = document.getElementById('player-name'); // Asumiendo que quieres mostrar un nombre

    // --- ESTADO DEL JUEGO Y BILLETERA (SIMULADO) ---
    let cc6Token = 1000;
    let cc6Gold = 50;
    let currentSpins = 100;
    let isWalletConnected = false;
    let simulatedWalletAddress = "";
    let simulatedWalletCc6Token = 0;

    // --- INICIALIZACIÓN ---
    function initializeGame() {
        updateCurrencyDisplay();
        updateWalletDisplay();
        // Cargar estado guardado de la billetera (simulado)
        const savedWalletState = localStorage.getItem('cc666_wallet_connected');
        if (savedWalletState === 'true') {
            // Simular reconexión si estaba conectada
            isWalletConnected = false; // Forzar cambio para que connectWallet funcione
            connectWallet();
        }
        playerNameDisplay.textContent = localStorage.getItem('cc666_playerName') || "HellRoller_123"; // Ejemplo
    }


    // --- FUNCIONES DE ACTUALIZACIÓN DE UI ---
    function updateCurrencyDisplay() {
        cc6TokenBalanceDisplay.textContent = `CC6T: ${Math.floor(cc6Token)}`;
        cc6GoldBalanceDisplay.textContent = `CC6G: ${Math.floor(cc6Gold)}`;
        walletCc6TokenBalanceDisplay.textContent = `W_CC6T: ${Math.floor(simulatedWalletCc6Token)}`;
    }

    function updateWalletDisplay() {
        if (isWalletConnected) {
            walletStatusDisplay.textContent = "Conectado";
            walletStatusDisplay.className = "connected";
            connectWalletButtons.forEach(btn => btn.textContent = "Desconectar");
            walletAddressDisplay.textContent = simulatedWalletAddress.substring(0, 6) + "..." + simulatedWalletAddress.substring(simulatedWalletAddress.length - 4);
            walletAddressDisplay.setAttribute('data-tooltip', `Dirección: ${simulatedWalletAddress}`);
            walletCc6TokenBalanceDisplay.style.display = 'inline-block';
        } else {
            walletStatusDisplay.textContent = "Desconectado";
            walletStatusDisplay.className = "disconnected";
            connectWalletButtons.forEach(btn => btn.textContent = "Conectar");
            walletAddressDisplay.textContent = "";
            walletAddressDisplay.setAttribute('data-tooltip', 'Billetera no conectada');
            walletCc6TokenBalanceDisplay.style.display = 'none';
            simulatedWalletCc6Token = 0; // Resetear saldo de billetera al desconectar
        }
        updateCurrencyDisplay(); // Actualizar el display de W_CC6T
    }

    // --- LÓGICA DE BILLETERA (SIMULADA) ---
    function connectWallet() {
        if (isWalletConnected) { // Si ya está conectada, la acción es desconectar
            isWalletConnected = false;
            simulatedWalletAddress = "";
            simulatedWalletCc6Token = 0;
            localStorage.setItem('cc666_wallet_connected', 'false');
            localStorage.removeItem('cc666_wallet_address');
            localStorage.removeItem('cc666_wallet_tokens');
            console.log("Billetera desconectada (simulado).");
        } else { // Conectar
            // Simulación de conexión
            console.log("Intentando conectar billetera (simulado)...");
            // Aquí iría la lógica real para interactuar con una extensión de billetera
            // Por ahora, simulamos una conexión exitosa:
            isWalletConnected = true;
            simulatedWalletAddress = "0x" + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''); // Dirección aleatoria
            simulatedWalletCc6Token = Math.floor(Math.random() * 10000); // Saldo aleatorio simulado
            
            localStorage.setItem('cc666_wallet_connected', 'true');
            localStorage.setItem('cc666_wallet_address', simulatedWalletAddress);
            localStorage.setItem('cc666_wallet_tokens', simulatedWalletCc6Token.toString());
            console.log(`Billetera conectada: ${simulatedWalletAddress} (simulado).`);
            console.log(`Saldo de CC6T en billetera: ${simulatedWalletCc6Token} (simulado).`);
        }
        updateWalletDisplay();
    }

    connectWalletButtons.forEach(button => {
        button.addEventListener('click', connectWallet);
    });


    // --- FUNCIONES DE ANIMACIÓN DE TEXTO Y NÚMEROS --- (Como las teníamos antes)
    function typeWriterEffect(element, text, speed = 50, callback) {
        element.textContent = "";
        element.style.opacity = 1;
        let i = 0;
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            } else if (callback) {
                callback();
            }
        }
        type();
    }

    function countUpNumber(element, targetAmount, duration = 1000) {
        // ... (función countUpNumber sin cambios significativos, asegúrate que funciona bien con targetAmount = 0)
        let currentAmount = 0;
        const frameDuration = 1000 / 60; // 60 FPS
        const totalFrames = Math.round(duration / frameDuration);
        const increment = targetAmount / totalFrames;

        if (targetAmount === 0) {
            element.textContent = "0";
            return;
        }
        let currentFrame = 0;
        const timer = setInterval(() => {
            currentFrame++;
            currentAmount += increment;
            if (currentFrame >= totalFrames) {
                currentAmount = targetAmount;
                clearInterval(timer);
            }
            element.textContent = Math.floor(currentAmount);
        }, frameDuration);
    }
    
    // --- Simulación de Explosión de Monedas --- (Como la teníamos antes)
    function createCoinBurst(count = 10, isJackpot = false) {
        // ... (función createCoinBurst sin cambios significativos)
        coinBurstContainer.innerHTML = ''; 
        if (!isJackpot && count < 15) return; // Solo para premios mayores o jackpots

        const numCoins = isJackpot ? count * 2 : count;

        for (let i = 0; i < numCoins; i++) {
            const particle = document.createElement('div');
            particle.classList.add('coin-burst-particle');
            particle.style.left = `${40 + Math.random() * 20}%`; // Centrado
            particle.style.bottom = `${Math.random() * 20}%`;
            const randomX = (Math.random() - 0.5) * (isJackpot ? 150 : 100);
            const randomY = (isJackpot ? 100 : 80) + Math.random() * (isJackpot ? 40 : 20);
            particle.style.setProperty('--tx', `${randomX}px`);
            const animDuration = 0.6 + Math.random() * 0.6;
            const animDelay = Math.random() * 0.3;
            particle.style.animation = `coinBurstAnimation ${animDuration}s ${animDelay}s forwards ease-out`;
            particle.style.transform = `translateY(0) scale(${0.7 + Math.random() * 0.6})`; // Tamaños variados
            coinBurstContainer.appendChild(particle);
            setTimeout(() => particle.remove(), (animDuration + animDelay) * 1000 + 100);
        }
    }


    // --- LÓGICA DE LA TRAGAMONEDAS ---
    const slotSymbols = ['💀', '😈', '666', '🔥', '👁️', '💰', 'BAR']; // Símbolo de moneda añadido
    function getRandomSymbol() { return slotSymbols[Math.floor(Math.random() * slotSymbols.length)]; }

    if (spinButton) {
        const originalSpinButtonText = spinButton.textContent;

        spinButton.addEventListener('click', () => {
            if (spinButton.disabled) return;

            spinButton.classList.add('spin-button-cooldown');
            spinButton.disabled = true;
            spinButton.textContent = "GIRANDO...";

            spinResultMessageContainer.style.opacity = 0;
            spinResultTextElement.textContent = "";
            spinWinningsLineElement.style.display = 'none';
            spinWinningsAmountElement.textContent = "0";
            
            const selectedMultiplier = parseInt(multiplierSelect.value);

            if (currentSpins <= 0) {
                spinResultMessageContainer.style.opacity = 1;
                typeWriterEffect(spinResultTextElement, "¡No tienes giros!", 30);
                spinButton.classList.remove('spin-button-cooldown');
                spinButton.disabled = false;
                spinButton.textContent = originalSpinButtonText;
                return;
            }

            currentSpins--;
            spinCountDisplay.textContent = Math.floor(currentSpins);

            reels.forEach(reel => reel.textContent = '...');

            setTimeout(() => {
                const result = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
                reels[0].textContent = result[0];
                reels[1].textContent = result[1];
                reels[2].textContent = result[2];

                let messageText = "";
                let winnings = 0;
                let isJackpot = false;

                // Lógica de Ganancias Mejorada (Ejemplo)
                if (result[0] === '💰' && result[1] === '💰' && result[2] === '💰') {
                    winnings = 250 * selectedMultiplier; messageText = "¡¡MEGA JACKPOT!!"; isJackpot = true;
                } else if (result[0] === result[1] && result[1] === result[2]) {
                    winnings = 100 * selectedMultiplier; messageText = "¡JACKPOT!"; isJackpot = true;
                } else if (result[0] === '666' && result[1] === '666' && result[2] === '666') {
                    winnings = 66 * selectedMultiplier; messageText = "¡Número de la Bestia!"; isJackpot = true;
                } else if ((result[0] === result[1] && result[0] !== result[2]) || (result[0] === result[2] && result[0] !== result[1]) || (result[1] === result[2] && result[1] !== result[0])) {
                    winnings = 20 * selectedMultiplier; messageText = "¡Doble!";
                } else if (result.includes('💰')) { // Un solo símbolo de moneda da un premio pequeño
                    winnings = 5 * selectedMultiplier; messageText = "¡Algo es algo!";
                }
                 else {
                    messageText = "¡Sigue Intentando!";
                }
                
                cc6Token += winnings;
                updateCurrencyDisplay();

                spinResultMessageContainer.style.opacity = 1;
                typeWriterEffect(spinResultTextElement, messageText, 70, () => {
                    if (winnings > 0) {
                        spinWinningsLineElement.style.display = 'block';
                        countUpNumber(spinWinningsAmountElement, winnings, Math.min(winnings * 10, 1500));
                        createCoinBurst(Math.min(10 + Math.floor(winnings / (5 * selectedMultiplier)), 50), isJackpot);
                    }
                });

                spinButton.classList.remove('spin-button-cooldown');
                spinButton.disabled = false;
                spinButton.textContent = originalSpinButtonText;
            }, 2000);
        });
    }

    // --- NAVEGACIÓN POR PESTAÑAS --- (con transición)
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const currentActiveButton = document.querySelector('#bottom-nav .nav-button.active');
            const currentActiveTab = document.querySelector('.tab-content.active');

            if (currentActiveButton) currentActiveButton.classList.remove('active');
            if (currentActiveTab) {
                // currentActiveTab.classList.remove('active'); // Quitarla inmediatamente para que no se solapen animaciones
                 // Ocultar después de la animación de salida si se implementa una
                setTimeout(() => { // Retraso para que se vea la animación de salida (si la hubiera)
                    if (currentActiveTab !== document.getElementById(button.dataset.tab)) {
                         currentActiveTab.style.display = 'none'; // Ocultar la anterior
                         currentActiveTab.classList.remove('active');
                    }
                }, 0); // Si no hay anim de salida, 0. Si la hay, ajustar al tiempo de la anim.
            }
            
            button.classList.add('active');
            const targetTab = document.getElementById(button.dataset.tab);
            if (targetTab) {
                targetTab.style.display = 'block'; // Asegurar display block antes de añadir active para la anim.
                // Pequeño delay para asegurar que el display block se aplique antes de la clase active para la animación
                requestAnimationFrame(() => {
                    targetTab.classList.add('active');
                });
            }
        });
    });
    // Activar pestaña inicial
    document.querySelector('.nav-button[data-tab="tab-ruleta-hades"]').click();


    // --- OTRAS FUNCIONALIDADES (Placeholders como estaban antes) ---
    // ... (Lógica de Ascensión, Drop, Referidos, Misiones)
    const sendToMoonButton = document.getElementById('send-to-moon');
    if (sendToMoonButton) {
        sendToMoonButton.addEventListener('click', () => { /* ... */ });
    }
    const claimTokensButton = document.getElementById('claim-tokens');
    if (claimTokensButton) { /* ... */ }


    // Inicializar Juego
    initializeGame();
});
