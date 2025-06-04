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
    const WebApp = window.Telegram.WebApp;
    const TONConnectSDK = window.TONConnectSDK; // Se asigna si el script del SDK se carga

    // --- 1. Inicialización del SDK de Telegram ---
    if (WebApp && WebApp.initData) {
        console.log("SDK de Telegram WebApp detectado.");
        WebApp.ready(); // Informa a Telegram que la app está lista
        WebApp.expand(); // Expande la Mini App a altura completa

        // Mostrar información del usuario de Telegram (opcional)
        if (WebApp.initDataUnsafe && WebApp.initDataUnsafe.user && telegramUserInfoDiv) {
            const user = WebApp.initDataUnsafe.user;
            telegramUserInfoDiv.innerHTML = `
                Hola, ${user.first_name || ''} ${user.last_name || ''} (@${user.username || 'N/A'})!
                <br>ID: ${user.id} | Lenguaje: ${user.language_code}
            `;
        }
         // Aplicar tema de Telegram (opcional)
        document.body.style.backgroundColor = WebApp.themeParams.bg_color || '#ffffff';
        document.body.style.color = WebApp.themeParams.text_color || '#000000';
        // Puedes aplicar más estilos a elementos específicos si quieres
        // WebApp.MainButton.setText('Botón Principal').show().onClick(() => WebApp.close());

    } else {
        console.error("SDK de Telegram WebApp NO detectado. Asegúrate de que telegram-web-app.js esté cargado y que la app se ejecute dentro de Telegram.");
        showUIMessage("Error: Esta app debe ejecutarse dentro de Telegram.", "error");
        // Podrías deshabilitar funcionalidad si no está en Telegram.
        if (connectTonWalletBtn) connectTonWalletBtn.disabled = true;
        if (sendTonTransactionBtn) sendTonTransactionBtn.disabled = true;
        return; // Detener si no estamos en entorno TMA
    }

    // --- 2. Configuración de TON Connect ---
    if (typeof TONConnectSDK === 'undefined') {
        console.error("¡ERROR CRÍTICO: TONConnectSDK no está definido! Asegúrate de que el script del SDK de TON Connect se haya cargado ANTES que este script (script.js) en tu HTML y que la URL sea correcta.");
        showUIMessage("Error: No se pudo cargar el SDK de TON Connect. Revisa la consola (F12) -> Network.", "error", 10000);
        if (connectTonWalletBtn) connectTonWalletBtn.disabled = true;
        return; // Detener la ejecución si el SDK de TON no está
    }

    const { TonConnectUI } = TONConnectSDK;
    const manifestUrl = 'https://nicolashcro.github.io/casino666/tonconnect-manifest.json'; // ¡USA TU URL CORRECTA!
    console.log("Usando manifestUrl para TON Connect:", manifestUrl);

    let tonConnectUI;
    try {
        tonConnectUI = new TonConnectUI({
            manifestUrl: manifestUrl,
            // Opcional: si quieres que el SDK renderice su propio botón de conexión
            // buttonRootId: 'id-del-div-donde-quieres-el-boton-sdk' 
        });
        console.log("TonConnectUI inicializado:", tonConnectUI);
    } catch (error) {
        console.error("Error al inicializar TonConnectUI:", error);
        showUIMessage("Error al init TON Connect. ¿Manifest URL correcta y accesible? ¿JSON válido?", "error", 10000);
        return;
    }

    // Tu dirección de billetera TON para recibir pagos
    const YOUR_TON_RECEIVING_ADDRESS = "UQCdA1_m4iiU6jKUaBMsvIoWfMLUzaRfggNg0sabGK-eV-SV"; // Reemplaza con tu dirección
    console.log("Dirección de recepción de pagos TON:", YOUR_TON_RECEIVING_ADDRESS);

    let userTonWalletInfo = null;

    function updateUserWalletUI(wallet) {
        // ... (esta función es igual a la de la respuesta anterior, asegúrate que tonWalletAppNameSpan exista)
        if (wallet) {
            userTonWalletInfo = wallet;
            console.log("Billetera TON conectada/actualizada:", wallet);
            if (tonWalletAddressSpan) tonWalletAddressSpan.textContent = `${wallet.account.address.slice(0, 6)}...${wallet.account.address.slice(-4)}`;
            if (tonNetworkSpan) tonNetworkSpan.textContent = wallet.account.chain === '-239' ? 'Mainnet' : (wallet.account.chain === '-3' ? 'Testnet' : `ID ${wallet.account.chain}`);
            if (tonWalletAppNameSpan) tonWalletAppNameSpan.textContent = wallet.device.appName;
            if (tonWalletInfoDiv) tonWalletInfoDiv.style.display = 'block';
            if (connectTonWalletBtn) connectTonWalletBtn.textContent = 'Desconectar Billetera';
            if (sendTonTransactionBtn) sendTonTransactionBtn.disabled = false;
            // WebApp.showAlert(`Billetera ${wallet.device.appName} conectada!`); // Opcional: alerta nativa de Telegram
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
    
    // Suscribirse a cambios de estado de la billetera TON Connect
    // Este evento se dispara cuando el usuario conecta, desconecta, o la conexión se restaura.
    tonConnectUI.onStatusChange(walletOrNull => {
        console.log("TON Connect onStatusChange. Wallet:", walletOrNull);
        updateUserWalletUI(walletOrNull);
    });

    // Verificar si hay una conexión restaurada (ej. si el usuario recarga la TMA)
    // No es estrictamente necesario esperar la promesa si onStatusChange ya maneja el estado inicial.
    if (tonConnectUI.wallet) {
        console.log("Conexión de billetera TON ya existente al cargar:", tonConnectUI.wallet);
        updateUserWalletUI(tonConnectUI.wallet);
    } else {
        console.log("No hay conexión de billetera TON existente al cargar.");
        updateUserWalletUI(null); // Asegura que la UI esté en estado desconectado
    }


    if (connectTonWalletBtn) {
        connectTonWalletBtn.addEventListener('click', async () => {
            console.log("Botón 'Conectar/Desconectar Billetera TON' clickeado.");
            if (tonConnectUI.connected) {
                console.log("Intentando desconectar billetera TON...");
                await tonConnectUI.disconnect(); // Disparará onStatusChange
            } else {
                console.log("Abriendo modal de conexión de TON Connect...");
                tonConnectUI.openModal(); // Muestra el popup para elegir billetera
            }
        });
    } else {
        console.error("Botón 'connect-ton-wallet-btn' no encontrado.");
    }

    if (sendTonTransactionBtn) {
        sendTonTransactionBtn.addEventListener('click', async () => {
            console.log("Botón 'send-ton-payment-btn' clickeado.");
            if (!tonConnectUI.connected || !userTonWalletInfo) {
                showUIMessage("Conecta tu billetera TON primero.", "error");
                WebApp.showAlert("Por favor, conecta tu billetera TON primero."); // Alerta nativa
                return;
            }
            // ... (lógica de transacción como antes)
            const amountNanoTON = '10000000'; // 0.01 TON para pruebas más baratas
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 600, 
                messages: [{ address: YOUR_TON_RECEIVING_ADDRESS, amount: amountNanoTON, /* payload: 'tu_comentario_o_id_de_item' */ }]
            };

            try {
                sendTonTransactionBtn.disabled = true;
                showUIMessage(`Enviando ${parseFloat(amountNanoTON) / 1e9} TON... Confirma en tu billetera.`, "info", 7000);
                
                const result = await tonConnectUI.sendTransaction(transaction);
                console.log("Transacción enviada con TON Connect! Resultado:", result); 
                // El `result.boc` es la "bolsa de celdas" de la transacción firmada.
                // NO significa que la transacción esté confirmada en la blockchain.
                
                // WebApp.HapticFeedback.notificationOccurred('success'); // Feedback háptico
                showUIMessage(`Transacción propuesta a la billetera. Esperando confirmación en la red (simulada)...`, "info", 15000);

                // **SIMULACIÓN DE ÉXITO - ¡NO USAR EN PRODUCCIÓN SIN VERIFICACIÓN REAL!**
                setTimeout(() => {
                    showUIMessage("¡Pago recibido y procesado (simulado)!", "success");
                    WebApp.showAlert("¡Gracias por tu compra! (Simulado)");
                    // Aquí tu lógica de juego: petTokens += N; updateDisplays();
                    if (tonConnectUI.connected) sendTonTransactionBtn.disabled = false;
                }, 15000);

            } catch (error) {
                console.error("Error al enviar transacción TON:", error);
                // WebApp.HapticFeedback.notificationOccurred('error');
                let errorMessage = "Error al enviar la transacción.";
                 if (error && typeof error === 'object' && 'message' in error) {
                    // Algunos errores comunes del SDK de TON Connect UI
                    if (error.message.includes('Modal is not opened') || error.message.includes('Modal is closed')) {
                         errorMessage = "El modal de conexión no está abierto o fue cerrado.";
                    } else if (error.message.includes('User rejected')) {
                         errorMessage = "Transacción rechazada por el usuario.";
                    } else if (error.message.includes('Wallet not connected')) {
                         errorMessage = "La billetera no está conectada.";
                    } else {
                        errorMessage = `Error: ${error.message.substring(0, 80)}`;
                    }
                } else if (typeof error === 'string' && error.includes('popup_closed')) { // Algunos errores de billeteras pueden ser strings
                    errorMessage = "Ventana de confirmación cerrada por el usuario.";
                }
                showUIMessage(errorMessage, "error");
                WebApp.showAlert(errorMessage);
                if (tonConnectUI.connected) sendTonTransactionBtn.disabled = false;
            }
        });
    }

    // Función para mostrar mensajes en la UI (ya la tenías, la adapto un poco)
    function showUIMessage(text, type = "info", duration = 5000) {
        if (!messagesDisplay) {
            console.warn("Elemento messagesDisplay no encontrado para mensaje:", text);
            return;
        }
        // console.log(`UI Mensaje [${type}]: ${text}`);
        messagesDisplay.textContent = text;
        messagesDisplay.className = ''; // Limpiar clases anteriores
        messagesDisplay.classList.add(`message-${type}`); // Añadir nueva clase de tipo
        
        // Limpiar mensaje después de la duración
        setTimeout(() => { 
            if(messagesDisplay && messagesDisplay.textContent === text) { // Solo si el mensaje no ha cambiado
                messagesDisplay.textContent = ""; 
                messagesDisplay.className = ""; 
            }
        }, duration);
    }
    
    // --- Lógica del Juego (Ejemplo - integra la tuya) ---
    let petTokens = 0;
    let currentPetLevel = 0;
    const petTokensDisplay = document.getElementById('pet-tokens-balance');
    const petEvolutionLevelDisplay = document.getElementById('pet-evolution-level');

    function updateGameDisplays() {
        if(petTokensDisplay) petTokensDisplay.textContent = String(Math.floor(petTokens));
        if(petEvolutionLevelDisplay) petEvolutionLevelDisplay.textContent = String(currentPetLevel);
        // ... y cualquier otra actualización de la UI de tu juego
    }
    updateGameDisplays(); // Llamada inicial

    console.log("Script.js TMA finalizado. App lista.");
});
