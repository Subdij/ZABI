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
          console.log("ici");
          return baseDegats + 20;
        }
      
        // Si l’attaque est faible contre la défense
        if (faiblesses[typeAttaque] === typeDefense) {
            degats_faiblesse = -20;
            console.log("ici2");
          return baseDegats - 20;
          
        }
        console.log("ici3");
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
            alert(`${player2Name} a gagné le combat!`);
        } else if (player2HP <= 0) {
            alert(`${player1Name} a gagné le combat!`);
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
        }, 5000);
        
        // Stocker l'ID du timeout sur l'élément pour pouvoir l'annuler si nécessaire
        matchupElement.dataset.timeoutId = timeoutId;
    }
    
    // Fonction pour ajouter un power-up de soin
    function addHealingPowerUp(playerIndex) {
        // Supprimer tout bouton de heal existant pour éviter les doublons
        const existingButton = document.getElementById(`heal-powerup-${playerIndex}`);
        if (existingButton) {
            existingButton.remove();
        }
        
        const powerupContainer = document.getElementById(`hero-info-${playerIndex}`);
        const healButton = document.createElement('button');
        healButton.id = `heal-powerup-${playerIndex}`;
        healButton.className = 'heal-powerup-btn';
        healButton.innerHTML = '💖 SOIN D\'URGENCE <span class="heal-info">(utilisable une fois)</span>';
        healButton.setAttribute('data-used', 'false');
        
        healButton.addEventListener('click', () => {
            if (healButton.getAttribute('data-used') === 'false') {
                const currentHP = playerIndex === 1 ? player1HP : player2HP;
                const healAmount = Math.floor(maxHP * 0.3 * (1 - currentHP / maxHP)); // Plus les PV sont bas, plus la guérison est efficace
                
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
                
                // Animation de soin
                const hpBar = playerIndex === 1 ? hpBar1 : hpBar2;
                hpBar.classList.add('heal-animation');
                setTimeout(() => {
                    hpBar.classList.remove('heal-animation');
                }, 1000);
                
                // Message temporaire de confirmation
                const healMessage = document.createElement('div');
                healMessage.className = 'heal-message';
                healMessage.textContent = `Soin de ${healAmount} PV appliqué!`;
                powerupContainer.insertBefore(healMessage, healButton);
                
                // Supprimer le message après 3 secondes
                setTimeout(() => {
                    if (powerupContainer.contains(healMessage)) {
                        powerupContainer.removeChild(healMessage);
                    }
                }, 3000);
            }
        });
        
        // Insérer le bouton juste en dessous des PV pour plus de visibilité
        const hpContainer = document.querySelector(`#hero-info-${playerIndex} .hp-container`);
        powerupContainer.insertBefore(healButton, hpContainer.nextSibling);
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
        const existingMessage = powerupContainer.querySelector('.boost-message');
        if (existingMessage) {
            powerupContainer.removeChild(existingMessage);
        }
        
        const boostMessage = document.createElement('div');
        boostMessage.className = 'boost-message';
        boostMessage.innerHTML = '<strong>STATS BOOSTÉES</strong>';
        
        // Insérer le message au-dessus de la section des caractéristiques
        const powerstatsTitle = powerupContainer.querySelector('h3:nth-of-type(3)');
        powerupContainer.insertBefore(boostMessage, powerstatsTitle);
        
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
        const attackContainer1 = document.getElementById('attack-container-1');
        const defenseContainer1 = document.getElementById('defense-container-1');
        const attackContainer2 = document.getElementById('attack-container-2');
        const defenseContainer2 = document.getElementById('defense-container-2');

        const attackTitle1 = document.querySelector('#hero-info-1 h3:nth-of-type(1)');
        const defenseTitle1 = document.querySelector('#hero-info-1 h3:nth-of-type(2)');
        const attackTitle2 = document.querySelector('#hero-info-2 h3:nth-of-type(1)');
        const defenseTitle2 = document.querySelector('#hero-info-2 h3:nth-of-type(2)');

        // Mettre à jour les titres avec les rôles
        player1Display.textContent = `${player1Name} - ${player1Role}`;
        player2Display.textContent = `${player2Name} - ${player2Role}`;

        // Afficher ou masquer les attaques et défenses en fonction des rôles
        if (player1Role === 'Attaquant') {
            attackContainer1.style.display = 'block';
            defenseContainer1.style.display = 'none';
            attackTitle1.style.display = 'block';
            defenseTitle1.style.display = 'none';

            attackContainer2.style.display = 'none';
            defenseContainer2.style.display = 'block';
            attackTitle2.style.display = 'none';
            defenseTitle2.style.display = 'block';
        } else {
            attackContainer1.style.display = 'none';
            defenseContainer1.style.display = 'block';
            attackTitle1.style.display = 'none';
            defenseTitle1.style.display = 'block';

            attackContainer2.style.display = 'block';
            defenseContainer2.style.display = 'none';
            attackTitle2.style.display = 'block';
            defenseTitle2.style.display = 'none';
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

        const [hero1, hero2] = await Promise.all([
            fetchHeroWithRetry(),
            fetchHeroWithRetry()
        ]);

        displayHeroInBattle(hero1, 1);
        displayHeroInBattle(hero2, 2);
        
        // Analyser l'équilibre du combat
        analyzeMatchup(hero1, hero2);

        assignRoles(); // Attribuer les rôles au début du combat
        preloadNextHeroes(5);

        // Afficher le bouton "Changer de rôle" et le compteur de tour une fois le combat commencé
        roleSwitchBtn.style.display = 'block';
        turnCounterDisplay.style.display = 'block';

        // Dans la fonction de démarrage du combat
        assignRandomPowerUp(1); // Pour le joueur 1
        assignRandomPowerUp(2); // Pour le joueur 2
    });

    // Bouton pour changer de rôle
    const roleSwitchBtn = document.createElement('button');
    roleSwitchBtn.textContent = 'Valider';
    roleSwitchBtn.className = 'btn-primary role-switch-btn';
    roleSwitchBtn.style.display = 'none'; // Masquer le bouton par défaut
    battleContainer.insertAdjacentElement('afterend', roleSwitchBtn);

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
        let valeurAttaque = getStatValue(heroAttaquant, attaqueChoisie.pouvoir) * attaqueChoisie.modificateur;
        let valeurDefense = getStatValue(heroDefenseur, defenseChoisie.pouvoir) * defenseChoisie.modificateur;
        degats_faiblesse=0;
        // Calculer les dégâts finaux
        let degats = Math.max(0, Math.floor(valeurAttaque - valeurDefense));
        console.log(degats);
        degats_initiaux=degats;
        // Calculer les dégâts avec les power-ups
        // Appliquer les power-ups d'attaque
        if (activeAttackPowerUp) {
            console.log(`Power-up d'attaque actif: ${activeAttackPowerUp.name}`);
            switch(activeAttackPowerUp.name) {
                case "Frappe Dévastatrice":
                    valeurAttaque = activeAttackPowerUp.effect(valeurAttaque);
                    console.log(`Valeur d'attaque doublée: ${valeurAttaque}`);
                    break;
                case "Expert des Faiblesses":
                    const oldDegats = degats;
                    degats = activeAttackPowerUp.effect(degats, attaqueChoisie.pouvoir, defenseChoisie.pouvoir);
                    console.log(`Dégâts modifiés par Expert des Faiblesses: ${oldDegats} → ${degats}`);
                    break;
                // ... autres cas
            }
            activeAttackPowerUp = null;
        }

        if (activeDefensePowerUp) {
            console.log(`Power-up de défense actif: ${activeDefensePowerUp.name}`);
            const oldDefense = valeurDefense;
            valeurDefense = activeDefensePowerUp.effect(valeurDefense);
            console.log(`Valeur de défense modifiée: ${oldDefense} → ${valeurDefense}`);
            activeDefensePowerUp = null;
        }
        // Appliquer les dégâts
        degats = calculerDegats(degats, attaqueChoisie.pouvoir, defenseChoisie.pouvoir);
        console.log(degats);
        dealDamage(defenseur, degats);
        
        // Afficher un message de combat
        const combatMessage = document.createElement('div');
        combatMessage.className = 'combat-message';
        combatMessage.innerHTML = `
            <strong>${attaquant === 1 ? player1Name : player2Name}</strong> utilise ${attaqueChoisie.name} (${Math.floor(valeurAttaque)} pts)
            <br>
            <strong>${defenseur === 1 ? player1Name : player2Name}</strong> se défend avec ${defenseChoisie.name} (${Math.floor(valeurDefense)} pts)
            
            
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

        // Inverser les rôles
        [player1Role, player2Role] = [player2Role, player1Role];
        updateRoleDisplay();

        // Incrémenter le compteur de tour
        turnCounter++;
        turnCounterDisplay.textContent = `Tour : ${turnCounter}`;
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

    // Définition des power-ups
    const powerUps = {
        HEAL: {
            name: "Soin Rapide",
            icon: "💖",
            description: "Restaure 50 PV instantanément",
            effect: (playerIndex) => {
                if (playerIndex === 1) {
                    player1HP = Math.min(maxHP, player1HP + 50);
                } else {
                    player2HP = Math.min(maxHP, player2HP + 50);
                }
                updateHPBars();
            }
        },
        DOUBLE_ATTACK: {
            name: "Frappe Dévastatrice",
            icon: "⚔️",
            description: "Double les dégâts de votre prochaine attaque",
            effect: (valeurAttaque) => valeurAttaque * 2
        },
        DOUBLE_DEFENSE: {
            name: "Mur de Fer",
            icon: "🛡️",
            description: "Double l'efficacité de votre prochaine défense",
            effect: (valeurDefense) => valeurDefense * 2
        },
        STAT_BOOST: {
            name: "Boost Aléatoire",
            icon: "⚡",
            description: "Augmente une statistique aléatoire de 50 points pour 1 tour",
            effect: (hero) => {
                const stats = Object.keys(hero.powerstats);
                const randomStat = stats[Math.floor(Math.random() * stats.length)];
                hero.powerstats[randomStat] = parseInt(hero.powerstats[randomStat]) + 50;
                return randomStat;
            }
        },
        WEAKNESS_EXPLOIT: {
            name: "Expert des Faiblesses",
            icon: "🎯",
            description: "Double les dégâts si vous exploitez une faiblesse",
            effect: (degats, typeAttaque, typeDefense) => {
                return faiblesses[typeDefense] === typeAttaque ? degats * 2 : degats;
            }
        },
        VAMPIRISM: {
            name: "Drain Vital",
            icon: "🧛",
            description: "Récupère 50% des dégâts infligés en PV",
            effect: (playerIndex, degats) => {
                const heal = Math.floor(degats * 0.5);
                if (playerIndex === 1) {
                    player1HP = Math.min(maxHP, player1HP + heal);
                } else {
                    player2HP = Math.min(maxHP, player2HP + heal);
                }
                updateHPBars();
            }
        },
        MIRROR_FORCE: {
            name: "Riposte",
            icon: "🪞",
            description: "Renvoie 30% des dégâts à l'attaquant",
            effect: (attaquant, degats) => {
                const mirrorDamage = Math.floor(degats * 0.3);
                if (attaquant === 1) {
                    player1HP = Math.max(0, player1HP - mirrorDamage);
                } else {
                    player2HP = Math.max(0, player2HP - mirrorDamage);
                }
                updateHPBars();
            }
        },
        ULTIMATE_MOVE: {
            name: "Coup Ultimate",
            icon: "🌟",
            description: "Utilise la plus haute statistique pour l'attaque ou la défense",
            effect: (hero) => {
                const stats = Object.entries(hero.powerstats);
                return Math.max(...stats.map(([_, value]) => parseInt(value)));
            }
        }
    };

    // Ajoutez ces variables au début du fichier pour suivre les power-ups actifs
    let activeAttackPowerUp = null;
    let activeDefensePowerUp = null;

    // Modifiez la fonction assignRandomPowerUp
    function assignRandomPowerUp(playerIndex) {
        const availablePowerUps = Object.entries(powerUps);
        const randomPowerUp = availablePowerUps[Math.floor(Math.random() * availablePowerUps.length)];
        
        const powerUpButton = document.createElement('button');
        powerUpButton.className = 'power-up-btn';
        powerUpButton.innerHTML = `
            ${randomPowerUp[1].icon} ${randomPowerUp[1].name}
            <span class="power-up-description">${randomPowerUp[1].description}</span>
        `;
        powerUpButton.setAttribute('data-used', 'false');
        
        // Ajouter l'événement de clic
        powerUpButton.addEventListener('click', () => {
            if (powerUpButton.getAttribute('data-used') === 'true') {
                return; // Power-up déjà utilisé
            }

            // Vérifier si c'est le bon moment pour utiliser le power-up
            const isAttackPowerUp = ['DOUBLE_ATTACK', 'WEAKNESS_EXPLOIT', 'VAMPIRISM', 'ULTIMATE_MOVE'].includes(randomPowerUp[0]);
            const isDefensePowerUp = ['DOUBLE_DEFENSE', 'MIRROR_FORCE'].includes(randomPowerUp[0]);
            const isUtilityPowerUp = ['HEAL', 'STAT_BOOST'].includes(randomPowerUp[0]);

            const isPlayerAttacking = (playerIndex === 1 && player1Role === 'Attaquant') || 
                                    (playerIndex === 2 && player2Role === 'Attaquant');
            const isPlayerDefending = (playerIndex === 1 && player1Role === 'Défenseur') || 
                                    (playerIndex === 2 && player2Role === 'Défenseur');

            if (isAttackPowerUp && !isPlayerAttacking) {
                alert("Ce power-up ne peut être utilisé que pendant votre tour d'attaque!");
                console.log(`${playerIndex === 1 ? player1Name : player2Name} a tenté d'utiliser un power-up d'attaque pendant la défense`);
                return;
            }

            if (isDefensePowerUp && !isPlayerDefending) {
                alert("Ce power-up ne peut être utilisé que pendant votre tour de défense!");
                console.log(`${playerIndex === 1 ? player1Name : player2Name} a tenté d'utiliser un power-up de défense pendant l'attaque`);
                return;
            }

            // Activer le power-up en fonction de son type
            console.log(`${playerIndex === 1 ? player1Name : player2Name} active le power-up ${randomPowerUp[1].name}`);

            switch(randomPowerUp[0]) {
                case 'HEAL':
                    randomPowerUp[1].effect(playerIndex);
                    console.log(`${playerIndex === 1 ? player1Name : player2Name} se soigne de 50 PV`);
                    break;
                case 'DOUBLE_ATTACK':
                    activeAttackPowerUp = randomPowerUp[1];
                    console.log(`${playerIndex === 1 ? player1Name : player2Name} double ses dégâts pour la prochaine attaque`);
                    break;
                case 'DOUBLE_DEFENSE':
                    activeDefensePowerUp = randomPowerUp[1];
                    console.log(`${playerIndex === 1 ? player1Name : player2Name} double sa défense pour le prochain tour`);
                    break;
                case 'STAT_BOOST':
                    const boostedStat = randomPowerUp[1].effect(playerIndex === 1 ? hero1 : hero2);
                    console.log(`${playerIndex === 1 ? player1Name : player2Name} augmente sa statistique ${boostedStat} de 50 points`);
                    displayHeroInBattle(playerIndex === 1 ? hero1 : hero2, playerIndex, true);
                    break;
                case 'WEAKNESS_EXPLOIT':
                    activeAttackPowerUp = randomPowerUp[1];
                    console.log(`${playerIndex === 1 ? player1Name : player2Name} active l'exploitation des faiblesses`);
                    break;
                case 'VAMPIRISM':
                    activeAttackPowerUp = randomPowerUp[1];
                    console.log(`${playerIndex === 1 ? player1Name : player2Name} active le drain vital`);
                    break;
                case 'MIRROR_FORCE':
                    activeDefensePowerUp = randomPowerUp[1];
                    console.log(`${playerIndex === 1 ? player1Name : player2Name} active la riposte`);
                    break;
                case 'ULTIMATE_MOVE':
                    activeAttackPowerUp = randomPowerUp[1];
                    console.log(`${playerIndex === 1 ? player1Name : player2Name} prépare son coup ultime`);
                    break;
            }

            // Marquer le power-up comme utilisé
            powerUpButton.setAttribute('data-used', 'true');
            powerUpButton.style.opacity = '0.5';
            powerUpButton.style.cursor = 'not-allowed';

            // Afficher un message de confirmation
            const confirmMessage = document.createElement('div');
            confirmMessage.className = 'power-up-message';
            confirmMessage.textContent = `${randomPowerUp[1].name} activé!`;
            powerUpButton.parentNode.insertBefore(confirmMessage, powerUpButton.nextSibling);

            // Supprimer le message après 2 secondes
            setTimeout(() => {
                if (confirmMessage.parentNode) {
                    confirmMessage.parentNode.removeChild(confirmMessage);
                }
            }, 2000);
        });
        
        // Ajouter le bouton au conteneur du joueur
        const container = document.getElementById(`hero-info-${playerIndex}`);
        container.insertAdjacentElement('afterbegin', powerUpButton);
        
        return randomPowerUp[1];
    }

});
