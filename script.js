document.addEventListener('DOMContentLoaded', async () => {
    // --- Selectores del DOM ---
    const petTokensDisplay = document.getElementById('pet-tokens-balance');
    const connectWalletBtn = document.getElementById('connect-wallet-btn');
    const walletInfoDiv = document.getElementById('wallet-info');
    const walletAddressDisplay = document.getElementById('wallet-address');
    const walletNetworkDisplay = document.getElementById('wallet-network');
    
    const petImageContainer = document.getElementById('pet-image-container');
    const petPlaceholder = document.getElementById('pet-placeholder');
    const petLevelDisplay = document.getElementById('pet-evolution-level');
    
    const energyFill = document.getElementById('energy-fill');
    const energyValueDisplay = document.getElementById('energy-value');
    const energyMaxDisplay = document.getElementById('energy-max');
    
    const evolveBtn = document.getElementById('evolve-button');
    const evolveCostDisplay = document.getElementById('evolution-cost');
    const messagesDisplay = document.getElementById('messages-display');

    const buyTokensWithTonBtn = document.getElementById('buy-tokens-with-ton-btn');
    
    const walletSelectionModal = document.getElementById('wallet-selection-modal');
    const closeWalletModalBtn = document.getElementById('close-wallet-modal-btn');
    const walletButtonsContainer = document.getElementById('wallet-buttons-container');
    const walletModalMessage = document.getElementById('wallet-modal-message');

    const GAME_RECEIVING_TON_ADDRESS = "UQCdA1_m4iiU6jKUaBMsvIoWfMLUzaRfggNg0sabGK-eV-SV";

    // --- Estado del Juego ---
    let petTokens = 0;
    let evolutionLevel = 0;
    let evolutionBaseCost = 10;
    let currentEvolveCost = evolutionBaseCost;
    let currentEnergy = 100;
    const maxEnergy = 100;
    const tapValue = 1;
    const energyPerTap = 5;
    const energyRechargePerSecond = 1;

    // --- TON Connect SDK Instancia ---
    let tonConnector = null; 
    const MY_APP_MANIFEST_URL = 'https://raw.githubusercontent.com/Nicolashcro/casino666/main/tonconnect-manifest.json';

    // --- INICIALIZACIÓN ---
    async function initGame() {
        updateDisplays();
        initTonConnect(); 
        setInterval(rechargeEnergy, 1000);

        if (window.Telegram && window.Telegram.WebApp) {
            try {
                window.Telegram.WebApp.ready();
                console.log("Telegram WebApp SDK detectado.");
            } catch (e) { console.warn("Error Telegram WebApp SDK:", e); }
        } else {
            console.log("Telegram WebApp SDK no detectado.");
        }
    }

    function initTonConnect() {
        if (typeof TonConnectSDK === 'undefined') {
            console.error("Error Crítico: TonConnectSDK no está cargado. Verifica el tag <script> en index.html.");
            showMessage("Error SDK: No se pudo cargar. Intenta recargar.", "error");
            disableTonButtons("Error SDK");
            return;
        }

        if (!MY_APP_MANIFEST_URL || MY_APP_MANIFEST_URL.includes('URL_REAL_DE_TU_TONCONNECT-MANIFEST.JSON')) {
            console.error("Error Crítico: 'MY_APP_MANIFEST_URL' en script.js no está configurada con la URL HTTPS pública de tu tonconnect-manifest.json.");
            showMessage("Error Config: Manifiesto TON no configurado.", "error");
            disableTonButtons("Error Config.");
            return;
        }
        
        try {
            tonConnector = new TonConnectSDK.TonConnect({ manifestUrl: MY_APP_MANIFEST_URL });

            tonConnector.onStatusChange(walletInfo => {
                if (walletInfo) { // Conectado
                    const address = TonConnectSDK.toUserFriendlyAddress(walletInfo.account.address, walletInfo.account.chain === TonConnectSDK.CHAIN.TESTNET);
                    const network = walletInfo.account.chain === TonConnectSDK.CHAIN.TESTNET ? "Testnet" : "Mainnet";
                    
                    console.log(`Billetera conectada: ${address} en ${network}`);
                    console.log("WalletInfo completo:", walletInfo);

                    if(walletAddressDisplay) walletAddressDisplay.textContent = `<span class="math-inline">\{address\.substring\(0, 6\)\}\.\.\.</span>{address.substring(address.length - 4)}`;
                    if(walletAddressDisplay) walletAddressDisplay.setAttribute('data-tooltip', `Billetera: ${address}`);
                    if(walletNetworkDisplay) walletNetworkDisplay.textContent = `(${network})`;
                    if(walletInfoDiv) walletInfoDiv.style.display = 'flex';
                    if(connectWalletBtn) connectWalletBtn.textContent = 'Desconectar';
                    if(buyTokensWithTonBtn) buyTokensWithTonBtn.disabled = false;

                    localStorage.setItem('ton_wallet_connected_real_v2', 'true');
                    closeWalletSelectionModal();
                } else { // Desconectado
                    console.log('Billetera desconectada.');
                    if(walletInfoDiv) walletInfoDiv.style.display = 'none';
                    if(connectWalletBtn) connectWalletBtn.textContent = 'Conectar Billetera';
                    if(buyTokensWithTonBtn) buyTokensWithTonBtn.disabled = true;
                    localStorage.removeItem('ton_wallet_connected_real_v2');
                }
            });

            // Intentar restaurar conexión
            tonConnector.restoreConnection();

        } catch (e) {
            console.error("Error inicializando TonConnect:", e);
            showMessage("Error al iniciar TON Connect. Revisa la consola.", "error");
            disableTonButtons("Error Init TON");
        }
    }

    function disableTonButtons(reason = "Error") {
        if (connectWalletBtn) {
            connectWalletBtn.textContent = reason;
            connectWalletBtn.disabled = true;
        }
        if (buyTokensWithTonBtn) {
            buyTokensWithTonBtn.disabled = true;
        }
    }
    
    // --- MANEJO DE BOTÓN DE CONEXIÓN/DESCONEXIÓN ---
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', async () => {
            if (!tonConnector) {
                showMessage("TON Connect no está listo.", "error");
                return;
            }
            if (tonConnector.connected) {
                try {
                    await tonConnector.disconnect();
                } catch (e) { console.error("Error al desconectar:", e); }
            } else {
                // Mostrar modal con opciones de billetera
                showWalletSelectionModal();
            }
        });
    }

    async function showWalletSelectionModal() {
        if (!tonConnector || !walletSelectionModal || !walletButtonsContainer || !walletModalMessage) return;
        
        walletButtonsContainer.innerHTML = '<p>Cargando billeteras...</p>'; // Mensaje de carga
        walletSelectionModal.style.display = 'flex';
        walletModalMessage.textContent = "";

        try {
            const walletsList = await ton
