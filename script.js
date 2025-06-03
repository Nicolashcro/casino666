document.addEventListener('DOMContentLoaded', () => {
    // --- Selectores del DOM (como estaban antes) ---
    const cc6TokenBalanceDisplay = document.getElementById('cc6-token-balance');
    const cc6GoldBalanceDisplay = document.getElementById('cc6-gold-balance');
    const walletTonBalanceDisplay = document.getElementById('wallet-ton-balance-display'); // Nuevo para saldo TON
    const connectWalletButtons = document.querySelectorAll('.wallet-button');
    const walletStatusDisplay = document.getElementById('wallet-status');
    const walletAddressDisplay = document.getElementById('wallet-address-display');
    const buyGoldButton = document.getElementById('buy-gold-button'); // Botón de compra

    // --- Estado del Juego (como estaba antes) ---
    let cc6Token = 1000;
    let cc6Gold = 50;
    // ...otros estados...

    // --- TON CONNECT INTEGRATION (Ilustrativo y Simplificado) ---
    let tonConnectUI = null;
    let userTONWalletInfo = null; // Para guardar la info de la billetera conectada
    const GAME_PAYMENT_ADDRESS = "UQCdA1_m4iiU6jKUaBMsvIoWfMLUzaRfggNg0sabGK-eV-SV"; // Tu dirección de cobro

    function initializeTonConnect() {
        if (typeof TonConnectSDK === 'undefined') {
            console.error("TonConnectSDK no está cargado. Por favor, incluye la librería en tu HTML.");
            walletStatusDisplay.textContent = "Error SDK";
            walletStatusDisplay.className = "disconnected";
            return;
        }

        // **IMPORTANTE**: Debes crear y alojar este archivo manifest.json en una URL pública (HTTPS)
        const manifestUrl = 'URL_A_TU_TONCONNECT_MANIFEST.JSON'; // Ejemplo: 'https://tu-juego.com/tonconnect-manifest.json'
                                                                // Para desarrollo local, puedes usar ngrok o similar para exponer tu localhost vía HTTPS

        if (manifestUrl === 'URL_A_TU_TONCONNECT_MANIFEST.JSON') {
             console.warn("Por favor, actualiza la manifestUrl en script.js con la URL real de tu tonconnect-manifest.json");
             alert("Configuración de TON Connect incompleta: Falta manifestUrl.");
        }

        tonConnectUI = new TonConnectSDK.TonConnectUI({
            manifestUrl: manifestUrl,
            // buttonRootId: 'ton-connect-button-root' // Opcional si quieres que el SDK genere un botón
        });

        // Suscribirse a cambios de estado de la billetera
        tonConnectUI.onStatusChange(wallet => {
            userTONWalletInfo = wallet; // Puede ser null si se desconecta
            if (wallet) {
                const address = TonConnectSDK.toUserFriendlyAddress(wallet.account.address, wallet.account.chain === TonConnectSDK.CHAIN.TESTNET);
                console.log("Billetera TON conectada:", address);
                console.log("Wallet object:", wallet);
                walletAddressDisplay.textContent = address.substring(0, 6) + "..." + address.substring(address.length - 4);
                walletAddressDisplay.setAttribute('data-tooltip', `Billetera: ${address}`);
                walletStatusDisplay.textContent = "Conectado";
                walletStatusDisplay.className = "connected";
                connectWalletButtons.forEach(btn => btn.textContent = "Desconectar TON");
                localStorage.setItem('cc666_ton_wallet_connected_v2', 'true'); // Usar nueva key para evitar conflictos
                // Aquí podrías intentar obtener el saldo real de TON si el SDK o una librería adicional lo permite
                // Por ahora, simulamos o ponemos un placeholder:
                fetchUserRealTONBalance(wallet.account.address); // Implementa esta función
            } else {
                console.log("Billetera TON desconectada.");
                walletAddressDisplay.textContent = "";
                walletAddressDisplay.setAttribute('data-tooltip', 'Billetera no conectada');
                walletStatusDisplay.textContent = "Desconectado";
                walletStatusDisplay.className = "disconnected";
                connectWalletButtons.forEach(btn => btn.textContent = "Conectar TON");
                walletTonBalanceDisplay.textContent = `TON: 0.00`;
                localStorage.removeItem('cc666_ton_wallet_connected_v2');
            }
        });
    }

    async function handleConnectTONWallet() {
        if (!tonConnectUI) {
            console.error("TonConnectUI no inicializado.");
            alert("Error: SDK de TON no configurado correctamente.");
            return;
        }
        if (tonConnectUI.connected) {
            try {
                await tonConnectUI.disconnect();
            } catch (error) {
                console.error("Error al desconectar:", error);
            }
        } else {
            tonConnectUI.openModal(); // Abre el modal del SDK para seleccionar billetera
        }
    }

    async function fetchUserRealTONBalance(address) {
        // Esta función es un PLACEHOLDER.
        // Para obtener el saldo real, necesitarías usar una librería como 'tonweb', 'TonClient' (parte de @ton/ton)
        // o hacer una llamada a un RPC de TON. @tonconnect/sdk por sí solo no siempre provee el saldo directamente.
        // Ejemplo conceptual (NO FUNCIONAL DIRECTAMENTE SIN LIBRERÍA ADICIONAL):
        /*
        try {
            // const tonweb = new TonWeb(new TonWeb.HttpProvider('https://testnet.toncenter.com/api/v2/jsonRPC')); // O mainnet
            // const balanceNano = await tonweb.getBalance(address);
            // const balanceTON = TonWeb.utils.fromNano(balanceNano);
            // walletTonBalanceDisplay.textContent = `TON: ${parseFloat(balanceTON).toFixed(2)}`;
            // console.log(`Saldo real para ${address}: ${balanceTON} TON`);
            walletTonBalanceDisplay.textContent = `TON: ${(Math.random() * 5).toFixed(2)}`; // Saldo simulado
        } catch (error) {
            console.error("Error obteniendo saldo TON:", error);
            walletTonBalanceDisplay.textContent = `TON: Error`;
        }
        */
        console.log(`Simulando obtención de saldo para ${address}. Mostrando saldo aleatorio.`);
        walletTonBalanceDisplay.textContent = `TON: ${(Math.random() * 5).toFixed(2)}`; // Saldo simulado por ahora
    }


    async function handlePayment(amountTON, description = "Pago en Crypto Casino 666") {
        if (!tonConnectUI || !tonConnectUI.connected) {
            alert("Por favor, conecta tu billetera TON primero.");
            handleConnectTONWallet(); // Intentar abrir modal de conexión
            return false;
        }

        const amountNanoTON = TonConnectSDK.toNano(amountTON.toString()).toString(); // Convertir TON a nanoTON

        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 600, // Transacción válida por 10 minutos
            messages: [
                {
                    address: GAME_PAYMENT_ADDRESS, // La dirección que tú proporcionaste
                    amount: amountNanoTON,
                    // payload: btoa(description) // Opcional: comentario como payload (debe ser base64)
                }
            ]
        };

        try {
            alert(`Vas a enviar ${amountTON} TON a ${GAME_PAYMENT_ADDRESS.substring(0,8)}... Confirma en tu billetera.`);
            const result = await tonConnectUI.sendTransaction(transaction);
            console.log("Resultado de sendTransaction:", result);
            // El SDK maneja el envío del `boc` (Bag of Cells) a la red
            // después de que el usuario confirma en la billetera.

            // Aquí deberías añadir lógica para verificar la transacción en la blockchain.
            // Esto es complejo y usualmente implica un backend o polling.
            alert(`Transacción enviada (BOC: ${result.boc.substring(0,20)}...). \n¡IMPORTANTE! Necesitas un backend para verificar la confirmación en la blockchain antes de acreditar bienes virtuales.`);
            return true; // Indica que la solicitud de transacción fue exitosa (no que está confirmada en blockchain)
        } catch (error) {
            console.error("Error al enviar transacción TON:", error);
            if (error instanceof TonConnectSDK.UserRejectsError) {
                alert("Transacción rechazada por el usuario.");
            } else {
                alert("Error al enviar la transacción. Revisa la consola.");
            }
            return false;
        }
    }

    // --- Asignar Eventos ---
    connectWalletButtons.forEach(button => {
        button.addEventListener('click', handleConnectTONWallet);
    });

    if (buyGoldButton) {
        buyGoldButton.addEventListener('click', async () => {
            const paymentSuccessful = await handlePayment(0.05, "Compra de 1000 CC6 GOLD");
            if (paymentSuccessful) {
                // IMPORTANTE: Esta es una acreditación optimista.
                // En un juego real, SOLO acreditarías el oro DESPUÉS de verificar
                // la transacción en la blockchain a través de un backend.
                console.log("Acreditando 1000 CC6 Gold (simulación tras envío de tx)");
                cc6Gold += 1000;
                updateCurrencyDisplay();
                alert("¡Gracias por tu compra! Se han añadido 1000 CC6G a tu cuenta (simulación).");
            }
        });
    }
    
    // --- Inicialización del Juego y TON Connect ---
    function initializeGame() {
        updateCurrencyDisplay(); // Actualiza CC6T y CC6G
        initializeTonConnect(); // Configura y se suscribe a cambios de billetera TON

        // Lógica de pestañas, etc. como estaba antes
        navButtons.forEach(button => { /* ... */ });
        document.querySelector('.nav-button[data-tab="tab-ruleta-hades"]').click(); // Activar pestaña inicial

        // Restaurar estado de la billetera si el SDK no lo hace automáticamente (depende del SDK)
        // tonConnectUI.connectionRestored.then(restored => {
        // if (restored) console.log("Conexión de billetera TON restaurada por el SDK");
        // });
    }
    
    // ... (resto de tus funciones: updateCurrencyDisplay, typeWriterEffect, countUpNumber, createCoinBurst, lógica de tragamonedas, etc.)
    // Asegúrate que updateCurrencyDisplay también actualice el saldo de TON si lo muestras.
    function updateCurrencyDisplay() {
        cc6TokenBalanceDisplay.textContent = `CC6T: ${Math.floor(cc6Token)}`;
        cc6GoldBalanceDisplay.textContent = `CC6G: ${Math.floor(cc6Gold)}`;
        // El saldo de TON se actualiza en fetchUserRealTONBalance o en el onStatusChange
    }

    // Las funciones de la tragamonedas, etc. se mantienen como estaban en la respuesta anterior
    // (getRandomSymbol, lógica de click en spinButton, etc.)
    const navButtons = document.querySelectorAll('.nav-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const spinButton = document.getElementById('spin-button');
    const reels = [document.getElementById('reel1'), document.getElementById('reel2'), document.getElementById('reel3')];
    const spinResultMessageContainer = document.getElementById('spin-result-message-container');
    const spinResultTextElement = document.getElementById('spin-result-text');
    const spinWinningsAmountElement = document.getElementById('spin-winnings-amount');
    const spinWinningsLineElement = document.getElementById('spin-winnings-line');
    const spinCountDisplay = document.getElementById('spin-count');
    const multiplierSelect = document.getElementById('multiplier-select');
    const slotSymbols = ['💀', '😈', '666', '🔥', '👁️', '💰', 'BAR'];
    function getRandomSymbol() { return slotSymbols[Math.floor(Math.random() * slotSymbols.length)]; }

    if (spinButton) {
        const originalSpinButtonText = spinButton.textContent;
        spinButton.addEventListener('click', () => {
            if (spinButton.disabled) return;
            // ... (resto de la lógica del botón de giro como en la respuesta anterior,
            // incluyendo el manejo de .spin-button-cooldown, texto, etc.) ...
            // Asegúrate que los timeouts y la lógica de habilitar/deshabilitar estén correctos.

            spinButton.classList.add('spin-button-cooldown');
            spinButton.disabled = true;
            spinButton.textContent = "GIRANDO...";

            spinResultMessageContainer.style.opacity = 0;
            spinResultTextElement.textContent = "";
            spinWinningsLineElement.style.display = 'none';
            spinWinningsAmountElement.textContent = "0";
            
            // ... (lógica de currentSpins, etc.)

            setTimeout(() => {
                // ... (lógica de resultado del giro, cálculo de winnings) ...
                 let messageText = "";
                let winnings = 0;
                let isJackpot = false;
                const result = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
                reels[0].textContent = result[0];
                reels[1].textContent = result[1];
                reels[2].textContent = result[2];

                if (result[0] === '💰' && result[1] === '💰' && result[2] === '💰') {
                    winnings = 250 * parseInt(multiplierSelect.value); messageText = "¡¡MEGA JACKPOT!!"; isJackpot = true;
                } else if (result[0] === result[1] && result[1] === result[2]) {
                    winnings = 100 * parseInt(multiplierSelect.value); messageText = "¡JACKPOT!"; isJackpot = true;
                } else {
                    messageText = "¡Sigue Intentando!";
                }
                
                cc6Token += winnings;
                updateCurrencyDisplay();

                spinResultMessageContainer.style.opacity = 1;
                typeWriterEffect(spinResultTextElement, messageText, 70, () => {
                    if (winnings > 0) {
                        spinWinningsLineElement.style.display = 'block';
                        countUpNumber(spinWinningsAmountElement, winnings, Math.min(winnings * 10, 1500));
                        createCoinBurst(Math.min(10 + Math.floor(winnings / 50), 50), isJackpot);
                    }
                });
                
                spinButton.classList.remove('spin-button-cooldown');
                spinButton.disabled = false;
                spinButton.textContent = originalSpinButtonText;
            }, 2000);
        });
    }
    
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // ... (lógica de cambio de pestaña como en la respuesta anterior)
            document.querySelector('.tab-content.active')?.classList.remove('active');
            document.querySelector('#bottom-nav .nav-button.active')?.classList.remove('active');
            button.classList.add('active');
            const targetTab = document.getElementById(button.dataset.tab);
            if (targetTab) {
                targetTab.style.display = 'block';
                requestAnimationFrame(() => {
                    targetTab.classList.add('active');
                });
            }
        });
    });


    initializeGame();
});
