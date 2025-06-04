document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM cargado. Iniciando juego con TON Connect.");

    // --- Selectores del DOM (adapta según tus IDs) ---
    const connectTonWalletBtn = document.getElementById('connect-ton-wallet-btn'); // Necesitarás un nuevo botón en tu HTML
    const tonWalletInfoDiv = document.getElementById('ton-wallet-info'); // Div para mostrar info de billetera TON
    const tonWalletAddressSpan = document.getElementById('ton-wallet-address');
    const tonNetworkSpan = document.getElementById('ton-network');
    const sendTonTransactionBtn = document.getElementById('send-ton-payment-btn'); // Botón para pagar
    const messagesDisplay = document.getElementById('messages-display'); // Ya lo tenías

    // --- Configuración de TON Connect ---
    const { TonConnectUI } = TONConnectSDK; // Acceder desde el SDK global
    const tonConnectUI = new TonConnectUI({
        manifestUrl: 'https_url_a_tu_tonconnect-manifest.json_en_github_pages', // ¡IMPORTANTE!
        buttonRootId: 'ton-connect-button-container' // Opcional: si quieres que el SDK genere un botón
    });

    // Tu dirección de billetera TON para recibir pagos
    const YOUR_TON_RECEIVING_ADDRESS = "TU_DIRECCION_DE_BILLETERA_TON_AQUI"; // Ej: UQxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

    let userTonWalletInfo = null;

    // --- Funciones de TON Connect ---

    // Actualizar UI con información de la billetera
    function updateUserWalletUI(wallet) {
        if (wallet) {
            userTonWalletInfo = wallet;
            console.log("Billetera TON conectada:", wallet);
            if (tonWalletAddressSpan) tonWalletAddressSpan.textContent = `${wallet.account.address.slice(0, 6)}...${wallet.account.address.slice(-4)}`;
            if (tonNetworkSpan) tonNetworkSpan.textContent = wallet.account.chain === '-239' ? 'TON Mainnet' : 'TON Testnet'; // -239 es mainnet, -3 es testnet
            if (tonWalletInfoDiv) tonWalletInfoDiv.style.display = 'block';
            if (connectTonWalletBtn) connectTonWalletBtn.textContent = 'Desconectar Billetera TON';
            if (sendTonTransactionBtn) sendTonTransactionBtn.disabled = false;
            showUIMessage(`Billetera ${wallet.device.appName} conectada!`, "success");
        } else {
            userTonWalletInfo = null;
            console.log("Billetera TON desconectada.");
            if (tonWalletAddressSpan) tonWalletAddressSpan.textContent = '';
            if (tonNetworkSpan) tonNetworkSpan.textContent = 'Desconectada';
            // if (tonWalletInfoDiv) tonWalletInfoDiv.style.display = 'none'; // Ocultar o mostrar según diseño
            if (connectTonWalletBtn) connectTonWalletBtn.textContent = 'Conectar Billetera TON';
            if (sendTonTransactionBtn) sendTonTransactionBtn.disabled = true;
            showUIMessage("Billetera desconectada.", "info");
        }
    }

    // Suscribirse a cambios de estado de la billetera
    tonConnectUI.onStatusChange(
        wallet => updateUserWalletUI(wallet),
        error => { // Opcional: manejar errores de suscripción
            console.error("Error en la suscripción de estado de TON Connect:", error);
            showUIMessage("Error de conexión con billetera.", "error");
        }
    );

    // Botón de Conectar/Desconectar
    if (connectTonWalletBtn) {
        connectTonWalletBtn.addEventListener('click', async () => {
            if (tonConnectUI.connected) {
                await tonConnectUI.disconnect();
                // El evento onStatusChange actualizará la UI
            } else {
                // Abre el modal para conectar. El SDK maneja la selección de billetera (Tonkeeper, MyTonWallet, @Wallet, etc.)
                tonConnectUI.openModal();
            }
        });
    }

    // Enviar Transacción (Pago)
    if (sendTonTransactionBtn) {
        sendTonTransactionBtn.addEventListener('click', async () => {
            if (!tonConnectUI.connected || !userTonWalletInfo) {
                showUIMessage("Conecta tu billetera TON primero.", "error");
                return;
            }
            if (!YOUR_TON_RECEIVING_ADDRESS || YOUR_TON_RECEIVING_ADDRESS === "TU_DIRECCION_DE_BILLETERA_TON_AQUI") {
                showUIMessage("Error: Dirección de recepción no configurada.", "error");
                console.error("CRÍTICO: YOUR_TON_RECEIVING_ADDRESS no está configurada.");
                return;
            }

            // Ejemplo de transacción: enviar 0.1 TON
            // El valor se especifica en nanoTONs (1 TON = 1,000,000,000 nanoTONs)
            const amountNanoTON = '100000000'; // 0.1 TON
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutos de validez
                messages: [
                    {
                        address: YOUR_TON_RECEIVING_ADDRESS,
                        amount: amountNanoTON,
                        // payload: "base64_encoded_comment_optional" // Comentario opcional o datos
                    }
                    // Puedes añadir más mensajes si es una transacción múltiple
                ]
            };

            try {
                sendTonTransactionBtn.disabled = true;
                showUIMessage(`Enviando ${parseFloat(amountNanoTON) / 1e9} TON... Confirma en tu billetera.`, "info");

                const result = await tonConnectUI.sendTransaction(transaction);
                console.log("Transacción enviada! Resultado:", result); // `result.boc` contiene la transacción firmada

                // **IMPORTANTE: VERIFICACIÓN DE LA TRANSACCIÓN**
                // Aquí solo se confirma que la billetera firmó y envió la transacción.
                // Para acreditar algo en tu juego, DEBES verificar que la transacción
                // se haya completado exitosamente en la blockchain TON.
                // Esto usualmente se hace en un backend o esperando y consultando un explorador de TON.
                // Para este ejemplo, simularemos un éxito.
                showUIMessage(`Transacción enviada (BOC: ${result.boc.slice(0,10)}...). Esperando confirmación (simulada)...`, "success");

                setTimeout(() => {
                    // Aquí iría la lógica de tu juego después de un pago "confirmado"
                    // Ejemplo: petTokens += 1000; updateDisplays();
                    showUIMessage("¡Pago recibido y procesado (simulado)!", "success");
                    sendTonTransactionBtn.disabled = false;
                }, 15000); // Simular espera

            } catch (error) {
                console.error("Error al enviar transacción TON:", error);
                let errorMessage = "Error al enviar la transacción.";
                if (error && typeof error === 'object' && 'message' in error) {
                    if (error.message.includes('User rejected')) {
                        errorMessage = "Transacción rechazada por el usuario.";
                    } else if (error.message.length < 60) {
                        errorMessage = `Error: ${error.message}`;
                    }
                }
                showUIMessage(errorMessage, "error");
                sendTonTransactionBtn.disabled = false;
            }
        });
    }

    // --- Lógica del Juego (simplificada, integra la tuya) ---
    // ... (Aquí va el resto de la lógica de tu juego: petTokens, level, etc. que ya tenías)
    function showUIMessage(text, type = "info", duration = 5000) {
        if (!messagesDisplay) return;
        messagesDisplay.textContent = text;
        messagesDisplay.className = `message-${type}`; // Asume que tienes clases CSS .message-info, .message-error, .message-success
        setTimeout(() => { 
            if(messagesDisplay && messagesDisplay.textContent === text) {
                messagesDisplay.textContent = ""; 
                messagesDisplay.className = ""; 
            }
        }, duration);
    }
    
    // Para inicializar la UI de la billetera al cargar (si ya estaba conectada)
    // tonConnectUI.connectionRestored.then(restored => {
    //     if (restored) {
    //         console.log("Conexión restaurada con:", tonConnectUI.wallet);
    //         updateUserWalletUI(tonConnectUI.wallet);
    //     }
    // });
    // O puedes usar el estado inicial de tonConnectUI.wallet
    if (tonConnectUI.wallet) {
        updateUserWalletUI(tonConnectUI.wallet);
    }


    console.log("Juego y TON Connect listos.");
});
