const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken')
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

router.post('/forgotPasswordResetPassword', Send_Mail, OTP_GENERATE, function(req, res, next) {




    //Checking User Existence
    if (!req.is_user_exist) {
        const error = new Error('Invalid Email ID');
        error.statusCode = 400;
        throw error;
    }

    //const token = randomStringGenerator(50);
    const expiryDateTime = new Date();
    expiryDateTime.setMinutes(expiryDateTime.getMinutes() + 10);




    User.createOtp({

            email: req.body.email,



        })
        .then(user => {
            html = `<html>
    
                    <body style="margin-left: 10px;">
                        <b>Hello,</b><br/><br/>
                        <p>
                            Please click here to reset your password: ${OTP_GENERATE.Otp}
                            If you have not requested to reset your password, please destroy this email.
                        </p>
                        <p>Note: Please do not share your password with anyone, Ecommerce will never ask you for your password.</p>
                        <p>Kind Regards,<br />
                              Ecommerce </p>
                    </body>
        
                </html>`,
                Send_Mail(req.body.email, 'akashbhanderi98@gmail.com', "Reset Password Otp", html);
        })
    req.emailSubject = ` Otp `;
    next();
    return res.json({
        status: true,
        message: " Otp sent to your registered email"
    })
});
(err) => {
    console.log(err)
    res.json[{ "message": "error occur while otp send!" }]
} //End of Reset_Link_Controller 





router.post('/resetPassword', async(req, res) => {
    const email = req.body.email;
    const password = req.body.password;



    // const  forgotPasswordSendEmail = function(req , res, next) {
    //     const validationError = validationResult(req);
    //     if (!validationError.isEmpty()) {
    //         return res.status(422).json({ errors: validationError.array() });
    //     }
    try {
        //Generating hash password
        const password = await bcrypt.hash(password, 12)

        User.updatepassword(email, password, function(err, res) {
            if (err) throw err

            return res.status(201).json({ status: "Success", message: "Password reseted" });
        });



    } catch (err) {
        return res.status(400).json({ error: err.message });
    }

})


//Upload User Profile Pic
router.post('/profile', profileUpload.single('profile'), ensureAuthenticated, async(req, res, next) => {
    let { userId } = req.body
        // .log("")
    const Profile = req.file.filename
    User.UpdateProfilePic(userId, Profile, function(err, profiledata) {
        if (err) return next(err)
        res.status(200).json({
            status: "success",
            message: "profile Upload successfully!!",
        });


    })
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