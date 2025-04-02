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
    
    // Ensemble pour stocker les IDs déjà utilisés
    const usedIds = new Set();
    
    // Fonction pour générer un ID aléatoire non utilisé
    function getRandomId() {
        let id;
        // Si tous les IDs ont été utilisés, réinitialiser l'ensemble
        if (usedIds.size >= 731) {
            usedIds.clear();
        }
        
        // Générer un ID aléatoire jusqu'à ce qu'on en trouve un non utilisé
        do {
            id = Math.floor(Math.random() * 731) + 1;
        } while (usedIds.has(id));
        
        // Ajouter l'ID à l'ensemble des IDs utilisés
        usedIds.add(id);
        console.log(`ID généré: ${id}`); // Log pour le débogage
        return id;
    }
    
    // Fonction pour récupérer les données d'un superhéros avec retry
    async function fetchHeroWithRetry(maxAttempts = 5) {
        let attempts = 0;
        let hero = null;
        
        while (!hero && attempts < maxAttempts) {
            attempts++;
            const id = getRandomId();
            console.log(`Tentative ${attempts} avec ID ${id}`);
            
            try {
                const response = await fetch(`/api/SuperHeros/${id}`);
                
                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }
                
                hero = await response.json();
                
                // Si le héros est null (non trouvé), on réessaie
                if (!hero) {
                    console.log(`Héros avec ID ${id} non trouvé, génération d'un nouvel ID...`);
                    continue;
                }
            } catch (error) {
                console.error('Erreur lors de la récupération du superhéros:', error);
            }
        }
        
        if (!hero) {
            console.error('Échec après plusieurs tentatives de récupération d\'un héros');
        }
        
        return hero;
    }
    
    // Correspondance entre caractéristiques et images d'icônes
    const statImages = {
        'intelligence': 'intelligence.png',
        'strength': 'strength.png',
        'speed': 'speed.png',
        'durability': 'durability.png',
        'power': 'power.png',
        'combat': 'combat.png'
    };
    
    // Fonction pour afficher les informations d'un héros dans une zone spécifique
    function displayHeroInBattle(hero, index) {
        const heroName = document.getElementById(`hero-name-${index}`);
        const heroImage = document.getElementById(`hero-image-${index}`);
        const powerstats = document.getElementById(`powerstats-${index}`);
        
        if (!hero) {
            heroName.textContent = "Erreur de chargement";
            return;
        }
        
        heroName.textContent = hero.name;
        heroImage.src = "https://cdn.jsdelivr.net/gh/rtomczak/superhero-api@0.3.0/api/images/sm/" + hero.slug + ".jpg";
        // Vider la grille de statistiques
        powerstats.innerHTML = '';
        
        // Ajouter chaque statistique à la grille
        if (hero.powerstats) {
            Object.entries(hero.powerstats).forEach(([key, value]) => {
                const statItem = document.createElement('div');
                statItem.className = 'stat-item';
                
                // Créer et ajouter l'icône en utilisant une image
                const iconImg = document.createElement('img');
                iconImg.src = `/img/${statImages[key] || 'default.png'}`; // Image par défaut si la clé n'est pas trouvée
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
    });
});
