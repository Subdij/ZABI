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

    // Variables pour stocker les noms des joueurs
    let player1Name = "";
    let player2Name = "";

    // Variables pour les rôles
    let player1Role = null; // 'Attaquant' ou 'Défenseur'
    let player2Role = null;

    // Compteur de tour
    let turnCounter = 1;

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
    function displayHeroInBattle(hero, index) {
        const heroName = document.getElementById(`hero-name-${index}`);
        const heroImage = document.getElementById(`hero-image-${index}`);
        const powerstats = document.getElementById(`powerstats-${index}`);
        const attackContainer = document.getElementById(`attack-container-${index}`);
        const defenseContainer = document.getElementById(`defense-container-${index}`);

        if (!hero) {
            heroName.textContent = "Erreur de chargement";
            return;
        }

        heroName.textContent = hero.name;

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

        powerstats.innerHTML = '';
        attackContainer.innerHTML = '';
        defenseContainer.innerHTML = ''; // Vider le conteneur des défenses

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

        // Ajouter les caractéristiques
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
                statValue.textContent = value;

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

        assignRoles(); // Attribuer les rôles au début du combat
        preloadNextHeroes(5);

        // Afficher le bouton "Changer de rôle" et le compteur de tour une fois le combat commencé
        roleSwitchBtn.style.display = 'block';
        turnCounterDisplay.style.display = 'block';
    });

    // Bouton pour changer de rôle
    const roleSwitchBtn = document.createElement('button');
    roleSwitchBtn.textContent = 'Changer de rôle';
    roleSwitchBtn.className = 'btn-primary role-switch-btn';
    roleSwitchBtn.style.display = 'none'; // Masquer le bouton par défaut
    battleContainer.insertAdjacentElement('afterend', roleSwitchBtn);

    // Gestion du clic sur le bouton de changement de rôle
    roleSwitchBtn.addEventListener('click', () => {
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
});
