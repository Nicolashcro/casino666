document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM completamente cargado y parseado.");

    // --- Selectores del DOM ---
    // (Asegúrate que todos estos IDs existan en tu HTML)
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
    const mainGameArea = document.getElementById('main-game-area'); 
    
    const YOUR_GAME_RECEIVING_EVM_ADDRESS = "0x30b79919DcFf4E26A599eEA684e6Fde58A0b5Cf4"; 

    let petTokens = 0;
    let petLevel = 0;
    let evolutionBaseCost = 10;
    let currentEvolveCost = evolutionBaseCost;
    let currentEnergy = 100;
    const maxEnergy = 100;
    const tapValue = 1;
    const energyPerTap = 5;
    const energyRechargePerSecond = 1;

    let currentAccount = null;
    let currentChainId = null;

    async function initGame() {
        console.log("Iniciando Crypto Pets (MetaMask)...");
        updateDisplays();
        setInterval(rechargeEnergy, 1000);
        
        // Verificar MetaMask
        if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
            console.log('MetaMask detectado.');
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                console.log("Cuentas obtenidas de eth_accounts:", accounts);
                if (accounts && accounts.length > 0) {
                    await handleAccountsChanged(accounts); 
                } else {
                    console.log("No hay cuentas MetaMask conectadas inicialmente.");
                    updateWalletUI(); 
                }
            } catch (err) {
                console.error("Error al obtener estado inicial de MetaMask (eth_accounts):", err);
                updateWalletUI();
            }

            window.ethereum.on('accountsChanged', (accounts) => {
                console.log("Evento 'accountsChanged' detectado:", accounts);
                handleAccountsChanged(accounts);
            });
            window.ethereum.on('chainChanged', (_chainId) => {
                console.log("Evento 'chainChanged' detectado. Nueva chainId:", _chainId);
                window.location.reload(); 
            });

        } else {
            console.warn('MetaMask no detectado. `window.ethereum` es:', window.ethereum);
            showUIMessage("MetaMask no detectado. Por favor, instala MetaMask para jugar.", "error");
            if(connectMetaMaskBtn) {
                connectMetaMaskBtn.textContent = "Instalar MetaMask";
                connectMetaMaskBtn.onclick = () => window.open('https://metamask.io/download/', '_blank');
            }
            if(buyTokensBtn) buyTokensBtn.disabled = true;
        }
        console.log("Crypto Pets - Juego Inicializado.");
    }

    function updateDisplays() {
        // ... (código igual al anterior)
        if(petTokensDisplay) petTokensDisplay.textContent = String(Math.floor(petTokens));
        if(petLevelDisplay) petLevelDisplay.textContent = String(petLevel);
        if(evolveCostDisplay) evolveCostDisplay.textContent = String(Math.floor(currentEvolveCost));
        if(energyValueDisplay) energyValueDisplay.textContent = String(Math.floor(currentEnergy));
        if(energyMaxDisplay) energyMaxDisplay.textContent = String(maxEnergy);
        if(energyFill) energyFill.style.width = `${(currentEnergy / maxEnergy) * 100}%`;
        const petEmojis = ['🐾', '🥚', '🐣', '🐥', '🐔', '🦄', '🐲', '🌟', '👽', '🤖'];
        if(petPlaceholder) petPlaceholder.textContent = petEmojis[petLevel % petEmojis.length];
        if(evolveBtn) evolveBtn.disabled = petTokens < currentEvolveCost;
        if(buyTokensBtn) buyTokensBtn.disabled = !currentAccount; 
    }

    function updateWalletUI() {
        // ... (código igual al anterior)
        if (!walletInfoDiv || !connectMetaMaskBtn || !walletAddressPlaceholder || !walletTypeDisplay || !networkNameDisplay) {
            console.error("Algunos elementos de la UI de la billetera no se encontraron en el DOM.");
            return;
        }
        if (currentAccount) {
            walletAddressPlaceholder.textContent = `${currentAccount.substring(0, 6)}...${currentAccount.substring(currentAccount.length - 4)}`;
            walletAddressPlaceholder.setAttribute('data-tooltip', `Dirección: ${currentAccount}`);
            walletTypeDisplay.textContent = "MetaMask"; 
            networkNameDisplay.textContent = getNetworkName(currentChainId) || "Cargando red...";
            walletInfoDiv.style.display = 'block';
            connectMetaMaskBtn.textContent = 'Desconectar';
        } else {
            walletInfoDiv.style.display = 'none';
            connectMetaMaskBtn.textContent = 'Conectar MetaMask';
            networkNameDisplay.textContent = 'Desconocida';
        }
        if(buyTokensBtn) buyTokensBtn.disabled = !currentAccount; 
    }

    function showUIMessage(text, type = "info", duration = 5000) {
        // ... (código igual al anterior)
        if (!messagesDisplay) return;
        messagesDisplay.textContent = text;
        messagesDisplay.className = `message-${type}`; 
        setTimeout(() => { 
            if(messagesDisplay && messagesDisplay.textContent === text) {
                messagesDisplay.textContent = ""; 
                messagesDisplay.className = ""; 
            }
        }, duration);
    }
    
    function showTapFeedback(event) {
        // ... (código igual al anterior, asegúrate que mainGameArea y petImageContainer sean válidos)
        if (!mainGameArea || !event || !petImageContainer) {
             return;
        }
        const feedback = document.createElement('div');
        feedback.textContent = `+${tapValue}`;
        feedback.classList.add('tap-feedback');
        const petRect = petImageContainer.getBoundingClientRect(); 
        const mainRect = mainGameArea.getBoundingClientRect();
        feedback.style.left = `${petRect.left - mainRect.left + (petRect.width / 2) - 15}px`; 
        feedback.style.top = `${petRect.top - mainRect.top + (petRect.height / 2) - 30}px`;  
        mainGameArea.appendChild(feedback);
        setTimeout(() => feedback.remove(), 750);
    }

    function rechargeEnergy() {
        // ... (código igual al anterior)
        if (currentEnergy < maxEnergy) {
            currentEnergy = Math.min(maxEnergy, currentEnergy + energyRechargePerSecond);
            updateDisplays();
        }
    }

    if (petImageContainer) {
        petImageContainer.addEventListener('click', (event) => {
            // ... (código igual al anterior)
            if (currentEnergy >= energyPerTap) {
                currentEnergy -= energyPerTap;
                petTokens += tapValue;
                showTapFeedback(event);
                updateDisplays();
            } else {
                showUIMessage("¡Sin energía! Espera a que se recargue.", "error", 2000);
            }
        });
    }

    if (evolveBtn) {
        evolveBtn.addEventListener('click', () => {
            // ... (código igual al anterior)
             if (petTokens >= currentEvolveCost) {
                petTokens -= currentEvolveCost;
                petLevel++;
                currentEvolveCost = Math.floor(evolutionBaseCost * Math.pow(1.35, petLevel)); 
                updateDisplays();
                showUIMessage(`¡Mascota evolucionada al Nivel ${petLevel}! 🎉`, "success");
            } else {
                showUIMessage(`Necesitas ${Math.floor(currentEvolveCost)} PetTokens para evolucionar.`, "error");
            }
        });
    }

    async function connectMetaMaskWallet() {
        console.log("Intentando conectar con MetaMask (eth_requestAccounts)...");
        if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
            try {
                showUIMessage("Solicitando conexión a MetaMask...", "info", 3000);
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                console.log("Cuentas obtenidas de eth_requestAccounts:", accounts);
                // El evento 'accountsChanged' debería manejar la actualización si tiene éxito.
                // Si no hay evento, llamar a handleAccountsChanged(accounts) directamente aquí.
            } catch (error) {
                if (error.code === 4001) { 
                    console.warn("Conexión a MetaMask rechazada por el usuario.");
                    showUIMessage("Conexión a MetaMask rechazada.", "error");
                } else {
                    console.error("Error en eth_requestAccounts:", error);
                    showUIMessage("Error al conectar. Revisa la consola.", "error");
                }
            }
        } else {
            console.warn('MetaMask no disponible al intentar conectar explícitamente.');
            showUIMessage("MetaMask no está instalado o disponible.", "error");
        }
    }

    async function handleAccountsChanged(accounts) {
        console.log("handleAccountsChanged ejecutado con cuentas:", accounts);
        if (!Array.isArray(accounts)) {
            console.warn("handleAccountsChanged recibió algo que no es un array:", accounts);
            currentAccount = null; // Asegurar estado limpio
        } else if (accounts.length === 0) {
            console.log('MetaMask desconectado o sin cuentas autorizadas.');
            currentAccount = null;
            showUIMessage("MetaMask desconectado.", "info");
        } else if (accounts[0] !== currentAccount) {
            currentAccount = accounts[0];
            console.log('Cuenta MetaMask conectada/cambiada:', currentAccount);
            showUIMessage(`Billetera Conectada: ${currentAccount.substring(0,6)}...`, "success");
        } else {
            // La cuenta es la misma, no es necesario actualizar el mensaje de "conectado"
            // pero sí es bueno re-obtener la chainId por si acaso.
            console.log("La cuenta no cambió, pero se refrescará la información de red.");
        }

        if (currentAccount && window.ethereum) {
            try {
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                console.log("ChainId obtenida en handleAccountsChanged:", chainId);
                handleChainChanged(chainId); 
            } catch (error) {
                console.error("Error obteniendo chainId en handleAccountsChanged:", error);
                currentChainId = null; 
                updateWalletUI(); 
            }
        } else {
             currentChainId = null; 
             updateWalletUI(); 
        }
        updateDisplays(); 
    }

    function handleChainChanged(_chainId) {
        console.log("handleChainChanged ejecutado con chainId:", _chainId);
        if (currentChainId !== _chainId) { 
            currentChainId = _chainId;
            const network = getNetworkName(_chainId);
            console.log('Red detectada/cambiada a:', network, `(ID: ${_chainId})`);
            if (network && !network.includes("Desconocida")) { 
                 showUIMessage(`Conectado a la red: ${network}`, "info");
            }
        }
        updateWalletUI(); 
    }

    function getNetworkName(chainIdHex) {
        // ... (código igual al anterior)
        if (!chainIdHex) return null;
        try {
            const chainId = parseInt(String(chainIdHex), 16); 
            switch (chainId) {
                case 1: return 'Ethereum Mainnet';
                case 5: return 'Goerli Testnet (Obsoleta)'; 
                case 11155111: return 'Sepolia Testnet';
                case 56: return 'BNB Smart Chain (BSC) Mainnet';
                case 97: return 'BSC Testnet';
                case 137: return 'Polygon Mainnet';
                case 80001: return 'Polygon Mumbai Testnet';
                case 42161: return 'Arbitrum One';
                case 10: return 'OP Mainnet (Optimism)';
                default: return `Red Desconocida (ID: ${chainId})`;
            }
        } catch (e) {
            console.error("Error parseando chainIdHex:", chainIdHex, e);
            return "Error de Red";
        }
    }

    if (connectMetaMaskBtn) {
        connectMetaMaskBtn.addEventListener('click', () => {
            if (currentAccount) {
                currentAccount = null;
                showUIMessage("Desconectado localmente. Para desconectar completamente, usa la extensión MetaMask.", "info");
                updateWalletUI();
                updateDisplays(); 
            } else {
                connectMetaMaskWallet();
            }
        });
    }
    
    if (buyTokensBtn) {
        buyTokensBtn.addEventListener('click', async () => {
            // ... (lógica de compra igual a la anterior, con su `eth_sendTransaction`)
            if (!currentAccount) {
                showUIMessage("Conecta tu billetera MetaMask primero.", "error");
                return; 
            }
            if (!YOUR_GAME_RECEIVING_EVM_ADDRESS || YOUR_GAME_RECEIVING_EVM_ADDRESS === "0x0000000000000000000000000000000000000000") {
                showUIMessage("Error crítico: La dirección de pago del juego no está configurada.", "error");
                console.error("CRÍTICO: YOUR_GAME_RECEIVING_EVM_ADDRESS no está configurada.");
                return;
            }
            const amountToPayETH_str = "0.001"; 
            const tokensToReceive = 1000;     
            let amountInWei;
            try {
                const ethInFloat = parseFloat(amountToPayETH_str);
                if (isNaN(ethInFloat) || ethInFloat <= 0) {
                    showUIMessage("Monto de pago inválido.", "error"); return;
                }
                const parts = amountToPayETH_str.split('.');
                const integerPart = parts[0];
                const fractionalPart = parts[1] || '';
                const weiMultiplier = BigInt('1000000000000000000');
                amountInWei = BigInt(integerPart) * weiMultiplier + BigInt(fractionalPart.padEnd(18, '0'));
            } catch (e) {
                console.error("Error al convertir ETH a Wei:", e);
                showUIMessage("Error al procesar el monto del pago.", "error");
                return;
            }
            const transactionParameters = {
                to: YOUR_GAME_RECEIVING_EVM_ADDRESS, 
                from: currentAccount,                 
                value: '0x' + amountInWei.toString(16), 
            };
            try {
                showUIMessage(`Solicitando ${amountToPayETH_str} ETH... Confirma en MetaMask.`, "info", 10000);
                buyTokensBtn.disabled = true; 
                const txHash = await window.ethereum.request({
                    method: 'eth_sendTransaction',
                    params: [transactionParameters],
                });
                console.log("Transacción enviada, Hash:", txHash);
                showUIMessage(`Tx enviada: ${txHash.substring(0,10)}... Esperando confirmación (simulada)...`, "info", 20000);
                setTimeout(() => {
                    petTokens += tokensToReceive; 
                    updateDisplays();
                    showUIMessage(`¡${tokensToReceive} PetTokens comprados! (Confirmación simulada para ${txHash.substring(0,10)}...)`, "success");
                    buyTokensBtn.disabled = !currentAccount; 
                }, 15000); 
            } catch (error) {
                console.error("Error al enviar la transacción:", error);
                if (error.code === 4001) { 
                    showUIMessage("Transacción rechazada por el usuario.", "error");
                } else if (error.message) {
                    showUIMessage(`Error de transacción: ${error.message.substring(0, 80)}...`, "error");
                } else {
                    showUIMessage("Error desconocido al enviar la transacción.", "error");
                }
                buyTokensBtn.disabled = !currentAccount; 
            }
        });
    }
    
    // --- INICIALIZAR EL JUEGO ---
    // Llama a initGame solo una vez que todo el script se haya cargado y parseado.
    initGame(); 
});
