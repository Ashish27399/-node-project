const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const aggregatePaginate = require('mongoose-aggregate-paginate');
const bcryptjs = require('bcryptjs')
const schema = mongoose.Schema;
const userKey = new schema({
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    email: {
        type: String
    },
    password: {
        type: String
    },
    mobileNumber: {
        type: String
    },
    message: {
        type: String
    },
    otp: {
        type: Number
    },
    amount: {
        type: Number
    },
    otpTime: {
        type: Number
    },
    image: {
        type: String
    },
    otpVerify: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ["ACTIVE", "BLOCK", "DELETE"],
        default: "ACTIVE"
    },
    userType: {
        type: String,
        enum: ["USER", "ADMIN", "SUB-ADMIN"],
        default: "USER"
    },
    curkey: {
        type: String,
    },
    multipleimage: {
        type: Array
    },
    countryCode: {
        type: String,
    },
    currencyCode: {
        type: String,
    },
    stateCode: {
        type: String,
    },
    permission: [
        {
            adminManagement: {
                type: Boolean,
                default: false
            },
            centerManagement: {
                type: Boolean,
                default: false
            },
            vaccinationManagement: {
                type: Boolean,
                default: false
            },
        }
    ],
    centerId: {
        type: mongoose.Schema.ObjectId, ref: 'center',
    },
    speakeasy: {
        type: Boolean,
        default: false
    },
    base32: {
        type: String
    },
    socialType: {
        type: String,
        enum: ["", "GOOGLE", "FACEBOOK", "TWITTER", "INSTAGRAM", "GITHUB"],
        default: ""
    },
    userName: {
        type: String
    },
},
    {
        timeStamps: true
    })
userKey.index({ location: '2dsphere' });
userKey.plugin(aggregatePaginate);
userKey.plugin(mongoosePaginate);
module.exports = mongoose.model('user', userKey);
mongoose.model('user', userKey).find({ userType: "ADMIN" }, (error, result) => {
    if (error) {
        console.log(error);
    } else if (result.length != 0) {
        console.log('Default admin already created');
    } else {
        var admindefault = {
            firstName: "Ashish",
            lastName: "Anand",
            email: "ashishanand27399@gmail.com",
            password: bcryptjs.hashSync("12345"),
            mobileNumber: "8340495845",
            amount: 100,
            status: "ACTIVE",
            userType: "ADMIN",
            otpVerify:true,
            curkey: "INR",
            countryCode: "IN",
            permission: [{
                adminManagement: true,
                centerManagement: true,
                vaccinationManagement: true
            }]
        }; 
        mongoose.model('user', userKey)(admindefault).save((saveErr, saveRes) => {
            if (saveErr) {
                console.log(saveErr);
            } else {
                console.log("Defualt admin create ", saveRes);
            }
        })
    }
})