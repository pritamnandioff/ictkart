const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require('path');
module.exports = {
    Email: async (email,reply) => {
        const parms = {
            title: "ICT",
            reply: reply
        }
        const file = path.join(__dirname, `../views/queryReply.ejs`);
        const data = await ejs.renderFile(file, parms);
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: "ictkart@gmail.com",
                pass: "upmtkytafnaxhltn"
                // pass: "pjyvyoqdurbcbmne"upmtkytafnaxhltn
            }, tls: {
                rejectUnauthorized: false
            }
        });
        var mailoptions = {
            from: 'ictkart@gmail.com',
            to: email,
            subject: 'ICTKarts',
            html: data,
            text: 'Reply from ICTKarts'
        };
        transporter.sendMail(mailoptions, (error, info) => {
            if (error) {
                console.log(error);
                console.log('failed');

                return 0
            }
            else {
                console.log('sent ');

                return 1;
            }
        });
    },
    otpMail: async (email, otp) => {
        const parms = {
            title: "ICT",
            OTP: otp
        }
        const file = path.join(__dirname, `../views/otp.ejs`);
        const data = await ejs.renderFile(file, parms);
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: "ictkart@gmail.com",
                pass: "upmtkytafnaxhltn"
            }, tls: {
                rejectUnauthorized: false
            }
        });
        var mailoptions = {
            from:  "ictkart@gmail.com",
            to: email,
            subject: 'ICTKarts',
            html: data,
            text: `Welcome, Your OTP number is ${otp}`
        };
        transporter.sendMail(mailoptions, (error, info) => {
            if (error) {
                console.log(error);
                console.log('failed');

                return 0
            }
            else {
                console.log('sent ');

                return 1;
            }
        });
    },
    RegistrationEmail: async (userObj,otp) => {
        const parms = {
            title: "ICT",
            BASE_URL: `https://ictkart.com/web/user/activate/${userObj._id}`,
            OTP: otp
        }
        const file = path.join(__dirname, `../views/verifyAccount.ejs`);
        const data = await ejs.renderFile(file, parms);
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            // port: 587,
            // ignoreTLS: false,
            // secure: false,
            auth: {
                user: "ictkart@gmail.com",
                pass: "upmtkytafnaxhltn"
            },
            tls: {
                rejectUnauthorized: false
            }
        });
        var mailoptions = {
            from: 'ictkart@gmail.com',
            to: userObj.email,
            subject: 'ICTKarts',
            html: data
        };
        transporter.sendMail(mailoptions, (error, info) => {
            if (error) {
                console.log('failed', error);
                return 0
            }
            else {
                console.log('sent ');
                return 1;
            }
        });
    },
    forgotPasswordEmail: (email, password) => {
        console.log(email, password);

        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: "ictkart@gmail.com",
                pass: "upmtkytafnaxhltn"
            }, tls: {
                rejectUnauthorized: false
            }
        });
        var mailoptions = {
            from: "ictkart@gmail.com",
            to: email,
            subject: 'New Paasword',
            text: `Your new password is :-${password}`
        };
        transporter.sendMail(mailoptions, (error, info) => {
            if (error) {
                console.log('failed');

                return 0
            }
            else {
                console.log('sent ');

                return 1;
            }
        });
    },
    EmailAttachment: async (email, message, filename) => {
        const parms = {
            title: "ICT-karts",
            BASE_URL: message,
        }
        // const file = path.join(__dirname, `../views/orderStatus.ejs`);
        // const data = await ejs.renderFile(file, parms);

        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: "ictkart@gmail.com",
                pass: "upmtkytafnaxhltn"
            }, tls: {
                rejectUnauthorized: false
            }
        });
        var mailoptions = {
            from: 'ictkart@gmail.com',
            to: email,
            subject: 'invoice generated',
            text: message,
            // html: data,
            attachments: [{ 'filename': "invoice generated", 'content': filename }]
        };
        transporter.sendMail(mailoptions, (error, info) => {
            if (error) {
                console.log('failed');
                return 0
            }
            else {
                console.log('sent ');
                return 1;
            }
        });
    },
    emailNotification: async (email,obj) => {
        const parms = {
            title: "ICT",
            // BASE_URL: `http://3.20.139.101/web/user/activate/${userObj._id}`,
            data: obj
        }
        const file = path.join(__dirname, `../views/orderNotification.ejs`);
        const data = await ejs.renderFile(file, parms);
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            // port: 587,
            // ignoreTLS: false,
            // secure: false,
            auth: {
                user: "ictkart@gmail.com",
                pass: "upmtkytafnaxhltn"
            },
            tls: {
                rejectUnauthorized: false
            }
        });
        var mailoptions = {
            from: 'ictkart@gmail.com',
            to: email,
            subject: 'ICTKarts',
            html: data
        };
        transporter.sendMail(mailoptions, (error, info) => {
            if (error) {
                console.log('failed', error);
                return 0
            }
            else {
                console.log('sent ');
                return 1;
            }
        });
    }
}