/**
 * Mueve la unidad
 *
 * Move the unit
 * @param {Unit} _unit
 */
Agent.prototype.move = function(){

    var moveDistance;

    moveDistance=this.speed;
    /**
     * Actualiza la posición de la unidad usando path y moveTo
     *
     * Update the unit's position using path and moveTo
     */
    //Mientras
    while(moveDistance>0&&this.moveTo.length!==0){
        //Si la unidad no tiene path o no ha llegado a su destino.
        if(this.path.length===0)
        {
            //Obtenemos destino y calculamos path
            this.path=this.game.map.getPath(this.position.clone().floor(),this.moveTo[0].clone());

            if(this.path.length===0){
                console.log("ERROR DE LA MUERTEEEEE");
            }
        }

        if(this.path.length>0){
            var nextPos,vNextPos;
            /**
             * Obtenemos la siguiente posición del path que está a la vista.
             * @type {Vector2D}
             */
            nextPos = new Vector2D(this.path[0][0]+0.5,this.path[0][1]+0.5);

            //CALCULAR SIGUIENTE POSICION DEL PATH QUE checkObsFreeDistance !=-1
            vNextPos = nextPos.subtract(this.position);

            //Si con moveDistance llegamos al siguiente path avanzamos hasta el siguiente path.
            if(vNextPos.mag()<moveDistance) {
                //Asignamos la nueva posicion
                this.position = new Vector2D(this.path[0][0]+0.5, this.path[0][1]+0.5);
                //Eliminamos la posición del path
                this.path.splice(0, 1);

                if(this.path.length===0){
                    this.moveTo.splice(0,1);
                }

            }else{
                this.position=this.position.add(vNextPos.normalize().multiply(moveDistance));
            }

            moveDistance -= vNextPos.mag();
        }

    }
};