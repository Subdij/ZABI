
# 🦸‍♂️ ZABI - Les Superhéros qui se battent dans le jeu qu'on a développé 🥊

Bienvenue dans **Les Superhéros qui se battent dans le jeu qu'on a développé**, un jeu de duel dynamique entre deux super-héros avec une ambiance arcade rétro !
Obtenez un héros, attaquez, défendez et utilisez vos pouvoirs spéciaux.

---

## 🚀 Fonctionnalités

- Interface typée *arcade* avec barres de vie en haut à gauche/droite
- Entrée des pseudos Joueur 1 & Joueur 2
- Sélection aléatoire de superhéros avec images et stats dynamiques
- Système d’attaque/défense avec effets visuels (animations de dégâts/soins)
- Matchmaking équilibré avec analyse du duel
- Bonus de soin limité pendant le combat
- Design rétro avec police `Press Start 2P`
- Système de Faiblesses

Pour rendre le combat plus stratégique, chaque type d'attaque peut exploiter une **faiblesse** de l’adversaire.  
Cela permet de réaliser des **coups critiques** qui infligent plus de dégâts.

Voici un tableau simple des correspondances :

| Type             | Faible contre        |
|------------------|----------------------|
| 🧠 Intelligence   | ⚡ Power              |
| 💪 Strength       | 🧠 Intelligence       |
| ⚡ Speed          | 🛡️ Durability         |
| 🛡️ Durability     | 💪 Strength           |
| ⚡ Power          | 🥋 Combat             |
| 🥋 Combat         | ⚡ Speed              |


- Si l’attaque cible une faiblesse : **+20 dégâts**
- Si l'attaque est faible contre la défense : **-20 dégâts**
- Sinon : dégâts normaux


## 📁 Structure du projet

```
ZABI/
│
├── public/
│   ├── css/
│   │   └── style.css         # Tous les styles visuels (interface, barres de vie, animations, etc.)
│   ├── js/
│   │   └── app.js            # Logique du jeu côté client
│   ├── img/
│   │   └── SF_Arene.jpg      # Fond arcade style Street Fighter
│   ├── audio/                # Dossier contenant les différents sons utilisés dans le jeu
│   │  
│   └── index.html            # Interface HTML principale
│
├── pouvoirs/
│   ├── attaques.json         # Json avec la liste des attaques 
│   └── defenses.json         # Json avec la liste des défenses
│
├── server.js                 # Serveur Node.js avec Express
├── package.json              # Dépendances & scripts
└── README.md                 # Documentation du projet
```

---

## ⚙️ Prérequis

- Node.js (version 14+ recommandée)
- npm

---

## 🔧 Installation & Lancement

```bash
# 1. Clone le repo
git clone https://github.com/Subdij/ZABI.git
cd ZABI

# 2. Installe les dépendances
npm install

# 3. Lance le serveur
node server.js
```

➡️ Le serveur tourne par défaut sur :  
📍 `http://localhost:3000`

---

## 🧠 Technologies utilisées

- **Node.js** + **Express** – pour servir les fichiers statiques
- **HTML5 / CSS3** – mise en page et design responsive
- **Vanilla JavaScript** – logique de combat, animations, interactions
- **Google Fonts** – `Press Start 2P` pour l’effet arcade rétro
- **MongoDB** – pour les stats des Héros

---

## 📸 Aperçu

![screenshot](./img/preview.png)

---

## Equipe

Créé par : 

- Alexandre M.
- Benoît D.
- Inès A.
- Ziyad C.
