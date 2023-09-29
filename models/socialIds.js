const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const verificationSchema = new Schema({
    vendorId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        default: null
    },
    fbUrl:{
        type: String,
        default: ""
    },
    twitterUrl:{
        type: String,
        default: ""
    },
    linkedinUrl:{
        type: String,
        default: ""
    },
    whatsappUrl:{
        type: String,
        default: ""
    },
    skypeUrl:{
        type: String,
        default: ""
    },
    youtubeUrl:{
        type: String,
        default: ""
    },
    instagramUrl:{
        type: String,
        default: ""
    }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});
module.exports = mongoose.model("socialIds", verificationSchema);
