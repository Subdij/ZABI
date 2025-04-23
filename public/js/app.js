document.addEventListener('DOMContentLoaded', () => {
    // Récupération des éléments DOM
    const welcomeScreen = document.getElementById('welcome-screen');
    const playBtn = document.getElementById('play-btn');
    const playersInput = document.getElementById('players-input');
    const startBattleBtn = document.getElementById('start-battle');
    const player1NameInput = document.getElementById('player1-name');
    const player2NameInput = document.getElementById('player2-name');
    const player1Display = document.getElementById('player1-display');
    const player2Display = document.getElementById('player2-display');
    const battleContainer = document.getElementById('battle-container');
    
    // Éléments pour les barres de PV
    const hpBar1 = document.getElementById('hp-bar-1');
    const hpBar2 = document.getElementById('hp-bar-2');
    const hpText1 = document.getElementById('hp-text-1');
    const hpText2 = document.getElementById('hp-text-2');
    
    // Variables pour stocker les PV des joueurs
    const maxHP = 1000;
    let player1HP = maxHP;
    let player2HP = maxHP;

    // Variables pour stocker les noms des joueurs
    let player1Name = "";
    let player2Name = "";

    // Variables pour les rôles
    let player1Role = null; // 'Attaquant' ou 'Défenseur'
    let player2Role = null;

    // Compteur de tour
    let turnCounter = 1;
    //Faiblesses 
    const faiblesses = {
        "Intelligence": "Power",
        "Strength": "Intelligence",
        "Speed": "Durability",
        "Durability": "Strength",
        "Power": "Combat",
        "Combat": "Speed"
      };
    let degats_faiblesse=0;
    let degats_initiaux=0;
      
    // Liste des événements bonus/malus possibles
    const randomEvents = [
        {
            id: "colere-zeus",
            name: "La Colère de Zeus",
            description: "Zeus est furieux! Des éclairs frappent le terrain de combat!",
            type: "malus",
            rarity: "rare", // common, uncommon, rare, epic, legendary
            trigger: () => Math.random() < 0.10, // 10% de chance de déclenchement
            effect: (playerIndex) => {
                // Détermine si on affecte un joueur ou les deux
                const bothPlayers = Math.random() < 0.3; // 30% de chance d'affecter les deux
                const damage = Math.floor(maxHP * 0.15); // 15% des PV max
                
                let message = "";
                if (bothPlayers) {
                    dealDamage(1, damage);
                    dealDamage(2, damage);
                    message = `Zeus frappe les deux combattants! -${damage} PV pour chacun`;
                } else {
                    dealDamage(playerIndex, damage);
                    message = `Zeus frappe ${playerIndex === 1 ? player1Name : player2Name}! -${damage} PV`;
                }
                return {
                    icon: "⚡",
                    message: message,
                    color: "#FFD700"
                };
            }
        },
        {
            id: "benediction-heros",
            name: "La Bénédiction du Héros",
            description: "Une lumière divine régénère le combattant!",
            type: "bonus",
            rarity: "uncommon",
            trigger: () => Math.random() < 0.15, // 15% de chance
            effect: (playerIndex) => {
                const healAmount = Math.floor(maxHP * 0.1);
                
                // Récupération de PV
                if (playerIndex === 1) {
                    player1HP = Math.min(maxHP, player1HP + healAmount);
                } else {
                    player2HP = Math.min(maxHP, player2HP + healAmount);
                }
                
                updateHPBars();
                
                // Animation de soin
                const hpBar = playerIndex === 1 ? hpBar1 : hpBar2;
                hpBar.classList.add('heal-animation');
                setTimeout(() => {
                    hpBar.classList.remove('heal-animation');
                }, 1000);
                
                return {
                    icon: "✨",
                    message: `${playerIndex === 1 ? player1Name : player2Name} reçoit une bénédiction! +${healAmount} PV`,
                    color: "#7CFC00"
                };
            }
        },
        {
            id: "fureur-combattant",
            name: "Fureur du Combattant",
            description: "Une rage incontrôlable renforce les attaques!",
            type: "bonus",
            rarity: "uncommon",
            trigger: () => Math.random() < 0.15, // 15% de chance
            effect: (playerIndex) => {
                const hero = document.getElementById(`hero-info-${playerIndex}`);
                const boostSlot = document.getElementById(`boost-slot-${playerIndex}`);
                
                // Ajout de la classe de boost d'attaque
                hero.classList.add('attack-boosted');
                
                // Sauvegarder le boost pour le prochain tour
                if (!window.activeBoosts) window.activeBoosts = {};
                window.activeBoosts[`player${playerIndex}-attack`] = true;
                
                // Affichage du boost
                const boostMessage = document.createElement('div');
                boostMessage.className = 'boost-message';
                boostMessage.innerHTML = '<strong>ATTAQUE +50%</strong>';
                
                // Nettoyer les anciens messages
                boostSlot.innerHTML = '';
                boostSlot.appendChild(boostMessage);
                
                // Ajouter un timeout pour nettoyer après 2 tours
                setTimeout(() => {
                    if (boostSlot.contains(boostMessage)) {
                        boostSlot.removeChild(boostMessage);
                    }
                    delete window.activeBoosts[`player${playerIndex}-attack`];
                    hero.classList.remove('attack-boosted');
                }, 2 * 5000); // Supposant que chaque tour prend environ 5 secondes
                
                return {
                    icon: "🔥",
                    message: `${playerIndex === 1 ? player1Name : player2Name} entre en fureur! Attaque +50% pour 2 tours`,
                    color: "#FF4500"
                };
            }
        },
        {
            id: "bouclier-divin",
            name: "Bouclier Divin",
            description: "Une barrière protectrice renforce la défense!",
            type: "bonus",
            rarity: "uncommon",
            trigger: () => Math.random() < 0.12, // 12% de chance
            effect: (playerIndex) => {
                const hero = document.getElementById(`hero-info-${playerIndex}`);
                const boostSlot = document.getElementById(`boost-slot-${playerIndex}`);
                
                // Ajout de la classe de boost de défense
                hero.classList.add('defense-boosted');
                
                // Sauvegarder le boost pour le prochain tour
                if (!window.activeBoosts) window.activeBoosts = {};
                window.activeBoosts[`player${playerIndex}-defense`] = true;
                
                // Affichage du boost
                const boostMessage = document.createElement('div');
                boostMessage.className = 'boost-message';
                boostMessage.style.backgroundColor = "#4169E1";
                boostMessage.innerHTML = '<strong>DÉFENSE +50%</strong>';
                
                // Nettoyer les anciens messages
                boostSlot.innerHTML = '';
                boostSlot.appendChild(boostMessage);
                
                // Ajouter un timeout pour nettoyer après 2 tours
                setTimeout(() => {
                    if (boostSlot.contains(boostMessage)) {
                        boostSlot.removeChild(boostMessage);
                    }
                    delete window.activeBoosts[`player${playerIndex}-defense`];
                    hero.classList.remove('defense-boosted');
                }, 2 * 5000); // Supposant que chaque tour prend environ 5 secondes
                
                return {
                    icon: "🛡️",
                    message: `${playerIndex === 1 ? player1Name : player2Name} reçoit un bouclier divin! Défense +50% pour 2 tours`,
                    color: "#4169E1"
                };
            }
        },
        {
            id: "tremblement-terre",
            name: "Tremblement de Terre",
            description: "Le sol s'ouvre sous les pieds des combattants!",
            type: "malus",
            rarity: "rare",
            trigger: () => Math.random() < 0.08, // 8% de chance
            effect: (playerIndex) => {
                // Affecte toujours les deux joueurs
                const damage1 = Math.floor(maxHP * (0.05 + Math.random() * 0.05)); // 5-10% des PV max
                const damage2 = Math.floor(maxHP * (0.05 + Math.random() * 0.05)); // 5-10% des PV max
                
                dealDamage(1, damage1);
                dealDamage(2, damage2);
                
                // Secouer l'écran
                document.body.classList.add('screen-shake');
                setTimeout(() => {
                    document.body.classList.remove('screen-shake');
                }, 1000);
                
                return {
                    icon: "🌋",
                    message: `Un tremblement de terre secoue l'arène! ${player1Name} perd ${damage1} PV et ${player2Name} perd ${damage2} PV`,
                    color: "#8B4513"
                };
            }
        },
        {
            id: "pluie-cosmique",
            name: "Pluie Cosmique",
            description: "Une étrange pluie d'énergie tombe du ciel!",
            type: "mixed",
            rarity: "epic",
            trigger: () => Math.random() < 0.05, // 5% de chance
            effect: (playerIndex) => {
                // Effet aléatoire pour chaque joueur
                const effectP1 = Math.random() < 0.5; // true = bonus, false = malus
                const effectP2 = Math.random() < 0.5; // true = bonus, false = malus
                
                const valueP1 = Math.floor(maxHP * 0.12); // 12% des PV max
                const valueP2 = Math.floor(maxHP * 0.12); // 12% des PV max
                
                let message = "Une pluie cosmique mystérieuse tombe sur l'arène!<br>";
                
                if (effectP1) {
                    player1HP = Math.min(maxHP, player1HP + valueP1);
                    message += `${player1Name} se sent revitalisé! +${valueP1} PV<br>`;
                    
                    // Animation de soin
                    hpBar1.classList.add('heal-animation');
                    setTimeout(() => {
                        hpBar1.classList.remove('heal-animation');
                    }, 1000);
                } else {
                    dealDamage(1, valueP1);
                    message += `${player1Name} est bombardé d'énergie négative! -${valueP1} PV<br>`;
                }
                
                if (effectP2) {
                    player2HP = Math.min(maxHP, player2HP + valueP2);
                    message += `${player2Name} se sent revitalisé! +${valueP2} PV`;
                    
                    // Animation de soin
                    hpBar2.classList.add('heal-animation');
                    setTimeout(() => {
                        hpBar2.classList.remove('heal-animation');
                    }, 1000);
                } else {
                    dealDamage(2, valueP2);
                    message += `${player2Name} est bombardé d'énergie négative! -${valueP2} PV`;
                }
                
                updateHPBars();
                
                return {
                    icon: "☄️",
                    message: message,
                    color: "#9370DB"
                };
            }
        }
    ];

    // Fonction pour tenter de déclencher un événement aléatoire
    function tryTriggerRandomEvent(currentTurn) {
        // Pas d'événement avant le 2e tour pour laisser les joueurs s'installer
        if (currentTurn < 2) return null;
        
        // Chance de base de 25% d'avoir un événement
        if (Math.random() > 0.25) return null;
        
        // Filtrer les événements qui peuvent se déclencher selon leur propre probabilité
        const possibleEvents = randomEvents.filter(event => event.trigger());
        
        if (possibleEvents.length === 0) return null;
        
        // Choisir un événement aléatoire parmi ceux qui peuvent se déclencher
        const selectedEvent = possibleEvents[Math.floor(Math.random() * possibleEvents.length)];
        
        // Déterminer quel joueur est affecté (ou les deux dans certains cas)
        const targetPlayer = Math.random() < 0.5 ? 1 : 2;
        
        // Déclencher l'effet et récupérer le message
        const eventResult = selectedEvent.effect(targetPlayer);
        
        // Vérifier que le résultat est au format attendu
        if (!eventResult || !eventResult.message) {
            console.error("L'événement n'a pas généré de résultat valide:", selectedEvent.id);
            return null;
        }
        
        return {
            event: selectedEvent,
            result: eventResult
        };
    }

    // Ajouter du CSS pour l'animation de tremblement
    const shakeCSS = document.createElement('style');
    shakeCSS.textContent = `
        @keyframes screen-shake {
            0% { transform: translate(0, 0); }
            10% { transform: translate(-5px, -5px); }
            20% { transform: translate(5px, 5px); }
            30% { transform: translate(-5px, 5px); }
            40% { transform: translate(5px, -5px); }
            50% { transform: translate(-5px, -5px); }
            60% { transform: translate(5px, 5px); }
            70% { transform: translate(-5px, 5px); }
            80% { transform: translate(5px, -5px); }
            90% { transform: translate(-5px, -5px); }
            100% { transform: translate(0, 0); }
        }
        
        .screen-shake {
            animation: screen-shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        
        .attack-boosted {
            outline: 2px solid #ff4500;
            box-shadow: 0 0 15px #ff4500;
        }
        
        .defense-boosted {
            outline: 2px solid #4169e1;
            box-shadow: 0 0 15px #4169e1;
        }
    `;
    document.head.appendChild(shakeCSS);

    // Mettre à jour le CSS d'animation
    const eventCSS = document.createElement('style');
    eventCSS.textContent = `
        .random-event {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.8);
            background: rgba(0, 0, 0, 0.9);
            border: 3px solid;
            border-radius: 10px;
            padding: 25px 40px;
            z-index: 1000;
            text-align: center;
            opacity: 0;
            transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            min-width: 350px;
            max-width: 90%;
            box-shadow: 0 0 30px rgba(255, 255, 255, 0.2);
            font-family: var(--font-pixel);
        }

        .random-event.show {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }

        .random-event.bonus {
            border-color: #4caf50;
            box-shadow: 0 0 30px rgba(76, 175, 80, 0.5);
        }

        .random-event.malus {
            border-color: #f44336;
            box-shadow: 0 0 30px rgba(244, 67, 54, 0.5);
        }
        
        .random-event-header {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .random-event-icon {
            font-size: 32px;
        }
        
        .random-event-message {
            font-size: 16px;
            line-height: 1.5;
        }
    `;

    document.head.appendChild(eventCSS);

    // Fonction pour afficher un événement aléatoire
    function displayRandomEvent(eventResult) {
        if (!eventResult) return;
        
        const { event, result } = eventResult;
        
        // Vérification plus stricte des propriétés requises
        if (!event || !result || typeof result !== 'object') {
            console.error("Données d'événement incomplètes:", eventResult);
            return;
        }
        
        // Définir des valeurs par défaut explicites pour chaque propriété
        const eventName = (event && event.name) ? event.name : "Événement mystérieux";
        const eventIcon = (result && result.icon) ? result.icon : "⚠️";
        const eventMessage = (result && result.message) ? result.message : "Un événement mystérieux s'est produit...";
        const eventColor = (result && result.color) ? result.color : "#FFCC00";
        const eventType = (event && event.type) ? event.type : "mixed";
        
        // Créer l'élément d'événement avec un HTML complet et valide
        const eventElement = document.createElement('div');
        eventElement.className = `random-event ${eventType}`;
        eventElement.style.borderColor = eventColor;
        eventElement.style.boxShadow = `0 0 30px ${eventColor}`;
        
        // Contenu de l'événement avec un formatage explicite
        eventElement.innerHTML = `
            <div class="random-event-header" style="color: ${eventColor}">
                <span class="random-event-icon">${eventIcon}</span>
                <span class="event-title">${eventName}</span>
            </div>
            <div class="random-event-message">${eventMessage}</div>
        `;
        
        // Ajouter à la page
        document.body.appendChild(eventElement);
        
        // Forcer un repaint avant d'ajouter la classe show
        void eventElement.offsetWidth;
        
        // Activer immédiatement la transition
        eventElement.classList.add('show');
        
        // Supprimer après l'animation
        setTimeout(() => {
            eventElement.classList.remove('show');
            
            // Attendre que la transition de sortie soit terminée avant de supprimer
            setTimeout(() => {
                if (document.body.contains(eventElement)) {
                    document.body.removeChild(eventElement);
                }
            }, 500);
            
        }, 4000); // Durée d'affichage légèrement plus longue
        
        // Ajouter à l'historique avec un format clair
        const historyMessage = `
            <div class="history-special-event">
                <span class="history-event-title">
                    <span class="history-event-icon">${eventIcon}</span>
                    ÉVÉNEMENT SPÉCIAL: ${eventName}
                </span>
                ${eventMessage}
            </div>
        `;
        addToHistory(historyMessage);
    }

    // Création de l'élément pour le compteur de tour
    const turnCounterDisplay = document.createElement('div');
    turnCounterDisplay.id = 'turn-counter';
    turnCounterDisplay.textContent = `Tour : ${turnCounter}`;
    turnCounterDisplay.style.textAlign = 'center';
    turnCounterDisplay.style.fontSize = '24px';
    turnCounterDisplay.style.fontWeight = 'bold';
    turnCounterDisplay.style.marginBottom = '20px';
    turnCounterDisplay.style.display = 'none'; // Masquer par défaut
    battleContainer.insertAdjacentElement('beforebegin', turnCounterDisplay);

    // Ensemble pour stocker les IDs déjà utilisés dans la session actuelle
    const usedIds = new Set();
    // Ensemble pour stocker les IDs invalides récupérés de la base de données
    const invalidIds = new Set();

    // Cache d'images pour les superhéros
    const imageCache = new Map();

    // Correspondance entre caractéristiques et images d'icônes
    const statImages = {
        'intelligence': 'intelligence.png',
        'strength': 'strength.png',
        'speed': 'speed.png',
        'durability': 'durability.png',
        'power': 'power.png',
        'combat': 'combat.png'
    };

    // Charger les IDs invalides au démarrage
    loadInvalidIds();

    // Fonction pour charger les IDs invalides depuis le serveur
    async function loadInvalidIds() {
        try {
            const response = await fetch('/api/InvalidID');
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            const ids = await response.json();
            ids.forEach(id => invalidIds.add(Number(id)));
        } catch (error) {
            console.error('Erreur lors du chargement des IDs invalides:', error);
        }
    }

    // Fonction pour générer un ID aléatoire valide
    function getRandomId() {
        if (usedIds.size > 700 - invalidIds.size) {
            usedIds.clear();
        }

        let id;
        let attempts = 0;
        const maxAttempts = 1000;

        do {
            id = Math.floor(Math.random() * 731) + 1;
            attempts++;

            if (attempts > maxAttempts) {
                return null;
            }
        } while (usedIds.has(id) || invalidIds.has(id));

        usedIds.add(id);
        return id;
    }

    // Fonction simplifiée pour récupérer un superhéros
    async function fetchHero() {
        const id = getRandomId();

        if (id === null) {
            return null;
        }

        try {
            const response = await fetch(`/api/SuperHeros/${id}`);
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            return null;
        }
    }

    // Fonction pour précharger l'image d'un superhéros
    function preloadHeroImage(hero) {
        if (!hero || !hero.slug || imageCache.has(hero.slug)) return;

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                imageCache.set(hero.slug, img.src);
                resolve(img);
            };
            img.onerror = (err) => {
                imageCache.set(hero.slug, '/img/hero-default.png');
                reject(err);
            };
            img.src = `https://cdn.jsdelivr.net/gh/rtomczak/superhero-api@0.3.0/api/images/sm/${hero.slug}.jpg`;
        });
    }

    // Précharger les icônes de statistiques au chargement de la page
    function preloadStatIcons() {
        Object.values(statImages).forEach(icon => {
            const img = new Image();
            img.src = `/img/${icon}`;
        });
        const defaultImg = new Image();
        defaultImg.src = '/img/default.png';
    }

    preloadStatIcons();

    // Fonction avec retry pour garantir l'obtention d'un superhéros
    async function fetchHeroWithRetry(maxAttempts = 5) {
        let hero = null;
        let attempts = 0;

        while (!hero && attempts < maxAttempts) {
            attempts++;
            hero = await fetchHero();
        }

        if (hero) {
            preloadHeroImage(hero).catch(() => {});
        }

        return hero;
    }

    // Fonction pour afficher les informations d'un héros dans une zone spécifique
    function displayHeroInBattle(hero, index, updateStatsOnly = false) {
        const heroName = document.getElementById(`hero-name-${index}`);
        const heroImage = document.getElementById(`hero-image-${index}`);
        const powerstats = document.getElementById(`powerstats-${index}`);
        const attackContainer = document.getElementById(`attack-container-${index}`);
        const defenseContainer = document.getElementById(`defense-container-${index}`);

        if (!hero) {
            heroName.textContent = "Erreur de chargement";
            return;
        }
        
        // Stocker les stats originales si elles n'existent pas déjà
        if (!hero.originalStats && hero.powerstats) {
            hero.originalStats = JSON.parse(JSON.stringify(hero.powerstats));
        }
        
        // Calculer la moyenne des stats pour l'afficher avec le nom
        const avgStats = calculateAverageStats(hero);
        
        // Mise à jour du titre avec le nom du héros et sa moyenne de stats
        heroName.innerHTML = `${hero.name} <span class="hero-avg-stats">Puissance totale: ${avgStats} pts</span>`;
        
        // Si on met à jour uniquement les stats, on ne refait pas toute l'affichage
        if (!updateStatsOnly) {
            heroImage.src = '/img/loading.gif';
            
            if (imageCache.has(hero.slug)) {
                heroImage.src = imageCache.get(hero.slug);
            } else {
                preloadHeroImage(hero)
                    .then(() => {
                        heroImage.src = imageCache.get(hero.slug);
                    })
                    .catch(() => {
                        heroImage.src = '/img/hero-default.png';
                    });
            }
            
            // Vider les conteneurs
            powerstats.innerHTML = '';
            attackContainer.innerHTML = '';
            defenseContainer.innerHTML = ''; 

            // Charger et afficher les attaques
            fetchAttacks().then(attacks => {
                const select = document.createElement('select');
                select.id = `attack-select-${index}`;
                select.className = 'attack-select';

                attacks.forEach(attack => {
                    const option = document.createElement('option');
                    option.value = attack.name;
                    option.textContent = `${attack.name} (${attack.pouvoir}, Modificateur: ${attack.modificateur})`;
                    select.appendChild(option);
                });

                attackContainer.appendChild(select);
            });

            // Charger et afficher les défenses
            fetchDefenses().then(defenses => {
                const select = document.createElement('select');
                select.id = `defense-select-${index}`;
                select.className = 'defense-select';

                defenses.forEach(defense => {
                    const option = document.createElement('option');
                    option.value = defense.name;
                    option.textContent = `${defense.name} (${defense.pouvoir}, Modificateur: ${defense.modificateur})`;
                    select.appendChild(option);
                });

                defenseContainer.appendChild(select);
            });
        } else {
            // Si on met à jour uniquement les stats, vider seulement le conteneur des stats
            powerstats.innerHTML = '';
        }

        // Ajouter les caractéristiques (toujours mis à jour)
        if (hero.powerstats) {
            Object.entries(hero.powerstats).forEach(([key, value]) => {
                const statItem = document.createElement('div');
                statItem.className = 'stat-item';

                const iconImg = document.createElement('img');
                iconImg.src = `/img/${statImages[key] || 'default.png'}`;
                iconImg.alt = key.charAt(0).toUpperCase() + key.slice(1);
                iconImg.classList.add('stat-icon-img');
                statItem.appendChild(iconImg);

                const statName = document.createElement('span');
                statName.className = 'stat-name';
                statName.textContent = `${key.charAt(0).toUpperCase() + key.slice(1)}: `;

                const statValue = document.createElement('span');
                
                // Vérifier si la stat a été améliorée
                if (hero.originalStats && parseInt(hero.originalStats[key]) < parseInt(value)) {
                    const originalValue = parseInt(hero.originalStats[key]);
                    const boostedValue = parseInt(value);
                    const boostAmount = boostedValue - originalValue;
                    
                    statValue.innerHTML = `${originalValue} <span class="boosted-stat">(+${boostAmount})</span>`;
                } else {
                    statValue.textContent = value;
                }

                statItem.appendChild(statName);
                statItem.appendChild(statValue);
                powerstats.appendChild(statItem);
            });
        }
    }

    // Fonction pour charger les attaques depuis l'API
    async function fetchAttacks() {
        try {
            const response = await fetch('/api/attaques');
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Erreur lors du chargement des attaques:', error);
            return [];
        }
    }

    // Fonction pour charger les défenses depuis l'API
    async function fetchDefenses() {
        try {
            const response = await fetch('/api/defenses');
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Erreur lors du chargement des défenses:', error);
            return [];
        }
    }

    // Fonction pour mettre à jour l'affichage des barres de PV
    function updateHPBars() {
        const p1Percentage = (player1HP / maxHP) * 100;
        const p2Percentage = (player2HP / maxHP) * 100;
        
        // Mise à jour des barres
        hpBar1.style.width = `${p1Percentage}%`;
        hpBar2.style.width = `${p2Percentage}%`;
        
        // Mise à jour des textes
        hpText1.textContent = `${player1HP} / ${maxHP} PV`;
        hpText2.textContent = `${player2HP} / ${maxHP} PV`;
        
        // Changement de couleur si PV bas
        if (p1Percentage < 25) {
            hpBar1.style.background = 'linear-gradient(90deg, #e63946 0%, #ff6b6b 100%)';
        } else if (p1Percentage < 50) {
            hpBar1.style.background = 'linear-gradient(90deg, #ff9500 0%, #ffcc00 100%)';
        }
        
        if (p2Percentage < 25) {
            hpBar2.style.background = 'linear-gradient(90deg, #e63946 0%, #ff6b6b 100%)';
        } else if (p2Percentage < 50) {
            hpBar2.style.background = 'linear-gradient(90deg, #ff9500 0%, #ffcc00 100%)';
        }
    }
    function calculerDegats(baseDegats, typeAttaque, typeDefense) {
        // Si la défense est faible contre l’attaque
        if (faiblesses[typeDefense] === typeAttaque) {
            degats_faiblesse = 20;
          return baseDegats + 20;
        }
      
        // Si l’attaque est faible contre la défense
        if (faiblesses[typeAttaque] === typeDefense) {
            degats_faiblesse = -20;
          return baseDegats - 20;
          
        }
        // Sinon dégâts normaux
        return baseDegats;
      }
    // Fonction pour infliger des dégâts à un joueur
    function dealDamage(player, damage) {
        const hpBar = player === 1 ? hpBar1 : hpBar2;
        


        // Animation de dégât
        hpBar.classList.add('damage-animation');
        setTimeout(() => {
            hpBar.classList.remove('damage-animation');
        }, 500);
        
        // Mise à jour des PV
        if (player === 1) {
            player1HP = Math.max(0, player1HP - damage);
        } else {
            player2HP = Math.max(0, player2HP - damage);
        }
        
        updateHPBars();
        
        // Vérifier si un joueur est KO
        if (player1HP <= 0) {
            const popup = document.getElementById('victory-popup');
            const message = document.getElementById('victory-message');
            message.textContent = `Victoire de ${player2Name} !`;
            popup.classList.add('show');


        } else if (player2HP <= 0) {
            const popup = document.getElementById('victory-popup');
            const message = document.getElementById('victory-message');
            message.textContent = `Victoire de ${player1Name} !`;
            popup.classList.add('show');

        }
        return damage;
    }

    // Fonction pour calculer la moyenne des stats d'un héros
    function calculateAverageStats(hero) {
        if (!hero || !hero.powerstats) return 0;
        
        let total = 0;
        let count = 0;
        
        for (const [key, value] of Object.entries(hero.powerstats)) {
            total += parseInt(value) || 0;
            count++;
        }
        
        return count > 0 ? Math.round(total / count) : 0;
    }
    
    // Fonction pour analyser l'équilibre du combat
    function analyzeMatchup(hero1, hero2) {
        // Supprime tout panneau existant pour éviter les doublons
        const existingPanel = document.querySelector('.matchup-info');
        if (existingPanel) {
            document.body.removeChild(existingPanel);
        }
        
        const avgStats1 = calculateAverageStats(hero1);
        const avgStats2 = calculateAverageStats(hero2);
        
        // Afficher les moyennes
        const matchupElement = document.createElement('div');
        matchupElement.className = 'matchup-info';
        
        // Ajout d'une icône et d'un titre amélioré
        matchupElement.innerHTML = `
            <div class="matchup-header">
                <span class="matchup-icon">⚖️</span>
                <h2>Analyse du Combat</h2>
            </div>
            <div class="stats-comparison">
                <div class="player-avg player-avg-1">
                    <span class="player-name">${player1Name}</span>
                    <div class="stat-value">${avgStats1}</div>
                    <div class="stat-label">Points moyens</div>
                </div>
                <div class="matchup-vs">VS</div>
                <div class="player-avg player-avg-2">
                    <span class="player-name">${player2Name}</span>
                    <div class="stat-value">${avgStats2}</div>
                    <div class="stat-label">Points moyens</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(matchupElement);
        
        // Calcul de la différence
        const diff = Math.abs(avgStats1 - avgStats2);
        const diffPercentage = Math.round((diff / Math.max(avgStats1, avgStats2)) * 100);
        
        let balanceStatus = '';
        let weakerPlayer = null;
        let weakerHero = null;
        let strongerHero = null;
        
        // Déterminer le joueur le plus faible
        if (avgStats1 < avgStats2) {
            weakerPlayer = 1;
            weakerHero = hero1;
            strongerHero = hero2;
        } else {
            weakerPlayer = 2;
            weakerHero = hero2;
            strongerHero = hero1;
        }
        
        // Définir le statut d'équilibre
        if (diffPercentage < 10) {
            balanceStatus = 'équilibré';
        } else if (diffPercentage < 25) {
            balanceStatus = 'légèrement déséquilibré';
            // Ajouter le power-up de soin
            addHealingPowerUp(weakerPlayer);
        } else {
            balanceStatus = 'fortement déséquilibré';
            // Ajouter le power-up de soin et booster les stats
            addHealingPowerUp(weakerPlayer);
            boostStats(weakerPlayer, weakerHero, strongerHero, diffPercentage);
        }
        
        // Ajouter le statut au message avec une icône
        const statusIcon = diffPercentage < 10 ? '✅' : diffPercentage < 25 ? '⚠️' : '🔥';
        const statusElement = document.createElement('div');
        statusElement.className = `match-status match-status-${balanceStatus.replace(/\s+/g, '-')}`;
        statusElement.innerHTML = `${statusIcon} Ce combat est <strong>${balanceStatus}</strong>!`;
        matchupElement.appendChild(statusElement);
        
        // Supprimer le message après 5 secondes
        const timeoutId = setTimeout(() => {
            // Vérifier si l'élément existe encore avant de le supprimer
            if (document.body.contains(matchupElement)) {
                document.body.removeChild(matchupElement);
            }
        }, 3000);
        
        // Stocker l'ID du timeout sur l'élément pour pouvoir l'annuler si nécessaire
        matchupElement.dataset.timeoutId = timeoutId;
    }
    
    // Fonction pour ajouter un power-up de soin
    function addHealingPowerUp(playerIndex) {
        const existingButton = document.getElementById(`heal-powerup-${playerIndex}`);
        if (existingButton) {
            existingButton.remove();
        }
    
        const powerupSlot = document.getElementById(`powerup-slot-${playerIndex}`);
        const healButton = document.createElement('button');
        healButton.id = `heal-powerup-${playerIndex}`;
        healButton.className = 'heal-powerup-btn';
        healButton.innerHTML = '💖 SOIN D\'URGENCE <span class="heal-info">(utilisable une fois)</span>';
        healButton.setAttribute('data-used', 'false');
    
        healButton.addEventListener('click', () => {
            if (healButton.getAttribute('data-used') === 'false') {
                const currentHP = playerIndex === 1 ? player1HP : player2HP;
                const healAmount = Math.floor(maxHP * 0.3 * (1 - currentHP / maxHP));
    
                if (playerIndex === 1) {
                    player1HP = Math.min(maxHP, player1HP + healAmount);
                } else {
                    player2HP = Math.min(maxHP, player2HP + healAmount);
                }
    
                updateHPBars();
                healButton.setAttribute('data-used', 'true');
                healButton.disabled = true;
                healButton.innerHTML = '✓ SOIN UTILISÉ';
                healButton.classList.add('used');
    
                const hpBar = playerIndex === 1 ? hpBar1 : hpBar2;
                hpBar.classList.add('heal-animation');
                setTimeout(() => {
                    hpBar.classList.remove('heal-animation');
                }, 1000);
    
                const healMessage = document.createElement('div');
                healMessage.className = 'heal-message';
                healMessage.textContent = `Soin de ${healAmount} PV appliqué!`;
    
                powerupSlot.appendChild(healMessage);
    
                setTimeout(() => {
                    if (powerupSlot.contains(healMessage)) {
                        powerupSlot.removeChild(healMessage);
                    }
                }, 3000);
            }
        });
    
        powerupSlot.innerHTML = '';
        powerupSlot.appendChild(healButton);
    }
    

    // Fonction pour booster les stats d'un joueur
    function boostStats(playerIndex, weakerHero, strongerHero, diffPercentage) {
        // Calculer le facteur de boost en fonction de la différence (max 50%)
        const boostFactor = Math.min(0.5, diffPercentage / 100);
        
        // S'assurer que les stats originales sont sauvegardées
        if (!weakerHero.originalStats && weakerHero.powerstats) {
            weakerHero.originalStats = JSON.parse(JSON.stringify(weakerHero.powerstats));
        }
        
        // Appliquer le boost à chaque statistique
        Object.keys(weakerHero.powerstats).forEach(stat => {
            const strongerStat = parseInt(strongerHero.powerstats[stat]) || 0;
            const weakerStat = parseInt(weakerHero.originalStats[stat]) || 0;
            
            // Ne pas dépasser la valeur du joueur plus fort
            weakerHero.powerstats[stat] = Math.min(
                strongerStat,
                Math.round(weakerStat + (strongerStat - weakerStat) * boostFactor)
            );
        });
        
        // Afficher un message de boost
        const powerupContainer = document.getElementById(`hero-info-${playerIndex}`);
        
        // Supprimer tout message existant pour éviter les doublons
        const boostSlot = document.getElementById(`boost-slot-${playerIndex}`);
boostSlot.innerHTML = ''; // reset
const boostMessage = document.createElement('div');
boostMessage.className = 'boost-message';
boostMessage.innerHTML = '<strong>STATS BOOSTÉES</strong>';
boostSlot.appendChild(boostMessage);

        
        // Mettre à jour UNIQUEMENT l'affichage des statistiques sans recréer les sélecteurs
        displayHeroInBattle(weakerHero, playerIndex, true);
        
        // Recalculer et mettre à jour la moyenne des stats dans le titre (car elle a changé après le boost)
        const heroName = document.getElementById(`hero-name-${playerIndex}`);
        const avgStats = calculateAverageStats(weakerHero);
        heroName.innerHTML = `${weakerHero.name} <span class="hero-avg-stats">Puissance totale: ${avgStats} pts</span>`;
    }
    
    // Fonction pour attribuer les rôles aléatoirement
    function assignRoles() {
        if (Math.random() > 0.5) {
            player1Role = 'Attaquant';
            player2Role = 'Défenseur';
        } else {
            player1Role = 'Défenseur';
            player2Role = 'Attaquant';
        }
        updateRoleDisplay();
    }

    // Fonction pour mettre à jour l'affichage en fonction des rôles
    function updateRoleDisplay() {
        // Titres des joueurs
        player1Display.textContent = `${player1Name} - ${player1Role}`;
        player2Display.textContent = `${player2Name} - ${player2Role}`;
    
        // Blocs complets
        const attackBlock1 = document.querySelector('#hero-info-1 .attack-block');
        const defenseBlock1 = document.querySelector('#hero-info-1 .defense-block');
        const attackBlock2 = document.querySelector('#hero-info-2 .attack-block');
        const defenseBlock2 = document.querySelector('#hero-info-2 .defense-block');
    
        if (player1Role === 'Attaquant') {
            attackBlock1.style.display = 'block';
            defenseBlock1.style.display = 'none';
            attackBlock2.style.display = 'none';
            defenseBlock2.style.display = 'block';
        } else {
            attackBlock1.style.display = 'none';
            defenseBlock1.style.display = 'block';
            attackBlock2.style.display = 'block';
            defenseBlock2.style.display = 'none';
        }
    }
    

    // Étape 1: Clic sur le bouton Play
    playBtn.addEventListener('click', () => {
        welcomeScreen.style.display = 'none';
        playersInput.style.display = 'block';
    });

    // Étape 2: Confirmation des pseudos et début du combat
    startBattleBtn.addEventListener('click', async () => {
        player1Name = player1NameInput.value.trim() || "Joueur 1";
        player2Name = player2NameInput.value.trim() || "Joueur 2";
        
        // Réinitialiser les PV
        player1HP = maxHP;
        player2HP = maxHP;
        updateHPBars();

        playersInput.style.display = 'none';

        player1Display.textContent = player1Name;
        player2Display.textContent = player2Name;

        document.getElementById('hero-name-1').textContent = 'Chargement...';
        document.getElementById('hero-name-2').textContent = 'Chargement...';
        document.getElementById('powerstats-1').innerHTML = '';
        document.getElementById('powerstats-2').innerHTML = '';

        battleContainer.style.display = 'flex';

        const [fetchedHero1, fetchedHero2] = await Promise.all([
            fetchHeroWithRetry(),
            fetchHeroWithRetry()
        ]);
        
        // Stocker les références globales aux héros
        hero1 = fetchedHero1;
        hero2 = fetchedHero2;

        displayHeroInBattle(hero1, 1);
        displayHeroInBattle(hero2, 2);
        
        // Analyser l'équilibre du combat
        analyzeMatchup(hero1, hero2);

        assignRoles(); // Attribuer les rôles au début du combat
        preloadNextHeroes(5);

        // Afficher le bouton "Changer de rôle" et le compteur de tour une fois le combat commencé
        roleSwitchBtn.style.display = 'block';
        turnCounterDisplay.style.display = 'block';

        // Afficher le bouton "Historique" une fois le combat commencé
        historyBtn.style.display = 'block';
    });

    // Bouton pour changer de rôle
    const roleSwitchBtn = document.createElement('button');
    roleSwitchBtn.textContent = 'Valider';
    roleSwitchBtn.className = 'btn-primary role-switch-btn';
    roleSwitchBtn.style.display = 'none'; // Masquer le bouton par défaut
    battleContainer.insertAdjacentElement('afterend', roleSwitchBtn);

    // Tableau pour stocker l'historique des messages
    const combatHistory = [];

    // Ajouter un message à l'historique avec le numéro du tour
    function addToHistory(message) {
        combatHistory.push({
            turn: turnCounter,
            message: message
        });
    }

    // Bouton et modal pour l'historique
    const historyBtn = document.getElementById('history-btn');
    const historyModal = document.getElementById('history-modal');
    const closeModal = document.getElementById('close-modal');
    const historyContent = document.getElementById('history-content');

    // Afficher l'historique dans la fenêtre modale avec des séparateurs
    historyBtn.addEventListener('click', () => {
        // Inverser l'ordre des tours pour afficher le dernier en haut
        historyContent.innerHTML = combatHistory
            .slice() // Crée une copie du tableau pour ne pas modifier l'original
            .reverse() // Inverse l'ordre des éléments
            .map(entry => `
                <div class="history-event">
                    <div class="history-turn">Tour ${entry.turn} :</div>
                    <div class="history-message">${entry.message}</div>
                </div>
            `)
            .join('<hr class="history-separator">');
        historyModal.style.display = 'block';
    });

    // Fermer la fenêtre modale
    closeModal.addEventListener('click', () => {
        historyModal.style.display = 'none';
    });

    // Fermer la fenêtre modale en cliquant à l'extérieur
    window.addEventListener('click', (event) => {
        if (event.target === historyModal) {
            historyModal.style.display = 'none';
        }
    });

    // Gestion du clic sur le bouton de changement de rôle
    roleSwitchBtn.addEventListener('click', async () => {
        // Récupérer l'attaque et la défense sélectionnées
        const attaquant = player1Role === 'Attaquant' ? 1 : 2;
        const defenseur = attaquant === 1 ? 2 : 1;
        
        const attackSelect = document.getElementById(`attack-select-${attaquant}`);
        const defenseSelect = document.getElementById(`defense-select-${defenseur}`);
        
        // Récupérer les données complètes des attaques et défenses
        const [attaques, defenses] = await Promise.all([
            fetchAttacks(),
            fetchDefenses()
        ]);
        
        const attaqueChoisie = attaques.find(a => a.name === attackSelect.value);
        const defenseChoisie = defenses.find(d => d.name === defenseSelect.value);
        
        // Récupérer les héros
        const heroAttaquant = document.getElementById(`powerstats-${attaquant}`);
        const heroDefenseur = document.getElementById(`powerstats-${defenseur}`);
        
        // Récupérer les valeurs des stats en utilisant une fonction utilitaire
        const getStatValue = (container, statName) => {
            const statElements = container.querySelectorAll('.stat-item');
            for (const element of statElements) {
                const nameElement = element.querySelector('.stat-name');
                if (nameElement && nameElement.textContent.toLowerCase().includes(statName.toLowerCase())) {
                    const valueElement = element.querySelector('span:last-child');
                    
                    // Vérifier si la stat est boostée (contient des parenthèses)
                    if (valueElement.innerHTML.includes('(+')) {
                        // Extraire la valeur originale et la valeur de boost
                        const originalValue = parseInt(valueElement.textContent.split('(')[0].trim());
                        // Extraire le nombre entre (+) dans le HTML
                        const boostMatch = valueElement.innerHTML.match(/\(\+(\d+)\)/);
                        const boostValue = boostMatch ? parseInt(boostMatch[1]) : 0;
                        
                        // Retourner la somme des deux valeurs
                        return originalValue + boostValue;
                    } else {
                        // Cas standard, sans boost
                        return parseInt(valueElement.textContent);
                    }
                }
            }
            return 0;
        };
        
        // Calculer les dégâts
        const valeurAttaque = getStatValue(heroAttaquant, attaqueChoisie.pouvoir) * attaqueChoisie.modificateur;
        const valeurDefense = getStatValue(heroDefenseur, defenseChoisie.pouvoir) * defenseChoisie.modificateur;
        degats_faiblesse=0;
        // Appliquer les bonus actifs aux calculs de dégâts
        const applyActiveBoosts = (playerIndex, value, type) => {
            if (!window.activeBoosts) return value;
            
            if (type === 'attack' && window.activeBoosts[`player${playerIndex}-attack`]) {
                return Math.floor(value * 1.5); // +50% d'attaque
            } else if (type === 'defense' && window.activeBoosts[`player${playerIndex}-defense`]) {
                return Math.floor(value * 1.5); // +50% de défense
            }
            
            return value;
        };

        const valeurAttaqueBoostee = applyActiveBoosts(attaquant, valeurAttaque, 'attack');
        const valeurDefenseBoostee = applyActiveBoosts(defenseur, valeurDefense, 'defense');

        // Calculer les dégâts finaux
        let degats = Math.max(0, Math.floor(valeurAttaqueBoostee - valeurDefenseBoostee));
        degats_initiaux=degats;
        // Calculer les dégâts finaux avec faiblesse
        degats = calculerDegats(degats, attaqueChoisie.pouvoir, defenseChoisie.pouvoir);
        dealDamage(defenseur, degats);
        
        // Ajouter le message au tableau d'historique
        const message = `
            <strong>${attaquant === 1 ? player1Name : player2Name}</strong> utilise ${attaqueChoisie.name} (${Math.floor(valeurAttaqueBoostee)} pts)
            <br>
            <strong>${defenseur === 1 ? player1Name : player2Name}</strong> se défend avec ${defenseChoisie.name} (${Math.floor(valeurDefenseBoostee)} pts)
            ${degats_faiblesse !== 0 ? `
                <br> Dégâts initiaux : ${degats_initiaux} <br>
                Dégâts de faiblesse : ${degats_faiblesse > 0 ? '+' : ''}${degats_faiblesse}` : ''}
            <br>
            Dégâts infligés : ${degats}
        `;
        addToHistory(message);
        
        // Ajouter un message de combat
        const combatMessage = document.createElement('div');
        combatMessage.className = 'combat-message';
        combatMessage.innerHTML = `
            <strong>${attaquant === 1 ? player1Name : player2Name}</strong> utilise ${attaqueChoisie.name} (${Math.floor(valeurAttaqueBoostee)} pts)
            <br>
            <strong>${defenseur === 1 ? player1Name : player2Name}</strong> se défend avec ${defenseChoisie.name} (${Math.floor(valeurDefenseBoostee)} pts)
            
            
            ${degats_faiblesse !== 0 ? `
                <br> Dégâts initiaux : ${degats_initiaux} <br>
                Dégâts de faiblesse : ${degats_faiblesse > 0 ? '+' : ''}${degats_faiblesse}` : ''}
            <br>
            Dégâts infligés : ${degats}
            
        `;
        battleContainer.insertAdjacentElement('beforeend', combatMessage);
        
        // Supprimer le message après 3 secondes
        setTimeout(() => {
            if (battleContainer.contains(combatMessage)) {
                battleContainer.removeChild(combatMessage);
            }
        }, 3000);

        // Tenter de déclencher un événement aléatoire
        const randomEvent = tryTriggerRandomEvent(turnCounter);
        if (randomEvent) {
            // Attendre un moment pour que le message de combat soit visible avant
            setTimeout(() => {
                displayRandomEvent(randomEvent);
            }, 1000);
        }

        // Inverser les rôles
        [player1Role, player2Role] = [player2Role, player1Role];
        updateRoleDisplay();

        // Incrémenter le compteur de tour
        turnCounter++;
        turnCounterDisplay.textContent = `Tour : ${turnCounter}`;
        
        // Vérifier les effets temporaires à la fin de chaque tour
        checkTemporaryEffects();
    });

    async function preloadNextHeroes(count = 3) {
        for (let i = 0; i < count; i++) {
            setTimeout(async () => {
                try {
                    const hero = await fetchHero();
                    if (hero) {
                        preloadHeroImage(hero);
                    }
                } catch (err) {}
            }, i * 300);
        }
    }

    // Variables pour stocker les références aux héros
    let hero1 = null;
    let hero2 = null;

    // Variables pour les effets temporaires
    let activeEffects = {
        player1: [],
        player2: []
    };

    // Système d'événements aléatoires
    function setupRandomEvents() {
        return [
            // Malus
            {
                id: "colere-zeus",
                name: "La Colère de Zeus",
                type: "malus",
                description: "Zeus lance sa foudre sur le champ de bataille!",
                probability: 0.10, // 10% de chance
                execute: () => {
                    document.body.classList.add('lightning-effect');
                    setTimeout(() => document.body.classList.remove('lightning-effect'), 1000);
                    
                    // Choisir une cible aléatoire (1, 2 ou les deux)
                    const target = Math.floor(Math.random() * 3);
                    const damage = Math.floor(maxHP * 0.15); // 15% des PV max
                    
                    if (target === 0 || target === 2) { // Joueur 1 ou les deux
                        player1HP = Math.max(0, player1HP - damage);
                        displayEventEffect(1, `a perdu ${damage} PV à cause de la foudre!`);
                    }
                    
                    if (target === 1 || target === 2) { // Joueur 2 ou les deux
                        player2HP = Math.max(0, player2HP - damage);
                        displayEventEffect(2, `a perdu ${damage} PV à cause de la foudre!`);
                    }
                    
                    updateHPBars();
                    return `La foudre de Zeus frappe le champ de bataille!`;
                }
            },
            {
                id: "tremblement-terre",
                name: "Tremblement de Terre",
                type: "malus",
                description: "Le sol tremble, déséquilibrant les combattants!",
                probability: 0.08,
                execute: () => {
                    battleContainer.classList.add('earthquake-effect');
                    setTimeout(() => battleContainer.classList.remove('earthquake-effect'), 800);
                    
                    // Les deux joueurs perdent une partie de leurs PV
                    const damage = Math.floor(maxHP * 0.1); // 10% des PV max
                    player1HP = Math.max(0, player1HP - damage);
                    player2HP = Math.max(0, player2HP - damage);
                    
                    displayEventEffect(1, `a perdu ${damage} PV à cause du séisme!`);
                    displayEventEffect(2, `a perdu ${damage} PV à cause du séisme!`);
                    
                    updateHPBars();
                    return `Un violent tremblement de terre secoue les combattants!`;
                }
            },
            {
                id: "fatigue-extreme",
                name: "Fatigue Extrême",
                type: "malus",
                description: "Un des combattants s'épuise soudainement!",
                probability: 0.07,
                execute: () => {
                    // Choisir une cible aléatoire
                    const target = Math.floor(Math.random() * 2);
                    
                    if (target === 0) {
                        // Appliquer un effet de débuff temporaire au joueur 1
                        applyTemporaryStatEffect(1, "tous", 0.7, 2);
                        displayEventEffect(1, `subit une fatigue extrême! Toutes ses statistiques sont réduites.`);
                        return `${player1Name} s'effondre de fatigue, affaiblissant temporairement ses capacités!`;
                    } else {
                        // Appliquer un effet de débuff temporaire au joueur 2
                        applyTemporaryStatEffect(2, "tous", 0.7, 2);
                        displayEventEffect(2, `subit une fatigue extrême! Toutes ses statistiques sont réduites.`);
                        return `${player2Name} s'effondre de fatigue, affaiblissant temporairement ses capacités!`;
                    }
                }
            },
            
            // Bonus
            {
                id: "benediction-apollon",
                name: "Bénédiction d'Apollon",
                type: "bonus",
                description: "Apollon guérit les blessures d'un combattant!",
                probability: 0.09,
                execute: () => {
                    // Choisir une cible aléatoire
                    const target = Math.floor(Math.random() * 2);
                    const healAmount = Math.floor(maxHP * 0.2); // 20% des PV max
                    
                    if (target === 0) {
                        player1HP = Math.min(maxHP, player1HP + healAmount);
                        displayEventEffect(1, `récupère ${healAmount} PV grâce à Apollon!`, true);
                        
                        const hpBar = document.getElementById('hp-bar-1');
                        hpBar.classList.add('heal-animation');
                        setTimeout(() => hpBar.classList.remove('heal-animation'), 1000);
                        
                        updateHPBars();
                        return `${player1Name} reçoit la bénédiction guérisseuse d'Apollon!`;
                    } else {
                        player2HP = Math.min(maxHP, player2HP + healAmount);
                        displayEventEffect(2, `récupère ${healAmount} PV grâce à Apollon!`, true);
                        
                        const hpBar = document.getElementById('hp-bar-2');
                        hpBar.classList.add('heal-animation');
                        setTimeout(() => hpBar.classList.remove('heal-animation'), 1000);
                        
                        updateHPBars();
                        return `${player2Name} reçoit la bénédiction guérisseuse d'Apollon!`;
                    }
                }
            },
            {
                id: "force-hercule",
                name: "La Force d'Hercule",
                type: "bonus",
                description: "Un des combattants est envahi par la force d'Hercule!",
                probability: 0.09,
                execute: () => {
                    // Choisir une cible aléatoire
                    const target = Math.floor(Math.random() * 2);
                    
                    if (target === 0) {
                        // Appliquer un effet de buff temporaire au joueur 1
                        applyTemporaryStatEffect(1, "strength", 1.7, 2);
                        displayEventEffect(1, `sent la puissance d'Hercule couler dans ses veines!`, true);
                        return `${player1Name} reçoit la force légendaire d'Hercule!`;
                    } else {
                        // Appliquer un effet de buff temporaire au joueur 2
                        applyTemporaryStatEffect(2, "strength", 1.7, 2);
                        displayEventEffect(2, `sent la puissance d'Hercule couler dans ses veines!`, true);
                        return `${player2Name} reçoit la force légendaire d'Hercule!`;
                    }
                }
            },
            {
                id: "sagesse-athena",
                name: "La Sagesse d'Athéna",
                type: "bonus",
                description: "Athéna partage sa sagesse avec un combattant!",
                probability: 0.07,
                execute: () => {
                    // Choisir une cible aléatoire
                    const target = Math.floor(Math.random() * 2);
                    
                    if (target === 0) {
                        // Appliquer un effet de buff temporaire au joueur 1
                        applyTemporaryStatEffect(1, "intelligence", 1.6, 2);
                        displayEventEffect(1, `reçoit la sagesse d'Athéna!`, true);
                        return `${player1Name} est illuminé par la sagesse d'Athéna!`;
                    } else {
                        // Appliquer un effet de buff temporaire au joueur 2
                        applyTemporaryStatEffect(2, "intelligence", 1.6, 2);
                        displayEventEffect(2, `reçoit la sagesse d'Athéna!`, true);
                        return `${player2Name} est illuminé par la sagesse d'Athéna!`;
                    }
                }
            },
            {
                id: "pluie-meteores",
                name: "Pluie de Météores",
                type: "malus",
                description: "Des météores s'abattent sur le champ de bataille!",
                probability: 0.06,
                execute: () => {
                    // Impact aléatoire sur les deux joueurs
                    const damage1 = Math.floor(maxHP * (0.05 + Math.random() * 0.15)); // 5-20%
                    const damage2 = Math.floor(maxHP * (0.05 + Math.random() * 0.15)); // 5-20%
                    
                    player1HP = Math.max(0, player1HP - damage1);
                    player2HP = Math.max(0, player2HP - damage2);
                    
                    displayEventEffect(1, `a perdu ${damage1} PV à cause des météores!`);
                    displayEventEffect(2, `a perdu ${damage2} PV à cause des météores!`);
                    
                    updateHPBars();
                    return `Une pluie de météores s'abat sur le champ de bataille!`;
                }
            },
            {
                id: "armure-hades",
                name: "L'Armure d'Hadès",
                type: "bonus",
                description: "Hadès offre son armure des enfers à un combattant!",
                probability: 0.07,
                execute: () => {
                    // Choisir une cible aléatoire
                    const target = Math.floor(Math.random() * 2);
                    
                    if (target === 0) {
                        // Appliquer un effet de buff temporaire au joueur 1
                        applyTemporaryStatEffect(1, "durability", 1.8, 2);
                        displayEventEffect(1, `est protégé par l'armure des enfers!`, true);
                        return `${player1Name} est enveloppé par l'armure sombre d'Hadès!`;
                    } else {
                        // Appliquer un effet de buff temporaire au joueur 2
                        applyTemporaryStatEffect(2, "durability", 1.8, 2);
                        displayEventEffect(2, `est protégé par l'armure des enfers!`, true);
                        return `${player2Name} est enveloppé par l'armure sombre d'Hadès!`;
                    }
                }
            },
            {
                id: "brouillard-mystique",
                name: "Brouillard Mystique",
                type: "malus",
                description: "Un épais brouillard enveloppe le champ de bataille!",
                probability: 0.06,
                execute: () => {
                    // Réduire l'efficacité des attaques pour les deux joueurs
                    applyTemporaryStatEffect(1, "intelligence", 0.75, 1);
                    applyTemporaryStatEffect(2, "intelligence", 0.75, 1);
                    
                    displayEventEffect(1, `a du mal à voir son adversaire!`);
                    displayEventEffect(2, `a du mal à voir son adversaire!`);
                    
                    return `Un brouillard mystique enveloppe l'arène, réduisant la visibilité!`;
                }
            },
            {
                id: "energie-cosmique",
                name: "Énergie Cosmique",
                type: "bonus",
                description: "Une vague d'énergie cosmique traverse le champ de bataille!",
                probability: 0.07,
                execute: () => {
                    // Augmenter le Power des deux joueurs
                    applyTemporaryStatEffect(1, "power", 1.4, 2);
                    applyTemporaryStatEffect(2, "power", 1.4, 2);
                    
                    displayEventEffect(1, `ressent une montée d'énergie cosmique!`, true);
                    displayEventEffect(2, `ressent une montée d'énergie cosmique!`, true);
                    
                    return `Une vague d'énergie cosmique traverse le champ de bataille, renforçant les pouvoirs!`;
                }
            },
            {
                id: "intervention-divine",
                name: "Intervention Divine",
                type: "bonus",
                description: "Les dieux interviennent directement!",
                probability: 0.04,
                execute: () => {
                    // Choisir le joueur avec le moins de PV
                    let target, healAmount;
                    
                    if (player1HP < player2HP) {
                        target = 1;
                        healAmount = Math.floor(maxHP * 0.35);
                        player1HP = Math.min(maxHP, player1HP + healAmount);
                    } else {
                        target = 2;
                        healAmount = Math.floor(maxHP * 0.35);
                        player2HP = Math.min(maxHP, player2HP + healAmount);
                    }
                    
                    const targetName = target === 1 ? player1Name : player2Name;
                    displayEventEffect(target, `a été choisi par les dieux! Récupère ${healAmount} PV!`, true);
                    
                    updateHPBars();
                    return `Les dieux interviennent en faveur de ${targetName}, lui redonnant de la vitalité!`;
                }
            },
            {
                id: "anomalie-temporelle",
                name: "Anomalie Temporelle",
                type: "malus",
                description: "Le temps se distord autour d'un combattant!",
                probability: 0.05,
                execute: () => {
                    // Choisir une cible aléatoire
                    const target = Math.floor(Math.random() * 2);
                    
                    if (target === 0) {
                        // Réduire la vitesse du joueur 1
                        applyTemporaryStatEffect(1, "speed", 0.6, 2);
                        displayEventEffect(1, `est ralenti par une distorsion temporelle!`);
                        return `${player1Name} est pris dans une bulle temporelle qui ralentit ses mouvements!`;
                    } else {
                        // Réduire la vitesse du joueur 2
                        applyTemporaryStatEffect(2, "speed", 0.6, 2);
                        displayEventEffect(2, `est ralenti par une distorsion temporelle!`);
                        return `${player2Name} est pris dans une bulle temporelle qui ralentit ses mouvements!`;
                    }
                }
            },
            {
                id: "rage-berserker",
                name: "Rage de Berserker",
                type: "bonus",
                description: "Une fureur incontrôlable s'empare d'un combattant!",
                probability: 0.06,
                execute: () => {
                    // Choisir une cible aléatoire
                    const target = Math.floor(Math.random() * 2);
                    
                    if (target === 0) {
                        // Augmenter l'attaque mais réduire la défense du joueur 1
                        applyTemporaryStatEffect(1, "strength", 1.8, 2);
                        applyTemporaryStatEffect(1, "durability", 0.7, 2);
                        displayEventEffect(1, `entre en rage! +Force, -Résistance`, true);
                        return `${player1Name} entre dans une rage berserker!`;
                    } else {
                        // Augmenter l'attaque mais réduire la défense du joueur 2
                        applyTemporaryStatEffect(2, "strength", 1.8, 2);
                        applyTemporaryStatEffect(2, "durability", 0.7, 2);
                        displayEventEffect(2, `entre en rage! +Force, -Résistance`, true);
                        return `${player2Name} entre dans une rage berserker!`;
                    }
                }
            }
        ];
    }

    // Fonction pour vérifier si un événement se déclenche
    function checkForRandomEvent() {
        // Probabilité de base de 20% qu'un événement se produise
        if (Math.random() > 0.20) return false;
        
        const events = setupRandomEvents();
        
        // Sélectionner un événement au hasard en tenant compte de leur probabilité relative
        const totalProbability = events.reduce((sum, event) => sum + event.probability, 0);
        let randomValue = Math.random() * totalProbability;
        let cumulativeProbability = 0;
        
        for (const event of events) {
            cumulativeProbability += event.probability;
            if (randomValue <= cumulativeProbability) {
                // Événement déclenché!
                const message = event.execute();
                displaySpecialEvent(event, message); // Utiliser le nouveau nom de fonction
                addToHistory(`<strong>Événement spécial:</strong> ${event.name}<br>${message}`);
                return true;
            }
        }
        
        return false; // Aucun événement déclenché
    }

    // Fonction pour afficher l'événement aléatoire à l'écran
    function displaySpecialEvent(event, message) {
        const eventContainer = document.createElement('div');
        eventContainer.className = `random-event ${event.type}`;
        
        eventContainer.innerHTML = `
            <h3>${event.name}</h3>
            <p>${message || "Un événement mystérieux s'est produit"}</p>
        `;
        
        document.body.appendChild(eventContainer);
        
        // Effet d'animation
        setTimeout(() => {
            eventContainer.classList.add('show');
        }, 10);
        
        // Supprimer après un délai
        setTimeout(() => {
            eventContainer.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(eventContainer)) {
                    document.body.removeChild(eventContainer);
                }
            }, 1000);
        }, 5000);
    }

    // Fonction pour afficher l'effet d'un événement sur un joueur spécifique
    function displayEventEffect(playerIndex, message, isPositive = false) {
        const container = document.getElementById(`hero-info-${playerIndex}`);
        const effectMsg = document.createElement('div');
        effectMsg.className = `event-effect ${isPositive ? 'positive' : 'negative'}`;
        effectMsg.innerHTML = `
            <strong>${playerIndex === 1 ? player1Name : player2Name}</strong> ${message}
        `;
        
        container.appendChild(effectMsg);
        
        setTimeout(() => {
            effectMsg.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            effectMsg.classList.remove('show');
            setTimeout(() => {
                if (container.contains(effectMsg)) {
                    container.removeChild(effectMsg);
                }
            }, 1000);
        }, 3500);
    }

    // Fonction pour appliquer un effet temporaire sur les stats d'un joueur
    function applyTemporaryStatEffect(playerIndex, statType, multiplier, durationInTurns) {
        // Récupérer le héros correspondant
        const hero = playerIndex === 1 ? hero1 : hero2;
        
        // S'assurer que les stats originales sont sauvegardées
        if (!hero.originalStats && hero.powerstats) {
            hero.originalStats = JSON.parse(JSON.stringify(hero.powerstats));
        }
        
        // Stocker l'effet actif
        const effect = {
            stat: statType,
            multiplier: multiplier,
            duration: durationInTurns,
            endTurn: turnCounter + durationInTurns
        };
        
        activeEffects[`player${playerIndex}`].push(effect);
        
        // Appliquer le multiplicateur à la statistique
        if (statType === "tous") {
            // Appliquer à toutes les stats
            Object.keys(hero.powerstats).forEach(stat => {
                const originalValue = parseInt(hero.originalStats[stat]);
                hero.powerstats[stat] = Math.round(originalValue * multiplier);
            });
        } else {
            // Appliquer à une statistique spécifique
            const originalValue = parseInt(hero.originalStats[statType]);
            hero.powerstats[statType] = Math.round(originalValue * multiplier);
        }
        
        // Mettre à jour l'affichage
        displayHeroInBattle(hero, playerIndex, true);
    }

    // Fonction pour vérifier et supprimer les effets temporaires expirés
    function checkTemporaryEffects() {
        const checkPlayer = (playerIndex) => {
            const hero = playerIndex === 1 ? hero1 : hero2;
            if (!hero) return;
            
            const playerEffects = activeEffects[`player${playerIndex}`];
            if (playerEffects.length === 0) return;
            
            let effectsRemoved = false;
            
            // Filtrer les effets qui ne sont pas encore expirés
            activeEffects[`player${playerIndex}`] = playerEffects.filter(effect => {
                if (effect.endTurn <= turnCounter) {
                    // L'effet est expiré
                    effectsRemoved = true;
                    return false;
                }
                return true;
            });
            
            // Si des effets ont été retirés, restaurer les stats originales
            if (effectsRemoved) {
                // Restaurer d'abord toutes les stats originales
                if (hero.originalStats) {
                    Object.keys(hero.originalStats).forEach(stat => {
                        hero.powerstats[stat] = hero.originalStats[stat];
                    });
                }
                
                // Puis réappliquer tous les effets actifs restants
                playerEffects.forEach(effect => {
                    if (effect.stat === "tous") {
                        Object.keys(hero.powerstats).forEach(stat => {
                            const originalValue = parseInt(hero.originalStats[stat]);
                            hero.powerstats[stat] = Math.round(originalValue * effect.multiplier);
                        });
                    } else {
                        const originalValue = parseInt(hero.originalStats[effect.stat]);
                        hero.powerstats[effect.stat] = Math.round(originalValue * effect.multiplier);
                    }
                });
                
                // Mettre à jour l'affichage
                displayHeroInBattle(hero, playerIndex, true);
                
                // Afficher un message si tous les effets sont terminés
                if (activeEffects[`player${playerIndex}`].length === 0) {
                    displayEventEffect(playerIndex, `retrouve son état normal.`, true);
                }
            }
        };
        
        // Vérifier les deux joueurs
        checkPlayer(1);
        checkPlayer(2);
    }
});
