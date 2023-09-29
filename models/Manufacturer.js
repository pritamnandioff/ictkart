const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const manufacturerSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    image: {
        type: String,
        default: ""
    },
    status: {
        type: Boolean,
        default: true
    },
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});
manufacturerSchema.virtual('Image').get(function () {
    return this.image ? IMG_URL + this.image : `${LOCAL_HOST}profile.png`;
});
// manufacturerSchema.virtual('icon').get(function () {
//     return this.bannerImg ? IMG_URL + this.bannerImg : `${LOCAL_HOST}profile.png`;
// });

module.exports = mongoose.model("manufacturers", manufacturerSchema);