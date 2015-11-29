var _, Map, Battle, BattleFrame, Mongoose, Game, Unit, Config, BattleQueue, Logger;

Config = require('../config');
_ = require("underscore");
Mongoose = require("mongoose");

BattleQueue = require("../model/BattleQueue");
Game = require("./Game");
Unit = require("./Unit");

//MODEL
Map = require("../model/Map");
Battle = require('../model/Battle');
BattleFrame = require('../model/BattleFrame');

Logger = require('../logger.js');

Mongoose.connect(Config.db.url);
Mongoose.connection.on('error', function (err) {
	console.error('MongoDB error: %s', err);
});

var messageHandler = function (message) {
	if (message.name === "RUN") {
		var queueItemId = message.data;
		BattleQueue.findById(queueItemId, function (err, queueItem) {
			runBattleQueueItem(queueItem);
		});
	}
};


function runBattleQueueItem(battleQueueItem) {

	//Create battle
	var battleEntity = new Battle();

	// Create Game
	var newGame = new Game();

	Map.findOne({default: true}, function (err, map) {
		if (err) {
			Logger.log('error', 'Can\'t find default map to run the battle', err);
			return;
		}
		//Create teams

		Logger.log('info', 'Creating a game instance');

		newGame.setMap(map.data);
		battleEntity.map = map._id;
		battleEntity.chunkSize = 300;
		battleEntity.fps = 60;
		battleEntity.agents = battleQueueItem.agents;
		battleEntity.moment = new Date();

		for (var i = 0; i < battleQueueItem.agents.length; i++) {
			var team = newGame.addTeam(battleEntity.agents[i].toString());
			Logger.log('info', 'Counting units for team ' + team.id);
			for (var o = 0; o < battleQueueItem.units; o++) {
				Logger.log('info', 'Creating unit ' + o + ' for team ' + team.id);
				team.addUnit(new Unit(newGame, team, {
					position: [2 + o * 8, 2 + i*25] //Return a vector2d,
				}));
			}

		}

		battleEntity.save(function (err) {
			if (err) {
				Logger.log('error', 'New battle can\'t be saved');
			}
			Logger.log('info', 'Battle saved');
			battleQueueItem.battle = battleEntity;
			battleQueueItem.save(function (err) {
				if(err){
					Logger.log('error', 'Battle not referenced in queue item');
					return;
				}
				Logger.log('info', 'Battle referenced in queue item');
			});

		});

		//Run Game
		Logger.log('info', 'Initializing game');
		newGame.initialize()
			.then(function initializeResolved() {

				function startCallback() {
					battleQueueItem.set('status','RUNNING');
					battleQueueItem.save();
					Logger.log('info', 'Battle run started');
				}

				function tickCallback(i, frame) {
					var battleFrameEntity = new BattleFrame({
						battle: battleEntity._id,
						index: i,
						data: frame
					});

					battleFrameEntity.save(function (err, response) {
					});
				}

				function endCallback() {
					battleQueueItem.set('status','ENDED');
					battleQueueItem.save(function (err) {
						if(!err){
							process.send({
								name:'ENDED',
								data:battleQueueItem._id
							});
						}
					});

					Logger.log('info', 'Battle run ended');
				}

				newGame.run(startCallback, tickCallback, endCallback);

			}, function initializeRejected(e) {
				Logger.log('error','Unknown error during game initializing');
			});

	});
}

process.on('message', messageHandler);


//module.exports = Runner;
