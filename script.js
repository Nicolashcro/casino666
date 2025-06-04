document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM cargado. Iniciando TMA script...");

    // --- Selectores del DOM ---
    const connectTonWalletBtn = document.getElementById('connect-ton-wallet-btn');
    const tonWalletInfoDiv = document.getElementById('ton-wallet-info');
    const tonWalletAddressSpan = document.getElementById('ton-wallet-address');
    const tonNetworkSpan = document.getElementById('ton-network');
    const tonWalletAppNameSpan = document.getElementById('ton-wallet-app-name');
    const sendTonTransactionBtn = document.getElementById('send-ton-payment-btn');
    const messagesDisplay = document.getElementById('messages-display');
    const telegramUserInfoDiv = document.getElementById('telegram-user-info');

    // Referencias a los SDKs globales
    // Es importante verificar que estos scripts se carguen ANTES que este script.js
    const WebApp = window.Telegram ? window.Telegram.WebApp : undefined;
    const TONConnectSDK_GLOBAL = window.TONConnectSDK; // Usar un nombre diferente para la asignación inicial

    console.log("Estado inicial de window.Telegram.WebApp:", WebApp);
    console.log("Estado inicial de window.TONConnectSDK:", TONConnectSDK_GLOBAL);


    // --- 1. Inicialización del SDK de Telegram ---
    if (WebApp && WebApp.initData) {
        console.log("SDK de Telegram WebApp detectado y listo.");
        WebApp.ready(); 
        WebApp.expand(); 

        if (WebApp.initDataUnsafe && WebApp.initDataUnsafe.user && telegramUserInfoDiv) {
            const user = WebApp.initDataUnsafe.user;
            telegramUserInfoDiv.innerHTML = `
                Hola, ${user.first_name || ''} ${user.last_name || ''} (@${user.username || 'N/A'})!
                <br>ID: ${user.id} | Lenguaje: ${user.language_code}
            `;
        }
        document.body.style.backgroundColor = WebApp.themeParams.bg_color || '#ffffff';
        document.body.style.color = WebApp.themeParams.text_color || '#000000';
    } else {
        console.error("SDK de Telegram WebApp NO detectado o no inicializado correctamente. Asegúrate de que telegram-web-app.js esté cargado ANTES que este script y que la app se ejecute dentro de Telegram.");
        showUIMessage("Error: Esta app debe ejecutarse dentro de Telegram.", "error", 10000);
        if (connectTonWalletBtn) connectTonWalletBtn.disabled = true;
        if (sendTonTransactionBtn) sendTonTransactionBtn.disabled = true;
        return; 
    }

    // --- 2. Configuración de TON Connect ---
    if (typeof TONConnectSDK_GLOBAL === 'undefined') {
        console.error("¡ERROR CRÍTICO: TONConnectSDK_GLOBAL (window.TONConnectSDK) no está definido! El script <script src='https://unpkg.com/@tonconnect/sdk@latest/dist/tonconnect-sdk.min.js'></script> NO se cargó correctamente o se cargó DESPUÉS de script.js. Revisa la pestaña 'Network' en las herramientas de desarrollador (F12).");
        showUIMessage("Error: No se pudo cargar el SDK de TON Connect. Revisa la consola (F12) -> Network para ver si 'tonconnect-sdk.min.js' se está cargando con estado 200.", "error", 20000);
        if (connectTonWalletBtn) connectTonWalletBtn.disabled = true;
        return; 
    }

    const { TonConnectUI } = TONConnectSDK_GLOBAL; // Ahora usamos la variable que verificamos
    // Asegúrate que esta URL sea correcta y que el archivo JSON exista y sea accesible públicamente
    const manifestUrl = 'https://nicolashcro.github.io/casino666/tonconnect-manifest.json'; 
    console.log("Usando manifestUrl para TON Connect:", manifestUrl);

    let tonConnectUI;
    try {
        tonConnectUI = new TonConnectUI({
            manifestUrl: manifestUrl,
        });
        console.log("TonConnectUI inicializado:", tonConnectUI);
    } catch (error) {
        console.error("Error al inicializar TonConnectUI. ¿Es la manifestUrl correcta y accesible ('" + manifestUrl + "')? ¿El JSON del manifiesto es válido?", error);
        showUIMessage("Error al init TON Connect. ¿Manifest URL correcta y accesible? ¿JSON válido?", "error", 10000);
        return;
    }

    const YOUR_TON_RECEIVING_ADDRESS = "UQCdA1_m4iiU6jKUaBMsvIoWfMLUzaRfggNg0sabGK-eV-SV";
    console.log("Dirección de recepción de pagos TON:", YOUR_TON_RECEIVING_ADDRESS);

    let userTonWalletInfo = null;

    function updateUserWalletUI(wallet) {
        if (wallet) {
            userTonWalletInfo = wallet;
            console.log("Billetera TON conectada/actualizada:", wallet);
            if (tonWalletAddressSpan) tonWalletAddressSpan.textContent = `${wallet.account.address.slice(0, 6)}...${wallet.account.address.slice(-4)}`;
            if (tonNetworkSpan) tonNetworkSpan.textContent = wallet.account.chain === '-239' ? 'Mainnet' : (wallet.account.chain === '-3' ? 'Testnet' : `ID ${wallet.account.chain}`);
            if (tonWalletAppNameSpan) tonWalletAppNameSpan.textContent = wallet.device.appName;
            if (tonWalletInfoDiv) tonWalletInfoDiv.style.display = 'block';
            if (connectTonWalletBtn) connectTonWalletBtn.textContent = 'Desconectar Billetera';
            if (sendTonTransactionBtn) sendTonTransactionBtn.disabled = false;
            showUIMessage(`Billetera ${wallet.device.appName} conectada!`, "success");
        } else {
            userTonWalletInfo = null;
            console.log("Billetera TON desconectada.");
            if (tonWalletAddressSpan) tonWalletAddressSpan.textContent = '';
            if (tonNetworkSpan) tonNetworkSpan.textContent = 'Desconectada';
            if (tonWalletAppNameSpan) tonWalletAppNameSpan.textContent = '';
            if (tonWalletInfoDiv) tonWalletInfoDiv.style.display = 'none';
            if (connectTonWalletBtn) connectTonWalletBtn.textContent = 'Conectar Billetera TON';
            if (sendTonTransactionBtn) sendTonTransactionBtn.disabled = true;
            showUIMessage("Billetera desconectada.", "info");
        }
    }
    
    tonConnectUI.onStatusChange(walletOrNull => {
        console.log("TON Connect onStatusChange. Wallet:", walletOrNull);
        updateUserWalletUI(walletOrNull);
    });

    if (tonConnectUI.wallet) {
        console.log("Conexión de billetera TON ya existente al cargar:", tonConnectUI.wallet);
        updateUserWalletUI(tonConnectUI.wallet);
    } else {
        console.log("No hay conexión de billetera TON existente al cargar.");
        updateUserWalletUI(null);
    }

    if (connectTonWalletBtn) {
        connectTonWalletBtn.addEventListener('click', async () => {
            console.log("Botón 'Conectar/Desconectar Billetera TON' clickeado.");
            if (tonConnectUI.connected) {
                await tonConnectUI.disconnect();
            } else {
                tonConnectUI.openModal();
            }
        });
    } else {
        console.error("Botón 'connect-ton-wallet-btn' no encontrado en el DOM.");
    }

    if (sendTonTransactionBtn) {
        sendTonTransactionBtn.addEventListener('click', async () => {
            // ... (lógica de transacción idéntica a la anterior)
            console.log("Botón 'send-ton-payment-btn' clickeado.");
            if (!tonConnectUI.connected || !userTonWalletInfo) {
                showUIMessage("Conecta tu billetera TON primero.", "error");
                WebApp.showAlert("Por favor, conecta tu billetera TON primero.");
                return;
            }
            const amountNanoTON = '10000000'; 
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 600, 
                messages: [{ address: YOUR_TON_RECEIVING_ADDRESS, amount: amountNanoTON, }]
            };
            try {
                sendTonTransactionBtn.disabled = true;
                showUIMessage(`Enviando ${parseFloat(amountNanoTON) / 1e9} TON... Confirma en tu billetera.`, "info", 7000);
                const result = await tonConnectUI.sendTransaction(transaction);
                console.log("Transacción enviada con TON Connect! Resultado:", result); 
                showUIMessage(`Transacción propuesta a la billetera. Esperando confirmación en la red (simulada)...`, "info", 15000);
                setTimeout(() => {
                    showUIMessage("¡Pago recibido y procesado (simulado)!", "success");
                    WebApp.showAlert("¡Gracias por tu compra! (Simulado)");
                    if (tonConnectUI.connected) sendTonTransactionBtn.disabled = false;
                }, 15000);
            } catch (error) {
                console.error("Error al enviar transacción TON:", error);
                let errorMessage = "Error al enviar la transacción.";
                 if (error && typeof error === 'object' && 'message' in error) {
                    if (error.message.toLowerCase().includes('user rejected')) {
                        errorMessage = "Transacción rechazada por el usuario.";
                    } else if (error.message.toLowerCase().includes('popup_closed')) {
                        errorMessage = "Modal de confirmación cerrado por el usuario.";
                    } else if (error.message.length < 80) { 
                        errorMessage = `Error: ${error.message}`;
                    }
                } else if (typeof error === 'string' && error.toLowerCase().includes('popup_closed')) {
                    errorMessage = "Ventana de confirmación cerrada por el usuario.";
                }
                showUIMessage(errorMessage, "error");
                WebApp.showAlert(errorMessage);
                if (tonConnectUI.connected) sendTonTransactionBtn.disabled = false;
            }
        });
    } else {
         console.error("Botón 'send-ton-payment-btn' no encontrado en el DOM.");
    }

    function showUIMessage(text, type = "info", duration = 5000) {
        if (!messagesDisplay) {
            console.warn("Elemento messagesDisplay no encontrado para mensaje:", text);
            return;
        }
        messagesDisplay.textContent = text;
        messagesDisplay.className = ''; 
        messagesDisplay.classList.add(`message-${type}`); 
        setTimeout(() => { 
            if(messagesDisplay && messagesDisplay.textContent === text) {
                messagesDisplay.textContent = ""; 
                messagesDisplay.className = ""; 
            }
        }, duration);
    }
    
    // Lógica del juego
    let petTokens = 0;
    let currentPetLevel = 0;
    const petTokensDisplay = document.getElementById('pet-tokens-balance');
    const petEvolutionLevelDisplay = document.getElementById('pet-evolution-level');

    function updateGameDisplays() {
        if(petTokensDisplay) petTokensDisplay.textContent = String(Math.floor(petTokens));
        if(petEvolutionLevelDisplay) petEvolutionLevelDisplay.textContent = String(currentPetLevel);
    }
    updateGameDisplays();

    console.log("Script.js TMA finalizado. App lista.");
});
