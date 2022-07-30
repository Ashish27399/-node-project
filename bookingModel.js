const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const aggregatePaginate = require('mongoose-aggregate-paginate');
const Schema = mongoose.Schema;

const bookingKey = new Schema(
    {
        centerId: {
            type: mongoose.Schema.ObjectId, ref: 'center',
        },
        centername:{
            type:String
        },
        bookingDate:{
            type:String
        },
        email: {
            type: String
        },
        slotTimes:{
            type:String
        },
        userId: {
            type: mongoose.Schema.ObjectId, ref: 'user',
        },
        status:{
            type:String,
            enum:["BOOKED","PENDING","CANCEL"],
            default:"PENDING"
        }, 
    },
    {
        timestamps:true
    }
)
bookingKey.index({ location: '2dsphere' });
bookingKey.plugin(aggregatePaginate);
bookingKey.plugin(mongoosePaginate);
module.exports = mongoose.model('booking',bookingKey)