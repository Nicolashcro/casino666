document.addEventListener('DOMContentLoaded', () => {
    // --- Selectores del DOM (agrupados para claridad) ---
    const gameContainer = document.getElementById('game-container');
    const playerNameDisplay = document.getElementById('player-name');

    // Wallet UI
    const connectWalletButton = document.getElementById('connect-wallet-button');
    const walletStatusDisplay = document.getElementById('wallet-status');
    const walletAddressDisplay = document.getElementById('wallet-address-display');
    const walletSimulatedCc6TokenBalanceDisplay = document.getElementById('wallet-cc6-token-simulated-balance');
    const buyGoldButton = document.getElementById('buy-gold-button');

    // Currency UI
    const cc6TokenBalanceDisplay = document.getElementById('cc6-token-balance');
    const cc6GoldBalanceDisplay = document.getElementById('cc6-gold-balance');

    // Tabs & Navigation
    const navButtons = document.querySelectorAll('.nav-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // Ruleta (Slot Machine) UI
    const spinButton = document.getElementById('spin-button');
    const reels = [document.getElementById('reel1'), document.getElementById('reel2'), document.getElementById('reel3')];
    const spinResultMessageContainer = document.getElementById('spin-result-message-container');
    const spinResultTextElement = document.getElementById('spin-result-text');
    const spinWinningsAmountElement = document.getElementById('spin-winnings-amount');
    const spinWinningsLineElement = document.getElementById('spin-winnings-line');
    const coinBurstContainer = document.getElementById('coin-burst-container');
    const spinCountDisplay = document.getElementById('spin-count');
    const multiplierSelect = document.getElementById('multiplier-select');

    // Tap to Earn UI
    const tappableRune = document.getElementById('tappable-rune');
    const tapEnergyDisplay = document.getElementById('tap-energy');
    const tapMaxEnergyDisplay = document.getElementById('tap-max-energy');
    const tapGainDisplay = document.getElementById('tap-gain');
    const tapFeedbackContainer = document.getElementById('tap-feedback-container');
    
    // Otros
    const claimTokensButton = document.getElementById('claim-tokens'); // Para Drop Tab
    const sendToMoonButton = document.getElementById('send-to-moon'); // Para Ascensión Tab


    // --- ESTADO DEL JUEGO Y BILLETERA (SIMULADO) ---
    let cc6Token = 1000;
    let cc6Gold = 50;
    let currentSpins = 100;
    let alterEgoLevel = 1;
    let dropBankTotal = 0;
    const dropRatePerHour = 3600; // 1 token por segundo para demo

    let isWalletConnected_simulated = false;
    let simulatedWalletAddress = "";
    let simulatedWalletCc6Token = 0;

    let currentTapEnergy = 100;
    const maxTapEnergy = 100;
    const tapGainAmount = 1;
    const energyRechargeRate = 1;
    const energyRechargeInterval = 1000; // ms

    const GAME_PAYMENT_ADDRESS_TON = "UQCdA1_m4iiU6jKUaBMsvIoWfMLUzaRfggNg0sabGK-eV-SV";

    // --- FUNCIONES DE INICIALIZACIÓN Y ACTUALIZACIÓN DE UI ---
    function updateAllDisplays() {
        cc6TokenBalanceDisplay.textContent = `CC6T: ${Math.floor(cc6Token)}`;
        cc6GoldBalanceDisplay.textContent = `CC6G: ${Math.floor(cc6Gold)}`;
        walletSimulatedCc6TokenBalanceDisplay.textContent = `W_CC6T: ${Math.floor(simulatedWalletCc6Token)}`;
        
        document.getElementById('alter-ego-level').textContent = alterEgoLevel;
        document.getElementById('drop-bank-total').textContent = Math.floor(dropBankTotal);
        document.getElementById('drop-rate').textContent = dropRatePerHour;
        spinCountDisplay.textContent = Math.floor(currentSpins);
        
        updateTapToEarnUI();
        updateWalletStatusUI_simulated();
    }

    function updateTapToEarnUI() {
        if (tapEnergyDisplay && tapMaxEnergyDisplay && tapGainDisplay) {
            tapEnergyDisplay.textContent = currentTapEnergy;
            tapMaxEnergyDisplay.textContent = maxTapEnergy;
            tapGainDisplay.textContent = tapGainAmount;
        }
    }

    function updateWalletStatusUI_simulated() {
        if (isWalletConnected_simulated) {
            walletStatusDisplay.textContent = "Conectado";
            walletStatusDisplay.className = "connected";
            if (connectWalletButton) connectWalletButton.textContent = "Desconectar TON";
            const shortAddr = simulatedWalletAddress.substring(0, 9) + "..." + simulatedWalletAddress.substring(simulatedWalletAddress.length - 4);
            walletAddressDisplay.textContent = shortAddr;
            walletAddressDisplay.setAttribute('data-tooltip', `Billetera: ${simulatedWalletAddress}`);
            walletSimulatedCc6TokenBalanceDisplay.style.display = 'inline-block';
        } else {
            walletStatusDisplay.textContent = "Desconectado";
            walletStatusDisplay.className = "disconnected";
            if (connectWalletButton) connectWalletButton.textContent = "Conectar TON";
            walletAddressDisplay.textContent = "";
            walletAddressDisplay.setAttribute('data-tooltip', 'Billetera no conectada');
            walletSimulatedCc6TokenBalanceDisplay.style.display = 'none';
        }
    }
    
    // --- LÓGICA DE BILLETERA (SIMULADA) ---
    function loadSimulatedWalletState() {
        const savedStatus = localStorage.getItem('cc666_wallet_connected_sim_v2'); // Nueva key para evitar conflictos
        if (savedStatus === 'true') {
            isWalletConnected_simulated = true;
            simulatedWalletAddress = localStorage.getItem('cc666_wallet_address_sim_v2') || generateFakeAddress();
            simulatedWalletCc6Token = parseInt(localStorage.getItem('cc666_wallet_tokens_sim_v2') || '0');
        } else {
            isWalletConnected_simulated = false;
        }
        updateAllDisplays(); // Llama a la función que actualiza todo
    }

    function generateFakeAddress() {
        return "SIM_TON_0x" + Array(30).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    function handleConnectSimulatedWallet() {
        if (isWalletConnected_simulated) { // Desconectar
            isWalletConnected_simulated = false;
            simulatedWalletAddress = "";
            simulatedWalletCc6Token = 0;
            localStorage.setItem('cc666_wallet_connected_sim_v2', 'false');
            localStorage.removeItem('cc666_wallet_address_sim_v2');
            localStorage.removeItem('cc666_wallet_tokens_sim_v2');
            alert("Billetera TON (Simulada) Desconectada.");
        } else { // Conectar
            isWalletConnected_simulated = true;
            simulatedWalletAddress = generateFakeAddress();
            simulatedWalletCc6Token = Math.floor(Math.random() * 5000) + 1000;
            localStorage.setItem('cc666_wallet_connected_sim_v2', 'true');
            localStorage.setItem('cc666_wallet_address_sim_v2', simulatedWalletAddress);
            localStorage.setItem('cc666_wallet_tokens_sim_v2', simulatedWalletCc6Token.toString());
            alert(`Billetera TON (Simulada) Conectada:\n${simulatedWalletAddress}\nSaldo CC6T en Billetera (Simulado): ${simulatedWalletCc6Token}`);
        }
        updateAllDisplays();
    }

    if (connectWalletButton) {
        connectWalletButton.addEventListener('click', handleConnectSimulatedWallet);
    }
    
    // --- LÓGICA DE PAGO (SIMULADO) ---
    if (buyGoldButton) {
        buyGoldButton.addEventListener('click', () => {
            if (!isWalletConnected_simulated) {
                alert("Por favor, conecta tu billetera TON (simulada) primero para comprar CC6 Gold.");
                return;
            }
            const costTON = 0.05;
            const goldAmount = 1000;
            // Simulación: Preguntar al usuario si quiere "gastar" de su saldo simulado de billetera
            // En una implementación real, esto invocaría al SDK de la billetera para una transacción real.
            if (confirm(`Simular envío de ${costTON} TON desde tu billetera a ${GAME_PAYMENT_ADDRESS_TON.substring(0,12)}... para ${goldAmount} CC6G?`)) {
                // Aquí, en una implementación real, llamarías a tonConnectUI.sendTransaction(...)
                // y esperarías el resultado.
                alert(`Pago simulado de ${costTON} TON realizado.\n(NOTA: Esto es solo una simulación, no se han transferido fondos reales.)`);
                cc6Gold += goldAmount;
                updateAllDisplays();
                // Mostrar algún feedback de éxito
                typeWriterEffect(spinResultTextElement, `¡${goldAmount} CC6G comprados!`, 50);
                spinWinningsLineElement.style.display = 'none';
                spinResultMessageContainer.style.opacity = 1;
            } else {
                alert("Compra cancelada.");
            }
        });
    }

    // --- ANIMACIONES DE TEXTO, NÚMEROS, MONEDAS (como estaban) ---
    function typeWriterEffect(element, text, speed = 50, callback) {
        if (!element) return;
        element.textContent = ""; element.style.opacity = 1; let i = 0;
        function type() { if (i < text.length) { element.textContent += text.charAt(i); i++; setTimeout(type, speed); } else if (callback) { callback(); }} type();
    }
    function countUpNumber(element, targetAmount, duration = 1000) {
        if (!element) return;
        let currentAmount = 0; const frameDuration = 1000 / 60; const totalFrames = Math.round(duration / frameDuration);
        const increment = targetAmount === 0 ? 0 : targetAmount / totalFrames;
        if (targetAmount === 0 && element) { element.textContent = "0"; return; }
        let currentFrame = 0; const timer = setInterval(() => { currentFrame++; currentAmount += increment;
        if (currentFrame >= totalFrames) { currentAmount = targetAmount; clearInterval(timer); }
        if (element) element.textContent = Math.floor(currentAmount); }, frameDuration);
    }
    function createCoinBurst(count = 10, isJackpot = false) {
        if (!coinBurstContainer) return;
        coinBurstContainer.innerHTML = ''; if (!isJackpot && count < 15) return;
        const numCoins = isJackpot ? count * 2 : count;
        for (let i = 0; i < numCoins; i++) { const particle = document.createElement('div'); particle.classList.add('coin-burst-particle');
        particle.style.left = `${40 + Math.random() * 20}%`; particle.style.bottom = `${Math.random() * 20}%`;
        const randomX = (Math.random() - 0.5) * (isJackpot ? 150 : 100);
        particle.style.setProperty('--tx', `${randomX}px`); const animDuration = 0.6 + Math.random() * 0.6;
        const animDelay = Math.random() * 0.3; particle.style.animation = `coinBurstAnimation ${animDuration}s ${animDelay}s forwards ease-out`;
        particle.style.transform = `translateY(0) scale(${0.7 + Math.random() * 0.6})`; coinBurstContainer.appendChild(particle);
        setTimeout(() => particle.remove(), (animDuration + animDelay) * 1000 + 100); }
    }

    // --- LÓGICA DE LA TRAGAMONEDAS ---
    const slotSymbols = ['💀', '😈', '666', '🔥', '👁️', '💰', 'BAR'];
    function getRandomSymbol() { return slotSymbols[Math.floor(Math.random() * slotSymbols.length)]; }

    if (spinButton) {
        const originalSpinButtonText = spinButton.textContent;
        spinButton.addEventListener('click', () => {
            if (spinButton.disabled) return;

            spinButton.classList.add('spin-button-cooldown');
            spinButton.disabled = true;
            spinButton.textContent = "GIRANDO...";

            if (spinResultMessageContainer) spinResultMessageContainer.style.opacity = 0;
            if (spinResultTextElement) spinResultTextElement.textContent = "";
            if (spinWinningsLineElement) spinWinningsLineElement.style.display = 'none';
            if (spinWinningsAmountElement) spinWinningsAmountElement.textContent = "0";
            
            const selectedMultiplier = parseInt(multiplierSelect.value);

            if (currentSpins <= 0) {
                if (spinResultMessageContainer) spinResultMessageContainer.style.opacity = 1;
                typeWriterEffect(spinResultTextElement, "¡No tienes giros!", 30);
                spinButton.classList.remove('spin-button-cooldown');
                spinButton.disabled = false;
                spinButton.textContent = originalSpinButtonText;
                return;
            }
            if(spinWinningsLineElement) spinWinningsLineElement.style.display = 'block';

            currentSpins--;
            if(spinCountDisplay) spinCountDisplay.textContent = Math.floor(currentSpins);

            reels.forEach(reel => {
                if (!reel) return;
                let i = 0;
                const maxFrames = 10 + Math.floor(Math.random() * 10);
                const intervalId = setInterval(() => {
                    reel.textContent = getRandomSymbol();
                    i++;
                    if (i >= maxFrames) {
                        clearInterval(intervalId);
                        // La asignación final se hará en el setTimeout principal
                    }
                }, 70 + Math.random() * 30); // Velocidad de giro variable
            });

            setTimeout(() => {
                const finalResult = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
                reels.forEach((reel, index) => {
                    if (reel) reel.textContent = finalResult[index];
                });

                let messageText = "";
                let winnings = 0;
                let isJackpot = false;

                if (finalResult[0] === '💰' && finalResult[1] === '💰' && finalResult[2] === '💰') {
                    winnings = 250 * selectedMultiplier; messageText = "¡¡MEGA JACKPOT!!"; isJackpot = true;
                } else if (finalResult[0] === finalResult[1] && finalResult[1] === finalResult[2]) {
                    winnings = 100 * selectedMultiplier; messageText = "¡JACKPOT!"; isJackpot = true;
                } else if (finalResult[0] === '666' && finalResult[1] === '666' && finalResult[2] === '666') {
                    winnings = 66 * selectedMultiplier; messageText = "¡Número Bestial!"; isJackpot = true;
                } else if ((finalResult[0] === finalResult[1]) || (finalResult[0] === finalResult[2]) || (finalResult[1] === finalResult[2])) {
                    winnings = 20 * selectedMultiplier; messageText = "¡Doble!";
                } else if (finalResult.includes('💰')) {
                    winnings = 5 * selectedMultiplier; messageText = "¡Monedas!";
                } else {
                    messageText = "¡Sigue Intentando!";
                }
                
                cc6Token += winnings;
                updateAllDisplays();

                if (spinResultMessageContainer) spinResultMessageContainer.style.opacity = 1;
                typeWriterEffect(spinResultTextElement, messageText, 70, () => {
                    if (winnings > 0) {
                        if(spinWinningsLineElement) spinWinningsLineElement.style.display = 'block';
                        countUpNumber(spinWinningsAmountElement, winnings, Math.min(winnings * 10, 1500));
                        createCoinBurst(Math.min(10 + Math.floor(winnings / (5 * selectedMultiplier)), 50), isJackpot);
                    } else {
                        if(spinWinningsLineElement) spinWinningsLineElement.style.display = 'none';
                    }
                });

                spinButton.classList.remove('spin-button-cooldown');
                spinButton.disabled = false;
                spinButton.textContent = originalSpinButtonText;
            }, 1500 + Math.random()*500);
