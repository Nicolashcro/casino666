document.addEventListener('DOMContentLoaded', () => {
    // --- Selectores del DOM (como estaban) ---
    const petTokensBalanceDisplay = document.getElementById('pet-tokens-balance');
    const connectWalletBtn = document.getElementById('connect-wallet-btn');
    const walletInfoDisplay = document.getElementById('wallet-info');
    const walletAddressDisplay = document.getElementById('wallet-address');
    const walletNetworkDisplay = document.getElementById('wallet-network'); // Para mostrar red

    const petImageContainer = document.getElementById('pet-image-container');
    const petEvolutionLevelDisplay = document.getElementById('pet-evolution-level');
    const energyFill = document.getElementById('energy-fill');
    const energyValueDisplay = document.getElementById('energy-value');
    const energyMaxDisplay = document.getElementById('energy-max');
    const evolveButton = document.getElementById('evolve-button');
    const evolutionCostDisplay = document.getElementById('evolution-cost');
    const messagesDisplay = document.getElementById('messages');
    // ... (otros selectores que tenías para Tap to Earn, Ruleta, etc. si los mantienes)

    // --- Estado del Juego (como estaba) ---
    let petTokens = 0;
    let evolutionLevel = 0;
    let evolutionBaseCost = 10;
    let currentEvolutionCost = 10;
    let currentEnergy = 100;
    const maxEnergy = 100;
    const tapValue = 1;
    const energyCostPerTap = 5;
    const energyRechargeRate = 1;
    const energyRechargeInterval = 1000;

    // --- TON CONNECT SDK ---
    let tonConnectUI = null; // Se inicializará después
    const GAME_PAYMENT_ADDRESS_TON = "UQCdA1_m4iiU6jKUaBMsvIoWfMLUzaRfggNg0sabGK-eV-SV"; // Tu dirección de cobro

    // **IMPORTANTE**: Reemplaza esta URL con la URL real donde alojaste tu manifiesto
    const MY_APP_MANIFEST_URL = 'https://github.com/Nicolashcro/casino666/blob/2ca8d6d283f4196b40ecb06657f909e807fae01f/tonconnect-manifest.json';

    // --- INICIALIZACIÓN DEL JUEGO Y TON CONNECT ---
    function initGame() {
        updateDisplays();
        initializeTonConnect(); // Inicializar TON Connect
        setInterval(rechargeEnergy, energyRechargeInterval);
        console.log("Crypto Pets - Tap & Evolve: Inicializado!");
    }

    function initializeTonConnect() {
        if (typeof TonConnectSDK === 'undefined' || typeof TonConnectUI === 'undefined') {
            console.error("TON Connect SDK o UI no está cargado. Asegúrate de incluir los scripts en tu HTML.");
            showMessage("Error: Falta SDK de TON", "error");
            if(connectWalletBtn) connectWalletBtn.disabled = true;
            return;
        }

        if (MY_APP_MANIFEST_URL === 'URL_REAL_DE_TU_TONCONNECT-MANIFEST.JSON') {
            console.error("FATAL: Debes configurar la 'MY_APP_MANIFEST_URL' en script.js con la URL real de tu archivo tonconnect-manifest.json alojado en HTTPS.");
            showMessage("Error de Configuración: Falta URL del Manifiesto TON", "error");
            if(connectWalletBtn) connectWalletBtn.disabled = true;
            return;
        }
        
        // Inicializar TonConnectUI
        tonConnectUI = new TonConnectUI.TonConnectUI({
            manifestUrl: MY_APP_MANIFEST_URL,
            buttonRootId: null, // Usaremos nuestro propio botón
            // language: 'es', // Opcional
            // actionsConfiguration: { twaReturnUrl: 'https://t.me/your_bot_or_channel' } // Opcional para Telegram Web Apps
        });

        // Suscribirse a cambios de estado de la billetera
        const unsubscribe = tonConnectUI.onStatusChange(
            walletAndAccount => { // walletAndAccount puede ser null si se desconecta
                if (walletAndAccount) {
                    handleWalletConnected(walletAndAccount);
                } else {
                    handleWalletDisconnected();
                }
            }
        );

        // También puedes verificar si hay una conexión restaurada
        checkRestoredConnection();
    }
    
    async function checkRestoredConnection() {
        if (!tonConnectUI) return;
        // Pequeño retraso para dar tiempo al SDK a restaurar la conexión si es posible
        await new Promise(resolve => setTimeout(resolve, 500)); 
        if (tonConnectUI.connected) {
            console.log("Conexión de billetera restaurada por el SDK.");
            // El evento onStatusChange ya debería haberse disparado si hay una conexión.
            // Si no, puedes obtener la billetera manualmente:
            // const wallet = tonConnectUI.wallet;
            // if (wallet) handleWalletConnected(wallet);
        } else {
            console.log("No hay conexión de billetera restaurada.");
            updateSimulatedWalletUI(false); // Asegurar que la UI esté desconectada
        }
    }


    function handleWalletConnected(walletInfo) {
        // 'walletInfo' es el objeto que recibes del SDK cuando la conexión es exitosa.
        // Basado en tu documentación de TON Connect (ConnectEventSuccess):
        // walletInfo.account.address es la dirección raw (0:<hex>)
        // walletInfo.account.chain es MAINNET o TESTNET
        // walletInfo.account.publicKey
        // walletInfo.account.walletStateInit
        // walletInfo.device (appName, appVersion, etc.)
        
        const addressRaw = walletInfo.account.address;
        const isTestnet = walletInfo.account.chain === TonConnectSDK.CHAIN.TESTNET; // Asumiendo que el SDK tiene esta constante
                                                                                // O compara con "-3" para Testnet, "-239" para Mainnet como en tu doc
        
        // Convertir dirección raw a formato "user-friendly" (el SDK debería proveer esto)
        // Para el ejemplo, usaré una función hipotética o la mostraré raw.
        // @tonconnect/sdk sí tiene `TonConnectSDK.toUserFriendlyAddress(rawAddress, isTestnet)`
        const userFriendlyAddress = TonConnectSDK.toUserFriendlyAddress(addressRaw, isTestnet);

        simulatedTonAddress = userFriendlyAddress; // Guardar la dirección real
        simulatedTonNetwork = isTestnet ? "Testnet" : "Mainnet";

        isWalletConnected_simulated = true; // Actualizar nuestro estado interno
        localStorage.setItem('ton_wallet_connected_real', 'true');
        localStorage.setItem('ton_wallet_address_real', userFriendlyAddress);
        localStorage.setItem('ton_wallet_network_real', simulatedTonNetwork);
        
        console.log(`Billetera TON Conectada: ${userFriendlyAddress} (${simulatedTonNetwork})`);
        console.log("Información del dispositivo de la billetera:", walletInfo.device);
        
        // Aquí podrías verificar las "features" soportadas por la billetera:
        if (walletInfo.device.features.some(f => f.name === 'SendTransaction')) {
            console.log("La billetera conectada soporta 'SendTransaction'.");
        }

        // Si solicitaste 'ton_proof' y fue exitoso, aquí verificarías la prueba.
        // const tonProofReply = walletInfo.connectItems?.find(item => item.name === 'ton_proof');
        // if (tonProofReply && !tonProofReply.error) { /* ... verificar prueba ... */ }

        updateSimulatedWalletUI(true, userFriendlyAddress, simulatedTonNetwork);
        showMessage("¡Billetera TON conectada!", "success");
    }

    function handleWalletDisconnected() {
        isWalletConnected_simulated = false;
        simulatedTonAddress = "";
        simulatedTonNetwork = "";
        localStorage.removeItem('ton_wallet_connected_real');
        localStorage.removeItem('ton_wallet_address_real');
        localStorage.removeItem('ton_wallet_network_real');
        console.log("Billetera TON Desconectada.");
        updateSimulatedWalletUI(false);
        showMessage("Billetera TON desconectada.", "info");
    }
    
    function updateSimulatedWalletUI(isConnected, address = "", network = "") {
        isWalletConnected_simulated = isConnected; // Actualiza el estado global
        if (isConnected) {
            walletInfoDisplay.style.display = 'flex'; // Mostrar información
            walletAddressDisplay.textContent = address.substring(0, 6) + "..." + address.substring(address.length - 4);
            walletAddressDisplay.setAttribute('data-tooltip', `Billetera: ${address}`);
            walletNetworkDisplay.textContent = `(${network})`;
            connectWalletBtn.textContent = "Desconectar";
        } else {
            walletInfoDisplay.style.display = 'none';
            walletAddressDisplay.textContent = "";
            walletNetworkDisplay.textContent = "";
            connectWalletBtn.textContent = "Conectar Billetera TON";
        }
    }
    
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', async () => {
            if (!tonConnectUI) {
                showMessage("SDK de TON no inicializado.", "error");
                return;
            }
            if (tonConnectUI.connected) {
                try {
                    await tonConnectUI.disconnect(); // SDK maneja la desconexión
                    // El evento onStatusChange se encargará de actualizar la UI
                } catch (e) {
                    console.error("Error al desconectar:", e);
                    showMessage("Error al desconectar.", "error");
                }
            } else {
                // El SDK @tonconnect/ui abre su propio modal para seleccionar billetera
                // Puede que necesites configurar `tonConnectUI.uiOptions = { language: 'es', theme: 'SYSTEM' };` antes.
                // El método para mostrar el modal puede variar, consulta la doc de @tonconnect/ui.
                // Usualmente, el botón que genera el SDK (si usas buttonRootId) o una llamada directa abre el modal.
                // Para un botón personalizado, a menudo se usa:
                try {
                    const walletsList = await tonConnectUI.getWallets(); // Opcional, para ver las billeteras
                    console.log("Billeteras disponibles:", walletsList);
                    tonConnectUI.openModal(); // Abre el modal de selección de billetera del SDK
                } catch (e) {
                    console.error("Error al abrir modal de conexión:", e);
                    showMessage("Error al iniciar conexión.", "error");
                }
            }
        });
    }

    // --- LÓGICA DE PAGO CON TON (ILUSTRATIVA) ---
    if (evolveButton) { // Reutilicemos el botón de evolucionar para simular una acción que requiere pago
        evolveButton.addEventListener('click', async () => {
            if (!isWalletConnected_simulated || !tonConnectUI || !tonConnectUI.connected) {
                showMessage("Conecta tu billetera TON para evolucionar con tokens reales.", "error");
                // Opcional: intentar abrir el modal de conexión
                // if (tonConnectUI && !tonConnectUI.connected) tonConnectUI.openModal();
                return;
            }

            if (petTokens < currentEvolutionCost) {
                 showMessage("¡No tienes suficientes PetTokens (del juego) para esta evolución!", "error");
                 return;
            }

            // SIMULAREMOS QUE LA EVOLUCIÓN CUESTA UNA PEQUEÑA CANTIDAD DE TON REAL
            const tonCostForEvolution = 0.01; // ¡Usa valores muy pequeños para pruebas en Testnet!
            const amountNanoTON = TonConnectSDK.toNano(tonCostForEvolution.toString()).toString();

            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 360, // Transacción válida por 6 minutos
                messages: [
                    {
                        address: GAME_PAYMENT_ADDRESS_TON, // Tu dirección de cobro
                        amount: amountNanoTON,
                        // payload: "base64_encoded_comment_or_data" // Opcional
                    }
                ]
            };

            showMessage(`Enviando ${tonCostForEvolution} TON para la evolución...`, "info");

            try {
                // Este es el paso crucial donde el SDK pide al usuario confirmar en su billetera
                const result = await tonConnectUI.sendTransaction(transaction);
                
                // 'result' contendrá el boc de la transacción enviada.
                // NO significa que la transacción esté confirmada en la blockchain.
                console.log("Transacción enviada al wallet, resultado (boc):", result.boc);
                showMessage("Transacción enviada a la billetera. Esperando confirmación...", "info");

                // **IMPORTANTE: PASO FALTANTE CRÍTICO PARA PRODUCCIÓN**
                // Aquí es donde DEBERÍAS tener un backend que:
                // 1. Reciba este 'boc' o la información de la transacción.
                // 2. Lo envíe a la red TON (si el SDK no lo hizo por completo).
                // 3. Monitoree la blockchain para confirmar que la transacción fue exitosa.
                // 4. SOLO DESPUÉS de la confirmación en blockchain, tu backend debería
                //    notificar al juego (o actualizar la base de datos del jugador)
                //    para que se acredite la evolución.

                // Para esta DEMO, simularemos una confirmación exitosa después de un tiempo:
                setTimeout(() => {
                    petTokens -= currentEvolutionCost; // Cobrar tokens del juego
                    evolutionLevel++;
                    currentEvolutionCost *= 1.20;
                    showMessage(`¡Mascota evolucionada al Nivel ${evolutionLevel} con TON! (Confirmación Simulada)`, "success");
                    updateDisplays();
                }, 8000); // Simular 8 segundos de espera para "confirmación"

            } catch (error) {
                console.error("Error en sendTransaction:", error);
                let userMessage = "Error al procesar el pago con TON.";
                if (error.message && error.message.toLowerCase().includes('user declined') || (error.code && error.code === 300 /* User declined the transaction*/)) {
                    userMessage = "Pago cancelado por el usuario.";
                } else if (error.message) {
                     // userMessage += " Detalles: " + error.message;
                }
                showMessage(userMessage, "error");
            }
        });
    }


    // --- FUNCIONES DE ACTUALIZACIÓN DE UI ---
    function updateDisplays() {
        if(petTokensBalanceDisplay) petTokensBalanceDisplay.textContent = Math.floor(petTokens);
        if(petEvolutionLevelDisplay) petEvolutionLevelDisplay.textContent = evolutionLevel;
        if(evolutionCostDisplay) evolutionCostDisplay.textContent = currentEvolutionCost.toFixed(2); // Mostrar decimales para el costo
        if(energyValueDisplay) energyValueDisplay.textContent = Math.floor(currentEnergy);
        if(energyMaxDisplay) energyMaxDisplay.textContent = maxEnergy;
        if(energyFill) energyFill.style.width = `${(currentEnergy / maxEnergy) * 100}%`;

        const petPlaceholders = ['🐾', '🐶', '🐱', '🦊', '🐻', '🐼', '🦁', '🦄', '🐲', '🌟']; // Más iconos
        const petElem = document.getElementById('pet-placeholder');
        if(petElem) petElem.textContent = petPlaceholders[evolutionLevel % petPlaceholders.length];
        
        if (evolveButton) {
            evolveButton.disabled = petTokens < currentEvolutionCost || !isWalletConnected_simulated; 
            // Deshabilitar si no hay suficientes tokens o billetera no conectada para la "compra" de evolución
            if (!isWalletConnected_simulated) {
                evolveButton.setAttribute('data-tooltip', 'Conecta tu billetera TON para evolucionar con TON');
            } else if (petTokens < currentEvolutionCost) {
                evolveButton.setAttribute('data-tooltip', 'Necesitas más PetTokens del juego');
            } else {
                evolveButton.removeAttribute('data-tooltip');
            }
        }
    }

    function showMessage(text, type = "info") {
        if (!messagesDisplay) return;
        messagesDisplay.textContent = text;
        messagesDisplay.className = `message-${type}`; // Para estilos CSS: .message-info, .message-error, .message-success
        setTimeout(() => {
            if(messagesDisplay) messagesDisplay.textContent = "";
            if(messagesDisplay) messagesDisplay.className = "";
        }, 4000);
    }

    function showTapFeedback(value) { /* ... como antes ... */
        const feedback = document.createElement('div');
        feedback.classList.add('tap-value-feedback');
        feedback.textContent = `+${value}`;
        if(petImageContainer) petImageContainer.appendChild(feedback);
        setTimeout(() => { feedback.remove(); }, 750);
    }


    // --- LÓGICA DE "TAP TO EARN" ---
    if (petImageContainer) { /* ... como antes ... */
        petImageContainer.addEventListener('click', () => {
            if (currentEnergy >= energyCostPerTap) {
                currentEnergy -= energyCostPerTap;
                petTokens += tapValue;
                showTapFeedback(tapValue);
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
    
    // --- INICIALIZAR TODO ---
    initGame();
});
