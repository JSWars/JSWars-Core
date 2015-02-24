var User;

User = require('../model/User');

/**
 * Route to obtain current session information
 *
 * @param {Object} Request
 * @param {Object} Response
 * @constructor
 */
function Session(req, res) {

    User.findOne({
            username: req.session.username
        }
    ).exec(function (err, user) {
            if(err){
                //Something going wrong during database call :(
                res.status(500).end();
                return;
            }

            if(user){
                res.json(user);
            }else{
                res.status(403).end();
            }
        });
}

module.exports = Session;