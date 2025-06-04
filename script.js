document.addEventListener('DOMContentLoaded', () => {
    // --- Selectores del DOM ---
    const petTokensDisplay = document.getElementById('pet-tokens-balance');
    const connectWalletBtn = document.getElementById('connect-wallet-btn');
    const walletInfoDiv = document.getElementById('wallet-info');
    const walletAddressPlaceholder = document.getElementById('wallet-address-placeholder');
    
    const petImageContainer = document.getElementById('pet-image-container');
    const petPlaceholder = document.getElementById('pet-placeholder');
    const petLevelDisplay = document.getElementById('pet-level');
    
    const energyFill = document.getElementById('energy-fill');
    const energyValueDisplay = document.getElementById('energy-value');
    const energyMaxDisplay = document.getElementById('energy-max');
    
    const evolveBtn = document.getElementById('evolve-button');
    const evolveCostDisplay = document.getElementById('evolution-cost');
    const messagesDisplay = document.getElementById('messages-display'); // ID corregido

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
        
        // Placeholder para lógica de Telegram Web App (si estás en ese entorno)
        if (window.Telegram && window.Telegram.WebApp) {
            try {
                window.Telegram.WebApp.ready();
                console.log("Telegram WebApp SDK detectado y listo.");
            } catch (e) {
                console.warn("Error al inicializar Telegram WebApp SDK:", e);
            }
        } else {
            console.log("Telegram WebApp SDK no detectado.");
        }
        console.log("Crypto Pets - Juego Inicializado (Versión Estable con Simulación)");
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

    function showMessage(text, type = "info") { // type: "info", "success", "error"
        if (!messagesDisplay) return;
        messagesDisplay.textContent = text;
        messagesDisplay.className = `message-${type}`; 
        setTimeout(() => { if(messagesDisplay) messagesDisplay.textContent = ""; if(messagesDisplay) messagesDisplay.className = ""; }, 4000);
    }

    function showTapFeedback(event) {
        const gameArea = document.getElementById('game-area');
        if (!gameArea || !event) return;

        const feedback = document.createElement('div');
        feedback.textContent = `+${tapValue}`;
        feedback.classList.add('tap-feedback');
        
        const gameAreaRect = gameArea.getBoundingClientRect();
        // Ajustar posición para que aparezca donde se hizo clic
        feedback.style.left = `${event.clientX - gameAreaRect.left - (feedback.offsetWidth / 2)}px`; 
        feedback.style.top = `${event.clientY - gameAreaRect.top - (feedback.offsetHeight / 2) - 10}px`; // Un poco arriba del clic
        
        document.getElementById('game-area').appendChild(feedback);
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
                showMessage("¡Sin energía!", "error");
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
                showMessage(`¡Mascota evolucionada al Nivel ${petLevel}!`, "success");
            } else {
                showMessage("No tienes suficientes PetTokens.", "error");
            }
        });
    }

    // --- SIMULACIÓN DE BILLETERA TON (SIN SDK REAL) ---
    function loadSimulatedWalletState() {
        const connected = localStorage.getItem('sim_wallet_v4_connected') === 'true';
        if (connected) {
            isWalletConnected_
