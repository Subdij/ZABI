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
            // Conserver uniquement les logs d'erreur critiques
            console.error('Erreur lors du chargement des IDs invalides:', error);
        }
    }
    
    // Fonction pour générer un ID aléatoire valide
    function getRandomId() {
        // Si presque tous les IDs valides ont été utilisés dans cette session, réinitialiser
        if (usedIds.size > 700 - invalidIds.size) {
            usedIds.clear();
        }
        
        let id;
        let attempts = 0;
        const maxAttempts = 1000; // Sécurité pour éviter une boucle infinie
        
        do {
            id = Math.floor(Math.random() * 731) + 1;
            attempts++;
            
            if (attempts > maxAttempts) {
                return null;
            }
        } while (usedIds.has(id) || invalidIds.has(id));
        
        // Ajouter l'ID à l'ensemble des IDs utilisés dans cette session
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
                // Uniquement utiliser l'image par défaut sans logger l'erreur
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
        // Image par défaut aussi
        const defaultImg = new Image();
        defaultImg.src = '/img/default.png';
    }
    
    // Déclencher le préchargement des icônes
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
            // Précharger l'image dès que nous avons le héros
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
        
        if (!hero) {
            heroName.textContent = "Erreur de chargement";
            return;
        }
        
        heroName.textContent = hero.name;
        
        // Afficher une image de chargement pendant le chargement de l'image du héros
        heroImage.src = '/img/loading.gif';
        
        // Si l'image est déjà dans le cache, l'utiliser immédiatement
        if (imageCache.has(hero.slug)) {
            heroImage.src = imageCache.get(hero.slug);
        } else {
            // Sinon précharger l'image puis l'afficher
            preloadHeroImage(hero)
                .then(() => {
                    heroImage.src = imageCache.get(hero.slug);
                })
                .catch(() => {
                    // En cas d'erreur, afficher une image par défaut
                    heroImage.src = '/img/hero-default.png';
                });
        }
        
        powerstats.innerHTML = '';
        attackContainer.innerHTML = ''; // Vider le conteneur des attaques

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

        // Ajouter les caractéristiques
        if (hero.powerstats) {
            Object.entries(hero.powerstats).forEach(([key, value]) => {
                const statItem = document.createElement('div');
                statItem.className = 'stat-item';
                
                // Créer et ajouter l'icône en utilisant une image
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
        // Fonction pour charger les attaques depuis la nouvelle route API
        async function fetchAttacks() {
            try {
                const response = await fetch('/api/attaques'); // Utilisation de la nouvelle route API
                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                console.error('Erreur lors du chargement des attaques:', error);
                return [];
            }
        }
    // Étape 1: Clic sur le bouton Play
    playBtn.addEventListener('click', () => {
        welcomeScreen.style.display = 'none';
        playersInput.style.display = 'block';
    });
    
    // Étape 2: Confirmation des pseudos et début du combat
    startBattleBtn.addEventListener('click', async () => {
        // Récupérer et nettoyer les pseudos
        player1Name = player1NameInput.value.trim() || "Joueur 1";
        player2Name = player2NameInput.value.trim() || "Joueur 2";
        
        // Cacher le formulaire
        playersInput.style.display = 'none';
        
        // Mise à jour des noms des joueurs dans l'interface
        player1Display.textContent = player1Name;
        player2Display.textContent = player2Name;
        
        // Préparer les zones des héros pour l'affichage
        document.getElementById('hero-name-1').textContent = 'Chargement...';
        document.getElementById('hero-name-2').textContent = 'Chargement...';
        document.getElementById('powerstats-1').innerHTML = '';
        document.getElementById('powerstats-2').innerHTML = '';
        
        // Afficher le conteneur de bataille
        battleContainer.style.display = 'flex';
        
        // Récupérer deux héros avec la fonction retry
        const [hero1, hero2] = await Promise.all([
            fetchHeroWithRetry(),
            fetchHeroWithRetry()
        ]);
        
        // Afficher les informations des deux héros
        displayHeroInBattle(hero1, 1);
        displayHeroInBattle(hero2, 2);
        
        // Précharger quelques héros supplémentaires pour les prochaines utilisations
        preloadNextHeroes(5);
    });
    
    // Fonction pour précharger des héros supplémentaires en arrière-plan
    async function preloadNextHeroes(count = 3) {
        for (let i = 0; i < count; i++) {
            setTimeout(async () => {
                try {
                    const hero = await fetchHero();
                    if (hero) {
                        preloadHeroImage(hero);
                    }
                } catch (err) {
                    // Ignorer silencieusement les erreurs de préchargement
                }
            }, i * 300); // Espacer les requêtes pour ne pas surcharger le serveur
        }
    }
});
