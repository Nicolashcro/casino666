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
