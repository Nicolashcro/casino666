document.addEventListener('DOMContentLoaded', () => {
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
    
    const GAME_RECEIVING_TON_ADDRESS = "UQCdA1_m4iiU6jKUaBMsvIoWfMLUzaRfggNg0sabGK-eV-SV";

    // --- Estado del Juego ---
    let petTokens = 0;
    let evolutionLevel = 0;
    let evolutionBaseCost = 10;
    let currentEvolutionCost = evolutionBaseCost;
    let currentEnergy = 100;
    const maxEnergy = 100;
    const tapValue = 1;
    const energyPerTap = 5;
    const energyRechargePerSecond = 1;

    // --- TON Connect UI Instancia ---
    let tonConnectUI = null; 
    // **IMPORTANTE**: URL a tu archivo tonconnect-manifest.json alojado en HTTPS
    const MY_APP_MANIFEST_URL = 'https://raw.githubusercontent.com/Nicolashcro/casino666/main/tonconnect-manifest.json';

    // --- INICIALIZACIÓN ---
    function initGame() {
        console.log("Iniciando Crypto Pets...");
        updateDisplays(); // Actualizar UI del juego base
        initTonConnect(); // Intentar inicializar TON Connect
        setInterval(rechargeEnergy, 1000);

        // Lógica de Telegram Web App (si aplica)
        if (window.Telegram && window.Telegram.WebApp) {
            try {
                window.Telegram.WebApp.ready();
                console.log("Telegram WebApp SDK detectado.");
            } catch (e) { console.warn("Error Telegram WebApp SDK:", e); }
        } else {
            console.log("Telegram WebApp SDK no detectado.");
        }
        console.log("Crypto Pets - Juego Inicializado.");
    }

    function initTonConnect() {
        // **VERIFICACIÓN CRUCIAL DEL SDK**
        if (typeof TON_CONNECT_UI === 'undefined' || typeof TON_CONNECT_UI.TonConnectUI === 'undefined') {
            console.error("Error Crítico: TON_CONNECT_UI no está definido. Asegúrate de que el script del SDK <script src='https://unpkg.com/@tonconnect/ui@latest/dist/tonconnect-ui.min.js'></script> esté en tu index.html y se cargue correctamente ANTES que este script.");
            showMessage("Error SDK: No se pudo cargar. Funcionalidad de billetera deshabilitada.", "error");
            disableTonFunctionality("Error SDK");
            return;
        }

        if (!MY_APP_MANIFEST_URL || MY_APP_MANIFEST_URL.includes('URL_REAL_DE_TU_TONCONNECT-MANIFEST.JSON') || MY_APP_MANIFEST_URL.includes('URL_RAIZ_DE_TU_JUEGO')) {
            console.error("Error Crítico: La 'MY_APP_MANIFEST_URL' en script.js no está configurada correctamente. Debe ser la URL HTTPS pública de tu archivo tonconnect-manifest.json (contenido raw).");
            showMessage("Error Config: Manifiesto TON no configurado.", "error");
            disableTonFunctionality("Error Config.");
            return;
        }
        
        try {
            console.log("Inicializando TON Connect UI con manifest:", MY_APP_MANIFEST_URL);
            tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
                manifestUrl: MY_APP_MANIFEST_URL,
                // buttonRootId: 'ton-connect-button-placeholder', // Descomenta si quieres que el SDK cree su botón
                uiPreferences: {
                    theme: 'SYSTEM', // THEME.DARK, THEME.LIGHT
                    borderRadius: 'm',
                },
                actionsConfiguration: { // Necesario para redirecciones correctas en TWA
                    twaReturnUrl: `https://t.me/${window.Telegram?.WebApp?.initDataUnsafe?.bot?.username || 'tu_bot_o_app_name'}`
                }
            });
            console.log("TON Connect UI inicializado.");

            // Suscribirse a cambios de estado para actualizar la UI
            tonConnectUI.onStatusChange(wallet => { // wallet puede ser null o WalletInfo
                if (wallet) {
                    handleWalletConnected(wallet);
                } else {
                    handleWalletDisconnected();
                }
            });
            // No es necesario llamar a restoreConnection manualmente con TonConnectUI,
            // usualmente lo maneja internamente o a través de su botón/estado.
            // Pero si hay un botón del SDK, él se encarga de la restauración.
            // Si manejamos nuestro propio botón, el estado se reflejará en onStatusChange.

        } catch (e) {
            console.error("Error fatal inicializando TonConnectUI:", e);
            showMessage("Error crítico al iniciar TON Connect. Revisa la consola.", "error");
            disableTonFunctionality("Error Init SDK");
        }
    }
    
    function disableTonFunctionality(reason = "Error") {
        if (connectWalletBtn) {
            connectWalletBtn.textContent = reason;
            connectWalletBtn.disabled = true;
        }
        if (buyTokensWithTonBtn) {
            buyTokensWithTonBtn.textContent = "Billetera no disp.";
            buyTokensWithTonBtn.disabled = true;
        }
    }

    function handleWalletConnected(walletInfo) {
        // walletInfo es un objeto del tipo Wallet o WalletInfoRemote, etc.
        // Contiene walletInfo.account (address, chain, publicKey, walletStateInit)
        // y walletInfo.device (platform, appName, etc.)
        const addressRaw = walletInfo.account.address;
        // El SDK principal (TonConnectSDK) tiene la utilidad toUserFriendlyAddress,
        // @tonconnect/ui podría no exponerla directamente así.
        // Asumiremos que la dirección ya viene en un formato usable o que la podemos mostrar raw.
        // Para la versión de cadena: TonConnectSDK.CHAIN.MAINNET o TonConnectSDK.CHAIN.TESTNET (-239 o -3)
        const isTestnet = walletInfo.account.chain === '-3'; 
        // El SDK TonConnectUI devuelve la dirección en formato "user-friendly" directamente en algunos casos
        // o puedes necesitar convertirla si tienes el SDK @tonconnect/sdk también.
        // Por ahora, asumamos que addressRaw es usable o la mostramos como viene (raw).
        const displayAddress = (typeof TonConnectSDK !== 'undefined' && TonConnectSDK.toUserFriendlyAddress) 
                               ? TonConnectSDK.toUserFriendlyAddress(addressRaw, isTestnet) 
                               : addressRaw;

        console.log(`Billetera conectada: ${displayAddress}`);
        console.log("Info de billetera completa:", walletInfo);

        if(walletAddressDisplay) walletAddressDisplay.textContent = `<span class="math-inline">\{displayAddress\.substring\(0, 6\)\}\.\.\.</span>{displayAddress.substring(displayAddress.length - 4)}`;
        if(walletAddressDisplay) walletAddressDisplay.setAttribute('data-tooltip', `Billetera: ${displayAddress}`);
        if(walletNetworkDisplay) walletNetworkDisplay.textContent = `(${isTestnet ? "Testnet" : "Mainnet"})`;
        if(walletInfoDiv) walletInfoDiv.style.display = 'flex';
        if(connectWalletBtn) connectWalletBtn.textContent = 'Desconectar';
        if(buyTokensWithTonBtn) buyTokensWithTonBtn.disabled = false;
    }

    function handleWalletDisconnected() {
        console.log('Billetera desconectada por el SDK.');
        if(walletInfoDiv) walletInfoDiv.style.display = 'none';
        if(connectWalletBtn) connectWalletBtn.textContent = 'Conectar Billetera';
        if(buyTokensWithTonBtn) buyTokensWithTonBtn.disabled = true;
    }
    
    // --- MANEJO DE BOTÓN DE CONEXIÓN/DESCONEXIÓN ---
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', async () => {
            if (!tonConnectUI) {
                showMessage("Error: TON Connect no está inicializado.", "error");
                return;
            }
            // @tonconnect/ui maneja su propio modal y estados de conexión/desconexión
            // Si está conectado, el botón del SDK usualmente muestra para desconectar.
            // Si no está conectado, muestra para conectar.
            // Con un botón personalizado, le pedimos que abra su modal de conexión o que se desconecte.
            if (tonConnectUI.connected) {
                try {
                    await tonConnectUI.disconnect();
                    // onStatusChange se encargará de actualizar la UI.
                } catch (e) {
                    console.error("Error al desconectar:", e);
                    showMessage("Error al desconectar la billetera.", "error");
                }
            } else {
                tonConnectUI.openModal(); // Esto abrirá el modal de @tonconnect/ui para conectar
            }
        });
    }

    // --- COMPRA DE TOKENS CON TON (TRANSACCIÓN REAL) ---
    if (buyTokensWithTonBtn) {
        buyTokensWithTonBtn.addEventListener('click', async () => {
            if (!tonConnectUI || !tonConnectUI.connected) {
                showMessage("Por favor, conecta tu billetera TON primero.", "error");
                tonConnectUI?.openModal(); 
                return;
            }

            const amountToPayTON = "0.1"; 
            const amountInNanoTON = (parseFloat(amountToPayTON) * 1000000000).toString(); // Convertir a nanoTON manualmente si toNano no está en TonConnectUI

            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 360, // 6 minutos
                messages: [ { address: GAME_RECEIVING_TON_ADDRESS, amount: amountInNanoTON } ]
            };

            try {
                showMessage(`Enviando ${amountToPayTON} TON... Confirma en tu billetera.`, "info");
                const result = await tonConnectUI.sendTransaction(transaction);
                
                console.log("Transacción enviada (BOC):", result.
