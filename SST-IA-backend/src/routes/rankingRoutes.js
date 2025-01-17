// routes/rankingRoutes.js
const express = require('express');
const router = express.Router();
const rankingController = require('../controllers/rankingController');

// Rutas para ranking (TODOS SON DEL TOP 10 (sino esta en el top 10 devuelve el top 10 y un mensaje diciendo que no ests en el top10)
router.get('/ranking-global', rankingController.getRanking); // Ranking global (Top 10)
router.get('/ranking-global/:userId', rankingController.getRankingWithUserPosition); // Ranking GLOBAL con posición del usuario (SOLO SI ESTA EN EL TOP 10 SINO TE REGRESA UN MENSAJE)
router.get('/ranking-actual', rankingController.getCurrentMonthlyRanking); // Ranking mensual actual (REGRESA EL MES(1-12), AÑO Y RANKING)-
router.get('/ranking-actual/:userId', rankingController.getUserMonthlyRankingPosition); // Ruta para obtener la posición del usuario en el ranking mensual

module.exports = router;
