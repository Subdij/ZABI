const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
// Configuration pour les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// URL de connexion MongoDB corrigée
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
  
  // S'assurer que la collection InvalidID existe
  try {
    await db.createCollection('InvalidID');
    console.log('Collection InvalidID vérifiée/créée');
  } catch (err) {
    // La collection existe probablement déjà, ce n'est pas une erreur critique
    console.log('Collection InvalidID existe déjà');
  }
  
  // Route pour accéder à la collection SuperHeros
  app.get('/api/SuperHeros', async (req, res) => {
    try {
      const SuperHeros = await db.collection('SuperHeros').find().toArray();
      console.log(`Récupération de ${SuperHeros.length} superhéros`);
      res.json(SuperHeros);
    } catch (err) {
      console.error('Erreur lors de la récupération des superhéros:', err);
      res.status(500).json({ message: "Erreur lors de la récupération des superhéros" });
    }
  });

  // Nouvelle route pour récupérer un superhéros par ID
  app.get('/api/SuperHeros/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id) || id < 1 || id > 731) {
        return res.status(400).json({ message: "ID invalide" });
      }
      
      const superhero = await db.collection('SuperHeros').findOne({ id: id });
      
      if (!superhero) {
        console.log(`Superhéros avec ID ${id} non trouvé`);
        return res.status(404).json(null);
      }
      
      res.json(superhero);
    } catch (err) {
      console.error('Erreur lors de la récupération du superhéros:', err);
      res.status(500).json({ message: "Erreur lors de la récupération du superhéros" });
    }
  });

  // Endpoint pour récupérer la liste des IDs invalides
  app.get('/api/InvalidID', async (req, res) => {
    try {
      const InvalidIDDocuments = await db.collection('InvalidID').find().toArray();
      // Extraire uniquement les IDs des documents
      const InvalidID = InvalidIDDocuments.map(doc => doc.id);
      console.log(`Envoi de ${InvalidID.length} IDs invalides`);
      res.json(InvalidID);
    } catch (err) {
      console.error('Erreur lors de la récupération des IDs invalides:', err);
      res.status(500).json({ message: "Erreur lors de la récupération des IDs invalides" });
    }
  });

  // Endpoint pour ajouter un nouvel ID invalide - version améliorée
  app.post('/api/InvalidID', async (req, res) => {
    try {
      console.log(`Requête reçue pour ajouter un ID invalide:`, req.body);
      
      const { id } = req.body;
      
      if (!id || isNaN(Number(id)) || id < 1 || id > 731) {
        console.error(`ID invalide reçu:`, id);
        return res.status(400).json({ message: "ID invalide", received: id });
      }
      
      const numericId = Number(id);
      console.log(`Traitement de l'ID invalide ${numericId}...`);
      
      try {
        // Vérification de la connexion à la base de données
        const collectionNames = await db.listCollections().toArray();
        console.log(`Collections disponibles:`, collectionNames.map(c => c.name));

        // Vérifier si l'ID existe déjà
        const existingId = await db.collection('InvalidID').findOne({ id: numericId });
        
        if (!existingId) {
          console.log(`Insertion de l'ID ${numericId} dans la collection InvalidID...`);
          const result = await db.collection('InvalidID').insertOne({ 
            id: numericId, 
            addedAt: new Date(),
            source: 'client'
          });
          console.log(`ID ${numericId} ajouté aux IDs invalides avec succès:`, result);
          res.status(200).json({ success: true, id: numericId, operation: 'inserted' });
        } else {
          console.log(`ID ${numericId} déjà présent dans les IDs invalides`);
          res.status(200).json({ success: true, id: numericId, operation: 'already_exists' });
        }
      } catch (dbError) {
        console.error(`Erreur de base de données lors de l'ajout de l'ID invalide ${numericId}:`, dbError);
        res.status(500).json({ message: `Erreur de base de données: ${dbError.message}` });
      }
    } catch (err) {
      console.error('Erreur lors de l\'ajout de l\'ID invalide:', err);
      res.status(500).json({ message: `Erreur lors de l'ajout de l'ID invalide: ${err.message}` });
    }
  });

  // Ajout d'un point de terminaison de test pour vérifier la connexion à MongoDB
  app.get('/api/db-test', async (req, res) => {
    try {
      // Vérifier si la collection InvalidID existe
      const collections = await db.listCollections().toArray();
      const hasInvalidIDCollection = collections.some(c => c.name === 'InvalidID');
      
      // Tester l'écriture dans la collection InvalidID
      const testId = 999999; // Un ID de test qui ne sera jamais un ID de héros valide
      const testResult = await db.collection('InvalidID').updateOne(
        { id: testId, isTest: true },
        { $set: { id: testId, isTest: true, lastTested: new Date() } },
        { upsert: true }
      );
      
      res.json({
        dbConnected: true,
        InvalidIDCollectionExists: hasInvalidIDCollection,
        testWriteSuccessful: testResult.acknowledged,
        collections: collections.map(c => c.name)
      });
    } catch (err) {
      console.error('Erreur du test de base de données:', err);
      res.status(500).json({ 
        dbConnected: false, 
        error: err.message 
      });
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

  // Nouvelle route pour récupérer les attaques
  app.get('/api/attaques', (req, res) => {
    const fs = require('fs');
    const filePath = path.join(__dirname, 'pouvoirs', 'attaques.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors de la lecture du fichier attaques.json:', err);
            return res.status(500).json({ message: "Erreur lors de la récupération des attaques" });
        }

        try {
            const attacks = JSON.parse(data);
            res.json(attacks);
        } catch (parseError) {
            console.error('Erreur lors de l\'analyse du fichier attaques.json:', parseError);
            res.status(500).json({ message: "Erreur lors de l'analyse des attaques" });
        }
    });
  });

  app.get('/api/defenses', (req, res) => {
    const fs = require('fs');
    const filePath = path.join(__dirname, 'pouvoirs', 'defenses.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors de la lecture du fichier defenses.json:', err);
            return res.status(500).json({ message: "Erreur lors de la récupération des défenses" });
        }

        try {
            const defenses = JSON.parse(data);
            res.json(defenses);
        } catch (parseError) {
            console.error('Erreur lors de l\'analyse du fichier defenses.json:', parseError);
            res.status(500).json({ message: "Erreur lors de l'analyse des défenses" });
        }
    });
  });

  app.listen(port, () => {
    console.log("Serveur démarré sur http://localhost:3000");
  });
  list_attack();
}

function list_attack(){
    const fs = require('fs');

    fs.readFile('pouvoirs/attaques.json', function(err, data) { 
        if (err) throw err; 
        attacks = JSON.parse(data); 
    }); 
}

startServer();
