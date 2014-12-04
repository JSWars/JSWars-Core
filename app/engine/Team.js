"use strict";
var Vector2D,Entity;




Vector2D = require("./vendor/Vector2D");
Entity = require("./Unit");

/**
 * Representa un equipo
 * @param _name Nombre del equipo
 * @param _entityNumber Número de entidades
 * @constructor Crear un equipo con las caracteristicas especificadas
 */
function Team(_name) {
    this.alive = true;
    this.name = (_name && _name.trim()) || "Guest";
    this.units = {};



}

/**
 * Añade una unidad al equipo
 * @param {Unit} _unit
 */
Team.prototype.addUnit=function(_unit){
  this.units.push(_unit);
};






/**
 * GETTERS && SETTERS
 */


/**
 * Devuelve si el equipo sobrevive o no
 * @returns True si está vivo, false si no
 */
Team.prototype.isAlive = function () {
    return this.alive;
};

/**
 * Permite establecer si el equipo sobrevive o no
 * @param _alive
 */
Team.prototype.setAlive = function(_alive){
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
 * Devulve un tanque por su identificador
 * @param Identificador
 * @returns Tanque
 */
Team.prototype.getTank = function (id) {
    return this.tanks[id];
};

module.exports = Team;
