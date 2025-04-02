document.addEventListener('DOMContentLoaded', () => {
    const battleBtn = document.getElementById('battle-btn');
    const battleContainer = document.getElementById('battle-container');
    
    // Ensemble pour stocker les IDs déjà utilisés
    const usedIds = new Set();
    
    // Fonction pour générer un ID aléatoire non utilisé
    function getRandomId() {
        let id;
        // Si tous les IDs ont été utilisés, réinitialiser l'ensemble
        if (usedIds.size >= 563) {
            usedIds.clear();
        }
        
        // Générer un ID aléatoire jusqu'à ce qu'on en trouve un non utilisé
        do {
            id = Math.floor(Math.random() * 563) + 1;
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
                const response = await fetch(`/api/superheros/${id}`);
                
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
        heroImage.src = "https://cdn.jsdelivr.net/gh/rtomczak/superhero-api@0.3.0/api/images/sm/" + hero.slug + ".jpg";
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
    
    // Gestionnaire d'événement pour le bouton de combat
    battleBtn.addEventListener('click', async () => {
        // Préparer les zones des héros pour l'affichage
        document.getElementById('hero-name-1').textContent = 'Chargement...';
        document.getElementById('hero-name-2').textContent = 'Chargement...';
        document.getElementById('powerstats-1').innerHTML = '';
        document.getElementById('powerstats-2').innerHTML = '';
        
        // Afficher le conteneur de bataille
        battleContainer.style.display = 'flex';
        
        // Masquer le bouton après le clic
        battleBtn.style.display = 'none';
        
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