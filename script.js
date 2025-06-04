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
            walletAddressPlaceholder.textContent = `<span class="math-inline">\{currentAccount\.substring\(0, 6\)\}\.\.\.</span>{currentAccount.substring(currentAccount.length - 4)}`;
            walletAddressPlaceholder.setAttribute('data-tooltip', `Dirección: ${currentAccount}`);
            walletTypeDisplay.textContent = "MetaMask";
            networkNameDisplay.textContent = getNetworkName(currentChainId);
            walletInfoDiv.style.display = 'block';
            connectMetaMaskBtn.textContent = 'Desconectar';
        } else {
            walletInfoDiv.style.display = 'none';
            connectMetaMaskBtn.textContent = 'Conectar MetaMask';
