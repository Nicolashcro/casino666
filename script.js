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
    
    // **TU DIRECCIÓN EVM PARA RECIBIR PAGOS**
    const YOUR_GAME_RECEIVING_EVM_ADDRESS = "0x30b79919DcFf4E26A599eEA684e6Fde58A0b5Cf4"; 

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
        console.log("Iniciando Crypto Pets (MetaMask)...");
        updateDisplays();
        setInterval(rechargeEnergy, 1000);
        
        if (typeof window.ethereum !== 'undefined') {
            console.log('MetaMask (o compatible) detectado.');
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts && accounts.length > 0) {
                    await handleAccountsChanged(accounts);
                    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                    handleChainChanged(chainId); // No necesita await si solo actualiza UI sync
                } else {
                    updateWalletUI();
                }
            } catch (err) {
                console.warn("Error al obtener estado inicial de MetaMask:", err.message || err);
                updateWalletUI();
            }

            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged); // MetaMask recomienda recargar la página en chainChanged

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
        if (!walletInfoDiv || !connectMetaMaskBtn || !walletAddressPlaceholder || !walletTypeDisplay || !networkNameDisplay) return;

        if (currentAccount) {
            walletAddressPlaceholder.textContent = `${currentAccount.substring(0, 6)}...${currentAccount.substring(currentAccount.length - 4)}`;
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
                // handleAccountsChanged se llamará por el evento 'accountsChanged' si tiene éxito,
                // o podemos llamarlo directamente para asegurar la actualización.
                await handleAccountsChanged(accounts); 
            } catch (error) {
                if (error.code === 4001) { 
                    showUIMessage("Conexión a MetaMask rechazada.", "error");
                } else {
                    console.error("Error al conectar con MetaMask:", error);
                    showUIMessage("Error al conectar con MetaMask. Revisa la consola.", "error");
                }
            }
        } else {
            showUIMessage("MetaMask no está instalado.", "error");
            if(connectMetaMaskBtn) connectMetaMaskBtn.onclick = () => window.open('https://metamask.io/download/', '_blank');
        }
    }

    async function handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            console.log('MetaMask desconectado o sin cuentas autorizadas.');
            currentAccount = null;
        } else if (accounts[0] !== currentAccount) {
            currentAccount = accounts[0];
            console.log('Cuenta MetaMask conectada/cambiada:', currentAccount);
            showUIMessage(`Billetera Conectada: ${currentAccount.substring(0,6)}...`, "success");
        }
        // Siempre actualiza la cadena y la UI
        if (currentAccount && window.ethereum) {
            try {
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                handleChainChanged(chainId); // Esto llama a updateWalletUI
            } catch (error) {
                console.error("Error obteniendo chainId tras cambio de cuenta:", error);
                currentChainId = null;
                updateWalletUI();
            }
        } else {
            currentChainId = null; // No hay cuenta, no hay chainId
            updateWalletUI();
        }
        updateDisplays(); // Para habilitar/deshabilitar botones dependientes
    }

    function handleChainChanged(_chainId) {
        currentChainId = _chainId;
        const network = getNetworkName(_chainId);
        console.log('Red cambiada a:', network, `(ID: ${_chainId})`);
        showUIMessage(`Red cambiada a: ${network}`, "info");
        updateWalletUI();
    }

    function getNetworkName(chainIdHex) {
        if (!chainIdHex) return "N/A";
        const chainId = parseInt(String(chainIdHex), 16);
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
                showUIMessage("Desconectado. Conecta de nuevo si lo deseas.", "info");
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
                await connectMetaMaskWallet(); 
                return;
            }
            if (!YOUR_GAME_RECEIVING_EVM_ADDRESS || YOUR_GAME_RECEIVING_EVM_ADDRESS === "0x0000000000000000000000000000000000000000") {
                showUIMessage("La dirección de pago del juego no está configurada.", "error");
                console.error("CRÍTICO: YOUR_GAME_RECEIVING_EVM_ADDRESS no está configurada.");
                return;
            }

            const amountToPayETH_str = "0.001"; // ¡PARA TESTNET!
            const amountInWei = (BigInt(parseFloat(amountToPayETH_str) * 1e18)).toString(16);
            
            const transactionParameters = {
                to: YOUR_GAME_RECEIVING_EVM_ADDRESS,
                from: currentAccount,
                value: '0x' + amountInWei,
            };

            try {
                showUIMessage(`Solicitando ${amountToPayETH_str} ETH (Testnet)... Confirma en MetaMask.`, "info");
                
                const txHash = await window.ethereum.request({
                    method: 'eth_sendTransaction',
                    params: [transactionParameters],
                });
                
                console.log("Transacción enviada, Hash:", txHash);
                showUIMessage(`Tx enviada: ${txHash.substring(0,12)}... Esperando confirmación...`, "info");

                // **SIMULACIÓN DE ÉXITO Y VERIFICACIÓN DE BACKEND**
                setTimeout(() => {
                    petTokens += 1000; // Acreditar tokens del juego
                    updateDisplays();
                    showUIMessage("¡1000 PetTokens comprados! (Confirmación Blockchain Simulada)", "success");
                }, 20000); 

            } catch (error) {
                console.error("Error al enviar transacción:", error);
                if (error.code === 4001) { 
                    showUIMessage("Transacción rechazada por el usuario.", "error");
                } else if (error.message) {
                    showUIMessage(`Error de transacción.`, "error");
                } else {
                    showUIMessage("Error desconocido al enviar la transacción.", "error");
                }
            }
        });
    }
    
    // --- INICIALIZAR EL JUEGO ---
    initGame();
});
