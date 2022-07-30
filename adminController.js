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
    //==========================================Admin Management APIs==============================================================================================
    adminLogin: async (req, res) => {
        try {
            
                const resp = await usermodel.findOne({ email: req.body.email, status: "ACTIVE", userType: "ADMIN" });
                
                if (!resp) {
                    return res.send({ responseCode: 409, responseMessage: "user not exist" });
                } else {
                    passcheck = bcryptjs.compareSync(req.body.password, resp.password);
                    
                    if (passcheck == false) {
                        return res.send({ responseCode: 401, responseMessage: "Invalid  password" });
                    } else {
                        var token = jwt.sign({ _id: resp._id, email: resp.email }, 'secretkey', { expiresIn: '24h' });
                    var data = { token: token, _id: resp._id, email: resp.mail }
                        return res.send({ responseCode: 200, responseMessage: "Successfully login", responseResult: data });
                    }
                }
            

        } catch (error) {
            return res.send({ responseCode: 501, responseMessage: "Something went wrong", responseResult: error });
        }
    },
    userList: async (req, res) => {
        try {
            user = await usermodel.findOne({ _id: req.userId, userType: "ADMIN" });
            if (!user) {
                return res.send({ responseCode: 409, responseMessage: "user is not exist" });
            } else {
                let query = { status: { $ne: "DELETE" }, userType: "USER" }
                let options = {
                    limit: parseInt(req.body.limit) || 10,
                    page: parseInt(req.body.page) || 1,
                    sort: { createAt: -1 }
                };
                let pagi = await usermodel.paginate(query, options);
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
    subAdminList: async (req, res) => {
        try {
            user = await usermodel.findOne({ _id: req.userId, userType: "ADMIN" });
            if (!user) {
                return res.send({ responseCode: 409, responseMessage: "user is not exist" });
            } else {
                let query = { status: { $ne: "DELETE" }, userType: "SUB-ADMIN" }
                let options = {
                    limit: parseInt(req.body.limit) || 10,
                    page: parseInt(req.body.page) || 1,
                    sort: { createAt: -1 }
                };
                let pagi = await usermodel.paginate(query, options);
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
    addSub_admin: (req, res) => {
        try {
            usermodel.findOne({ _id: req.userId, userType: { $ne: "USER" } }, (error1, result1) => {
                if (error1) {
                    return res.send({ responseCode: 500, responseMessage: "Internal server error", responseResult: error1 });
                } else {
                    if (result1.permission[0].adminManagement == true) {
                        const query = ({ $and: [{ $or: [{ email: req.body.email }, { mobileNumber: req.body.mobileNumber }] }, { status: { $ne: "DELETE" } }] });
                        usermodel.findOne(query, (error2, result2) => {
                            if (error2) {
                                return res.send({ responseCode: 500, responseMessage: "Internal server error", responseResult: error2 });
                            } else if (result2) {
                                if (req.body.email == result2.email) {
                                    return res.send({ responseCode: 409, responseMessage: "Email already exist" });
                                } else if (req.body.mobileNumber == result2.mobileNumber) {
                                    return res.send({ responseCode: 409, responseMessage: "mobile number already exist" });
                                } else {
                                    return res.send({ responseCode: 401, responseMessage: "Invalid email and mobile" });
                                }
                            } else {
                                req.body.otp = Math.floor((Math.random() * 1000) + 1000);
                                req.body.otpTime = new Date().getTime();
                                text = `Dear user , your otp for verification is  ${req.body.otp} and after that login with your password :${req.body.password} .it will be valid for 3 minutes.. `;
                                req.body.password = bcryptjs.hashSync(req.body.password);
                                new usermodel(req.body).save((saveErr, saveRes) => {
                                    if (saveErr) {
                                        return res.send({ responseCode: 500, responseMessage: "Internal server error" });
                                    } else {
                                        subject = "OTP";
                                        commonFunction.sendOtp(saveRes.email, subject, text, (emailErr, emailRes) => {
                                            if (emailErr) {
                                                return res.send({ responseCode: 500, responseMessage: "Internal server error," });
                                            } else {
                                                return res.send({ responseCode: 200, responseMessage: "Add sub-admin successfully", responseResult: saveRes });
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    } else {
                        return res.send({ responseCode: 403, responseMessage: "Admin have not permission" });
                    }
                }
            })
        } catch (error) {
            console.log(error, "error catch");
            return res.send({ responseCode: 501, responseMessage: "Something went wrong!", responseResult: error })
        }
    },
    activeblock: (req, res) => {
        try {
            usermodel.findOne({ _id: req.userId, userType: { $ne: "USER" } }, (error, result) => {
                if (error) {
                    return res.send({ responseCode: 500, responseMessage: "Internal server error" });
                } else if (!result) {
                    return res.send({ responseCode: 401, responseMessage: "user is not exist" });
                } else {
                    if (result.permission[0].adminManagement == true) {
                        usermodel.findOne({ _id: req.body._id }, (error1, result1) => {
                            if (error1) {
                                return res.send({ responseCode: 500, responseMessage: "Internal server error" });
                            } else {
                                if (result1.status == "ACTIVE") {
                                    usermodel.findByIdAndUpdate({ _id: result1._id }, { $set: { status: "BLOCK" } }, { new: true }, (updateErr, updateRes) => {
                                        if (updateErr) {
                                            return res.send({ responseCode: 500, responseMessage: "Internal server error" });
                                        } else {
                                            return res.send({ responseCode: 200, responseMessage: "BLOCK successfully", responseResult: updateRes });
                                        }
                                    })
                                } else {
                                    usermodel.findByIdAndUpdate({ _id: result1._id }, { $set: { status: "ACTIVE" } }, { new: true }, (updateErr1, updateRes1) => {
                                        if (updateErr1) {
                                            return res.send({ responseCode: 500, responseMessage: "Internal server error" });
                                        } else {
                                            return res.send({ responseCode: 200, responseMessage: "ACTIVE successfully", responseResult: updateRes1 });
                                        }
                                    })
                                }
                            }
                        })
                    }
                }
            })
        } catch (error) {
            console.log(error);
            return res.send({ responseCode: 501, responseMessage: "Something went error" });
        }
    },
    AdmineditProfile:async (req, res) => {
        try {
            let query = {_id: req.userId, status: { $ne: "DELETE" }, userType: "ADMIN" };
            let user = await usermodel.findOne(query);
            if (!user) {
                return res.send({ reponseCode: 404, responseMessage: 'ADMIN not found .', responseResult: [] });
            }else{
                    let updateUser = await usermodel.findByIdAndUpdate({ _id: user._id }, { $set: req.body }, { new: true })
                    if (updateUser) {
                        return res.send({ reponseCode: 200, responseMessage: 'Succesfully updated', responseResult: updateUser });
                    }
                }}catch (error) {
            return res.send({ reponseCode: 501, responseMessage: 'Something went wrong', responseResult: error.message });
        }
    },
    AdmingetProfile:async (req, res) => {
        try {
            let usersData = await usermodel.findOne({ _id: req.userId, status: { $ne: 'DELETE' } ,userType:'ADMIN'})
            if (!usersData) {
                    res.send({ responseCode: 404, responseMessage: 'ADMIN  not found!', responseResult: [] })
                } else{
                res.send({ responseCode: 200, responseMessage: "ADMIN data found successfully", responseResult:usersData })
            }}
         catch (error) {
            return res.send({ responseCode: 501, responseMessage: "Something went wrong!", responseResult: error.message, });
        }
    },
    //=======================================Sub Admin Management APIs==============================================================================================
    subAdminotpVerify: async (req, res) => {
        try {
            const query = { $and: [{ $or: [{ email: req.body.email }, { mobileNumber: req.body.mobileNumber }] }, { userType: "SUB-ADMIN" }] };
            const user = await usermodel.findOne(query)
            if (!user) {
                return res.send({ responseCode: 409, responseMessage: "user is not exist" });
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
            console.log(error);
            return res.send({ responseCode: 500, responseMessage: "Something went wrong", responseResult: error })
        }
    },
    subAdminresend: async (req, res) => {
        try {
            const query = { $and: [{ $or: [{ email: req.body.email }, { mobileNumber: req.body.mobileNumber }] }, { userType: "SUB-ADMIN" }] };
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
    subAdminforgotPassword: async (req, res) => {
        try {
            const query = { $and: [{ $or: [{ email: req.body.email }, { mobileNumber: req.body.mobileNumber }] }, { userType: "SUB-ADMIN" }] };
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
        
            return res.send({ responseCode: 500, responseMessage: "Something went wrong", responseResult: error })
        }
    },
    subAdminresetPassword: async (req, res) => {
        const query = { $and: [{ $or: [{ email: req.body.email }, { mobileNumber: req.body.mobileNumber }] }, { userType: "SUB-ADMIN" }] };
        const user = await usermodel.findOne(query)
        if (!user) {
            return res.send({ responseCode: 409, responseMessage: "user is not exist" });
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
    subAdminlogin: async (req, res) => {
        try {
            return new Promise(async (resolve, reject) => {
                const resp = await usermodel.findOne({ email: req.body.email, status: "ACTIVE", userType: { $ne: "USER" } });
                if (!resp) {
                    return res.send({ responseCode: 409, responseMessage: "user not exist" });
                } else {
                    resolve(resp)
                    var token = jwt.sign({ _id: resp._id, email: resp.email }, 'secretkey', { expiresIn: '24h' });
                    var data = { token: token, _id: resp._id, email: resp.mail }
                    passcheck = bcryptjs.compareSync(req.body.password, resp.password);
                    if (passcheck == false) {
                        return res.send({ responseCode: 401, responseMessage: "Invalid email or password" });
                    } else {
                        return res.send({ responseCode: 200, responseMessage: "Successfully login", responseResult: data });
                    }
                }
            })

        } catch (error) {
            return res.send({ responseCode: 501, responseMessage: "Something went wrong", responseResult: error });
        }
    },
    subAdmineditProfile:async (req, res) => {
        try {
            let query = {_id: req.userId, status: { $ne: "DELETE" }, userType:{$ne:"USER"} };
            let user = await usermodel.findOne(query);
            if (!user) {
                return res.send({ reponseCode: 404, responseMessage: 'ADMIN not found .', responseResult: [] });
            }else{
                    let updateUser = await usermodel.findByIdAndUpdate({ _id: user._id }, { $set: req.body }, { new: true })
                    if (updateUser) {
                        return res.send({ reponseCode: 200, responseMessage: 'Succesfully updated', responseResult: updateUser });
                    }
                }}catch (error) {
            return res.send({ reponseCode: 501, responseMessage: 'Something went wrong', responseResult: error.message });
        }
    },
    subAdmingetProfile: async(req, res) => {
        let result=await usermodel.findOne({ _id: req.userId, userType: "SUB-ADMIN" }, (not, result) => {
            if (!result) {
                return res.send({ responseCode: 409, responseMessage: "user is not exist" });
            } else {
                return res.send({ responseCode: 200, responseMessage: "Data fetch", responseResult: result });
            }
        })
    },
     //=======================================Center Management APIs==================================================================================================
    centerAdd: async (req, res) => {
        try {
            user = await usermodel.findOne({ _id: req.userId, userType: "ADMIN" });
            if (!user) {
                return res.send({ responseCode: 409, responseMessage: "Data is not exist" });
            } else {
                let center = await centerModel.findOne({ centerName: req.body.centerName, status: "ACTIVE" });
                if (center) {
                    return res.send({ responseCode: 409, responseMessage: "Data already exist" });
                } else {
                    req.body.image = await commonFunction.uploadImg(req.body.image);
                    let saveRes = await centerModel(req.body).save();
                    if (saveRes) {
                        return res.send({ responseCode: 200, responseMessage: "Signup successfully with profile picture", responseResult: saveRes });
                    }
                }
            }
        } catch (error) {
            console.log(error)
            return res.send({ responseCode: 501, responseMessage: "Sothing went wrong!", responseResult: error });
        }
    },
    centerview:  async (req, res) => {
        try {
            let user = usermodel.findOne({ _id: req.userId, userType: { $ne: "USER" } });
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
            console.log(error)
            return res.send({ responseCode: 501, responseMessage: "Something went wrong" });
        }
    },
    centerList: async (req, res) => {
        try {
            let user = usermodel.findOne({ _id: req.userId, userType: { $ne: "USER" } });
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
                    return res.send({ responseCode: 200, responseMessage: "user not exits" });
                }
            }
        } catch (error) {
            console.log(error)
            return res.send({ responseCode: 5001, responseMessage: "Something went wrong" });
        }
    },
    centerUpdate:  (req, res) => {
        usermodel.findOne({ _id: req.userId, userType: { $ne: "USER" } }, (not, result) => {
            if (not) {
                return res.send({ responseCode: 409, responseMessage: "Data is not exist" });
            } else {
                centerModel.findOne({ _id: req.body._id }, (error1, result1) => {
                    if (error1) {
                        return res.send({ responseCode: 500, responseMessage: "Internal server error" });
                    } else {
                        if (result1.centerName == req.body.centerName) {
                            centerModel.findByIdAndUpdate({ _id: result1._id }, { $set: (req.body) }, { new: true }, (updateErr, updateRes) => {
                                if (updateErr) {
                                    return res.send({ responseCode: 500, responseMessage: "Internal server error" });
                                } else {
                                    return res.send({ responseCode: 200, responseMessage: "Successfully update", responseResult: updateRes });
                                }
                            })
                        } else {
                            centerModel.findOne({ _id: result1._id }, (errorr, resultt) => {
                                if (errorr) {
                                    return res.send({ responseCode: 500, responseMessage: "Internal server error" });
                                } else {
                                    centerModel.findByIdAndUpdate({ _id: resultt._id }, { $set: (req.body) }, { new: true }, (updateError, updateResult) => {
                                        if (updateError) {
                                            return res.send({ responseCode: 500, responseMessage: "Internal server error" });
                                        } else {
                                            return res.send({ responseCode: 200, responseMessage: "Successfully update", responseResult: updateResult });
                                        }
                                    })
                                }
                            })
                        }
                    }
                })
            }
        })
    },
    centerActiveBlock: (req, res) => {
        usermodel.findOne({ _id: req.userId, userType: { $ne: "USER" } }, (error, result) => {
            if (error) {
                return res.send({ resopnseCode: 500, responseMessage: "Internal Server error" });
            } else if (!result) {
                return res.send({ responseCode: 404, responseMessage: "Data is not found" });
            } else {
                centerModel.findOne({ _id: req.body._id }, (error1, result1) => {
                    if (error1) {
                        return res.send({ responseCode: 500, responseMessage: "Internal server error" });
                    } else {
                        if (result1.status == "ACTIVE") {
                            centerModel.findByIdAndUpdate({ _id: result1._id }, { $set: { status: "BLOCK" } }, { new: true }, (updateErr, updateRes) => {
                                if (updateErr) {
                                    return res.send({ responseCode: 500, responseMessage: "Internal server error" });
                                } else {
                                    return res.send({ responseCode: 200, responseMessage: "Block successfully", resopnseResult: updateRes });
                                }
                            })
                        } else {
                            centerModel.findByIdAndUpdate({ _id: result1._id }, { $set: { status: "ACTIVE" } }, { new: true }, (updateErr, updateRes) => {
                                if (updateErr) {
                                    return res.send({ responseCode: 500, responseMessage: "Internal server error" });
                                } else {
                                    return res.send({ responseCode: 200, responseMessage: "ACTIVE successfully", resopnseResult: updateRes });
                                }
                            })
                        }
                    }
                })
            }
        })
    },
    centerDelete:(req, res) => {
        usermodel.findOne({ _id: req.userId, userType: { $ne: "USER" } }, (error, result) => {
            if (error) {
                return res.send({ resopnseCode: 500, responseMessage: "Internal Server error" });
            } else if (!result) {
                return res.send({ responseCode: 404, responseMessage: "Data is not found" });
            } else {
                centerModel.findOne({ _id: req.body._id }, (error1, result1) => {
                    if (error1) {
                        return res.send({ responseCode: 500, responseMessage: "Internal server error" });
                    } else {
                        centerModel.findByIdAndUpdate({ _id: result1._id }, { $set: { status: "DELETE" } }, { new: true }, (updateErr, updateRes) => {
                            if (updateErr) {
                                return res.send({ responseCode: 500, responseMessage: "Internal server error" });
                            } else {
                                return res.send({ responseCode: 200, responseMessage: "DELETE successfully", resopnseResult: updateRes });
                            }
                        })
                    }
                })
            }
        })
    },
    slotTimes: async (req, res) => {
        try {
            let user = await usermodel.findOne({ _id: req.userId, userType: { $ne: "USER" } });
            if (!user) {
                return res.send({ responseCode: 409, responseMessage: "Data not exist" });
            } else {
                let center = await centerModel.findOne({ _id: req.body._id });
                if (!center) {
                    return res.send({ responseCode: 409, responseMessage: "center not exist" });
                } else {

                    var x = {
                        nextSlot: 15,
                        breakTime: [
                            [center.afterNoonFrombreakTime, center.afterNoonTobreakTime], [center.enveningFrombreakTime, center.enveningTobreakTime]
                        ],
                        startTime: center.openTime,
                        endTime: center.closeTime
                    };

                    var slotTime = moment(x.startTime, "HH:mm");
                    var endTime = moment(x.endTime, "HH:mm");

                    function isInBreak(slotTime, breakTimes) {
                        return breakTimes.some((br) => {
                            return slotTime >= moment(br[0], "HH:mm") && slotTime < moment(br[1], "HH:mm");
                        });
                    }
                    var allSlotTime = [];
                    let times = [];
                    while (slotTime < endTime) {
                        if (!isInBreak(slotTime, x.breakTime)) {
                            times.push(slotTime.format("HH:mm"));
                        }
                        slotTime = slotTime.add(x.nextSlot, 'minutes');
                    }
                    for (i = 0; i < times.length; i++) {
                        for (j = 0; j < i + 1; j++) {
                            //console.log(times[j]+"-"+times[i]);
                        }
                        if (j == 41) {
                            break;
                        }
                        //console.log(times[i]+"-"+times[j]);
                        allSlotTime.push(times[i] + "-" + times[j])
                    }
                    //console.log("Time slots: ", times);
                }
                let updateRes = await centerModel.findByIdAndUpdate({ _id: center._id }, { $set: { allSlotTimes: allSlotTime,dates:req.body.dates } }, { new: true });
                return res.send({ responseCode: 200, responseMessage: "success", responseResult: updateRes });
            }
        } catch (error) {
            console.log(error)
            return res.send({ resopnseCode: 501, responseMessage: "Something went wrong", responseResult: error });
        }
    },
    approved: async (req, res) => {
        try {
            var user = await usermodel.findOne({ _id: req.userId, userType: "SUB-ADMIN" });
            if (!user) {
                return res.send({ responseCode: 409, responseMessage: "user is not exist" });
            } else {
                var approved = await bookingModel.findOne({ _id: req.body._id });
                if (!approved) {
                    return res.send({ responseCode: 409, responseMessage: "Booking ID is not exist" });
                } else {
                    if (approved.status == "PENDING") {
                        subject = "Appointment";
                        text = `Your Booking ID: ${req.body._id},\n Id:${user._id}\nfirst Name :${user.firstName} \n center Name:${approved.centername}\n reporting Date:${approved.bookingDate} \n reporting  Time ${approved.slotTimes}  .your approved successfully and you are going to center take vaccine`;
                        const mail = await commonFunction.sendOtp(approved.email, subject, text)
                        if (mail) {
                            await bookingModel.findByIdAndUpdate({ _id: approved._id }, { $set: { status: "BOOKED" } }, { new: true });
                            return res.send({ responseCode: 200, responseMessage: "Booking Successfully", responseResult: text });
                        } else {
                            return res.send({ responseCode: 401, responseMessage: "Not Booking" });
                        }
                    } else {
                        return res.send({ responseCode: 200, responseMessage: "Already Booked" });
                    }
                }
            }
        } catch (error) {
            console.log(error)
            return res.send({ responseCode: 501, responseMessage: "somehting went wrong", responseResult: error });
        }
    },
    bookingCancelAdminSide: async (req, res) => {
        try {
            var user = await usermodel.findOne({ _id: req.userId, userType: "SUB-ADMIN" });
            if (!user) {
                return res.send({ responseCode: 409, responseMessage: "user is not exist" });
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
                        const mail = await commonFunction.sendOtp(approved.email, subject, text)
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
    bookingList: async (req, res) => {
        try {
            let user = usermodel.findOne({ _id: req.userId, userType: { $ne: "USER" } });
            if (user) {
                let query = { status: { $ne: "CANCEL" } }
                let options = {
                    limit: parseInt(req.body.limit) || 10,
                    page: parseInt(req.body.page) || 1,
                    sort: { createAt: -1 },
                };
                let pagi = await bookingModel.paginate(query, options);
                if (pagi.docs.length != 0) {
                    return res.send({ responseCode: 200, responseMessage: "Data fetch Successfully", responseResult: pagi });
                } else {
                    return res.send({ responseCode: 200, responseMessage: "Data not exits" });
                }
            }
        } catch (error) {
            console.log(error)
            return res.send({ responseCode: 5001, responseMessage: "Something went wrong" });
        }
    },
}