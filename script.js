document.addEventListener('DOMContentLoaded', async () => {
    // --- Selectores del DOM ---
    const petTokensBalanceDisplay = document.getElementById('pet-tokens-balance');
    const connectWalletBtn = document.getElementById('connect-wallet-btn');
    const walletInfoDiv = document.getElementById('wallet-info');
    const walletAddressDisplay = document.getElementById('wallet-address');
    const walletNetworkDisplay = document.getElementById('wallet-network');

    const petImageContainer = document.getElementById('pet-image-container');
    const petPlaceholder = document.getElementById('pet-placeholder');
    const petEvolutionLevelDisplay = document.getElementById('pet-evolution-level');
    
    const energyFill = document.getElementById('energy-fill');
    const energyValueDisplay = document.getElementById('energy-value');
    const energyMaxDisplay = document.getElementById('energy-max');
    
    const evolveButton = document.getElementById('evolve-button');
    const evolutionCostDisplay = document.getElementById('evolution-cost');
    const messagesDisplay = document.getElementById('messages');
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

    // --- TON Connect SDK Instancia ---
    let tonConnectUI = null;
    // USA LA URL RAW DE TU MANIFIESTO EN GITHUB:
    const MY_APP_MANIFEST_URL = 'https://raw.githubusercontent.com/Nicolashcro/casino666/main/tonconnect-manifest.json';

    // --- INICIALIZACIÓN ---
    async function initGame() {
        updateDisplays();
        initTonConnect(); 
        setInterval(rechargeEnergy, 1000);

        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.ready();
            // window.Telegram.WebApp.expand();
            console.log("Telegram WebApp SDK detectado.");
        } else {
            console.log("Telegram WebApp SDK no detectado.");
        }
    }

    function initTonConnect() {
        if (typeof TonConnectSDK === 'undefined' || typeof TonConnectUI === 'undefined') {
            console.error("Error Crítico: TON Connect SDK o UI no está cargado. Verifica los tags <script> en index.html.");
            showMessage("Error SDK: Recarga la página o revisa la consola.", "error");
            if (connectWalletBtn) connectWalletBtn.textContent = "Error SDK";
            if (connectWalletBtn) connectWalletBtn.disabled = true;
            if (buyTokensWithTonBtn) buyTokensWithTonBtn.disabled = true;
            return;
        }

        if (!MY_APP_MANIFEST_URL || MY_APP_MANIFEST_URL.includes('URL_REAL_DE_TU_TONCONNECT-MANIFEST.JSON') || MY_APP_MANIFEST_URL.includes('URL_RAIZ_DE_TU_JUEGO')) {
            console.error("Error Crítico: La 'MY_APP_MANIFEST_URL' en script.js no está configurada correctamente con la URL real de tu tonconnect-manifest.json. Debe ser una URL HTTPS pública al archivo raw.");
            showMessage("Error Config: Manifiesto TON no configurado.", "error");
            if (connectWalletBtn) connectWalletBtn.textContent = "Error Config";
            if (connectWalletBtn) connectWalletBtn.disabled = true;
            if (buyTokensWithTonBtn) buyTokensWithTonBtn.disabled = true;
            return;
        }
        
        try {
            tonConnectUI = new TonConnectUI.TonConnectUI({
                manifestUrl: MY_APP_MANIFEST_URL,
                // Opcional: si quieres que el SDK renderice su propio botón en un div específico
                // buttonRootId: 'ton-connect-button-root', 
                uiPreferences: {
                    theme: THEME.DARK, // o THEME.LIGHT
                    borderRadius: 's', // 's' o 'm'
                },
                actionsConfiguration: {
                    twaReturnUrl: `https://t.me/${window.Telegram?.WebApp?.initDataUnsafe?.bot?.username || 'tu_bot_username'}`
                }
            });

            // Suscribirse a cambios de estado para actualizar la UI
            tonConnectUI.onStatusChange(wallet => {
                if (wallet) { // Conectado
                    const address = TonConnectSDK.toUserFriendlyAddress(wallet.account.address, wallet.account.chain === TonConnectSDK.CHAIN.TESTNET);
                    const network = wallet.account.chain === TonConnectSDK.CHAIN.TESTNET ? "Testnet" : "Mainnet";
                    
                    console.log(`Billetera conectada: ${address} en ${network}`);
                    walletAddressDisplay.textContent = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
                    walletNetworkDisplay.textContent = `(${network})`;
                    walletInfoDiv.style.display = 'flex'; // Mostrar la info
                    connectWalletBtn.textContent = 'Desconectar';
                    if(buyTokensWithTonBtn) buyTokensWithTonBtn.disabled = false;
                } else { // Desconectado
                    console.log('Billetera desconectada.');
                    walletInfoDiv.style.display = 'none';
                    connectWalletBtn.textContent = 'Conectar Billetera';
                    if(buyTokensWithTonBtn) buyTokensWithTonBtn.disabled = true;
                }
            });

        } catch (e) {
            console.error("Error inicializando TonConnectUI:", e);
            showMessage("Error al iniciar TON Connect. Revisa la consola.", "error");
            if (connectWalletBtn) connectWalletBtn.textContent = "Error Init TON";
            if (connectWalletBtn) connectWalletBtn.disabled = true;
            if (buyTokensWithTonBtn) buyTokensWithTonBtn.disabled = true;
        }
    }

    // --- MANEJO DE BOTÓN DE CONEXIÓN/DESCONEXIÓN ---
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', async () => {
            if (!tonConnectUI) {
                showMessage("TON Connect no está listo. Intenta recargar.", "error");
                return;
            }
            if (tonConnectUI.connected) {
                try {
                    await tonConnectUI.disconnect();
                } catch (e) { console.error("Error al desconectar:", e); }
            } else {
                // @tonconnect/ui maneja su propio modal.
                // Si el SDK está configurado para usar nuestro botón (sin buttonRootId),
                // necesitaríamos llamar a un método para abrir el modal.
                // Si tiene buttonRootId, el SDK reemplaza ese div con su botón.
                // Con TonConnectUI, usualmente se usa su propio componente de botón o se abre el modal programáticamente.
                // El modal se abre automáticamente si se usa el botón renderizado por el SDK.
                // Si usamos nuestro propio botón, necesitamos decirle que abra el modal.
                tonConnectUI.openModal();
            }
        });
    }

    // --- COMPRA DE TOKENS CON TON (TRANSACCIÓN REAL) ---
    if (buyTokensWithTonBtn) {
        buyTokensWithTonBtn.addEventListener('click', async () => {
            if (!tonConnectUI || !tonConnectUI.connected) {
                showMessage("Por favor, conecta tu billetera TON primero.", "error");
                tonConnectUI?.openModal(); // Intentar abrir modal si no está conectado
                return;
            }

            const amountToPayTON = "0.1"; // ¡USA VALORES PEQUEÑOS Y TESTNET!
            const amountInNanoTON = TonConnectSDK.toNano(amountToPayTON).toString();

            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 360, // 6 minutos
                messages: [
                    {
                        address: GAME_RECEIVING_TON_ADDRESS,
                        amount: amountInNanoTON,
                        // payload: btoa("Compra de 1000 PetTokens") // Comentario opcional, debe ser base64
                    }
                ]
                // network: TonConnectSDK.CHAIN.TESTNET, // Especificar red si es necesario
            };

            try {
                showMessage(`Solicitando ${amountToPayTON} TON... Confirma en tu billetera.`, "info");
                const result = await tonConnectUI.sendTransaction(transaction);
                
                console.log("Transacción enviada (raw result):", result);
                // `result.boc` es el Bag of Cells. Esto significa que el usuario firmó
                // y la billetera intentó enviar la transacción. NO que esté confirmada.

                showMessage("Transacción enviada a la billetera. Esperando confirmación de la red...", "info");

                // **AQUÍ VA LA LÓGICA DE VERIFICACIÓN DEL BACKEND**
                // Por ahora, simulamos un éxito después de un tiempo.
                // En producción, tu backend debe verificar el 'boc' o un ID de transacción
                // contra la blockchain de TON.
                setTimeout(() => {
                    petTokens += 1000;
                    updateDisplays();
                    showMessage("¡1000 PetTokens comprados! (Confirmación Simulada)", "success");
                }, 15000); // Simular 15 segundos para "confirmación en red"

            } catch (error) {
                console.error("Error en sendTransaction:", error);
                let userMessage = "Error al procesar el pago.";
                // TonConnectUI suele lanzar errores específicos que puedes capturar
                // if (error.name === 'UserRejectsError') { ... } o similar
                if (error && (typeof error.message === 'string' && error.message.toLowerCase().includes('user rejected') || (error.message && error.message.includes('Modal closed')) || error.code === 300 )) {
                     userMessage = "Pago cancelado.";
                } else if (error && error.message) {
                    // userMessage += ` (${error.message.substring(0, 30)}...)`;
                }
                showMessage(userMessage, "error");
            }
        });
    }

    // --- FUNCIONES DE ACTUALIZACIÓN DE UI Y JUEGO ---
    function updateDisplays() {
        if(petTokensBalanceDisplay) petTokensBalanceDisplay.textContent = Math.floor(petTokens);
        if(petEvolutionLevelDisplay) petEvolutionLevelDisplay.textContent = evolutionLevel;
        if(evolutionCostDisplay) evolutionCostDisplay.textContent = currentEvolutionCost.toFixed(2);
        if(energyValueDisplay) energyValueDisplay.textContent = Math.floor(currentEnergy);
        if(energyMaxDisplay) energyMaxDisplay.textContent = maxEnergy;
        if(energyFill) energyFill.style.width = `${(currentEnergy / maxEnergy) * 100}%`;
        
        const petEmojis = ['🐾', '🐶', '🐱', '🦊', '🐻', '🐼', '🦁', '🦄', '🐲', '🌟'];
        if(petPlaceholder) petPlaceholder.textContent = petEmojis[evolutionLevel % petEmojis.length];
        
        if (evolveButton) {
            evolveButton.disabled = petTokens < currentEvolutionCost;
        }
        if (buyTokensWithTonBtn && tonConnectUI) {
            buyTokensWithTonBtn.disabled = !tonConnectUI.connected;
        } else if (buyTokensWithTonBtn) {
            buyTokensWithTonBtn.disabled = true; // Deshabilitado si tonConnectUI no se inicializó
        }
    }

    function showMessage(text, type = "info") {
        if (!messagesDisplay) return;
        messagesDisplay.textContent = text;
        messagesDisplay.className = `message message-${type}`; // Añadida clase base .message
        messagesDisplay.style.color = type === "error" ? '#e74c3c' : type === "success" ? '#2ecc71' : '#3498db';
        setTimeout(() => { if(messagesDisplay) messagesDisplay.textContent = ""; if(messagesDisplay) messagesDisplay.className = "message"; }, 5000);
    }

    function showTapFeedback(event) { /* ... como antes ... */
        const gameArea = document.getElementById('game-area');
        if (!gameArea || !event) return;
        const feedback = document.createElement('div');
        feedback.textContent = `+${tapValue}`;
        feedback.classList.add('tap-feedback');
        const gameAreaRect = gameArea.getBoundingClientRect();
        feedback.style.left = `${event.clientX - gameAreaRect.left - 10}px`;
        feedback.style.top = `${event.clientY - gameAreaRect.top - 20}px`;
        gameArea.appendChild(feedback);
        setTimeout(() => feedback.remove(), 950);
    }

    // --- LÓGICA DEL JUEGO "TAP TO EARN" Y EVOLUCIÓN ---
    if (petImageContainer) {
        petImageContainer.addEventListener('click', (event) => {
            if (currentEnergy >= energyPerTap) {
                currentEnergy -= energyPerTap;
                petTokens += tapValue;
                showTapFeedback(event);
                updateDisplays();
            } else {
                showMessage("¡Sin energía!", "error");
            }
        });
    }
    function rechargeEnergy() {
        if (currentEnergy < maxEnergy) {
            currentEnergy = Math.min(maxEnergy, currentEnergy + energyRechargeRate);
            updateDisplays();
        }
    }
    if (evolveButton) {
        evolveButton.addEventListener('click', () => { // Esta evolución es con PetTokens del juego
            if (petTokens >= currentEvolutionCost) {
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
