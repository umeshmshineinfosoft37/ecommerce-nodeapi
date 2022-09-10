const nodemailer = require('nodemailer');

const Send_Mail = (receiver, cc, subject, body, ) => {

    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,

        auth: {
            user: "testuser@gmail.com",
            pass: "test123",
        }
    });

    mailOptions = {
        from: "akashbhanderi98@gmail.com",
        subject: subject,
        to: receiver,
        html: body,
    }
    if (cc) mailOptions.cc = cc;
    try {
        transporter.sendMail(mailOptions, (err, info) => {

            if (err) return console.log("error: ", err);

            if (info) {
                console.log("Mail Sent Successfully");
            }
        })
        return "Mail Sent Successfully";
    } catch (err) {
        return res.status(404).json({ error: err.message })
    }

}

module.exports = { Send_Mail }