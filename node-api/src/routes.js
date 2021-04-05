// import express from 'express';
// import TeamController from './controllers/TeamController.js'
// import StatisticsController from './controllers/StatisticsController.js';

const express = require('express');
const TeamController = require('./controllers/TeamController');
const StatisticsController = require('./controllers/StatisticsController');

const routes = express.Router();

routes.get('/team', TeamController.getTeam);
routes.get('/statistics', StatisticsController.getStatistics);

module.exports = routes;