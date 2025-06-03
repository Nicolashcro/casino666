document.addEventListener('DOMContentLoaded', () => {
    // --- Selectores del DOM ---
    const navButtons = document.querySelectorAll('.nav-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const spinButton = document.getElementById('spin-button');
    const reels = [document.getElementById('reel1'), document.getElementById('reel2'), document.getElementById('reel3')];
    const spinResultMessageContainer = document.getElementById('spin-result-message-container');
    const spinResultTextElement = document.getElementById('spin-result-text');
    const spinWinningsAmountElement = document.getElementById('spin-winnings-amount');
    const spinWinningsLineElement = document.getElementById('spin-winnings-line');
    const coinBurstContainer = document.getElementById('coin-burst-container');
    const spinCountDisplay = document.getElementById('spin-count');
    const multiplierSelect = document.getElementById('multiplier-select');

    const cc6TokenBalanceDisplay = document.getElementById('cc6-token-balance');
    const cc6GoldBalanceDisplay = document.getElementById('cc6-gold-balance');
    const walletSimulatedCc6TokenBalanceDisplay = document.getElementById('wallet-cc6-token-simulated-balance');
    const connectWalletHeaderButton = document.getElementById('connect-wallet-header');
    // const connectWalletDropButton = document.getElementById('connect-wallet-drop'); // Ya no es necesario, usamos uno general
    const walletStatusDisplay = document.getElementById('wallet-status');
    const walletAddressDisplay = document.getElementById('wallet-address-display');
    const playerNameDisplay = document.getElementById('player-name');
    const buyGoldButton = document.getElementById('buy-gold-button');

    // Tap to Earn Elements
    const tappableRune = document.getElementById('tappable-rune');
    const tapEnergyDisplay = document.getElementById('tap-energy');
    const tapMaxEnergyDisplay = document.getElementById('tap-max-energy');
    const tapGainDisplay = document.getElementById('tap-gain');
    const tapFeedbackContainer = document.getElementById('tap-feedback-container');

    // --- ESTADO DEL JUEGO Y BILLETERA (SIMULADO) ---
    let cc6Token = 1000;
    let cc6Gold = 50;
    let currentSpins = 100;
    
    let isWalletConnected_simulated = false;
    let simulatedWalletAddress = "";
    let simulatedWalletCc6Token = 0; // Saldo de CC6T en la billetera simulada

    // Tap to Earn State
    let currentTapEnergy = 100;
    const maxTapEnergy = 100;
    const tapGainAmount = 1;
    const energyRechargeRate = 1; // Energía por segundo
    const energyRechargeInterval = 1000; // 1 segundo

    // --- INICIALIZACIÓN DEL JUEGO ---
    function initializeGame() {
        updateAllDisplays();
        loadSimulatedWalletState();
        playerNameDisplay.textContent = localStorage.getItem('cc666_playerName') || "HellRollerX";
        
        // Activar la pestaña de la ruleta por defecto
        document.querySelector('.nav-button[data-tab="tab-ruleta-hades"]')?.click();

        // Iniciar recarga de energía para Tap to Earn
        setInterval(rechargeTapEnergy, energyRechargeInterval);
        updateTapToEarnUI(); // Para mostrar estado inicial
    }

    function updateAllDisplays() {
        updateCurrencyDisplay();
        updateWalletStatusUI_simulated();
        updateTapToEarnUI();
    }

    // --- LÓGICA DE BILLETERA (SIMULADA) ---
    function loadSimulatedWalletState() {
        const savedStatus = localStorage.getItem('cc666_wallet_connected_sim');
        if (savedStatus === 'true') {
            isWalletConnected_simulated = true;
            simulatedWalletAddress = localStorage.getItem('cc666_wallet_address_sim') || generateFakeAddress();
            simulatedWalletCc6Token = parseInt(localStorage.getItem('cc666_wallet_tokens_sim') || '0');
        } else {
            isWalletConnected_simulated = false;
            simulatedWalletAddress = "";
            simulatedWalletCc6Token = 0;
        }
        updateWalletStatusUI_simulated();
    }

    function generateFakeAddress() {
        return "TON_SIM_" + Array(30).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    function connectSimulatedWallet() {
        if (isWalletConnected_simulated) { // Desconectar
            isWalletConnected_simulated = false;
            simulatedWalletAddress = "";
            simulatedWalletCc6Token = 0; // Resetear saldo simulado
            localStorage.setItem('cc666_wallet_connected_sim', 'false');
            localStorage.removeItem('cc666_wallet_address_sim');
            localStorage.removeItem('cc666_wallet_tokens_sim');
            alert("Billetera TON (Simulada) Desconectada.");
        } else { // Conectar
            isWalletConnected_simulated = true;
            simulatedWalletAddress = generateFakeAddress();
            simulatedWalletCc6Token = Math.floor(Math.random() * 5000) + 1000; // Saldo simulado de CC6T en billetera
            localStorage.setItem('cc666_wallet_connected_sim', 'true');
            localStorage.setItem('cc666_wallet_address_sim', simulatedWalletAddress);
            localStorage.setItem('cc666_wallet_tokens_sim', simulatedWalletCc6Token.toString());
            alert(`Billetera TON (Simulada) Conectada:\n${simulatedWalletAddress}\nSaldo CC6T en Billetera: ${simulatedWalletCc6Token}`);
        }
        updateWalletStatusUI_simulated();
        updateCurrencyDisplay(); // Para refrescar el W_CC6T
    }

    function updateWalletStatusUI_simulated() {
        if (isWalletConnected_simulated) {
            walletStatusDisplay.textContent = "Conectado";
            walletStatusDisplay.className = "connected";
            connectWalletHeaderButton.textContent = "Desconectar TON";
            // connectWalletDropButton.textContent = "Desconectar TON";
            const shortAddr = simulatedWalletAddress.substring(0, 9) + "..." + simulatedWalletAddress.substring(simulatedWalletAddress.length - 4);
            walletAddressDisplay.textContent = shortAddr;
            walletAddressDisplay.setAttribute('data-tooltip', `Billetera: ${simulatedWalletAddress}`);
            walletSimulatedCc6TokenBalanceDisplay.style.display = 'inline-block';
        } else {
            walletStatusDisplay.textContent = "Desconectado";
            walletStatusDisplay.className = "disconnected";
            connectWalletHeaderButton.textContent = "Conectar TON";
            // connectWalletDropButton.textContent = "Conectar TON";
            walletAddressDisplay.textContent = "";
            walletAddressDisplay.setAttribute('data-tooltip', 'Billetera no conectada');
            walletSimulatedCc6TokenBalanceDisplay.style.display = 'none';
        }
    }
    
    connectWalletHeaderButton.addEventListener('click', connectSimulatedWallet);
    // if(connectWalletDropButton) connectWalletDropButton.addEventListener('click', connectSimulatedWallet);


    // --- LÓGICA DE PAGO (SIMULADO) ---
    if (buyGoldButton) {
        buyGoldButton.addEventListener('click', () => {
            if (!isWalletConnected_simulated) {
                alert("Por favor, conecta tu billetera TON (simulada) primero.");
                return;
            }
            const costTON = 0.05;
            // Aquí, en una implementación real, interactuarías con el SDK de TON.
            // Por ahora, solo simulamos:
            alert(`Simulando pago de ${costTON} TON a la
