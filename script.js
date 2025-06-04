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
        
    // **IMPORTANTE**: Reemplaza esta dirección con tu dirección EVM real donde quieres recibir los pagos de prueba (Testnet primero)
    const YOUR_GAME_RECEIVING_EVM_ADDRESS = "0x0000000000000000000000000000000000000000"; // <-- ¡CAMBIA ESTO A TU DIRECCIÓN DE TESTNET!

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
        console.log("Iniciando Crypto Pets (MetaMask)...");
        updateDisplays();
        setInterval(rechargeEnergy, 1000);
        
        if (typeof window.ethereum !== 'undefined') {
            console.log('MetaMask (o compatible) detectado.');
            
            // Intentar obtener cuentas si ya está conectado y la dApp tiene permiso
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts && accounts.length > 0) {
                    await handleAccountsChanged(accounts); // Esperar a que se resuelva
                } else {
                    updateWalletUI(); // UI en estado desconectado
                }
            } catch (err) {
                console.warn("Error al obtener cuentas iniciales:", err.message || err);
                updateWalletUI();
            }

            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged); // Recarga la página en cambio de red

        } else {
            showUIMessage("MetaMask no detectado. Por favor, instala MetaMask.", "error");
            if(connectMetaMaskBtn) {
                connectMetaMaskBtn.textContent = "Instalar MetaMask";
                connectMetaMaskBtn.onclick = () => window.open('https://metamask.io/download/', '_blank');
            }
            if(buyTokensBtn) buyTokensBtn.disabled = true;
        }
        console.log("Crypto Pets - Juego Inicializado.");
    }

    // --- FUNCIONES DE ACTUALIZACIÓN DE UI ---
    function updateDisplays() {
        if(petTokensDisplay) petTokensDisplay.textContent = String(Math.floor(petTokens));
        if(petLevelDisplay) petLevelDisplay.textContent = String(petLevel);
        if(evolveCostDisplay) evolveCostDisplay.textContent = String(Math.floor(currentEvolveCost));
        if(energyValueDisplay) energyValueDisplay.textContent = String(Math.floor(currentEnergy));
        if(energyMaxDisplay) energyMaxDisplay.textContent = String(maxEnergy);
        if(energyFill) energyFill.style.width = `${(currentEnergy / maxEnergy) * 100}%`;

        const petEmojis = ['🐾', '🐶', '🐱', '🦊', '🐻', '🐼', '🦁', '🦄', '🐲', '🌟'];
        if(petPlaceholder) petPlaceholder.textContent = petEmojis[petLevel % petEmojis.length];
        
        if(evolveBtn) evolveBtn.disabled = petTokens < currentEvolveCost;
        if(buyTokensBtn) buyTokensBtn.disabled = !currentAccount;
    }

    function updateWalletUI() {
        if (!walletInfoDiv || !connectMetaMaskBtn || !walletAddressPlaceholder || !walletTypeDisplay || !networkNameDisplay) {
             console.warn("Algunos elementos de UI de billetera no encontrados en el DOM.");
             return;
        }

        if (currentAccount) {
            walletAddressPlaceholder.textContent = `<span class="math-inline">\{currentAccount\.substring\(0, 6\)\}\.\.\.</span>{currentAccount.substring(currentAccount.length - 4)}`;
            walletAddressPlaceholder.setAttribute('data-tooltip', `Dirección: ${currentAccount}`);
            walletTypeDisplay.textContent = "MetaMask";
            networkNameDisplay.textContent = getNetworkName(currentChainId);
            walletInfoDiv.style.display = 'block';
            connectMetaMaskBtn.textContent = 'Desconectar';
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
                // handleAccountsChanged se llamará automáticamente por el listener si la cuenta cambia,
                // pero lo llamamos aquí para asegurar la actualización inmediata de la UI tras la conexión.
                await handleAccountsChanged(accounts); 
            } catch (error) {
                if (error.code === 4001) { // EIP-1193 userRejectedRequest error
                    showUIMessage("Conexión a MetaMask rechazada.", "error");
                } else {
                    console.error("Error al conectar con MetaMask:", error);
                    showUIMessage("Error al conectar con MetaMask.", "error");
                }
            }
        } else {
            showUIMessage("MetaMask no está instalado. Por favor, instala la extensión.", "error");
            if(connectMetaMaskBtn) connectMetaMaskBtn.onclick = () => window.open('https://metamask.io/download/', '_blank');
        }
    }

    async function handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            console.log('MetaMask desconectado o ninguna cuenta autorizada.');
            currentAccount = null;
        } else if (accounts[0] !== currentAccount) {
            currentAccount = accounts[0];
            console.log('Cuenta MetaMask cambiada/conectada:', currentAccount);
            // No mostrar mensaje aquí, ya que se muestra al conectar o se actualiza la UI
        }
        // Obtener Chain ID después de confirmar la cuenta
        if (currentAccount && window.ethereum) {
            try {
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                await handleChainChanged(chainId); // Esperar a que se procese el cambio de cadena
            } catch (error) {
                console.error("Error obteniendo chainId:", error);
                currentChainId = null; // Resetear si hay error
            }
        } else {
            currentChainId = null; // No hay cuenta, no hay chainId
        }
        updateWalletUI();
        updateDisplays(); 
    }

    async function handleChainChanged(_chainId) { // Ahora asíncrona si tiene operaciones async dentro
        currentChainId = _chainId;
        const network = getNetworkName(_chainId);
        console.log('Red cambiada a:', network, `(ID: ${_chainId})`);
        updateWalletUI(); // Esto actualizará el nombre de la red en la UI
    }


    function getNetworkName(chainIdHex) {
        if (!chainIdHex) return "N/A";
        const chainId = parseInt(String(chainIdHex), 16); // Asegurar que es string antes de parseInt
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
                currentAccount = null;
                currentChainId = null;
                showUIMessage("Desconectado. Para reconectar, presiona el botón.", "info");
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
                await connectMetaMaskWallet(); // Intentar conectar si no está conectado
                return;
            }
            if (!YOUR_GAME_RECEIVING_EVM_ADDRESS || YOUR_GAME_RECEIVING_EVM_ADDRESS === "0x0000000000000000000000000000000000000000" || YOUR_GAME_RECEIVING_EVM_ADDRESS === "TU_DIRECCION_EVM_PARA_RECIBIR_PAGOS_AQUI") {
                showUIMessage("La dirección de pago del juego no está configurada correctamente.", "error");
                console.error("CRÍTICO: YOUR_GAME_RECEIVING_EVM_ADDRESS no está configurada o es una dirección placeholder en script.js");
                return;
            }

            const amountToPayETH_str = "0.001"; // ¡MANTÉN ESTO PEQUEÑO PARA PRUEBAS EN TESTNET!
            const amountInWei = window.ethereum.networkVersion === '1' || window.ethereum.networkVersion === '56' || window.ethereum.networkVersion === '137' ? 
                                (BigInt(parseFloat(amountToPayETH_str) * 1e18)).toString(16) : // Mainnets
                                (BigInt(parseFloat(amountToPayETH_str) * 1e18)).toString(16); // Testnets (mismo cálculo de Wei)
            
            const transactionParameters = {
                to: YOUR_GAME_RECEIVING_EVM_ADDRESS,
