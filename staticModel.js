const mongoose = require('mongoose');
const schema = mongoose.Schema;
const statickey = new schema({
    type: {
        type: String
    },
    title: {
        type: String
    },
    description: {
        type: String
    },
    status: {
        type: String,
        enum: ["ACTIVE", "BLOCK", "DELETE"],
        default: "ACTIVE"
    },

},
    {
        timestamps: true
    })

module.exports = mongoose.model('static', statickey)
mongoose.model('static', statickey).find({}, (staticErr, staticRes) => {
    if (staticErr) {
        console.log('Static error ', staticErr);
    } else if (staticRes.length!=0) {
        console.log("Static created already exist");
    } else {
        var object1 = {
            type: "T&C",
            title: "Term And Conditions ",
            description: "A term and conditions agreement is the agreement that includes the terms, the rules and the guidelines of acceptable behavior and other useful sections to which users must agree in order to use or access your website and mobioe app."
        };
        var object2 = {
            type: "AboutUs",
            title: "About Us",
            description: "An about us oage helps your company make a good first impression, and is critical for building customer trust and loyalty."
        };
        var object3 = {
            type: "ContactUs",
            title: "contactUs",
            description: "They slap an email address, phone, and location on a plain background and call it a day"
        };
        mongoose.model('static', statickey).create(object1, object2, object3, (createErr, createRes) => {
            if (createErr) {
                console.log(createErr);
            } else {
                console.log("Static Created Success", object1, object2, object3);
            }
        })
    }
})