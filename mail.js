const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const { OAuth2 } = google.auth

const {
    MAILER_CLIENT_ID,
    MAILER_CLIENT_SECRET,
    MAILER_REFRESH_TOKEN,
    MAILER_ADDR,
} = process.env

module.exports = async (email, code) => {
    try {
        const oAuth2Client = new OAuth2(
            MAILER_CLIENT_ID,
            MAILER_CLIENT_SECRET,
            "https://developers.google.com/oauthplayground"
        )
    
        oAuth2Client.setCredentials({
            refresh_token: MAILER_REFRESH_TOKEN
        })
    
        const accessToken = await oAuth2Client.getAccessToken()

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: 'OAuth2',
                user: MAILER_ADDR,
                clientId: MAILER_CLIENT_ID,
                clientSecret: MAILER_CLIENT_SECRET,
                refreshToken: MAILER_REFRESH_TOKEN,
                accessToken
            }
        })

        return transporter.sendMail({
            from: MAILER_ADDR,
            to: email,
            subject: "1DBM email validation",
            text: `${code} is your validation code. Enter this code on your first login to enable your account`
        })

    } catch (error) {
        throw error
    }
    
}

