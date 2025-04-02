const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
attacks = {};
// Configuration pour les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// URL de connexion MongoDB
// Pour une base de données locale: 'mongodb://localhost:27017/zabiDB'
// Pour MongoDB Atlas: 'mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority'
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/ZABI/SuperHeros';

// Connexion à MongoDB
async function connectToMongoDB() {
  try {
    const client = new MongoClient(mongoURI);
    await client.connect();
    console.log('Connecté à MongoDB avec succès');

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

  // Exemples de routes (à personnaliser selon vos besoins)
  app.get('/api/items', async (req, res) => {
    try {
      const items = await db.collection('items').find().toArray();
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
