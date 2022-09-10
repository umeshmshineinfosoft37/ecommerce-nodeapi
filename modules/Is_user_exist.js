const { validationResult } = require('express-validator');
const User = require('../models/User');

const Is_User_Exist = (req, res, next) => {

    const validationError = validationResult(req);

    if (!validationError.isEmpty()) {
        const error = validationError.array();
        error.statusCode = 422;
        throw error;
    }

    const email = req.body.email || req.email;

    User.findOne({ where: { email: email } })
        .then(user => {

            if (!user) {
                console.log('is_user_exist', false)
                req.is_user_exist = false;
                return next();
            }
            console.log('is_user_exist', true)
            req.is_user_exist = true;
            req.userData = user;
            return next();

        }).catch(err => {
            return res.status(404).json({ error: err.message })
        })

};



module.exports = { Is_User_Exist };