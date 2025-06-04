document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM completamente cargado. Iniciando script.js...");

    // --- Selectores del DOM ---
    const connectTonWalletBtn = document.getElementById('connect-ton-wallet-btn');
    const tonWalletInfoDiv = document.getElementById('ton-wallet-info');
    const tonWalletAddressSpan = document.getElementById('ton-wallet-address');
    const tonNetworkSpan = document.getElementById('ton-network');
    const sendTonTransactionBtn = document.getElementById('send-ton-payment-btn');
    const messagesDisplay = document.getElementById('messages-display');

    console.log("Botón 'Conectar Billetera TON' encontrado:", connectTonWalletBtn);
    console.log("Div 'ton-wallet-info' encontrado:", tonWalletInfoDiv);

    // --- Tu API Key de TON (004a2...) NO se usa para TonConnectUI ---
    // Esa clave es para interactuar con APIs de nodos TON (ej. Toncenter), no para la conexión de billetera cliente.

    // --- Configuración de TON Connect ---
    if (typeof TONConnectSDK === 'undefined') {
        console.error("¡ERROR CRÍTICO: TONConnectSDK no está definido! Asegúrate de que el script del SDK se haya cargado antes que este script.");
        showUIMessage("Error: No se pudo cargar el SDK de TON Connect.", "error");
        return; // Detener la ejecución si el SDK no está
    }

    const { TonConnectUI, THEME } = TONConnectSDK; // Acceder desde el SDK global
    const manifestUrl = 'https://github.com/Nicolashcro/casino666/blob/main/tonconnect-manifest.json'; // ¡¡¡REEMPLAZA ESTA URL!!!
    console.log("Usando manifestUrl:", manifestUrl);

    let tonConnectUI;
    try {
        tonConnectUI = new TonConnectUI({
            manifestUrl: manifestUrl,
            // buttonRootId: 'ton-connect-button-container', // Descomenta si quieres que el SDK genere un botón
            // language: 'es', // Opcional
            // uiPreferences: { theme: THEME.DARK } // Opcional
        });
        console.log("TonConnectUI inicializado correctamente:", tonConnectUI);
    } catch (error) {
        console.error("Error al inicializar TonConnectUI:", error);
        showUIMessage("Error al inicializar la conexión con billetera TON. Revisa la consola.", "error");
        return;
    }

    const YOUR_TON_RECEIVING_ADDRESS = "UQCdA1_m4iiU6jKUaBMsvIoWfMLUzaRfggNg0sabGK-eV-SV";
    console.log("Dirección de recepción de pagos TON:", YOUR_TON_RECEIVING_ADDRESS);
    if (YOUR_TON_RECEIVING_ADDRESS === "UQCdA1_m4iiU6jKUaBMsvIoWfMLUzaRfggNg0sabGK-eV-SV") {
        console.warn("ADVERTENCIA: Debes configurar tu YOUR_TON_RECEIVING_ADDRESS.");
        showUIMessage("Advertencia: Configura tu dirección de recepción de TON en el script.", "error", 10000);
    }


    let userTonWalletInfo = null;

    function updateUserWalletUI(wallet) {
        if (wallet) {
            userTonWalletInfo = wallet;
            console.log("Billetera TON conectada/actualizada:", wallet);
            if (tonWalletAddressSpan) tonWalletAddressSpan.textContent = `${wallet.account.address.slice(0, 6)}...${wallet.account.address.slice(-4)}`;
            if (tonNetworkSpan) tonNetworkSpan.textContent = wallet.account.chain === '-239' ? 'TON Mainnet' : (wallet.account.chain === '-3' ? 'TON Testnet' : `Red ID ${wallet.account.chain}`);
            if (tonWalletInfoDiv) tonWalletInfoDiv.style.display = 'block';
            if (connectTonWalletBtn) connectTonWalletBtn.textContent = 'Desconectar Billetera TON';
            if (sendTonTransactionBtn) sendTonTransactionBtn.disabled = false;
            showUIMessage(`Billetera ${wallet.device.appName} conectada!`, "success");
        } else {
            userTonWalletInfo = null;
            console.log("Billetera TON desconectada.");
            if (tonWalletAddressSpan) tonWalletAddressSpan.textContent = '';
            if (tonNetworkSpan) tonNetworkSpan.textContent = 'Desconectada';
            if (tonWalletInfoDiv) tonWalletInfoDiv.style.display = 'none';
            if (connectTonWalletBtn) connectTonWalletBtn.textContent = 'Conectar Billetera TON';
            if (sendTonTransactionBtn) sendTonTransactionBtn.disabled = true;
            showUIMessage("Billetera desconectada.", "info");
        }
    }

    console.log("Suscribiéndose a cambios de estado de TON Connect...");
    tonConnectUI.onStatusChange(
        wallet => {
            console.log("Evento onStatusChange disparado. Wallet:", wallet);
            updateUserWalletUI(wallet);
        },
        error => {
            console.error("Error en la suscripción de estado de TON Connect (onStatusChange):", error);
            showUIMessage("Error de conexión con billetera.", "error");
        }
    );

    // Restaurar conexión si existe
    // Esto es asíncrono, pero el onStatusChange debería eventualmente actualizar la UI.
    // No es estrictamente necesario esperar aquí si la UI se actualiza por el evento.
    tonConnectUI.connectionRestored.then(restored => {
        console.log("Intento de restauración de conexión completado. Restaurada:", restored);
        if (restored && tonConnectUI.wallet) {
             console.log("Conexión restaurada con:", tonConnectUI.wallet);
             // onStatusChange ya debería haber manejado esto, pero podemos forzar por si acaso.
             // updateUserWalletUI(tonConnectUI.wallet);
        } else if (tonConnectUI.wallet) {
            // A veces el estado ya está presente sin que `connectionRestored` sea true explícitamente.
            console.log("Conexión ya presente al cargar:", tonConnectUI.wallet);
            // updateUserWalletUI(tonConnectUI.wallet);
        } else {
            console.log("No hay conexión para restaurar o ya está desconectada.");
            updateUserWalletUI(null); // Asegurar UI limpia si no hay billetera
        }
    }).catch(err => {
        console.error("Error durante connectionRestored:", err);
    });


    if (connectTonWalletBtn) {
        connectTonWalletBtn.addEventListener('click', async () => {
            console.log("Botón 'Conectar/Desconectar Billetera TON' clickeado.");
            if (!tonConnectUI) {
                console.error("tonConnectUI no está definido al hacer clic en el botón.");
                return;
            }
            if (tonConnectUI.connected) {
                console.log("Intentando desconectar billetera...");
                try {
                    await tonConnectUI.disconnect();
                    console.log("Desconexión solicitada."); // onStatusChange actualizará la UI
                } catch (error) {
                    console.error("Error durante tonConnectUI.disconnect():", error);
                    showUIMessage("Error al intentar desconectar.", "error");
                }
            } else {
                console.log("Abriendo modal de conexión de TON Connect...");
                try {
                    tonConnectUI.openModal();
                } catch (error) {
                     console.error("Error durante tonConnectUI.openModal():", error);
                     showUIMessage("Error al abrir el modal de conexión.", "error");
                }
            }
        });
    } else {
        console.error("No se encontró el botón con ID 'connect-ton-wallet-btn'.");
    }

    if (sendTonTransactionBtn) {
        sendTonTransactionBtn.addEventListener('click', async () => {
            console.log("Botón 'send-ton-payment-btn' clickeado.");
            // ... (resto de la lógica de sendTonTransactionBtn como en la respuesta anterior)
            if (!tonConnectUI.connected || !userTonWalletInfo) {
                showUIMessage("Conecta tu billetera TON primero.", "error");
                return;
            }
            if (!YOUR_TON_RECEIVING_ADDRESS || YOUR_TON_RECEIVING_ADDRESS === "TU_DIRECCION_DE_BILLETERA_TON_AQUI") {
                showUIMessage("Error: Dirección de recepción no configurada.", "error");
                console.error("CRÍTICO: YOUR_TON_RECEIVING_ADDRESS no está configurada.");
                return;
            }
            const amountNanoTON = '100000000'; // 0.1 TON
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 600, 
                messages: [{ address: YOUR_TON_RECEIVING_ADDRESS, amount: amountNanoTON }]
            };
            try {
                sendTonTransactionBtn.disabled = true;
                showUIMessage(`Enviando ${parseFloat(amountNanoTON) / 1e9} TON... Confirma en tu billetera.`, "info");
                const result = await tonConnectUI.sendTransaction(transaction);
                console.log("Transacción enviada! Resultado:", result); 
                showUIMessage(`Transacción enviada (BOC: ${result.boc.slice(0,10)}...). Esperando confirmación (simulada)...`, "success");
                setTimeout(() => {
                    showUIMessage("¡Pago recibido y procesado (simulado)!", "success");
                    if (tonConnectUI.connected) sendTonTransactionBtn.disabled = false; // Solo re-habilita si sigue conectado
                }, 15000); 
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
                 if (tonConnectUI.connected) sendTonTransactionBtn.disabled = false;
            }
        });
    } else {
         console.error("No se encontró el botón con ID 'send-ton-payment-btn'.");
    }


    function showUIMessage(text, type = "info", duration = 5000) {
        if (!messagesDisplay) {
            console.warn("Elemento messagesDisplay no encontrado para mostrar mensaje:", text);
            return;
        }
        // console.log(`Mostrando UI Mensaje [${type}]: ${text}`); // Descomenta si quieres ver todos los mensajes en consola
        messagesDisplay.textContent = text;
        messagesDisplay.className = `message-${type}`;
        setTimeout(() => { 
            if(messagesDisplay && messagesDisplay.textContent === text) {
                messagesDisplay.textContent = ""; 
                messagesDisplay.className = ""; 
            }
        }, duration);
    }
    
    // --- Lógica del juego (simplificada) ---
    // ... (tu lógica de petTokens, level, etc.)
    let petTokens = 0; // Ejemplo
    const petTokensDisplay = document.getElementById('pet-tokens-balance'); // Ejemplo
    function updateDisplays() { // Ejemplo
        if(petTokensDisplay) petTokensDisplay.textContent = String(Math.floor(petTokens));
    }
    updateDisplays(); // Llamada inicial ejemplo

    console.log("Script.js finalizado. Esperando interacciones del usuario.");
});
