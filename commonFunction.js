const nodemailer = require('nodemailer');
const cloudinary = require('cloudinary');
const fast2sms = require('fast-two-sms');
const multer = require('multer');
const API_KEY = "RVPXjqiOse8fuMhBHbCQ6TGLZ2SnDpcYralE3WKvdA7IU5g4t1BMu65OegpkvfUWRlGXTCJLIdPYxczm";
cloudinary.config({ cloud_name: 'dr56uxd9r', api_key: 237118615958265, api_secret: 'ktcxJY3YRKkppJxOF6pYA7trhaE' })
module.exports = {
    sendOtp: (email, subject, text, callback) => {
        var transporter = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, service: "Gmail", auth: { user: "ashishanand27399@gmail.com", pass: "8227853375" } });

        var mailOptions = { from: 'ashishanand27399@gmail.com', to: email, subject: subject, text: text };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                callback(error, null);
            } else {
                console.log('Email sent' +info.response);
                callback(null, info);
            }
        })
    },
    sendMessage: (message, mobileNumbers, callback) => {

        var options = { authorization: API_KEY, message: message, numbers: [mobileNumbers] }
        console.log(options)
        fast2sms.sendMessage(options).then(result => {
            callback(null, result)
        }).catch(err => {
            callback(err, null)
        })
    },
    sendMessage1: (message, mobileNumbers, callback) => {
        try {
            var options = { authorization: API_KEY, message: message, numbers: [mobileNumbers] }
            fast2sms.sendMessage(options, function (messRes) {
                if (messRes.error) {
                    console.log(error);
                    return callback(error, null);
                } else {
                    console.log('send message ', +messRes.body);
                    return callback(null, messRes)
                }
            })
        } catch (error) {
            console.log('catch error', error);
            return res.send({ responseCode: 501, responseMessage: "Sothing went wrong!", responseResult: error });
        }

    },
    sendOtp1: async (email, subject, text) => {
        try {
            var transporter = await nodemailer.createTransport(
                {
                    host: "smtp.gmail.com",
                    port: 465,
                    secure: true,
                    service: "Gmail",
                    auth:
                    {
                        user: "ashishanand27399@gmail.com",
                        pass: "8227853375"
                    }
                });

            var mailOptions = {
                from: 'ashishanand27399@gmail.com',
                to: email,
                subject: subject,
                text: text
            };

            const tran = await transporter.sendMail(mailOptions);
            if (tran) {
                console.log('Email sent' + tran.response)
            }
            return tran;
        } catch (error) {
            console.log('catch error' + error)
        }
    },
    uploadImg: async (img) => {
        var result = await cloudinary.v2.uploader.upload(img);
        if (result) {
            return result.secure_url;
        } else {
            console.log('image is not define')
        }
    },
    multipleimg: async (image, files) => {
        var file = await multer.diskStorage({ filename: files, diskStorage: image })
        console.log(file);
        return file;
    }
}