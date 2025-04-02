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
    
    // Fonction pour récupérer les données d'un superhéros
    async function fetchHero(id) {
        try {
            const response = await fetch(`/api/superheros/${id}`);
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la récupération du superhéros:', error);
            return null;
        }
    }
    
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
        
        // Générer deux ID aléatoires différents et récupérer les héros
        const id1 = getRandomId();
        const id2 = getRandomId();
        
        // Récupérer les deux héros simultanément
        const [hero1, hero2] = await Promise.all([
            fetchHero(id1),
            fetchHero(id2)
        ]);
        
        // Afficher les informations des deux héros
        displayHeroInBattle(hero1, 1);
        displayHeroInBattle(hero2, 2);
    });
});
