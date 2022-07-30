const usermodel = require('../model/usermodel');
const centerModel = require('../model/centerModel');
const bookingModel = require('../model/bookingModel')
const bcryptjs = require('bcryptjs');
const commonFunction = require('../helper/commonFunction');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
var speakeasys = require("speakeasy");
const moment = require('moment');
module.exports = {
    //=============================================User Authentication APIs=========================================================================================
    SignUp: async (req, res) => {
        try {
            const query = ({ $and: [{ $or: [{ email: req.body.email }, { mobileNumber: req.body.mobileNumber }] }, { status: { $ne: "DELETE" }, userType: "USER" }] });
            const model = await usermodel.findOne(query)
            if (model) {
                if (req.body.email == model.email) {
                    return res.send({ responseCode: 409, responseMessage: "Email already exist" });
                } else if (req.body.mobileNumber == model.mobileNumber) {
                    return res.send({ responseCode: 409, responseMessage: "Mobile number already exist" });
                } else {
                    return res.send({ responseCode: 401, responseMessage: "Invalid email and mobile" });
                }
            } else {
                req.body.otp = Math.floor((Math.random() * 1000) + 1000)
                req.body.otpTime = new Date().getTime();
                req.body.password = bcryptjs.hashSync(req.body.password);
                subject = "OTP";
                text = `Your OTP to verify : ${req.body.otp} .It will be valid for 3 minutes.. `;
                const mail = await commonFunction.sendOtp1(req.body.email, subject, text)
                if (mail) {
                    const saveRes = await usermodel(req.body).save()
                    return res.send({ responseCode: 200, responseMessage: "successfully signUP", responseResult: saveRes })
                }
            }
        } catch (error) {
            console.log(error);
            return res.send({ responseCode: 500, responseMessage: "Something went wrong", responseResult: error })
        }
    },
    otpVerify: async (req, res) => {
        try {
            const query = ({ $and: [{ $or: [{ email: req.body.email }, { mobileNumber: req.body.mobileNumber }] }, { status: { $ne: "DELETE" }, userType: "USER" }] });
            const user = await usermodel.findOne(query)
            if (!user) {
                return res.send({ responseCode: 409, responseMessage: "Data is not exist" });
            } else {
                let currentTime = new Date().getTime();
                let diff = currentTime - user.otpTime;
                if (diff >= 3 * 60 * 1000) {
                    return res.send({ responseCode: 408, responseMessage: "Time out" });
                } else {
                    if (req.body.otp == user.otp) {
                        let updateRes = await usermodel.findByIdAndUpdate({ _id: user._id }, { $set: { otpVerify: true } }, { new: true });
                        if (updateRes) {
                            return res.send({ responseCode: 200, responseMessage: "OTP successfully verify" });
                        }
                    } else {
                        return res.send({ responseCode: 404, responseMessage: "Invalid OTP" });
                    }
                }
            }
        } catch (error) {
        
            return res.send({ responseCode: 500, responseMessage: "Something went wrong", responseResult: error })
        }
    },
    resendOtp: async (req, res) => {
        try {
            const query = ({ $and: [{ $or: [{ email: req.body.email }, { mobileNumber: req.body.mobileNumber }] }, { status: { $ne: "DELETE" }, userType: "USER" }] });
            const user = await usermodel.findOne(query)
            if (!user) {
                return res.send({ responseCode: 409, responseMessage: "Data is not exist" });
            } else {
                let otpCode = Math.floor((Math.random() * 1000) + 1000);
                let otpTime = new Date().getTime();
                let updateRes = await usermodel.findByIdAndUpdate({ _id: user._id }, { $set: { otp: otpCode, otpTime: otpTime, otpVerify: false } }, { new: true });
                if (updateRes) {
                    subject = "OTP";
                    text = `Your OTP to verify : ${otpCode} .It will be valid for 3 minutes.. `;
                    const mail = await commonFunction.sendOtp1(req.body.email, subject, text)
                    if (mail) {
                        return res.send({ responseCode: 200, responseMessage: "Resend Otp successfully", responseResult: `${otpCode}` });
                    }
                }
            }
        } catch (error) {
            return res.send({ responseCode: 500, responseMessage: "Something went wrong", responseResult: error })
        }
    },
    forgotPassword: async (req, res) => {
        try {
            const query = ({ $and: [{ $or: [{ email: req.body.email }, { mobileNumber: req.body.mobileNumber }] }, { status: { $ne: "DELETE" }, userType: "USER" }] });
            const user = await usermodel.findOne(query)
            if (!user) {
                return res.send({ responseCode: 409, responseMessage: "Data is not exist" });
            } else {
                let otp = Math.floor((Math.random() * 1000) + 1000);
                let otpTime = new Date().getTime();
                subject = "OTP";
                text = `Your OTP to verify : ${otp} .It will be valid for 3 minutes.. `;
                const mail = await commonFunction.sendOtp1(req.body.email, subject, text)
                if (mail) {
                    let updateRes = await usermodel.findByIdAndUpdate({ _id: user._id }, { $set: { otp: otp, otpTime: otpTime, otpVerify: false } }, { new: true });
                    if (updateRes) {
                        return res.send({ responseCode: 200, responseMessage: "Forgot successfully", responseResult: `${otp}` })
                    }
                }
            }
        } catch (error) {
            console.log(error)
            return res.send({ responseCode: 500, responseMessage: "Something went wrong", responseResult: error })
        }
    },
    resetPassword: async (req, res) => {
        const query = ({ $and: [{ $or: [{ email: req.body.email }, { mobileNumber: req.body.mobileNumber }] }, { status: { $ne: "DELETE" }, userType: "USER" }] });
        const user = await usermodel.findOne(query)
        if (!user) {
            return res.send({ responseCode: 409, responseMessage: "Data is not exist" });
        } else {
            if (user.otpVerify == true) {
                return res.send({ responseCode: 409, responseMessage: "Password already change" });
            } else {
                let currentTime = new Date().getTime();
                let diff = currentTime - user.otpTime;
                if (diff >= 3 * 60 * 1000) {
                    return res.send({ responseCode: 408, responseMessage: "Time out" });
                } else {
                    if (req.body.otp == user.otp) {
                        if (req.body.confirmPassword == req.body.newPassword) {
                            let updateRes = await usermodel.findByIdAndUpdate({ _id: user._id }, { $set: { password: bcryptjs.hashSync(req.body.newPassword), otpVerify: true } }, { new: true });
                            if (updateRes) {
                                return res.send({ responseCode: 200, responseMessage: "Reset Password successfully" });
                            }
                        } else {
                            return res.send({ responseCode: 200, responseMessage: "Confirm and newpassword not matched" });
                        }
                    } else {
                        return res.send({ responseCode: 401, responseMessage: "Invalid OTP" })
                    }
                }
            }
        }
    },
    login: async (req, res) => {
        try {
            const resp = await usermodel.findOne({ email: req.body.email, status: "ACTIVE", userType: "USER" });
                if (!resp) {
                    return res.send({ responseCode: 409, responseMessage: "user not exist" });
                } else {
                    if(resp.otpVerify==false){
                        return res.send({ responseCode: 409, responseMessage: "otp not verified" ,responseResult:[]}); 
                    }else{
                        passcheck = bcryptjs.compareSync(req.body.password, resp.password);
                   if (passcheck == false) {
                        return res.send({ responseCode: 401, responseMessage: "Invalid  password" });
                    } else {
                        var token = jwt.sign({ _id: resp._id, email: resp.email }, 'secretkey', { expiresIn: '24h' });
                        var data = { token: token, _id: resp._id, email: resp.email }
                        return res.send({ responseCode: 200, responseMessage: "Successfully login", responseResult: data });
                    }
                }
            }

        } catch (error) {
            return res.send({ responseCode: 501, responseMessage: "Something went wrong", responseResult: error });
        }
    },
    editProfile: async (req, res) => {
        try {
            let query = { _id: req.userId, status: { $ne: "DELETE" } ,userType: "USER" };
            let user = await usermodel.findOne(query);
            if (!user) {
                return res.send({ reponseCode: 404, responseMessage: 'User not found .', responseResult: [] });
            } else {
                
                let userCheck = await usermodel.findOne(query);
                if (req.body.email!=user.email) {
                    let updateUser = await usermodel.findByIdAndUpdate({ _id: user._id }, { $set: req.body }, { new: true })
                    if (updateUser) {
                        return res.send({ reponseCode: 200, responseMessage: 'Succesfully updated', responseResult: updateUser });
                    }
                }
                else {
                    if (req.body.email == userCheck.email) {
                        return res.send({ reponseCode: 409, responseMessage: 'Email already in use.', responseResult: [] });
                    }
                }
            }
        } catch (error) {
            
            return res.send({ reponseCode: 501, responseMessage: 'Something went wrong', responseResult: error.message });
        }
    },
    getProfile: (req, res) => {
        usermodel.findOne({ _id: req.userId, userType: "USER" }, (not, result) => {
            if (not) {
                return res.send({ responseCode: 409, responseMessage: "user not exist" });
            } else {
                return res.send({ responseCode: 200, responseMessage: "Fatch data ", responseResult: result });
            }
        })
    },
    userCenterview: async (req, res) => {
        try {
            let user = usermodel.findOne({ _id: req.userId, userType: "USER" });
            if (user) {
                let query = { status: "ACTIVE" };
                query.$or = [
                    { name: { $regex: req.body.search, $options: 'i' } },
                    { address: { $regex: req.body.search, $options: 'i' } },
                ];
                let options = {
                    limit: parseInt() || 10,
                    page: parseInt() || 1,
                    sort: { createAt: -1 },
                };
                let listData = await centerModel.paginate(query, options);
                if (listData.docs.length != 0) {
                    return res.send({ responseCode: 200, responseMessage: "Search data found", responseResult: listData });
                } else {
                    return res.send({ responseCode: 404, responseMessage: "Search data not found" });
                }
            }
        } catch (error) {
            
            return res.send({ responseCode: 501, responseMessage: "Something went wrong" ,responseResult:error.message});
        }
    },
    userCenterList: async (req, res) => {
        try {
            let user = usermodel.findOne({ _id: req.userId, userType: "USER" });
            if (user) {
                let query = { status: { $ne: "DELETE" } }
                let options = {
                    limit: parseInt(req.body.limit) || 10,
                    page: parseInt(req.body.page) || 1,
                    sort: { createAt: -1 },
                };
                let pagi = await centerModel.paginate(query, options);
                if (pagi.docs.length != 0) {
                    return res.send({ responseCode: 200, responseMessage: "Data fetch Successfully", responseResult: pagi });
                } else {
                    return res.send({ responseCode: 409, responseMessage: "Data is not exist" });
                }
            }
        } catch (error) {
            console.log(error)
            return res.send({ responseCode: 5001, responseMessage: "Something went wrong" });
        }
    },
    //======================================Two Authentications APIs=================================================================================================
    twoFAGen: async (req, res) => {
        try {
            let user = await usermodel.findOne({ _id: req.userId });
            if (!user) {
                return res.send({ responseCode: 409, responseMessage: "user is not exist" });
            } else {
                if (req.body.speakeasy == "true") {
                    var secret = speakeasys.generateSecret({ length: 20 });
                    var url = speakeasys.otpauthURL({ secret: secret.ascii, label: user.email, algorithm: 'sha512' });
                    console.log(secret)
                    userString = user.toString()
                    //let data_url = await QRCode.toDataURL(secret.otpauth_url);
                    let data_url = await QRCode.toDataURL(url);
                    console.log(data_url);
                    let updateRes = await usermodel.findByIdAndUpdate({ _id: user._id }, { $set: { speakeasy: true, base32: secret.base32 } }, { new: true });
                    if (updateRes) {
                        return res.send({ responseCode: 200, responseMessage: "Two authentication True ", responseResult: data_url });
                    }
                } else {
                    return res.send({ responseCode: 409, responseMessage: "Two authentication false" });
                }
            }
        } catch (error) {
            console.log(error)
            return res.send({ responseCode: 501, responseMessage: "Something went wrong", responseResult: error.message });
        }
    },
    twoFALogin: async (req, res) => {
        try{
        let user = await usermodel.findOne({ email: req.body.email });
        if (!user) {
            return res.send({ responseCode: 409, responseMessage: "user is not exist" });
        } else {
            if (user.otpVerify == true) {
                if (user.speakeasy == true) {
                    passcheck = bcryptjs.compareSync(req.body.password, user.password);
                    if (passcheck == false) {
                        return res.send({ responseCode: 401, responseMessage: "Invalid  password" });
                    } else {
                        var token = jwt.sign({ _id: user._id, email: user.email }, 'secretkey', { expiresIn: '12h' });
                        var data = { token: token, _id: user._id, email: user.email }
                        var verified = await speakeasys.totp.verify({
                            secret: user.base32,
                            encoding: 'base32',
                            token: req.body.userToken
                        });
                    return res.send({ responseCode: 200, responseMessage: "Successfully Login", responseResult: data, verified });
                    }}}}}
                        catch(error){
                            return res.send({ responseCode: 409, responseMessage: "two authentication not verified" ,responseResult:error.message});

                        }
                    },
    //======================================Booking User APIs=========================================================================================================
    findNearestCenter: async (req, res) => {
        try {
            let user = usermodel.findOne({ _id: req.userId, userType: "USER" });
            if (user) {
                var max;
                var min;
                var query = { status: "ACTIVE" }
                if (query) {
                    if (req.body.flag == 0) {
                        max = 1000 * 5
                        min=0*1000
                    } else if (req.body.flag == 1) {
                        max = 1000 * 10
                        min=1000*5
                    } else if (req.body.flag == 2) {
                        max = 1000 * 20
                        min=1000*10
                    } else if (req.body.flag == 3) {
                        max = 1000 * 40
                        min=1000*20
                    } else if (req.body.flag == 4) {
                        max = 1000 * 50
                        min=1000*40
                    }
                    let aggregate = usermodel.aggregate([{
                        "$geoNear": {
                            "near": {
                                "type": "Point",
                                "coordinates": [req.body.location.coordinates[0], req.body.location.coordinates[1]]
                            },
                            "maxDistance": max,
                            "minDistance": min,
                            "spherical": true,
                            "distanceField": "dist.calculated",
                            "includeLocs": "dist.location"
                        }
                    },])
                    let options = {
                        page: parseInt(req.body.page) || 1,
                        limit: parseInt(req.body.limit) || 10,
                        sort: { createAt: -1 },
                    }
                    var result = await centerModel.aggregatePaginate(aggregate, options)
                    if (result.docs.length == 0) {
                        return res.send({ responseCode: 404, responseMessage: "Nearest center not found" });
                    } else {
                        return res.send({ responseCode: 200, responseMessage: "ALL Nearest center ", responseResult: result });
                    }
                } else {
                    return res.send({ responseCode: 404, responseMessage: "center not exist" });
                }
            } else {
                return res.send({ responseCode: 404, responseMessage: "Data not exist" });
            }
        } catch (error) {
            console.log(error)
            return res.send({ responseCode: 501, responseMessage: "Something went wrong" });
        }
    },
    booking: async (req, res) => {
        try {
            var user = await usermodel.findOne({ _id: req.userId, userType: "USER" });
            if (!user) {
                return res.send({ responseCode: 409, responseMessage: "Data is not exist" });
            } else {
                let center = await centerModel.findOne({ _id: req.body.centerId })
                if (!center) {
                    return res.send({ responseCode: 409, responseMessage: "Center not found" });
                } else {
                    if (center.slots == 0) {
                        return res.send({ responseCode: 409, responseMessage: "Slots not available" });
                    }
                    const booked = await bookingModel.findOne({ userId: user._id })
                    if (booked) {
                        return res.send({ responseCode: 401, responseMessage: "Already Booking  exist" });
                    } else {
                        var a = new Date(req.body.bookingDate);
                        var now = new Date();
                        if (a >= now) {
                            var n = a.getDay();
                            if ((n === 0)) {
                                return res.send({ responseCode: 401, responseMessage: "This date is weekend" })
                            } else {
                                const query = ({ $and: [{ slotTimes: req.body.slotTimes }, { bookingDate: req.body.bookingDate }] });
                                const book = await bookingModel.findOne(query)
                                if (book) {
                                    return res.send({ responseCode: 401, responseMessage: "Slots Already Booking  exist" });
                                } else {
                                    req.body.userId = user._id
                                    req.body.email = user.email
                                    const saveRes = await bookingModel(req.body).save()
                                    subject = "Appointment";
                                    text = `Your Booking ID: ${saveRes._id} .You are wait for confimation `;
                                    const mail = await commonFunction.sendOtp1(user.email, subject, text)
                                    if (mail) {
                                        await centerModel.findByIdAndUpdate({ _id: center._id }, { $set: { slots: center.slots - 1 } }, { new: true });
                                        return res.send({ responseCode: 200, responseMessage: "Booking Successfully", responseResult: saveRes });
                                    } else {
                                        return res.send({ responseCode: 401, responseMessage: "Not Booking" });
                                    }
                                }
                            }
                        } else {
                            return res.send({ responseCode: 401, responseMessage: "Please enter future data" })
                        }
                    }
                }
            }
        } catch (error) {
            console.log(error)
            return res.send({ responseCode: 501, responseMessage: "Something went wrong", responseResult: error });
        }
    },
    bookingProfile: async (req, res) => {
        try {
            let user = await usermodel.findOne({ _id: req.userId, userType: "USER" })
            if (!user) {
                return res.send({ responseCode: 409, responseMessage: "Data is not exist" });
            } else {
                let book = await bookingModel.findOne({ userId: user._id });
                if (book) {
                    return res.send({ responseCode: 200, responseMessage: "Get profile successfull", responseResult: book })
                } else {
                    return res.send({ responseCode: 200, responseMessage: "PENDING" })
                }
            }
        } catch (error) {
            console.log(error)
            return res.send({ responseCode: 501, responseMessage: "somehting went wrong", responseResult: error });
        }
    },
    bookingCancel: async (req, res) => {
        try {
            var user = await usermodel.findOne({ _id: req.userId, userType: "USER" });
            if (!user) {
                return res.send({ responseCode: 409, responseMessage: "Data is not exist" });
            } else {
                var approved = await bookingModel.findOne({ _id: req.body._id });
                if (!approved) {
                    return res.send({ responseCode: 409, responseMessage: "Booking ID is not exist" });
                } else {
                    if (approved.status == "BOOKED" || approved.status == "PENDING") {
                        let dose = await centerModel.findOne({ _id: approved.centerId })
                        await centerModel.findByIdAndUpdate({ _id: dose._id }, { $set: { slots: dose.slots + 1 } }, { new: true });
                        await bookingModel.findByIdAndUpdate({ _id: approved._id }, { $set: { status: "CANCEL" } }, { new: true });
                        subject = "Cancel"
                        text = `your booking id :${req.body._id} have been Cancel.`
                        const mail = await commonFunction.sendOtp(user.email, subject, text)
                        return res.send({ responseCode: 200, responseMessage: "Cancel successfully" });
                    } else {
                        return res.send({ responseCode: 200, responseMessage: "Already Cancel successfully" });
                    }
                }
            }
        } catch (error) {
            console.log(error)
            return res.send({ responseCode: 501, responseMessage: "somehting went wrong", responseResult: error });
        }
    },
    reschedule: async (req, res) => {
        try {
            var user = await usermodel.findOne({ _id: req.userId, userType: "USER" });
            if (!user) {
                return res.send({ responseCode: 409, responseMessage: "Data is not exist" });
            } else {
                let center = await centerModel.findOne({ _id: req.body.centerId, dates: req.body.bookingDate });
                if (!center) {
                    return res.send({ responseCode: 409, responseMessage: "Center and Datas not found" });
                } else {
                    if (center.slots == 0) {
                        return res.send({ responseCode: 409, responseMessage: "Slots not available" });
                    }
                    const booked = await bookingModel.findOne({ userId: user._id })
                    if (booked) {
                        var a = new Date(req.body.bookingDate);
                        var now = new Date();
                        if (a >= now) {
                            var n = a.getDay();
                            if ((n === 0)) {
                                return res.send({ responseCode: 401, responseMessage: "This date is weekend" })
                            } else {
                                const query = ({ $and: [{ slotTimes: req.body.slotTimes }, { bookingDate: req.body.bookingDate }] });
                                const book = await bookingModel.findOne(query)
                                if (book) {
                                    return res.send({ responseCode: 401, responseMessage: "Slots Already Booking  exist" });
                                } else {
                                    req.body.userId = user._id
                                    req.body.email = user.email
                                    saveRes=await bookingModel.findByIdAndUpdate({ _id: booked._id }, { $set: (req.body) }, { new: true });
                                    //const saveRes = await bookingModel(req.body).save()
                                    subject = "Appointment";
                                    text = `Please Find the Details Booking ID: ${booked._id} \n user email:${user.email} \n user Id: ${user._id} \n user name:${user.firstName} \n center name:${center.centerName}\n selection Date :${booked.bookingDate} \n selection Time :${booked.slotTimes} . waiting for Approval `;
                                    const mail = await commonFunction.sendOtp1(center.adminsubadminemail, subject, text)
                                    if (mail) {
                                        await centerModel.findByIdAndUpdate({ _id: center._id }, { $set: { slots: center.slots - 1 } }, { new: true });
                                        return res.send({ responseCode: 200, responseMessage: "Booking Successfully", responseResult: saveRes });
                                    } else {
                                        return res.send({ responseCode: 401, responseMessage: "Not Booking" });
                                    }
                                }
                            }
                        } else {
                            return res.send({ responseCode: 401, responseMessage: "Please enter future data" })
                        }
                    } else {
                        return res.send({ responseCode: 401, responseMessage: "Please first go booking api then reschedule date and time" });
                    }
                }
            }
        } catch (error) {
            console.log(error)
            return res.send({ responseCode: 501, responseMessage: "Something went wrong", responseResult: error });
        }
    },
}