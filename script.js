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
    
    // **IMPORTANTE**: Reemplaza esta dirección con tu dirección EVM donde quieres recibir los pagos (Testnet primero)
    const YOUR_GAME_RECEIVING_EVM_ADDRESS = "0x0000000000000000000000000000000000000000"; // <-- ¡CAMBIA ESTO!

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

    // --- INICIALIZACIÓN DEL JUEGO Y METAMASK ---
    async function initGame() {
        updateDisplays(); // Actualiza UI del juego base
        setInterval(rechargeEnergy, 1000); // Inicia recarga de energía
        
        if (typeof window.ethereum !== 'undefined') {
            console.log('MetaMask (o compatible) detectado.');
            // Intentar obtener cuentas y chainId si ya está conectado y la dApp tiene permiso
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts && accounts.length > 0) {
                    handleAccountsChanged(accounts); // Esto actualiza currentAccount y UI
                    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                    handleChainChanged(chainId); // Esto actualiza currentChainId y UI
                } else {
                    updateWalletUI(); // Asegura que la UI muestre "desconectado"
                }
            } catch (err) {
                console.warn("Error al intentar obtener cuentas/chainId iniciales de MetaMask:", err.message);
                updateWalletUI(); // Estado desconectado en UI
            }

            // Configurar escuchadores para eventos de MetaMask
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

        } else {
            showUIMessage("MetaMask no detectado. Por favor, instala la extensión.", "error");
            if(connectMetaMaskBtn) {
                connectMetaMaskBtn.textContent = "Instalar MetaMask";
                connectMetaMaskBtn.onclick = () => window.open('https://metamask.io/download/', '_blank');
                // No deshabilitar, permitir que lleve a la página de descarga
            }
            if(buyTokensBtn) buyTokensBtn.disabled = true;
        }
        
        console.log("Crypto Pets - Juego Inicializado (MetaMask Real)");
    }

    // --- FUNCIONES DE ACTUALIZACIÓN DE UI ---
    function updateDisplays() {
        if(petTokensDisplay) petTokensDisplay.textContent = Math.floor(petTokens);
        if(petLevelDisplay) petLevelDisplay.textContent = petLevel;
        if(evolveCostDisplay) evolveCostDisplay.textContent = Math.floor(currentEvolveCost);
        if(energyValueDisplay) energyValueDisplay.textContent = Math.floor(currentEnergy);
        if(energyMaxDisplay) energyMaxDisplay.textContent = maxEnergy;
        if(energyFill) energyFill.style.width = `${(currentEnergy / maxEnergy) * 100}%`;

        const petEmojis = ['🐾', '🐶', '🐱', '🦊', '🐻', '🐼', '🦁', '🦄', '🐲', '🌟'];
        if(petPlaceholder) petPlaceholder.textContent = petEmojis[petLevel % petEmojis.length];
        
        if(evolveBtn) evolveBtn.disabled = petTokens < currentEvolveCost;
        if(buyTokensBtn) buyTokensBtn.disabled = !currentAccount;
    }

    function updateWalletUI() {
        if (!walletInfoDiv || !connectMetaMaskBtn || !walletAddressPlaceholder || !walletTypeDisplay || !networkNameDisplay) return;

        if (currentAccount) {
            walletAddressPlaceholder.textContent = `${currentAccount.substring(0, 6)}...${currentAccount.substring(currentAccount.length - 4)}`;
            walletAddressPlaceholder.setAttribute('data-tooltip', `Dirección: ${currentAccount}`);
            walletTypeDisplay.textContent = "MetaMask";
            networkNameDisplay.textContent = getNetworkName(currentChainId);
            walletInfoDiv.style.display = 'block';
            connectMetaMaskBtn.textContent = 'Desconectar'; // El usuario desconecta desde la extensión
        } else {
            walletInfoDiv.style.display = 'none';
            connectMetaMaskBtn.textContent = 'Conectar MetaMask';
            networkNameDisplay.textContent = 'Desconocida';
        }
        if(buyTokensBtn) buyTokensBtn.disabled = !currentAccount;
    }

    function showUIMessage(text, type = "info") {
        if (!messagesDisplay) return;
        messagesDisplay.textContent = text;
        messagesDisplay.className = `message-${type}`;
        setTimeout(() => { if(messagesDisplay) { messagesDisplay.textContent = ""; messagesDisplay.className = ""; }}, 5000);
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

    // --- LÓGICA DEL JUEGO "TAP TO EARN" Y EVOLUCIÓN ---
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

    // --- LÓGICA DE BILLETERA METAMASK ---
    async function connectMetaMaskWallet() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                handleAccountsChanged(accounts); // Esta función actualiza currentAccount y la UI
                
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                handleChainChanged(chainId); // Esto actualiza currentChainId y la UI
            } catch (error) {
                if (error.code === 4001) {
                    showUIMessage("Conexión rechazada por el usuario.", "error");
                } else {
                    console.error("Error al conectar con MetaMask:", error);
                    showUIMessage("Error al conectar. Revisa la consola.", "error");
                }
            }
        } else {
            showUIMessage("MetaMask no está instalado. Por favor, instala la extensión.", "error");
            if(connectMetaMaskBtn) connectMetaMaskBtn.onclick = () => window.open('https://metamask.io/download/', '_blank');
        }
    }

    function handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            console.log('MetaMask desconectado o ninguna cuenta autorizada.');
            currentAccount = null;
        } else if (accounts[0] !== currentAccount) {
            currentAccount = accounts[0];
            console.log('Cuenta MetaMask seleccionada:', currentAccount);
        }
        updateWalletUI();
        updateDisplays(); 
    }

    function handleChainChanged(_chainId) {
        currentChainId = _chainId;
        console.log('Red cambiada a:', _chainId, `(${getNetworkName(_chainId)})`);
        updateWalletUI();
    }

    function getNetworkName(chainIdHex) {
        if (!chainIdHex) return "N/A";
        const chainId = parseInt(chainIdHex, 16);
        switch (chainId) {
            case 1: return 'Ethereum Mainnet';
            case 5: return 'Goerli Testnet';
            case 11155111: return 'Sepolia Testnet';
            case 56: return 'BSC Mainnet';
            case 97: return 'BSC Testnet';
            case 137: return 'Polygon Mainnet';
            case 80001: return 'Polygon Mumbai';
            default: return `Red ID ${chainId}`;
        }
    }

    if (connectMetaMaskBtn) {
        connectMetaMaskBtn.addEventListener('click', () => {
            if (currentAccount) {
                // MetaMask no tiene un método de "desconexión" programático desde la dApp.
                // La dApp simplemente deja de usar la cuenta.
                // El usuario debe desconectar el sitio desde la extensión de MetaMask.
                currentAccount = null;
                currentChainId = null;
                showUIMessage("Desconectado. Para desconectar completamente, hazlo desde MetaMask.", "info");
                updateWalletUI();
                updateDisplays();
            } else {
                connectMetaMaskWallet();
            }
        });
    }
    
    // --- LÓGICA DE PAGO CON METAMASK ---
    if (buyTokensBtn) {
        buyTokensBtn.addEventListener('click', async () => {
            if (!currentAccount) {
                showUIMessage("Conecta tu billetera MetaMask primero.", "error");
                connectMetaMaskWallet();
                return;
            }
            if (!YOUR_GAME_RECEIVING_EVM_ADDRESS || YOUR_GAME_RECEIVING_EVM_ADDRESS === "TU_DIRECCION_EVM_PARA_RECIBIR_PAGOS_AQUI") {
                showUIMessage("La dirección de pago del juego no está configurada.", "error");
                console.error("CRÍTICO: YOUR_GAME_RECEIVING_EVM_ADDRESS no está configurada en script.js");
                return;
            }

            const amountToPayETH_str = "0.001"; // ¡MANTÉN ESTO PEQUEÑO PARA PRUEBAS EN TESTNET!
            const amountInWei_hex = '0x' + (parseFloat(amountToPayETH_str) * 1e18).toString(16);

            const transactionParameters = {
                to: YOUR_GAME_RECEIVING_EVM_ADDRESS,
                from: currentAccount,
                value: amountInWei_hex,
                // chainId: currentChainId, // Opcional: MetaMask usará la red activa.
                // Gas: MetaMask lo estimará, pero en producción podrías querer especificarlo.
            };

            try {
                showUIMessage(`Solicitando ${amountToPayETH_str} ETH (Testnet)... Confirma en MetaMask.`, "info");
                
                const txHash = await window.ethereum.request({
                    method: 'eth_sendTransaction',
                    params: [transactionParameters],
                });
                
                console.log("Transacción enviada, Hash:", txHash);
                showUIMessage(`Transacción enviada: ${txHash.substring(0,10)}... Esperando confirmación de la red.`, "info");

                // **AQUÍ NECESITAS UN BACKEND PARA VERIFICAR EL txHash EN LA BLOCKCHAIN**
                // Y LUEGO ACREDITAR LOS PETTOKENS DE FORMA SEGURA.
                // Para esta demo, simulamos éxito y acreditamos localmente:
                setTimeout(() => {
                    petTokens += 1000;
                    updateDisplays();
                    showUIMessage("¡1000 PetTokens comprados! (Confirmación Blockchain Simulada)", "success");
                }, 20000); // Simular 20 segundos de espera

            } catch (error) {
                console.error("Error al enviar transacción con MetaMask:", error);
                if (error.code === 4001) { // User rejected the request.
                    showUIMessage("Transacción rechazada por el usuario.", "error");
                } else if (error.message) {
                    showUIMessage(`Error de transacción: ${error.message.substring(0,50)}...`, "error");
                } else {
                    showUIMessage("Error desconocido al enviar la transacción.", "error");
                }
            }
        });
    }
    
    // --- INICIALIZAR EL JUEGO ---
    initGame();
});
