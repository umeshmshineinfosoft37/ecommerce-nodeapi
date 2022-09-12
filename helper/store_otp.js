// const User = require('../models/User')
// const { validationResult } = require('express-validator');
// const { OTP_GENERATE } = require('../modules/otp_generated')();
// const {Send_mail} = require('../helper/send_mail')

// const store_otp_controller = async(req, res, next) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         return res.status(422).json({ errors: errors.array() });
//     }

//     try {
//         const otp = OTP_GEN.Otp;
//         // html = `<html>

//         //     <body style="margin-left: 10px;">
//         //         <b>Hello,</b><br/><br/>
//         //         <p>
//         //             Please click here to reset your password: ${OTP_GEN.Otp}
//         //             If you have not requested to reset your password, please destroy this email.
//         //         </p>
//         //         <p>Note: Please do not share your password with anyone, shoppingApp will never ask you for your password.</p>
//         //         <p>Kind Regards,<br />
//         //               ShoppingApp </p>
//         //     </body>

//         // </html>`,
//         //     SendMail(req.body.emailAddress, 'akashbhanderi98@gmail.com', "Reset Password Otp", html);



//         const email = req.body.email;
//         if (!otp) return res.status(422).json({ errors: 'Something went wrong. Please try again' });
//         const otpExists = await User.findOne({ where: { email: email } })

//         if (!otpExists) {
//             const createOtp = await User.create({
//                 otp: otp,
//                 email: email,
//             })
//         }
//         console.log(otp)
//         const otpId = otpExists.id;
//         const userOtp = await User.findByPk(otpId)
//         userOtp.otp = otp;
//         userOtp.save();
//         req.smsMessage = `Your Otp is ${otp}`;
//         next();
//         return res.json({
//             message: "Otp is Send",
//             data: otp
//         })
//     } catch (err) {
//         return res.status(422).json({ error: err.message });
//     }
// }

// module.exports = store_otp_controller