document.addEventListener('DOMContentLoaded', async () => {
    // --- Selectores del DOM ---
    const petTokensBalanceDisplay = document.getElementById('pet-tokens-balance');
    const connectWalletBtn = document.getElementById('connect-wallet-btn');
    const walletInfoDisplay = document.getElementById('wallet-info');
    const walletAddressDisplay = document.getElementById('wallet-address');
    const walletNetworkDisplay = document.getElementById('wallet-network');

    const petImageContainer = document.getElementById('pet-image-container');
    const petEvolutionLevelDisplay = document.getElementById('pet-evolution-level');
    const petPlaceholder = document.getElementById('pet-placeholder');
    // const petImage = document.getElementById('pet-image');

    const energyFill = document.getElementById('energy-fill');
    const energyValueDisplay = document.getElementById('energy-value');
    const energyMaxDisplay = document.getElementById('energy-max');

    const evolveButton = document.getElementById('evolve-button');
    const evolutionCostDisplay = document.getElementById('evolution-cost');
    const messagesDisplay = document.getElementById('messages');
    const buyTokensWithTonBtn = document.getElementById('buy-tokens-with-ton-btn');

    // --- Dirección de Destino para Pagos TON ---
    const GAME_RECEIVING_TON_ADDRESS = "UQCdA1_m4iiU6jKUaBMsvIoWfMLUzaRfggNg0sabGK-eV-SV";

    // --- Estado del Juego ---
    let petTokens = 0;
    let evolutionLevel = 0;
    let evolutionBaseCost = 10;
    let currentEvolutionCost = evolutionBaseCost;
    let currentEnergy = 100;
    const maxEnergy = 100;
    const tapValue = 1;
    const energyCostPerTap = 5;
    const energyRechargeRate = 1; // por segundo

    // --- TON Connect SDK Instancia ---
    let tonConnectUI = null;

    // **IMPORTANTE**: URL a tu archivo tonconnect-manifest.json alojado en HTTPS
    // USA LA URL RAW DE GITHUB SI LO TIENES ALLÍ:
    const MY_APP_MANIFEST_URL = 'https://raw.githubusercontent.com/Nicolashcro/casino666/main/tonconnect-manifest.json';

    // --- INICIALIZACIÓN DEL JUEGO Y TON CONNECT ---
    async function initGame() {
        updateDisplays();
        setInterval(rechargeEnergy, 1000);
        initTonConnect(); // Inicializar TON Connect

        // Lógica de Telegram Web App (si aplica)
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.ready();
            console.log("Telegram WebApp SDK detectado.");
            // window.Telegram.WebApp.expand(); 
        } else {
            console.log("Telegram WebApp SDK no detectado.");
        }
    }

    function initTonConnect() {
        if (typeof TonConnectSDK === 'undefined' || typeof TonConnectUI === 'undefined') {
            console.error("TON Connect SDK o UI no está cargado.");
            showMessage("Error: Falta SDK de TON", "error");
            if (connectWalletBtn) connectWalletBtn.disabled = true;
            return;
        }

        if (!MY_APP_MANIFEST_URL || MY_APP_MANIFEST_URL === 'URL_REAL_DE_TU_TONCONNECT-MANIFEST.JSON') {
            console.error("Configura la MY_APP_MANIFEST_URL en script.js con la URL real de tu tonconnect-manifest.json");
            showMessage("Error Config: Falta URL del Manifiesto TON", "error");
            if (connectWalletBtn) connectWalletBtn.disabled = true;
            return;
        }

        try {
            tonConnectUI = new TonConnectUI.TonConnectUI({
                manifestUrl: MY_APP_MANIFEST_URL,
                actionsConfiguration: {
                    // Para que funcione bien dentro de Telegram Web Apps al usar billeteras externas
                    twaReturnUrl: `https://t.me/${window.Telegram?.WebApp?.initDataUnsafe?.bot?.username || 'your_bot_username'}`
                }
                // buttonRootId: 'ton-connect-button-custom-root' // Opcional: si quieres que el SDK renderice su propio botón
            });

            // Suscribirse a cambios de estado
            tonConnectUI.onStatusChange(wallet => { // wallet puede ser null o un objeto WalletInfoNotConnected | WalletInfoRemote | WalletInfoInjected
                if (wallet) { // Conectado
                    // wallet.account = { address, chain, publicKey, walletStateInit }
                    // wallet.device = { platform, appName, appVersion, maxProtocolVersion, features }
                    const address = TonConnectSDK.toUserFriendlyAddress(wallet.account.address, wallet.account.chain === TonConnectSDK.CHAIN.TESTNET);
                    const network = wallet.account.chain === TonConnectSDK.CHAIN.TESTNET ? "Testnet" : "Mainnet";
                    
                    console.log(`Billetera conectada: ${address} en ${network}`);
                    console.log("Info de billetera completa:", wallet);

                    walletAddressDisplay.textContent = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
                    walletNetworkDisplay.textContent = `(${network})`;
                    walletInfoDisplay.style.display = 'block';
                    connectWalletBtn.textContent = 'Desconectar';
                    if(buyTokensWithTonBtn) buyTokensWithTonBtn.disabled = false;

                    // Guardar estado (opcional, el SDK puede manejar la restauración)
                    localStorage.setItem('ton_wallet_connected', 'true');

                } else { // Desconectado
                    console.log('Billetera desconectada.');
                    walletInfoDisplay.style.display = 'none';
                    walletAddressDisplay.textContent = '';
                    walletNetworkDisplay.textContent = '';
                    connectWalletBtn.textContent = 'Conectar Billetera';
                    if(buyTokensWithTonBtn) buyTokensWithTonBtn.disabled = true;
                    localStorage.removeItem('ton_wallet_connected');
                }
            });

            // Intentar restaurar una conexión existente
            // Esto es importante para que el usuario no tenga que reconectar cada vez
            tonConnectUI.connectionRestored.then(restored => {
                 if (restored) {
                    console.log("Conexión de billetera restaurada exitosamente por el SDK.");
                 } else {
                    console.log("No se restauró ninguna conexión previa por el SDK.");
                 }
            });

        } catch (e) {
            console.error("Error inicializando TonConnectUI:", e);
            showMessage("Error al iniciar conexión TON", "error");
            if (connectWalletBtn) connectWalletBtn.disabled = true;
        }
    }

    // --- MANEJO DE BOTÓN DE CONEXIÓN/DESCONEXIÓN ---
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', async () => {
            if (!tonConnectUI) {
                showMessage("Error: TON Connect no está listo.", "error");
                return;
            }
            if (tonConnectUI.connected) {
                try {
                    await tonConnectUI.disconnect();
                    showMessage("Billetera desconectada.", "info");
                } catch (e) {
                    console.error("Error al desconectar:", e);
                    showMessage("Error al desconectar.", "error");
                }
            } else {
                // Abrir el modal del SDK para que el usuario elija una billetera
                tonConnectUI.openModal();
            }
        });
    }

    // --- MANEJO DE COMPRA DE TOKENS (TRANSACCIÓN SIMULADA CON SDK) ---
    if (buyTokensWithTonBtn) {
        buyTokensWithTonBtn.addEventListener('click', async () => {
            if (!tonConnectUI || !tonConnectUI.connected) {
                showMessage("Por favor, conecta tu billetera TON primero.", "error");
                // Opcional: intentar abrir modal de conexión
                // tonConnectUI?.openModal();
                return;
            }

            const amountToPayTON = "0.1"; // Cantidad en TON para la compra (¡USA TESTNET!)
            const amountInNanoTON = TonConnectSDK.toNano(amountToPayTON).toString(); // Convertir a nanoTON

            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 360, // 6 minutos de validez
                messages: [
                    {
                        address: GAME_RECEIVING_TON_ADDRESS, // Tu dirección de cobro
                        amount: amountInNanoTON,
                        // payload: "YOUR_COMMENT_OR_DATA_ENCODED_IN_BASE64", // Opcional
                    }
                ]
                // network: TonConnectSDK.CHAIN.TESTNET, // Opcional: puedes especificar la red
            };

            try {
                showMessage(`Enviando ${amountToPayTON} TON... Confirma en tu billetera.`, "info");
                const result = await tonConnectUI.sendTransaction(transaction);

                // 'result.boc' es el Bag of Cells de la transacción firmada.
                // Esto NO significa que la transacción esté confirmada en la blockchain.
                console.log("Transacción enviada (BOC):", result.boc);
                showMessage("Transacción enviada a la billetera. Procesando...", "info");

                // **Paso CRÍTICO FALTANTE PARA PRODUCCIÓN:**
                // Necesitas un backend para enviar este `result.boc` a la red TON (si el SDK no lo hace)
                // y para verificar que la transacción se confirme en la blockchain.
                // NO ACREDITES TOKENS EN EL JUEGO ANTES DE ESTA VERIFICACIÓN DE BACKEND.

                // Para esta demo, simulamos éxito y acreditamos tokens del juego:
                setTimeout(() => {
                    petTokens += 1000; // Acreditar PetTokens comprados
                    updateDisplays();
                    showMessage("¡1000 PetTokens comprados con TON! (Confirmación Simulada)", "success");
                }, 8000); // Simular tiempo de "confirmación"

            } catch (error) {
                console.error("Error en sendTransaction:", error);
                // La documentación de TON Connect tiene códigos de error específicos.
                // Ejemplo de manejo de error si el usuario rechaza:
                // if (error.code === TonConnectSDK.UserRejectsError.code) { ... }
                // O, más genéricamente, a menudo el mensaje contiene "User declined" o similar.
                if (error && (typeof error.message === 'string' && error.message.toLowerCase().includes('user rejected') || error.code === 300)) {
                     showMessage("Compra cancelada por el usuario.", "error");
                } else {
                     showMessage("Error al procesar el pago con TON.", "error");
                }
            }
        });
    }

    // --- FUNCIONES DE ACTUALIZACIÓN DE UI Y JUEGO (como estaban) ---
    function updateDisplays() {
        // ... (código de updateDisplays como en la respuesta anterior, asegurando que todos los elementos existan)
        if (petTokensBalanceDisplay) petTokensBalanceDisplay.textContent = Math.floor(petTokens);
        if (petEvolutionLevelDisplay) petEvolutionLevelDisplay.textContent = evolutionLevel;
        if (evolutionCostDisplay) evolutionCostDisplay.textContent = currentEvolutionCost.toFixed(2);
        if (energyValueDisplay) energyValueDisplay.textContent = Math.floor(currentEnergy);
        if (energyMaxDisplay) energyMaxDisplay.textContent = maxEnergy;
        if (energyFill) energyFill.style.width = `${(currentEnergy / maxEnergy) * 100}%`;
        
        const petEmojis = ['🐾', '🐶', '🐱', '🦊', '🐻', '🐼', '🦁', '🦄', '🐲', '🌟'];
        if (petPlaceholder) petPlaceholder.textContent = petEmojis[evolutionLevel % petEmojis.length];
        
        if (evolveButton) {
            evolveButton.disabled = petTokens < currentEvolutionCost;
        }
        if (buyTokensWithTonBtn && tonConnectUI) { // Habilitar/deshabilitar botón de compra
            buyTokensWithTonBtn.disabled = !tonConnectUI.connected;
        }
    }

    function showMessage(text, type = "info") { /* ... como antes ... */
        if (!messagesDisplay) return;
        messagesDisplay.textContent = text;
        messagesDisplay.className = `message-${type}`;
        messagesDisplay.style.color = type === "error" ? '#dc3545' : type === "success" ? '#28a745' : '#007bff';
        setTimeout(() => { if(messagesDisplay) messagesDisplay.textContent = ""; if(messagesDisplay) messagesDisplay.className = ""; }, 4000);
    }

    function showTapFeedback(event) { /* ... como antes ... */
        const feedback = document.createElement('div');
        feedback.textContent = `+${tapValue}`;
        feedback.classList.add('tap-feedback');
        const gameAreaRect = document.getElementById('game-area').getBoundingClientRect();
        feedback.style.left = `${event.clientX - gameAreaRect.left - 10}px`;
        feedback.style.top = `${event.clientY - gameAreaRect.top - 20}px`;
        document.getElementById('game-area').appendChild(feedback);
        setTimeout(() => feedback.remove(), 950);
    }

    // --- LÓGICA DEL JUEGO "TAP TO EARN" Y EVOLUCIÓN (como estaban) ---
    if (petImageContainer) { /* ... como antes ... */
        petImageContainer.addEventListener('click', (event) => {
            if (currentEnergy >= energyCostPerTap) {
                currentEnergy -= energyCostPerTap;
                petTokens += tapValue;
                showTapFeedback(event);
                updateDisplays();
            } else {
                showMessage("¡Sin energía!", "error");
            }
        });
    }
    function rechargeEnergy() { /* ... como antes ... */
        if (currentEnergy < maxEnergy) {
            currentEnergy = Math.min(maxEnergy, currentEnergy + energyRechargeRate);
            updateDisplays();
        }
    }
    if (evolveButton) { /* Se modificó para simular costo en TON también */
         evolveButton.addEventListener('click', () => {
            if (petTokens >= currentEvolutionCost) {
                // Esta es la evolución con PetTokens del juego.
                // El botón de "Comprar con TON" es para adquirir PetTokens, no para evolucionar directamente con TON.
                // O podrías tener una evolución que SÓLO cueste TON.
                petTokens -= currentEvolutionCost;
                evolutionLevel++;
                currentEvolutionCost = Math.floor(evolutionBaseCost * Math.pow(1.2, evolutionLevel));
                updateDisplays();
                showMessage(`¡Mascota evolucionada al Nivel ${evolutionLevel}!`, "success");
            } else {
                showMessage("No tienes suficientes PetTokens para evolucionar.", "error");
            }
        });
    }

    // --- INICIALIZAR EL JUEGO ---
    initGame();
});
