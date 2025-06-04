document.addEventListener('DOMContentLoaded', () => {
    // --- Selectores del DOM ---
    const petTokensDisplay = document.getElementById('pet-tokens-balance');
    const connectWalletBtn = document.getElementById('connect-wallet-btn');
    const walletInfoDiv = document.getElementById('wallet-info'); // Cambiado de walletDetailsDiv
    const walletAddressPlaceholder = document.getElementById('wallet-address-placeholder');
    
    const petImageContainer = document.getElementById('pet-image-container');
    const petPlaceholder = document.getElementById('pet-placeholder');
    const petLevelDisplay = document.getElementById('pet-evolution-level');
    
    const energyFill = document.getElementById('energy-fill');
    const energyValueDisplay = document.getElementById('energy-value');
    const energyMaxDisplay = document.getElementById('energy-max');
    
    const evolveBtn = document.getElementById('evolve-button');
    const evolveCostDisplay = document.getElementById('evolution-cost');
    const messagesDisplay = document.getElementById('messages');

    const buyTokensWithTonBtn = document.getElementById('buy-tokens-with-ton-btn');
    const depositAddressMessage = document.getElementById('deposit-address-message');
    const gameTonAddressPlaceholder = document.getElementById('game-ton-address-placeholder');
    
    const YOUR_GAME_RECEIVING_TON_ADDRESS = "UQCdA1_m4iiU6jKUaBMsvIoWfMLUzaRfggNg0sabGK-eV-SV";

    // --- Estado del Juego ---
    let petTokens = 0;
    let petLevel = 0;
    let evolutionBaseCost = 10;
    let currentEvolveCost = evolutionBaseCost;
    let currentEnergy = 100;
    const maxEnergy = 100;
    const tapValue = 1;
    const energyPerTap = 5;
    const energyRechargePerSecond = 1;

    // --- Estado de Billetera (Simulado) ---
    let isWalletConnected_Simulated = false;
    let simulatedWalletAddress = "";

    // --- INICIALIZACIÓN ---
    function initGame() {
        updateDisplays();
        loadSimulatedWalletState();
        setInterval(rechargeEnergy, 1000);
        if(gameTonAddressPlaceholder) gameTonAddressPlaceholder.textContent = YOUR_GAME_RECEIVING_TON_ADDRESS;
        console.log("Crypto Pets - Juego Inicializado (Versión Estable)");
    }

    // --- ACTUALIZACIÓN DE UI ---
    function updateDisplays() {
        if(petTokensDisplay) petTokensDisplay.textContent = Math.floor(petTokens);
        if(petLevelDisplay) petLevelDisplay.textContent = petLevel;
        if(evolveCostDisplay) evolveCostDisplay.textContent = Math.floor(currentEvolveCost);
        if(energyValueDisplay) energyValueDisplay.textContent = Math.floor(currentEnergy);
        if(energyMaxDisplay) energyMaxDisplay.textContent = maxEnergy;
        if(energyFill) energyFill.style.width = `${(currentEnergy / maxEnergy) * 100}%`;

        const petEmojis = ['🐾', '🐶', '🐱', '🦊', '🐻', '🐼', '🦁', '🦄', '🐲', '🌟'];
        if(petPlaceholder) petPlaceholder.textContent = petEmojis[petLevel % petEmojis.length];
        
        if(evolveBtn) evolveBtn.disabled = petTokens < currentEvolveCost;
        if(buyTokensWithTonBtn) buyTokensWithTonBtn.disabled = !isWalletConnected_Simulated;
    }

    function showMessage(text, isError = false) {
        if (!messagesDisplay) return;
        messagesDisplay.textContent = text;
        messagesDisplay.style.color = isError ? '#dc3545' : '#28a745';
        setTimeout(() => { if(messagesDisplay) messagesDisplay.textContent = ""; }, 3000);
    }

    function showTapFeedback(event) {
        const gameArea = document.getElementById('game-area');
        if (!gameArea || !event) return;

        const feedback = document.createElement('div');
        feedback.textContent = `+${tapValue}`;
        feedback.classList.add('tap-feedback');
        
        const gameAreaRect = gameArea.getBoundingClientRect();
        feedback.style.left = `${event.clientX - gameAreaRect.left - 10}px`;
        feedback.style.top = `${event.clientY - gameAreaRect.top - 20}px`;
        
        gameArea.appendChild(feedback);
        setTimeout(() => feedback.remove(), 950);
    }

    // --- LÓGICA DEL JUEGO ---
    if (petImageContainer) {
        petImageContainer.addEventListener('click', (event) => {
            if (currentEnergy >= energyPerTap) {
                currentEnergy -= energyPerTap;
                petTokens += tapValue;
                showTapFeedback(event);
                updateDisplays();
            } else {
                showMessage("¡Sin energía!", true);
            }
        });
    }

    function rechargeEnergy() {
        if (currentEnergy < maxEnergy) {
            currentEnergy = Math.min(maxEnergy, currentEnergy + energyRechargePerSecond);
            updateDisplays();
        }
    }

    if (evolveBtn) {
        evolveBtn.addEventListener('click', () => {
            if (petTokens >= currentEvolveCost) {
                petTokens -= currentEvolveCost;
                petLevel++;
                currentEvolveCost = Math.floor(evolveBaseCost * Math.pow(1.2, petLevel));
                updateDisplays();
                showMessage(`¡Mascota evolucionada al Nivel ${petLevel}!`, false);
            } else {
                showMessage("No tienes suficientes PetTokens.", true);
            }
        });
    }

    // --- SIMULACIÓN DE BILLETERA TON ---
    function loadSimulatedWalletState() {
        const connected = localStorage.getItem('sim_wallet_v3_connected') === 'true';
        if (connected) {
            isWalletConnected_Simulated = true;
            simulatedWalletAddress = localStorage.getItem('sim_wallet_v3_address') || "SIM_EQ...xxxx";
        }
        updateSimulatedWalletUI();
    }
    
    function updateSimulatedWalletUI() {
        if (!walletInfoDiv || !connectWalletBtn || !walletAddressPlaceholder) return;

        if (isWalletConnected_Simulated) {
            walletAddressPlaceholder.textContent = simulatedWalletAddress.substring(0, 7) + "..." + simulatedWalletAddress.substring(simulatedWalletAddress.length - 5);
            walletInfoDiv.style.display = 'block';
            connectWalletBtn.textContent = 'Desconectar';
        } else {
            walletInfoDiv.style.display = 'none';
            connectWalletBtn.textContent = 'Conectar Billetera TON';
        }
        if(buyTokensWithTonBtn) buyTokensWithTonBtn.disabled = !isWalletConnected_Simulated;
    }

    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', () => {
            if (isWalletConnected_Simulated) {
                isWalletConnected_Simulated = false;
                simulatedWalletAddress = "";
                localStorage.removeItem('sim_wallet_v3_connected');
                localStorage.removeItem('sim_wallet_v3_address');
                showMessage("Billetera (Simulada) Desconectada.", false);
            } else {
                // SIMULACIÓN DE CONEXIÓN:
                // En una implementación real, aquí llamarías a `tonConnectUI.openModal()` o similar.
                simulatedWalletAddress = "SIM_EQ" + Math.random().toString(36).substring(2, 12).toUpperCase();
                isWalletConnected_Simulated = true;
                localStorage.setItem('sim_wallet_v3_connected', 'true');
                localStorage.setItem('sim_wallet_v3_address', simulatedWalletAddress);
                showMessage(`Billetera (Simulada) Conectada: ${simulatedWalletAddress}`, false);
                
                // Aquí es donde el SDK real (TonConnectUI) manejaría la respuesta.
                // Ejemplo de cómo actualizarías la UI si el SDK te diera la información:
                // handleRealWalletConnected({ account: { address: 'RAW_ADDRESS_FROM_SDK', chain: TonConnectSDK.CHAIN.MAINNET } });
            }
            updateSimulatedWalletUI();
        });
    }

    if (buyTokensWithTonBtn) {
        buyTokensWithTonBtn.addEventListener('click', () => {
            if (!isWalletConnected_Simulated) {
                showMessage("Conecta tu billetera (simulada) primero.", true);
                return;
            }
            const amountTON = 0.1;
            if(depositAddressMessage) depositAddressMessage.style.display = 'block';
            showMessage(`Simulación: Para comprar, enviarías ${amountTON} TON a la dirección mostrada. (No se enviarán fondos reales).`, false);
            
            // Lógica para una transacción REAL (actualmente comentada):
            // if (tonConnectUI && tonConnectUI.connected) {
            //     const transaction = { /* ... construir objeto de transacción ... */ };
            //     tonConnectUI.sendTransaction(transaction)
            //         .then(result => { /* ... manejar éxito ... */ })
            //         .catch(error => { /* ... manejar error ... */ });
            // } else {
            //     showMessage("La funcionalidad real de TON Connect no está activa.", true);
            // }
        });
    }
    
    // --- INICIALIZAR ---
    initGame();
});
