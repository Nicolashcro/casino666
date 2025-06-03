document.addEventListener('DOMContentLoaded', () => {
    // --- Selectores del DOM ---
    const petTokensBalanceDisplay = document.getElementById('pet-tokens-balance');
    const connectWalletBtn = document.getElementById('connect-wallet-btn');
    const walletInfoDisplay = document.getElementById('wallet-info');
    const walletAddressDisplay = document.getElementById('wallet-address');
    const walletNetworkDisplay = document.getElementById('wallet-network');

    const petImageContainer = document.getElementById('pet-image-container');
    const petEvolutionLevelDisplay = document.getElementById('pet-evolution-level');
    // const petImage = document.getElementById('pet-image'); // Si usas <img> para la mascota

    const energyFill = document.getElementById('energy-fill');
    const energyValueDisplay = document.getElementById('energy-value');
    const energyMaxDisplay = document.getElementById('energy-max');

    const evolveButton = document.getElementById('evolve-button');
    const evolutionCostDisplay = document.getElementById('evolution-cost');
    const messagesDisplay = document.getElementById('messages');

    const tonConnectModal = document.getElementById('ton-connect-modal');
    const closeModalButton = document.querySelector('#ton-connect-modal .close-button');
    const walletOptionBtns = document.querySelectorAll('#ton-connect-modal .wallet-option-btn');
    const modalMessage = document.getElementById('modal-message');

    // --- Estado del Juego ---
    let petTokens = 0;
    let evolutionLevel = 0;
    let evolutionBaseCost = 10;
    let currentEvolutionCost = 10;

    let currentEnergy = 100;
    const maxEnergy = 100;
    const tapValue = 1; // PetTokens ganados por toque
    const energyCostPerTap = 5; // Energía gastada por toque
    const energyRechargeRate = 1; // Energía recuperada por segundo
    const energyRechargeInterval = 1000; // 1 segundo

    // --- Estado de Billetera TON (Simulado) ---
    let isWalletConnected_simulated = false;
    let simulatedTonAddress = "";
    let simulatedTonNetwork = "";

    // --- INICIALIZACIÓN DEL JUEGO ---
    function initGame() {
        updateDisplays();
        loadSimulatedWalletState(); // Cargar estado de billetera guardado
        setInterval(rechargeEnergy, energyRechargeInterval);

        // Activar pestaña por defecto (si tuvieras varias)
        // Por ahora, es una sola pantalla principal
        console.log("Crypto Pets - Tap & Evolve: Inicializado!");
    }

    // --- FUNCIONES DE ACTUALIZACIÓN DE UI ---
    function updateDisplays() {
        petTokensBalanceDisplay.textContent = Math.floor(petTokens);
        petEvolutionLevelDisplay.textContent = evolutionLevel;
        evolutionCostDisplay.textContent = Math.floor(currentEvolutionCost);
        energyValueDisplay.textContent = Math.floor(currentEnergy);
        energyMaxDisplay.textContent = maxEnergy;
        energyFill.style.width = `${(currentEnergy / maxEnergy) * 100}%`;

        // Actualizar imagen de mascota basada en evolutionLevel (aquí pondrías tu lógica de imágenes)
        // Por ejemplo: petImage.src = `pets/pet_level_${evolutionLevel}.png`;
        // O cambiar el contenido del placeholder:
        const petPlaceholders = ['🐾', '🐶', '🐱', '🦊', '🐻', '🐼', '🦁', '🦄', '🐲', '🌟'];
        document.getElementById('pet-placeholder').textContent = petPlaceholders[evolutionLevel % petPlaceholders.length];


        if (petTokens < currentEvolutionCost) {
            evolveButton.disabled = true;
        } else {
            evolveButton.disabled = false;
        }
    }

    function showMessage(text, type = "info") { // type puede ser "info", "error", "success"
        messagesDisplay.textContent = text;
        messagesDisplay.className = type; // Para aplicar estilos diferentes si quieres
        setTimeout(() => {
            messagesDisplay.textContent = "";
            messagesDisplay.className = "";
        }, 3000);
    }

    function showTapFeedback(value) {
        const feedback = document.createElement('div');
        feedback.classList.add('tap-value-feedback');
        feedback.textContent = `+${value}`;
        petImageContainer.appendChild(feedback); // Añadir al contenedor de la mascota
        setTimeout(() => {
            feedback.remove();
        }, 750); // Duración de la animación CSS
    }

    // --- LÓGICA DE "TAP TO EARN" ---
    if (petImageContainer) {
        petImageContainer.addEventListener('click', () => {
            if (currentEnergy >= energyCostPerTap) {
                currentEnergy -= energyCostPerTap;
                petTokens += tapValue;
                showTapFeedback(tapValue);
                updateDisplays();
                // Podrías añadir una animación al tocar la mascota aquí
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

    // --- LÓGICA DE EVOLUCIÓN ---
    if (evolveButton) {
        evolveButton.addEventListener('click', () => {
            if (petTokens >= currentEvolutionCost) {
                petTokens -= currentEvolutionCost;
                evolutionLevel++;
                // El costo aumenta un 20% para la siguiente evolución
                currentEvolutionCost *= 1.20; 
                // currentEvolutionCost = Math.ceil(currentEvolutionCost); // Redondear hacia arriba si quieres enteros

                showMessage(`¡Mascota evolucionada al Nivel ${evolutionLevel}!`, "success");
                updateDisplays();
                // Aquí podrías cambiar la imagen de la mascota
                // petImage.src = `path_to_new_evolution_image_${evolutionLevel}.png`;
            } else {
                showMessage("¡No tienes suficientes PetTokens para evolucionar!", "error");
            }
        });
    }

    // --- LÓGICA DE BILLETERA TON (SIMULADA) ---
    function updateSimulatedWalletUI() {
        if (isWalletConnected_simulated) {
            walletInfoDisplay.style.display = 'block';
            walletAddressDisplay.textContent = simulatedTonAddress.substring(0, 6) + "..." + simulatedTonAddress.substring(simulatedTonAddress.length - 4);
            walletNetworkDisplay.textContent = `(${simulatedTonNetwork})`;
            connectWalletBtn.textContent = "Desconectar";
            // Aquí, en una implementación real, obtendrías y mostrarías el saldo real de TON
        } else {
            walletInfoDisplay.style.display = 'none';
            walletAddressDisplay.textContent = "";
            walletNetworkDisplay.textContent = "";
            connectWalletBtn.textContent = "Conectar Billetera TON";
        }
    }

    function loadSimulatedWalletState() {
        const connected = localStorage.getItem('ton_wallet_sim_connected') === 'true';
        if (connected) {
            isWalletConnected_simulated = true;
            simulatedTonAddress = localStorage.getItem('ton_wallet_sim_address') || generateFakeSimulatedAddress();
            simulatedTonNetwork = localStorage.getItem('ton_wallet_sim_network') || "Testnet (Sim.)";
        }
        updateSimulatedWalletUI();
    }

    function saveSimulatedWalletState() {
        localStorage.setItem('ton_wallet_sim_connected', isWalletConnected_simulated);
        if (isWalletConnected_simulated) {
            localStorage.setItem('ton_wallet_sim_address', simulatedTonAddress);
            localStorage.setItem('ton_wallet_sim_network', simulatedTonNetwork);
        } else {
            localStorage.removeItem('ton_wallet_sim_address');
            localStorage.removeItem('ton_wallet_sim_network');
        }
    }
    
    function generateFakeSimulatedAddress() {
        return "EQ_SIM_" + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', () => {
            if (isWalletConnected_simulated) {
                // Simular desconexión
                isWalletConnected_simulated = false;
                showMessage("Billetera TON (Simulada) Desconectada", "info");
            } else {
                // Mostrar modal de conexión simulado
                tonConnectModal.style.display = 'flex';
                modalMessage.textContent = ""; // Limpiar mensajes anteriores del modal
            }
            saveSimulatedWalletState();
            updateSimulatedWalletUI();
        });
    }

    if (closeModalButton) {
        closeModalButton.addEventListener('click', () => {
            tonConnectModal.style.display = 'none';
        });
    }

    walletOptionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Simular conexión exitosa con la billetera seleccionada
            isWalletConnected_simulated = true;
            simulatedTonAddress = generateFakeSimulatedAddress(); // Nueva dirección simulada
            simulatedTonNetwork = btn.dataset.walletName.includes("Tonkeeper") ? "Mainnet (Sim.)" : "Testnet (Sim.)";
            
            modalMessage.textContent = `Conectado a ${btn.dataset.walletName}!`;
            modalMessage.style.color = "green";

            saveSimulatedWalletState();
            updateSimulatedWalletUI();

            setTimeout(() => {
                tonConnectModal.style.display = 'none';
            }, 1500); // Cerrar modal después de un momento
            
            // Aquí es donde, en una implementación real, recibirías `ConnectEventSuccess`
            // y manejarías el `payload` con `items` (como `TonAddressItemReply`), `device`, etc.
            // Basado en la documentación que proporcionaste, harías algo como:
            // const connectEventPayload = { items: [{ name: "ton_addr", address: simulatedTonAddress, network: "-3", publicKey: "...", walletStateInit: "..."}], device: { ... } };
            // handleConnectEvent(connectEventPayload);
            showMessage(`Billetera ${btn.dataset.walletName} conectada (Simulación).`, "success");
        });
    });

    // Cierra el modal si se hace clic fuera del contenido
    window.onclick = function(event) {
        if (event.target == tonConnectModal) {
            tonConnectModal.style.display = "none";
        }
    }

    // --- Inicializar Juego ---
    initGame();
});
