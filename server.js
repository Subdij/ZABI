const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
// Configuration pour les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// URL de connexion MongoDB corrigée
// Le format correct est mongodb://localhost:27017/ZABI
// La collection est spécifiée séparément lors des requêtes
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/ZABI';

// Connexion à MongoDB
async function connectToMongoDB() {
  try {
    const client = new MongoClient(mongoURI);
    await client.connect();
    console.log('Connecté à MongoDB avec succès');
    console.log('Base de données connectée: ZABI');
    
    // Référence à la base de données
    const db = client.db();
    return { client, db };
  } catch (err) {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);
  }
}

// Démarrage du serveur après connexion à MongoDB
async function startServer() {
  const { client, db } = await connectToMongoDB();
  
  // Route pour accéder à la collection SuperHeros
  app.get('/api/superheros', async (req, res) => {
    try {
      const superheros = await db.collection('SuperHeros').find().toArray();
      console.log(`Récupération de ${superheros.length} superhéros`);
      res.json(superheros);
    } catch (err) {
      console.error('Erreur lors de la récupération des superhéros:', err);
      res.status(500).json({ message: "Erreur lors de la récupération des superhéros" });
    }
  });

  // Nouvelle route pour récupérer un superhéros par ID
  app.get('/api/superheros/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id) || id < 1 || id > 563) {
        return res.status(400).json({ message: "ID invalide" });
      }
      
      const superhero = await db.collection('SuperHeros').findOne({ id: id });
      
      while (!superhero) {
        console.log(`Superhéros avec ID ${id} non trouvé, génération d'un nouvel ID`);
        id = Math.floor(Math.random() * 563) + 1;
        superhero = await db.collection('SuperHeros').findOne({ id: id });
      }
      
      res.json(superhero);
    } catch (err) {
      console.error('Erreur lors de la récupération du superhéros:', err);
      res.status(500).json({ message: "Erreur lors de la récupération du superhéros" });
    }
  });

  // Conserver la route items pour compatibilité
  app.get('/api/items', async (req, res) => {
    try {
      const items = await db.collection('SuperHeros').find().toArray();
      res.json(items);
    } catch (err) {
      res.status(500).json({ message: "Erreur lors de la récupération des données" });
    }
  });

  app.listen(port, () => {
    console.log("Serveur démarré sur http://localhost:${port}");
  });
  list_attack();
}


function list_attack(){
    const fs = require('fs');

    fs.readFile('pouvoirs/attaques.json', function(err, data) { 

        if (err) throw err; 

        attacks = JSON.parse(data); 
        console.log("Liste des attaques :" + JSON.stringify(attacks)); 
    }); 
}

startServer();
