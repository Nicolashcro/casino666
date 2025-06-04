document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM cargado. Iniciando TMA script...");

    // --- Selectores del DOM (asegúrate que todos estos IDs existan en tu HTML) ---
    const connectTonWalletBtn = document.getElementById('connect-ton-wallet-btn');
    const tonWalletInfoDiv = document.getElementById('ton-wallet-info');
    const tonWalletAddressSpan = document.getElementById('ton-wallet-address');
    const tonNetworkSpan = document.getElementById('ton-network');
    const tonWalletAppNameSpan = document.getElementById('ton-wallet-app-name');
    const sendTonTransactionBtn = document.getElementById('send-ton-payment-btn');
    const messagesDisplay = document.getElementById('messages-display');
    const telegramUserInfoDiv = document.getElementById('telegram-user-info');
    
    const petTokensDisplay = document.getElementById('pet-tokens-balance');
    const petEvolutionLevelDisplay = document.getElementById('pet-evolution-level');
    const petImageContainer = document.getElementById('pet-image-container'); // Para el juego
    const petPlaceholder = document.getElementById('pet-placeholder'); // Para el juego


    // --- SDK Global Check ---
    // Esta función se llamará después de intentar inicializar los SDKs
    function showUIMessage(text, type = "info", duration = 5000) {
        if (!messagesDisplay) {
            console.warn("Elemento messagesDisplay no encontrado para mensaje:", text);
            return;
        }
        messagesDisplay.textContent = text;
        messagesDisplay.className = ''; // Limpiar clases anteriores
        messagesDisplay.classList.add(`message-${type}`);
        setTimeout(() => {
            if (messagesDisplay && messagesDisplay.textContent === text) {
                messagesDisplay.textContent = "";
                messagesDisplay.className = "";
            }
        }, duration);
    }

    // --- 1. Inicialización del SDK de Telegram ---
    let WebApp;
    if (window.Telegram && window.Telegram.WebApp) {
        WebApp = window.Telegram.WebApp;
        console.log("SDK de Telegram WebApp detectado.");
        try {
            WebApp.ready();
            WebApp.expand();
            console.log("Telegram WebApp.ready() y expand() llamados.");

            // Aplicar tema de Telegram
            document.body.style.backgroundColor = WebApp.themeParams.bg_color || '#ffffff';
            document.body.style.color = WebApp.themeParams.text_color || '#000000';
            if (document.querySelector('footer')) {
                 document.querySelector('footer').style.color = WebApp.themeParams.hint_color || '#707579';
            }
            // Actualizar estilo de botones para usar colores de Telegram
            const buttons = document.querySelectorAll('#ton-wallet-section button, #payment-section button');
            buttons.forEach(button => {
                button.style.color = WebApp.themeParams.button_text_color || 'white';
                button.style.backgroundColor = WebApp.themeParams.button_color || '#007bff';
            });


            if (WebApp.initDataUnsafe && WebApp.initDataUnsafe.user && telegramUserInfoDiv) {
                const user = WebApp.initDataUnsafe.user;
                telegramUserInfoDiv.innerHTML = `
                    Usuario: ${user.first_name || ''} ${user.last_name || ''} (@${user.username || 'N/A'})
                `;
            }
        } catch (e) {
            console.error("Error al inicializar Telegram WebApp:", e);
            showUIMessage("Error al iniciar con Telegram.", "error");
            return; // No continuar si falla la inicialización básica de Telegram
        }
    } else {
        console.error("SDK de Telegram WebApp (window.Telegram.WebApp) NO detectado. Asegúrate de que telegram-web-app.js esté cargado ANTES que este script y que la app se ejecute dentro de Telegram.");
        showUIMessage("Error: App no iniciada en Telegram.", "error", 10000);
        if (connectTonWalletBtn) connectTonWalletBtn.disabled = true;
        if (sendTonTransactionBtn) sendTonTransactionBtn.disabled = true;
        return; 
    }

    // --- 2. Configuración de TON Connect ---
    // Verificar si el SDK de TON Connect se cargó
    if (typeof window.TONConnectSDK === 'undefined') {
        console.error("¡ERROR CRÍTICO: window.TONConnectSDK no está definido! El script <script src='https://unpkg.com/@tonconnect/sdk@latest/dist/tonconnect-sdk.min.js'></script> NO se cargó correctamente o se cargó DESPUÉS de este script (script.js). Revisa la pestaña 'Network' en las herramientas de desarrollador (F12).");
        showUIMessage("Error CRÍTICO: SDK de TON Connect no cargado. Verifica la consola y la pestaña 'Network'.", "error", 20000);
        if (connectTonWalletBtn) connectTonWalletBtn.disabled = true;
        return; 
    }

    const { TonConnectUI } = window.TONConnectSDK;
    const manifestUrl = 'https://nicolashcro.github.io/casino666/tonconnect-manifest.json';
    console.log("Usando manifestUrl para TON Connect:", manifestUrl);

    let tonConnectUI;
    try {
        tonConnectUI = new TonConnectUI({
            manifestUrl: manifestUrl,
            // actionsConfiguration: {
            //    twaReturnUrl: `https://t.me/tu_bot_username_aqui/tu_app_aqui` // Opcional, para un retorno más fluido en ciertos casos
            // }
        });
        console.log("TonConnectUI SDK version:", tonConnectUI.connector.sdkVersion);
        console.log("TonConnectUI inicializado correctamente.");
    } catch (error) {
        console.error(`Error al inicializar TonConnectUI con manifestUrl "${manifestUrl}":`, error);
        showUIMessage(`Error al init TON Connect. ¿Manifest accesible y válido? (${error.message || 'Error desconocido'})`, "error", 15000);
        if (connectTonWalletBtn) connectTonWalletBtn.disabled = true;
        return;
    }

    const YOUR_TON_RECEIVING_ADDRESS = "UQCdA1_m4iiU6jKUaBMsvIoWfMLUzaRfggNg0sabGK-eV-SV"; // TU DIRECCIÓN TON
    console.log("Dirección de recepción de pagos TON:", YOUR_TON_RECEIVING_ADDRESS);

    let userTonWalletInfo = null;

    function updateUserWalletUI(wallet) {
        if (wallet) {
            userTonWalletInfo = wallet;
            const address = TonConnectSDK.toUserFriendlyAddress(wallet.account.address, wallet.account.chain === '-239'); // -239 mainnet, -3 testnet
            console.log("Billetera TON conectada:", wallet.device.appName, "Dirección:", address, "Red:", wallet.account.chain);
            
            if (tonWalletAddressSpan) tonWalletAddressSpan.textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
            if (tonNetworkSpan) tonNetworkSpan.textContent = wallet.account.chain === '-239' ? 'Mainnet' : (wallet.account.chain === '-3' ? 'Testnet' : `Desconocida (${wallet.account.chain})`);
            if (tonWalletAppNameSpan) tonWalletAppNameSpan.textContent = wallet.device.appName;
            
            if (tonWalletInfoDiv) tonWalletInfoDiv.style.display = 'block';
            if (connectTonWalletBtn) connectTonWalletBtn.textContent = 'Desconectar';
            if (sendTonTransactionBtn) sendTonTransactionBtn.disabled = false;
            showUIMessage(`Billetera ${wallet.device.appName} conectada`, "success");
        } else {
            userTonWalletInfo = null;
            console.log("Billetera TON desconectada.");
            if (tonWalletAddressSpan) tonWalletAddressSpan.textContent = '';
            if (tonNetworkSpan) tonNetworkSpan.textContent = 'Desconectada';
            if (tonWalletAppNameSpan) tonWalletAppNameSpan.textContent = '';
            if (tonWalletInfoDiv) tonWalletInfoDiv.style.display = 'none';
            if (connectTonWalletBtn) connectTonWalletBtn.textContent = 'Conectar Billetera TON';
            if (sendTonTransactionBtn) sendTonTransactionBtn.disabled = true;
            showUIMessage("Billetera desconectada", "info");
        }
    }
    
    // Suscribirse a cambios de estado
    const unsubscribe = tonConnectUI.onStatusChange(walletOrNull => {
        console.log("TON Connect onStatusChange. Nuevo estado de billetera:", walletOrNull);
        updateUserWalletUI(walletOrNull);
    });
    // Para desuscribirse después si es necesario: unsubscribe();

    // Restaurar conexión
    tonConnectUI.connectionRestored.then(restored => {
         console.log("Intento de restauración de conexión de TON Connect. Restaurada:", restored);
         if (restored) {
            // onStatusChange debería haberlo manejado, pero podemos reconfirmar
            console.log("Conexión restaurada, billetera actual:", tonConnectUI.wallet);
            // updateUserWalletUI(tonConnectUI.wallet); // onStatusChange lo hace
         } else {
            console.log("No se restauró ninguna conexión previa de TON Connect.");
            updateUserWalletUI(null); // Asegurar que la UI esté desconectada si no hay nada
         }
    }).catch(e => console.error("Error en tonConnectUI.connectionRestored:", e));


    // Botón de Conectar/Desconectar
    if (connectTonWalletBtn) {
        connectTonWalletBtn.addEventListener('click', async () => {
            console.log("Botón 'Conectar/Desconectar Billetera TON' clickeado. Conectado actualmente:", tonConnectUI.connected);
            if (tonConnectUI.connected) {
                try {
                    await tonConnectUI.disconnect();
                    console.log("Desconexión de TON Connect solicitada.");
                } catch (e) {
                    console.error("Error al desconectar TON Connect:", e);
                    showUIMessage("Error al desconectar.", "error");
                }
            } else {
                console.log("Abriendo modal de conexión de TON Connect...");
                tonConnectUI.openModal();
            }
        });
    } else {
        console.error("Botón 'connect-ton-wallet-btn' no encontrado en el DOM.");
        showUIMessage("Error: Botón de conexión no encontrado.", "error");
    }

    // Botón de Enviar Transacción (Pago)
    if (sendTonTransactionBtn) {
        sendTonTransactionBtn.addEventListener('click', async () => {
            console.log("Botón 'Comprar con TON' clickeado.");
            if (!tonConnectUI.connected || !userTonWalletInfo) {
                const msg = "Por favor, conecta tu billetera TON primero.";
                showUIMessage(msg, "error");
                WebApp.showAlert(msg);
                return;
            }
            if (!YOUR_TON_RECEIVING_ADDRESS || YOUR_TON_RECEIVING_ADDRESS.startsWith("TU_DIRECCION")) {
                showUIMessage("Error crítico: Dirección de recepción de pagos no configurada.", "error");
                return;
            }

            const amountNanoTON = '10000000'; // 0.01 TON (para pruebas)
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 360, // 6 minutos de validez
                messages: [
                    {
                        address: YOUR_TON_RECEIVING_ADDRESS,
                        amount: amountNanoTON,
                        // payload: 'YOUR_CUSTOM_PAYLOAD_COMMENT_BASE64_ENCODED_IF_NEEDED' // Opcional
                    }
                ]
            };

            try {
                sendTonTransactionBtn.disabled = true;
                const amountTON = parseFloat(amountNanoTON) / 1e9;
                showUIMessage(`Enviando ${amountTON} TON... Confirma en tu billetera.`, "info", 10000);
                WebApp.MainButton.setText(`Confirmar envío de ${amountTON} TON...`).showProgress(true);

                const result = await tonConnectUI.sendTransaction(transaction);
                console.log("Transacción propuesta a la billetera:", result);
                // result.boc contiene la transacción firmada. Necesitas un backend o
                // un servicio de terceros para verificar que esta transacción se haya minado.
                WebApp.MainButton.hideProgress().setText("Procesando...");
                showUIMessage(`Transacción enviada a la red. Esperando confirmación (esto es una simulación)...`, "info", 20000);
                WebApp.HapticFeedback.notificationOccurred('success');

                // SIMULACIÓN DE VERIFICACIÓN DE TRANSACCIÓN Y ENTREGA DE BIENES
                // ¡¡¡NO USAR ESTO EN PRODUCCIÓN PARA BIENES CON VALOR REAL!!!
                // En producción, tu backend debería verificar el `boc` en la blockchain.
                setTimeout(() => {
                    petTokens += 1000; // Ejemplo: dar tokens del juego
                    updateGameDisplays();
                    const successMsg = "¡1000 PetTokens comprados! (Simulado)";
                    showUIMessage(successMsg, "success");
                    WebApp.showAlert(successMsg);
                    WebApp.MainButton.hide();
                    if (tonConnectUI.connected) sendTonTransactionBtn.disabled = false;
                }, 15000); // Simular 15 segundos de espera

            } catch (error) {
                WebApp.MainButton.hideProgress().hide();
                console.error("Error al enviar transacción TON con sendTransaction:", error);
                WebApp.HapticFeedback.notificationOccurred('error');
                let errorMessage = "Error al enviar la transacción.";
                if (error && typeof error === 'object') { // Errores del SDK de TON Connect suelen ser objetos
                    if (error.name === 'UserRejectedError' || (error.message && error.message.toLowerCase().includes('user declined')) || (error.message && error.message.toLowerCase().includes('user rejected'))) {
                        errorMessage = "Transacción rechazada por el usuario.";
                    } else if (error.message && error.message.toLowerCase().includes('popup closed') || error.message.toLowerCase().includes('modal closed')) {
                         errorMessage = "Ventana de confirmación cerrada.";
                    } else {
                        errorMessage = `Error de transacción: ${error.message ? error.message.substring(0,100) : 'Desconocido'}`;
                    }
                }
                showUIMessage(errorMessage, "error");
                // WebApp.showAlert(errorMessage); // Puede ser redundante si showUIMessage es visible
                if (tonConnectUI.connected) sendTonTransactionBtn.disabled = false;
            }
        });
    } else {
        console.error("Botón 'send-ton-payment-btn' no encontrado en el DOM.");
    }
    
    // Lógica del Juego (Ejemplo - integra la tuya)
    let petTokens = 0;
    let currentPetLevel = 0;
    // Los selectores petTokensDisplay y petEvolutionLevelDisplay ya están arriba

    function updateGameDisplays() {
        if(petTokensDisplay) petTokensDisplay.textContent = String(Math.floor(petTokens));
        if(petEvolutionLevelDisplay) petEvolutionLevelDisplay.textContent = String(currentPetLevel);
        // ... y cualquier otra actualización de la UI de tu juego
    }
    // Asegúrate de que los elementos del juego también estén en el DOM
    if (petImageContainer && petPlaceholder) {
        // Aquí puedes añadir listeners o lógica para la mascota
    } else {
        console.warn("Elementos del display de la mascota no encontrados.");
    }

    updateGameDisplays(); // Llamada inicial
    console.log("Script.js TMA y lógica de juego básica inicializada. App lista.");
});
