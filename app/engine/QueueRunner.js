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

		if (map === null) {
			Logger.log('error', 'No map found.');
			battleEntity.status = 'ERROR';
			battleEntity.save(function (err) {
				if (!err) {
					process.send({
						name: 'ERROR',
						data: battleQueueItem._id
					});
				}
			});
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
					position: [5 + o * 4, 2 + i * 25] //Return a vector2d,
				}));
			}

		}

		battleEntity.save(function (err) {
			if (err) {
				Logger.log('error', 'New battle can\'t be saved');
				return;
			}
			Logger.log('info', 'Battle saved');
			battleQueueItem.battle = battleEntity;
			battleQueueItem.save(function (err) {
				if (err) {
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
					battleEntity.set('status', 'RUNNING');
					battleEntity.save(function (err) {
						if (err) {
							Logger.log('error', err);
						}
					});
					Logger.log('info', 'Battle started');
				}

				function tickCallback(i, frame) {
					var battleFrameEntity = new BattleFrame({
						battle: battleEntity._id,
						index: i,
						data: frame
					});

					battleFrameEntity.save(function (err, response) {
						if (err) {
							Logger.log('error', err);
						}
					});
				}

				function endCallback(gameResult, gameTicks) {

					battleEntity.set('duration', gameTicks / battleEntity.fps);
					battleEntity.set('status', 'ENDED');

					if (gameResult === -1) {
						Logger.log('info', 'Battle ends with timeout');
					} else {
						var winner = gameResult;

						battleEntity.winner = winner.agent.id;
						battleEntity.loosers = [];

						var battleAgents = battleEntity.get('agents');
						for (var i = 0; i < battleAgents.length; i++) {
							if (battleAgents[i].toString() != battleEntity.winner.toString()) {
								battleEntity.loosers.push(battleAgents[i]);
							}
						}


						Logger.log('info', 'Battle ends with a winner team')
					}

					Logger.log('info', 'Battle ended');

					battleEntity.save(function (err) {
						if (!err) {
							process.send({
								name: 'ENDED',
								data: {
									id: battleQueueItem._id
								}
							});
						} else {
							Logger.log('error', err);
						}
					});
				}

				newGame.run(startCallback, tickCallback, endCallback);

			}, function initializeRejected(errors) {
				Logger.log('error', 'Unknown error during game initializing');
				battleEntity.status = 'ERROR';
				battleEntity.save(function (err) {
					process.send({
						name: 'ERROR',
						data: {
							id: battleQueueItem._id,
							reason: errors.error
						}
					});

				});
			});

	});
}

process.on('message', messageHandler);


//module.exports = Runner;
