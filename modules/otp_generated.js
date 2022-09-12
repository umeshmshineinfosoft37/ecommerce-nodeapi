const OTP_GENERATE = () => {
    /*******************   GENERATING TIME  **************** */

    const expiryDatetime = new Date();
    expiryDatetime.setMinutes(expiryDatetime.getMinutes() + 1);

    /*******************  END OF  GENERATING TIME  **************** */

    otp_fun = () => {
        let uniqueNum = Math.round(Math.random() * 9999);
        const uniqueNumLength = uniqueNum.toString().length;

        if (uniqueNumLength != 4) return otp_fun();

        return uniqueNum;
    }
    return { Otp: otp_fun(), expiryDatetime };
}

module.exports = { OTP_GENERATE }