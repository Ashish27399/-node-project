const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const aggregatePaginate = require('mongoose-aggregate-paginate');
const Schema = mongoose.Schema;

const centreKey = new Schema(
    {
        centerName: {
            type: String
        },
        address: {
            type: String
        },
        dateskey: [
            {
                dates: {
                    type: String
                },
                allSlotTimes: {
                    type: Array
                },
            },
        ],
        adminsubadminemail: {
            type: String
        },
        contactNumber: {
            type: String
        },
        openTime: {
            type: String
        },
        closeTime: {
            type: String
        },
        afterNoonFrombreakTime: {
            type: String
        },
        afterNoonTobreakTime: {
            type: String
        },
        slots: {
            type: Number
        },
        image: {
            type: String
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number],
                default: [0, 0]
            }
        },
        status: {
            type: String,
            enum: ["ACTIVE", "BLOCK", "DELETE"],
            default: "ACTIVE"
        },
    },
    {
        timestamps: true
    }
)
centreKey.index({ location: '2dsphere' });
centreKey.plugin(aggregatePaginate);
centreKey.plugin(mongoosePaginate);
module.exports = mongoose.model('center', centreKey)