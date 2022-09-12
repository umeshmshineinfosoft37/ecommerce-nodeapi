const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken')
var bcrypt = require('bcryptjs');
const config = require('../configs/jwt-config')
const { ensureAuthenticated } = require('../modules/ensureAuthenticated')
require('dotenv').config()
const { Is_User_Exist } = require('../modules/Is_user_exist')
const { Send_Mail } = require('../helper/send_mail')
const { store_otp } = require('../helper/store_otp')
const { OTP_GENERATE } = require('../modules/otp_generated')
const User = require('../models/User');
const { profileUpload } = require('../helper/profileUpload')
const TypedError = require('../modules/ErrorHandler');
const { json } = require('body-parser');



//POST /signin
router.post('/signin', Is_User_Exist, function(req, res, next) {
    const { fullname, email, password } = req.body
    req.checkBody('fullname', 'fullname is required').notEmpty();
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();

    let missingFieldErrors = req.validationErrors();
    if (missingFieldErrors) {
        let err = new TypedError('signin error', 400, 'missing_field', {
            errors: missingFieldErrors,
        })
        return next(err)
    }
    req.checkBody('email', 'Email is not valid').isEmail();
    req.checkBody('password', 'Passwords have to match').equals(req.body.verifyPassword);
    let invalidFieldErrors = req.validationErrors()
    if (invalidFieldErrors) {
        let err = new TypedError('signin error', 400, 'invalid_field', {
            errors: invalidFieldErrors,
        })
        return next(err)
    }
    var newUser = new User({
        fullname: fullname,
        password: password,
        email: email
    });
    User.getUserByEmail(email, function(error, user) {
        if (error) return next(err)
        if (user) {
            let err = new TypedError('signin error', 409, 'invalid_field', {
                message: "user is existed"
            })
            return next(err)
        }
        User.createUser(newUser, function(err, user) {
            if (err) return next(err);
            res.json({ message: 'user created' })
        });
    })
});

//POST /login
router.post('/login', Is_User_Exist, function(req, res, next) {
    const { email, password } = req.body || {}

    if (!email || !password) {
        let err = new TypedError('login error', 400, 'missing_field', { message: "missing username or password" })
        return next(err)
    }
    User.getUserByEmail(email, function(err, user) {
        if (err) return next(err)
        if (!user) {
            let err = new TypedError('login error', 403, 'invalid_field', { message: "Incorrect email or password" })
            return next(err)
        }
        User.comparePassword(password, user.password, function(err, isMatch) {
            if (err) return next(err)
            if (isMatch) {
                let token = jwt.sign({ email: email, user_id: user.id, admin: user.admin === 'true' ? true : false },
                    config.secret, { expiresIn: process.env.JWT_EXPIRY }
                )
                res.status(200).json({
                    user_token: {
                        user_id: user.id,
                        user_name: user.fullname,
                        token: token,
                        is_admin: user.admin ? true : false,

                    }
                })
            } else {
                let err = new TypedError('login error', 403, 'invalid_field', { message: "Incorrect email or password" })
                return next(err)
            }
        })
    })
})






router.post('/resetPassword', ensureAuthenticated, async(req, res, next) => {
    const { email, password } = req.body;

    req.checkBody('email', 'email is required').notEmpty();
    req.checkBody('password', 'password is required').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();
    let invalidFieldErrors = req.validationErrors()
    if (invalidFieldErrors) {
        let err = new TypedError('Change Password error', 400, 'invalid_field', {
            errors: invalidFieldErrors,
        })
        return next(err)
    }
    User.getUserByEmail(email, function(err, user) {
        if (err) return next(err)
        if (user) {
            User.updatepassword(user.email, password, function(err, upData) {
                console.log("errr===>", err)
                if (err) throw err
                if (upData) {
                    res.status(200).json({ status: "Success", message: "Password Reset Successfuly!" });
                }
            });

        } else {
            let err = new TypedError('login error', 403, 'invalid_field', { message: "Incorrect email or password" })
            return next(err)

        }

    })

})


//Upload User Profile Pic
router.post('/profile', profileUpload.single('profile'), ensureAuthenticated, async(req, res, next) => {
    if (req.file && req.file.filename && req.body) {
        let { userId } = req.body
        const Profile = req.file.filename
        req.checkBody('userId', 'fullname is required').notEmpty();

        let invalidFieldErrors = req.validationErrors()
        if (invalidFieldErrors) {
            let err = new TypedError('signin error', 400, 'invalid_field', {
                errors: invalidFieldErrors,
            })
            return next(err)
        }
        User.UpdateProfilePic(userId, Profile, function(err, profiledata) {
            if (err) return next(err)
            res.status(200).json({
                status: "success",
                message: "profile Upload successfully!!",
                image: profiledata.Profile
            });

        })
    } else {
        let err = new TypedError('Profile error', 400, 'invalid_field', {
            message: "Image Not Upload"
        })
        return next(err)
    }

})

router.get('/:userId', ensureAuthenticated, async(req, res, next) => {
        let { userId } = req.params
        try {
            User.getUserById({ _id: userId }, (err, profiledata) => {
                if (profiledata) {

                    return res.status(200).json({ profiledata });
                } else {
                    let err = new TypedError('profile error', 404, 'not_found', { message: "create a profile first" })
                    return next(err)
                }
            })
        } catch (e) {
            if (e) return next(e)
        }
    })
    //Update User
router.post('/:userId/userprofile', ensureAuthenticated, async(req, res, next) => {
    let userId = req.params.userId
    req.checkBody('fullname', 'fullname is required').notEmpty();
    req.checkBody('email', 'email is required').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();
    let invalidFieldErrors = req.validationErrors()
    if (invalidFieldErrors) {
        let err = new TypedError('signin error', 400, 'invalid_field', {
            errors: invalidFieldErrors,
        })
        return next(err)
    }

    let ProfileData = {
        fullname,
        email,
    } = req.body;

    try {
        User.UpdateProfile(
            ({ _id: userId }),
            ProfileData,
            function(err, ProfileData) {
                if (err) return next(err)
                if (ProfileData) {
                    res.status(200).json({ data: {...ProfileData } })
                } else {
                    let err = new TypedError('profile error', 404, 'not_found', { message: "create a profile first" })
                    return next(err)
                }
            })

    } catch (e) {
        if (e) return next(e)
    }
})
module.exports = router;