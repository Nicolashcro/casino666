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

    // --- Configuración de TON Connect ---
    if (typeof TONConnectSDK === 'undefined') {
        console.error("¡ERROR CRÍTICO: TONConnectSDK no está definido! Asegúrate de que el script del SDK (<script src='https://unpkg.com/@tonconnect/sdk@latest/dist/tonconnect-sdk.min.js'></script>) se haya cargado ANTES que este script (script.js) en tu HTML.");
        showUIMessage("Error: No se pudo cargar el SDK de TON Connect. Revisa la consola del navegador (F12) y la pestaña 'Network' para ver si 'tonconnect-sdk.min.js' se está cargando.", "error", 15000);
        if (connectTonWalletBtn) connectTonWalletBtn.disabled = true; // Deshabilitar botón si el SDK falla
        return; // Detener la ejecución si el SDK no está
    }

    const { TonConnectUI, THEME } = TONConnectSDK;

    // **USA UNA DE ESTAS URLs PARA TU MANIFESTURL, NO LA DE GITHUB.COM/BLOB/...**
    // Opción A: Si usas GitHub Pages y el manifest está en la raíz de tu sitio publicado:
    const manifestUrl = 'https://nicolashcro.github.io/casino666/tonconnect-manifest.json'; 
    // Opción B: Si quieres usar el archivo raw directamente desde el repositorio (menos ideal para producción pero funciona para pruebas):
    // const manifestUrl = 'https://raw.githubusercontent.com/Nicolashcro/casino666/main/tonconnect-manifest.json';
    
    console.log("Usando manifestUrl:", manifestUrl);

    let tonConnectUI;
    try {
        tonConnectUI = new TonConnectUI({
            manifestUrl: manifestUrl,
        });
        console.log("TonConnectUI inicializado correctamente:", tonConnectUI);
    } catch (error) {
        console.error("Error al inicializar TonConnectUI. ¿Es la manifestUrl correcta y accesible? ¿El JSON del manifiesto es válido?", error);
        showUIMessage("Error al inicializar conexión con billetera TON. Revisa la consola.", "error");
        return;
    }

    // Reemplaza esta con TU dirección de billetera TON donde quieres recibir los pagos
    const YOUR_TON_RECEIVING_ADDRESS = "UQCdA1_m4iiU6jKUaBMsvIoWfMLUzaRfggNg0sabGK-eV-SV"; 
    console.log("Dirección de recepción de pagos TON:", YOUR_TON_RECEIVING_ADDRESS);
    // Eliminé la advertencia redundante aquí, ya que la dirección está hardcodeada por ahora.

    let userTonWalletInfo = null;

    function updateUserWalletUI(wallet) {
        if (wallet) {
            userTonWalletInfo = wallet;
            console.log("Billetera TON conectada/actualizada:", wallet);
            if (tonWalletAddressSpan) tonWalletAddressSpan.textContent = `<span class="math-inline">\{wallet\.account\.address\.slice\(0, 6\)\}\.\.\.</span>{wallet.account.address.slice(-4)}`;
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
        walletOrNull => { // El callback recibe la billetera o null
            console.log("Evento onStatusChange disparado. Wallet:", walletOrNull);
            updateUserWalletUI(walletOrNull);
        },
        error => { // Este segundo callback es para errores durante la configuración de la suscripción, es raro que ocurra.
            console.error("Error catastrófico en la suscripción de estado de TON Connect (onStatusChange):", error);
            showUIMessage("Error crítico con la conexión de billetera.", "error");
        }
    );
    
    // Intentar restaurar la conexión al cargar la página
    // Esto es útil si el usuario ya había conectado y recarga la página.
    tonConnectUI.connectionRestored.then(restored => {
        console.log("Intento de restauración de conexión completado. Restaurada:", restored);
        // onStatusChange se encarga de actualizar la UI si la conexión se restaura exitosamente.
        // Si `tonConnectUI.wallet` ya tiene valor aquí, onStatusChange ya se habrá disparado o se disparará pronto.
        if (!restored && !tonConnectUI.wallet) {
            // Si no se restauró y no hay billetera, nos aseguramos que la UI esté en estado desconectado.
            updateUserWalletUI(null);
        }
    }).catch(err => {
        // Este catch es para errores en la promesa `connectionRestored` misma, no para errores de conexión de usuario.
        console.error("Error durante la promesa connectionRestored:", err);
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
                    await tonConnectUI.disconnect(); // Esto disparará onStatusChange con null
                    console.log("Desconexión solicitada.");
                } catch (error) {
                    console.error("Error durante tonConnectUI.disconnect():", error);
                    showUIMessage("Error al intentar desconectar.", "error");
                }
            } else {
                console.log("Abriendo modal de conexión de TON Connect...");
                try {
                    tonConnectUI.openModal(); // Muestra el popup para elegir billetera
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
            if (!tonConnectUI.connected || !userTonWalletInfo) {
                showUIMessage("Conecta tu billetera TON primero.", "error");
                return;
            }
            // ... (lógica de transacción como antes, es correcta)
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
                    // Solo re-habilita si sigue conectado y no hay otra tx pendiente
                    if (tonConnectUI.connected) sendTonTransactionBtn.disabled = false; 
                }, 15000); 
            } catch (error) {
                console.error("Error al enviar transacción TON:", error);
                let errorMessage = "Error al enviar la transacción
