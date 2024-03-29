"use strict";
var Q, Vector2D, Bullet, Unit, _, AgentController, Agent;

Q = require("q");
Vector2D = require("./vendor/Vector2D");
Unit = require("./Unit");
Bullet = require('./Bullet');
_ = require('underscore');
AgentController = require('./controllers/AgentController');
Agent = require('../model/Agent');


/**
 * Representa un equipo
 * @param {number} _id Identificador del equipo
 * @param {string} _name Nombre del equipo
 * @param {string} _agent Identificador del agente
 * @param {Game} _game Instancia del objeto game
 * @constructor Crear un equipo con las caracteristicas especificadas
 */
function Team(_id, _agentId, _game) {

	/**
	 * Variable del juego
	 *
	 * Intance of the game
	 */
	this.game = _game;


	/**
	 * Indica si el equipo entero sigue vivo
	 * @type {boolean}
	 */
	this.alive = true;


	/**
	 * Identificador del equipo
	 * @type {number}
	 */
	this.id = _id;

	/**
	 * Nombre del equipo
	 * @type {string}
	 * @deprecated
	 */
	//this.name = (_name && _name.trim()) || "Guest";


	/**
	 * Agente que controlará el equipo
	 * @type {AgentController}
	 */
	this.agent = {
		id: _agentId
	};


	/**
	 * Contendrá la información de usuario cuando se solicite
	 * @type {User}
	 */
	this.user = undefined;

	/**
	 * Unidades del equipo
	 * @type {Unit[]}
	 */
	this.units = [];

	/**
	 *
	 * @type {string}
	 */
	this.color;


	/**
	 * Health of the team
	 * @type {number}
	 */

	this.health = 0;

	/**
	 * Agent is prepared
	 * @type {Boolean{
	 */

	this.prepared = false;

}


Team.prototype.prepare = function () {
	var _self = this;
	//Convertimos el agente en un controlador
	this.agent = new AgentController(this.agent.id, this.game, this.id);

	var promises = [this.agent.prepare()];
	promises.push(Agent.findById(this.agent.id)
		.then(function (agent) {
			_self.color = agent.color || "#000000";
		}));

	//Esto no es cierto...
	this.prepared = true;
	//Devolvemos la promesa del agente tal cual
	return Q.all(promises);
};


Team.prototype.updateHealth = function () {
	var totalHealth = 0;
	var maxHealth = 0;

	_.each(this.units, function (_unit) {
		totalHealth = totalHealth + _unit.health;
		maxHealth = maxHealth + _unit.maxHealth;
	});

	if (totalHealth <= 0) {
		this.alive = false;
	}
	this.health = (totalHealth / maxHealth) * 100;
};

/**
 * Apply the inputs from a agent of this current iteration
 * @param _inputs
 */
Team.prototype.applyInputs = function (_inputs) {

};

/**
 * Añade una unidad al equipo
 *
 * Adds a unit to the team
 * @param {Unit} _unit
 */
Team.prototype.addUnit = function (_unit) {
	_unit.teamId = this.id;
	this.units.push(_unit);
};


/**
 * Elimina la unitad de la posición indicada
 *
 * Delete the unit at the _index position
 * @param {number} _index
 */
Team.prototype.removeUnit = function (_index) {
	delete this.units[_index];
};

/**
 * NAME
 * USER
 * COLOR
 *
 */
Team.prototype.toJSON = function () {
	return _.pick(this, 'name', 'user', 'color');
};


/**
 * GETTERS && SETTERS
 */


/**
 * Devuelve si el equipo sobrevive o no
 * @returns {boolean} True si está vivo, false si no
 */
Team.prototype.isAlive = function () {
	return this.alive;
};

/**
 * Permite establecer si el equipo sobrevive o no
 * @param _alive
 */
Team.prototype.setAlive = function (_alive) {
	this.alive = _alive;
};

/**
 * Devuelve el nombre del equipo
 * @returns {String} Nombre del equipo
 */
Team.prototype.getName = function () {
	return this.name;
};

/**
 * Devuelve un tanque por su identificador
 * @param _index
 * @returns {Unit} unit
 */
Team.prototype.Unit = function (_index) {
	return this.units[_index];
};

module.exports = Team;
