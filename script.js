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
    const mainGameArea = document.getElementById('main-game-area'); // Asegúrate que este ID exista en tu HTML para showTapFeedback
    
    // **TU DIRECCIÓN EVM PARA RECIBIR PAGOS**
    // Esta es la dirección donde los usuarios enviarán ETH para comprar PetTokens.
    // ¡ASEGÚRATE DE QUE ESTA ES UNA DIRECCIÓN QUE CONTROLES!
    const YOUR_GAME_RECEIVING_EVM_ADDRESS = "0x30b79919DcFf4E26A599eEA684e6Fde58A0b5Cf4"; 

    // La "public key de API MetaMask" que mencionaste (92f803c324f247b3a5dda6de1b61b74c)
    // no se utiliza directamente en el frontend para las interacciones cliente-MetaMask.
    // Si es para un servicio de backend (ej. Infura, Alchemy), se usaría allí, no aquí.

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
                    await handleAccountsChanged(accounts); // Usamos await para asegurar que la info de cuenta y red se cargue
                    // const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                    // handleChainChanged(chainId); // handleAccountsChanged ya obtiene y maneja el chainId
                } else {
                    updateWalletUI(); // No hay cuentas conectadas inicialmente
                }
            } catch (err) {
                console.warn("Error al obtener estado inicial de MetaMask:", err.message || err);
                updateWalletUI();
            }

            window.ethereum.on('accountsChanged', handleAccountsChanged);
            // MetaMask recomienda recargar la página en chainChanged para evitar estados inconsistentes.
            // Si prefieres no recargar, asegúrate de manejar todos los cambios de estado adecuadamente.
            window.ethereum.on('chainChanged', (_chainId) => {
                console.log("Red cambiada, recargando la página como recomienda MetaMask.");
                // handleChainChanged(_chainId); // Opcional si no recargas
                window.location.reload(); 
            });

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
        if(buyTokensBtn) buyTokensBtn.disabled = !currentAccount; // Habilitar/deshabilitar botón de compra
    }

    function updateWalletUI() {
        if (!walletInfoDiv || !connectMetaMaskBtn || !walletAddressPlaceholder || !walletTypeDisplay || !networkNameDisplay) return;

        if (currentAccount) {
            walletAddressPlaceholder.textContent = `${currentAccount.substring(0, 6)}...${currentAccount.substring(currentAccount.length - 4)}`;
            walletAddressPlaceholder.setAttribute('data-tooltip', `Dirección: ${currentAccount}`);
            walletTypeDisplay.textContent = "MetaMask"; // Podría ser más dinámico si soportas otras billeteras
            networkNameDisplay.textContent = getNetworkName(currentChainId);
            walletInfoDiv.style.display = 'block';
            connectMetaMaskBtn.textContent = 'Desconectar';
        } else {
            walletInfoDiv.style.display = 'none';
            connectMetaMaskBtn.textContent = 'Conectar MetaMask';
            networkNameDisplay.textContent = 'Desconocida';
        }
        if(buyTokensBtn) buyTokensBtn.disabled = !currentAccount; // También aquí por si acaso
    }

    function showUIMessage(text, type = "info") {
        if (!messagesDisplay) return;
        messagesDisplay.textContent = text;
        messagesDisplay.className = `message-${type}`; // Asume que tienes clases CSS .message-info, .message-error, .message-success
        setTimeout(() => { if(messagesDisplay) { messagesDisplay.textContent = ""; messagesDisplay.className = ""; }}, 5000);
    }

    function showTapFeedback(event) {
        // Corrección: usar mainGameArea que sí está definido
        if (!mainGameArea || !event) {
            // console.warn("mainGameArea no encontrado para showTapFeedback o evento no proveído");
            return;
        }
        const feedback = document.createElement('div');
        feedback.textContent = `+${tapValue}`;
        feedback.classList.add('tap-feedback');
        
        // Posicionamiento relativo al mainGameArea
        const gameAreaRect = mainGameArea.getBoundingClientRect();
        // Usar clientX/Y da la posición relativa al viewport.
        // Restamos el offset de gameAreaRect para hacerlo relativo a mainGameArea
        feedback.style.left = `${event.clientX - gameAreaRect.left - 10}px`; 
        feedback.style.top = `${event.clientY - gameAreaRect.top - 30}px`;  
        
        mainGameArea.appendChild(feedback);
        setTimeout(() => feedback.remove(), 950); // Duración de la animación
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
                currentEvolveCost = Math.floor(evolutionBaseCost * Math.pow(1.25, petLevel)); // Aumento un poco más el costo
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
                // El evento 'accountsChanged' debería manejar la actualización, 
                // pero llamamos a handleAccountsChanged directamente para asegurar la UI inmediata.
                await handleAccountsChanged(accounts); 
            } catch (error) {
                if (error.code === 4001) { // Código para "User rejected the request."
                    showUIMessage("Conexión a MetaMask rechazada.", "error");
                } else {
                    console.error("Error al conectar con MetaMask:", error);
                    showUIMessage("Error al conectar con MetaMask. Revisa la consola.", "error");
                }
            }
        } else {
            showUIMessage("MetaMask no está instalado. Por favor, instálalo.", "error");
            if(connectMetaMaskBtn) connectMetaMaskBtn.onclick = () => window.open('https://metamask.io/download/', '_blank');
        }
    }

    async function handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            console.log('MetaMask desconectado o sin cuentas autorizadas.');
            currentAccount = null;
            // currentChainId = null; // La cadena podría seguir siendo la misma, pero sin cuenta no es tan relevante
            showUIMessage("MetaMask desconectado.", "info");
        } else if (accounts[0] !== currentAccount) {
            currentAccount = accounts[0];
            console.log('Cuenta MetaMask conectada/cambiada:', currentAccount);
            showUIMessage(`Billetera Conectada: ${currentAccount.substring(0,6)}...`, "success");
        }

        // Siempre obtener chainId si hay una cuenta, ya que puede cambiar o ser la primera vez
        if (currentAccount && window.ethereum) {
            try {
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                handleChainChanged(chainId); // Esto llama a updateWalletUI
            } catch (error) {
                console.error("Error obteniendo chainId tras cambio de cuenta:", error);
                currentChainId = null; // Resetea si hay error
                updateWalletUI(); // Actualiza UI con chainId desconocido
            }
        } else {
             currentChainId = null; // No hay cuenta, no hay chainId relevante
             updateWalletUI(); // Asegura que la UI refleje la desconexión
        }
        updateDisplays(); // Para habilitar/deshabilitar botones de juego dependientes del estado de conexión
    }

    function handleChainChanged(_chainId) {
        if (currentChainId !== _chainId) {
            currentChainId = _chainId;
            const network = getNetworkName(_chainId);
            console.log('Red cambiada a:', network, `(ID: ${_chainId})`);
            showUIMessage(`Red cambiada a: ${network}`, "info");
        }
        updateWalletUI(); // Siempre actualiza la UI de la billetera con la info de red
    }

    function getNetworkName(chainIdHex) {
        if (!chainIdHex) return "N/A";
        const chainId = parseInt(String(chainIdHex), 16); // Convertir de Hex a decimal
        switch (chainId) {
            case 1: return 'Ethereum Mainnet';
            case 5: return 'Goerli Testnet'; // Deprecada, pero aún puede aparecer
            case 11155111: return 'Sepolia Testnet';
            case 56: return 'BSC Mainnet';
            case 97: return 'BSC Testnet';
            case 137: return 'Polygon Mainnet';
            case 80001: return 'Polygon Mumbai';
            case 42161: return 'Arbitrum One';
            case 10: return 'Optimism';
            default: return `Red ID ${chainId}`;
        }
    }

    if (connectMetaMaskBtn) {
        connectMetaMaskBtn.addEventListener('click', () => {
            if (currentAccount) {
                // Simular desconexión (MetaMask no tiene una API de "desconexión" programática explícita)
                // Simplemente borramos el estado local. El usuario tendría que desconectar desde la extensión.
                currentAccount = null;
                currentChainId = null; // Opcional: mantener el último chainId conocido
                showUIMessage("Desconectado. Conecta de nuevo si lo deseas.", "info");
                updateWalletUI();
                updateDisplays(); // Actualizar botones del juego
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
                await connectMetaMaskWallet(); // Intentar conectar si no lo está
                return; // Esperar a que el usuario conecte
            }
            if (!YOUR_GAME_RECEIVING_EVM_ADDRESS || YOUR_GAME_RECEIVING_EVM_ADDRESS === "0x0000000000000000000000000000000000000000") {
                showUIMessage("La dirección de pago del juego no está configurada.", "error");
                console.error("CRÍTICO: YOUR_GAME_RECEIVING_EVM_ADDRESS no está configurada en script.js.");
                return;
            }

            // TODO: Ajustar el precio y la cantidad de tokens según sea necesario.
            // Considera hacer esto configurable o dinámico.
            const amountToPayETH_str = "0.001"; // Ejemplo: 0.001 ETH (PARA TESTNET)
            const tokensToReceive = 1000;      // Ejemplo: 1000 PetTokens

            // Convertir ETH a Wei (la unidad más pequeña, como centavos para dólares)
            // 1 ETH = 10^18 Wei. Usar BigInt para evitar problemas de precisión con números grandes.
            let amountInWei;
            try {
                // Multiplicar como números grandes primero, luego convertir a BigInt
                const ethValue = parseFloat(amountToPayETH_str);
                if (isNaN(ethValue) || ethValue <= 0) {
                    showUIMessage("Monto de pago inválido.", "error");
                    return;
                }
                // Para evitar errores de redondeo con decimales, se puede multiplicar por 10^18 como string o manejarlo con cuidado
                // Una forma más segura:
                const [integerPart, decimalPart = ''] = amountToPayETH_str.split('.');
                const decimalWei = (decimalPart + '0'.repeat(18)).substring(0, 18);
                amountInWei = BigInt(integerPart + decimalWei);

            } catch (e) {
                console.error("Error al convertir ETH a Wei:", e);
                showUIMessage("Error al procesar el monto del pago.", "error");
                return;
            }
            
            const transactionParameters = {
                to: YOUR_GAME_RECEIVING_EVM_ADDRESS, // La dirección que recibe el pago.
                from: currentAccount,                 // La cuenta del usuario que paga.
                value: '0x' + amountInWei.toString(16), // El monto en Wei, en formato hexadecimal.
                // chainId: currentChainId, // Opcional: MetaMask infiere esto, pero puede ser explícito.
            };

            try {
                showUIMessage(`Enviando ${amountToPayETH_str} ETH (Testnet)... Confirma en MetaMask.`, "info");
                buyTokensBtn.disabled = true; // Deshabilitar botón durante el proceso
                
                const txHash = await window.ethereum.request({
                    method: 'eth_sendTransaction',
                    params: [transactionParameters],
                });
                
                console.log("Transacción enviada, Hash:", txHash);
                showUIMessage(`Tx enviada: ${txHash.substring(0,12)}... Esperando confirmación...`, "info");

                // **IMPORTANTE: SIMULACIÓN DE ÉXITO Y VERIFICACIÓN**
                // En un juego real, NO deberías acreditar tokens inmediatamente.
                // Deberías:
                // 1. (Ideal) Enviar txHash a tu backend. Tu backend verifica la tx en la blockchain.
                //    Cuando se confirma, el backend actualiza el saldo de tokens del usuario.
                // 2. (Frontend-only, menos seguro) Usar `eth_getTransactionReceipt` para esperar la confirmación.
                //    Esto es más complejo y vulnerable a manipulación del cliente.

                // Para este ejemplo, simularemos un éxito después de un tiempo.
                // ¡NO USAR ESTA SIMULACIÓN EN PRODUCCIÓN PARA BIENES REALES!
                // Este timeout es solo para fines de demostración.
                setTimeout(() => {
                    petTokens += tokensToReceive; // Acreditar tokens del juego
                    updateDisplays();
                    showUIMessage(`¡${tokensToReceive} PetTokens comprados! (Confirmación Blockchain Simulada para ${txHash.substring(0,12)}...)`, "success");
                    buyTokensBtn.disabled = !currentAccount; // Rehabilitar si la cuenta sigue conectada
                }, 20000); // Simular espera de 20 segundos para la "confirmación"

            } catch (error) {
                console.error("Error al enviar transacción:", error);
                if (error.code === 4001) { // User rejected the request
                    showUIMessage("Transacción rechazada por el usuario.", "error");
                } else if (error.message) {
                    // Intentar mostrar un mensaje de error más específico si está disponible
                    showUIMessage(`Error de transacción: ${error.message.substring(0, 100)}`, "error");
                } else {
                    showUIMessage("Error desconocido al enviar la transacción.", "error");
                }
                buyTokensBtn.disabled = !currentAccount; // Rehabilitar si la cuenta sigue conectada
            }
        });
    }
    
    // --- INICIALIZAR EL JUEGO ---
    initGame();
});
