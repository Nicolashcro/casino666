document.addEventListener('DOMContentLoaded', async () => {
    // --- Selectores del DOM ---
    const petTokensDisplay = document.getElementById('pet-tokens-balance');
    const connectMetaMaskBtn = document.getElementById('connect-metamask-btn');
    const walletInfoDiv = document.getElementById('wallet-info');
    const walletAddressPlaceholder = document.getElementById('wallet-address-placeholder');
    const walletTypeDisplay = document.getElementById('wallet-type-display');
    const networkNameDisplay = document.getElementById('network-name-display');
    
    const petImageContainer = document.getElementById('pet-image-container');
    const petPlaceholder = document.getElementById('pet-placeholder');
    const petLevelDisplay = document.getElementById('pet-evolution-level');
    
    const energyFill = document.getElementById('energy-fill');
    const energyValueDisplay = document.getElementById('energy-value');
    const energyMaxDisplay = document.getElementById('energy-max');
    
    const evolveBtn = document.getElementById('evolve-button');
    const evolveCostDisplay = document.getElementById('evolution-cost');
    const messagesDisplay = document.getElementById('messages-display');

    const buyTokensBtn = document.getElementById('buy-tokens-btn');
    const paymentInfoMessage = document.getElementById('payment-info-message');
    
    // Dirección EVM del juego para recibir pagos (REEMPLAZA CON LA TUYA REAL DE TESTNET PRIMERO)
    const YOUR_GAME_RECEIVING_EVM_ADDRESS = "TU_DIRECCION_EVM_PARA_RECIBIR_PAGOS_AQUI"; 

    // --- Estado del Juego ---
    let petTokens = 0;
    let petLevel = 0;
    let evolutionBaseCost = 10;
    let currentEvolveCost = evolutionBaseCost;
    let currentEnergy = 100;
    const maxEnergy = 100;
    const tapValue = 1;
    const energyPerTap = 5;
    const energyRechargePerSecond = 1;

    // --- Estado de Billetera MetaMask ---
    let currentAccount = null;
    let currentChainId = null;

    // --- INICIALIZACIÓN ---
    async function initGame() {
        updateDisplays();
        setInterval(rechargeEnergy, 1000);
        
        if (typeof window.ethereum !== 'undefined') {
            console.log('MetaMask (o compatible) detectado.');
            // Intentar obtener cuentas si ya está conectado y permitido
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    handleAccountsChanged(accounts);
                }
            } catch (err) {
                console.warn("Error al obtener cuentas iniciales:", err);
            }

            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);
        } else {
            showMessage("MetaMask no detectado. Por favor, instala MetaMask.", "error");
            if(connectMetaMaskBtn) connectMetaMaskBtn.textContent = "Instalar MetaMask";
            if(connectMetaMaskBtn) connectMetaMaskBtn.disabled = true;
            if(buyTokensBtn) buyTokensBtn.disabled = true;
        }
        
        console.log("Crypto Pets - Juego Inicializado (MetaMask)");
    }

    // --- ACTUALIZACIÓN DE UI ---
    function updateDisplays() {
        // ... (lógica de updateDisplays para PetTokens, Nivel, Energía, EvolveBtn como antes) ...
        if(petTokensDisplay) petTokensDisplay.textContent = Math.floor(petTokens);
        if(petLevelDisplay) petLevelDisplay.textContent = petLevel;
        if(evolveCostDisplay) evolveCostDisplay.textContent = Math.floor(currentEvolveCost);
        if(energyValueDisplay) energyValueDisplay.textContent = Math.floor(currentEnergy);
        if(energyMaxDisplay) energyMaxDisplay.textContent = maxEnergy;
        if(energyFill) energyFill.style.width = `${(currentEnergy / maxEnergy) * 100}%`;

        const petEmojis = ['🐾', '🐶', '🐱', '🦊', '🐻', '🐼', '🦁', '🦄', '🐲', '🌟'];
        if(petPlaceholder) petPlaceholder.textContent = petEmojis[petLevel % petEmojis.length];
        
        if(evolveBtn) evolveBtn.disabled = petTokens < currentEvolveCost;
        if(buyTokensBtn) buyTokensBtn.disabled = !currentAccount; // Habilitar si hay una cuenta conectada
    }

    function updateWalletUI() {
        if (currentAccount) {
            if(walletAddressPlaceholder) walletAddressPlaceholder.textContent = `${currentAccount.substring(0, 6)}...${currentAccount.substring(currentAccount.length - 4)}`;
            if(walletAddressPlaceholder) walletAddressPlaceholder.setAttribute('data-tooltip', `Dirección: ${currentAccount}`);
            if(walletTypeDisplay) walletTypeDisplay.textContent = "MetaMask"; // O nombre de la billetera si se puede obtener
            if(networkNameDisplay) networkNameDisplay.textContent = getNetworkName(currentChainId);
            if(walletInfoDiv) walletInfoDiv.style.display = 'block';
            if(connectMetaMaskBtn) connectMetaMaskBtn.textContent = 'Desconectar'; // O simplemente ocultarlo
        } else {
            if(walletInfoDiv) walletInfoDiv.style.display = 'none';
            if(connectMetaMaskBtn) connectMetaMaskBtn.textContent = 'Conectar MetaMask';
            if(networkNameDisplay) networkNameDisplay.textContent = 'Desconectado';
        }
        if(buyTokensBtn) buyTokensBtn.disabled = !currentAccount;
    }

    function showUIMessage(text, type = "info") { /* ... como antes ... */ }
    function showTapFeedback(event) { /* ... como antes ... */ }

    // --- LÓGICA DEL JUEGO (Tap to Earn, Evolución) ---
    if (petImageContainer) { /* ... como antes ... */ }
    function rechargeEnergy() { /* ... como antes ... */ }
    if (evolveBtn) { /* ... como antes ... */ }
    // (Pega aquí las funciones completas de showUIMessage, showTapFeedback, el listener de petImageContainer, rechargeEnergy, y el listener de evolveBtn de la respuesta anterior)
    if (petImageContainer) {
        petImageContainer.addEventListener('click', (event) => {
            if (currentEnergy >= energyPerTap) {
                currentEnergy -= energyPerTap;
                petTokens += tapValue;
                showTapFeedback(event);
                updateDisplays();
            } else {
                showUIMessage("¡Sin energía!", "error");
            }
        });
    }
    function rechargeEnergy() {
        if (currentEnergy < maxEnergy) {
            currentEnergy = Math.min(maxEnergy, currentEnergy + energyRechargePerSecond);
            updateDisplays();
        }
    }
    if (evolveBtn) {
        evolveBtn.addEventListener('click', () => {
            if (petTokens >= currentEvolveCost) {
                petTokens -= currentEvolveCost;
                petLevel++;
                currentEvolveCost = Math.floor(evolutionBaseCost * Math.pow(1.2, petLevel));
                updateDisplays();
                showUIMessage(`¡Mascota evolucionada al Nivel ${petLevel}!`, "success");
            } else {
                showUIMessage("No tienes suficientes PetTokens.", "error");
            }
        });
    }
     function showUIMessage(text, type = "info") {
        if (!messagesDisplay) return;
        messagesDisplay.textContent = text;
        messagesDisplay.className = `message-${type}`;
        messagesDisplay.style.color = type === "error" ? '#dc3545' : type === "success" ? '#28a745' : '#007bff';
        setTimeout(() => { if(messagesDisplay) messagesDisplay.textContent = ""; if(messagesDisplay) messagesDisplay.className = ""; }, 4000);
    }
    function showTapFeedback(event) {
        const gameArea = document.getElementById('game-area');
        if (!gameArea || !event) return;
        const feedback = document.createElement('div');
        feedback.textContent = `+${tapValue}`;
        feedback.classList.add('tap-feedback');
        const gameAreaRect = gameArea.getBoundingClientRect();
        feedback.style.left = `${event.clientX - gameAreaRect.left - 10}px`;
        feedback.style.top = `${event.clientY - gameAreaRect.top - 30}px`;
        gameArea.appendChild(feedback);
        setTimeout(() => feedback.remove(), 950);
    }


    // --- LÓGICA DE BILLETERA METAMASK ---
    async function connectMetaMask() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                handleAccountsChanged(accounts);
            } catch (error) {
                if (error.code === 4001) { // EIP-1193 userRejectedRequest error
                    showUIMessage("Conexión a MetaMask rechazada por el usuario.", "error");
                } else {
                    console.error("Error al conectar con MetaMask:", error);
                    showUIMessage("Error al conectar con MetaMask.", "error");
                }
            }
        } else {
            showUIMessage("MetaMask no está instalado. Por favor, instala la extensión.", "error");
            // Podrías redirigir a la página de descarga de MetaMask
        }
    }

    function handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            console.log('MetaMask está bloqueado o no tiene cuentas conectadas.');
            currentAccount = null;
            showUIMessage("Por favor, conecta una cuenta en MetaMask.", "info");
        } else if (accounts[0] !== currentAccount) {
            currentAccount = accounts[0];
            console.log('Cuenta cambiada/conectada:', currentAccount);
            showUIMessage(`Billetera MetaMask conectada: ${currentAccount.substring(0,6)}...`, "success");
            // Obtener Chain ID actual
            window.ethereum.request({ method: 'eth_chainId' }).then(handleChainChanged).catch(console.error);
        }
        updateWalletUI();
        updateDisplays(); // Para habilitar/deshabilitar botones dependientes
    }

    async function handleChainChanged(chainIdHex) {
        currentChainId = chainIdHex;
        console.log('Red cambiada a:', chainIdHex, `(${getNetworkName(chainIdHex)})`);
        if(networkNameDisplay) networkNameDisplay.textContent = getNetworkName(chainIdHex);
        showUIMessage(`Cambiado a red: ${getNetworkName(chainIdHex)}`, "info");
    }

    function getNetworkName(chainIdHex) {
        if (!chainIdHex) return "Desconocida";
        const chainId = parseInt(chainIdHex, 16);
        switch (chainId) {
            case 1: return 'Ethereum Mainnet';
            case 5: return 'Goerli Testnet';
            case 11155111: return 'Sepolia Testnet';
            case 56: return 'BSC Mainnet';
            case 97: return 'BSC Testnet';
            case 137: return 'Polygon Mainnet';
            case 80001: return 'Polygon Mumbai Testnet';
            // Añade más redes según necesites
            default: return `ChainID ${chainId}`;
        }
    }

    if (connectMetaMaskBtn) {
        connectMetaMaskBtn.addEventListener('click', () => {
            if (currentAccount) {
                // Simular desconexión (MetaMask no tiene un método de "desconexión" explícito desde la dApp)
                // La dApp "olvida" la cuenta. El usuario se desconecta desde la extensión.
                currentAccount = null;
                currentChainId = null;
                showUIMessage("Desconectado de MetaMask (simulado). Conecta de nuevo si es necesario.", "info");
                updateWalletUI();
                updateDisplays();
            } else {
                connectMetaMask();
            }
        });
    }
    
    // --- LÓGICA DE PAGO CON METAMASK (Ejemplo para comprar PetTokens) ---
    if (buyTokensBtn) {
        buyTokensBtn.addEventListener('click', async () => {
            if (!currentAccount) {
                showUIMessage("Conecta tu billetera MetaMask primero.", "error");
                connectMetaMask(); // Intentar conectar
                return;
            }
            if (!YOUR_GAME_RECEIVING_EVM_ADDRESS || YOUR_GAME_RECEIVING_EVM_ADDRESS === "TU_DIRECCION_EVM_PARA_RECIBIR_PAGOS_AQUI") {
                showUIMessage("Dirección de pago del juego no configurada.", "error");
                console.error("Error: YOUR_GAME_RECEIVING_EVM_ADDRESS no está configurada en script.js");
                return;
            }

            const amountToPayETH = "0.001"; // ¡Usa valores PEQUEÑOS y en TESTNET!
            const amountInWei = (parseFloat(amountToPayETH) * 1e18).toString(16); // Convertir a Wei y luego a Hexadecimal

            const transactionParameters = {
                // nonce: '0x00', // El nonce (número de transacción) normalmente lo gestiona MetaMask.
                // gasPrice: '0x09184e72a000', // Opcional: precio del gas en Wei hexadecimal. Mejor dejar que MetaMask sugiera.
                // gas: '0x2710', // Opcional: límite de gas en hexadecimal (ej: 21000 para transferencia simple). Mejor dejar que MetaMask sugiera.
                to: YOUR_GAME_RECEIVING_EVM_ADDRESS,
                from: currentAccount,
                value: '0x' + amountInWei, // Cantidad en Wei, prefijada con 0x
                // data: '0x...', // Opcional: para interactuar con contratos inteligentes
                // chainId: '0x...', // Opcional: MetaMask usará la red activa. Es bueno verificarla.
            };

            try {
                showUIMessage(`Solicitando ${amountToPayETH} ETH... Confirma en MetaMask.`, "info");
                const txHash = await window.ethereum.request({
                    method: 'eth_sendTransaction',
                    params: [transactionParameters],
                });
                console.log("Transacción enviada, Hash:", txHash);
                showUIMessage(`Transacción enviada: ${txHash.substring(0,10)}... Esperando confirmación.`, "info");

                // **AQUÍ VA LA LÓGICA DE VERIFICACIÓN DEL BACKEND (CRUCIAL)**
                // Necesitas un backend para:
                // 1. Escuchar este txHash en la blockchain.
                // 2. Esperar a que se mine y confirme (varias confirmaciones de bloque).
                // 3. SOLO DESPUÉS de la confirmación, acreditar los PetTokens.
                
                // Para esta DEMO, simulamos éxito:
                setTimeout(() => {
                    petTokens += 1000;
                    updateDisplays();
                    showUIMessage("¡1000 PetTokens comprados con ETH! (Confirmación Simulada)", "success");
                }, 20000); // Simular tiempo de confirmación en red (puede ser más largo)

            } catch (error) {
                console.error("Error al enviar transacción con MetaMask:", error);
                if (error.code === 4001) {
                    showUIMessage("Transacción rechazada por el usuario.", "error");
                } else {
                    showUIMessage("Error al enviar la transacción.", "error");
                }
            }
        });
    }
    
    // --- INICIALIZAR ---
    initGame();
});
