const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const contactusSchema = new Schema({
    companyName: {
        type: String,
        default: ""
    },
    firstName:{
        type: String,
        default: ""
    },
    lastName:{
        type: String,
        default: ""
    },
    email:{
        type: String,
        default: ""
    },
    dialCode: {
        type: String,
        default: '91'
    },
    mobile:{
        type: String,
        default: ""
    },
    message:{
        type: String,
        default: ""
    },
    status:{
        type: Boolean,
        default: true
    },
    queryStatus:{
        type:String,
        enum:['pending','completed','rejected'],
        default: "pending"
    },
    queryReply:{
        type: String,
        default: ""
    },
    querySubject:{
        type: String,
        default: ""
    },
    replyDate:{
        type: Date,
        default:""
    }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});
module.exports = mongoose.model("contactus", contactusSchema);