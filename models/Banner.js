const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bannerSchema = new Schema({
    title: {
        type: String,
        default: ""
    },
    image: {
        type: String,
        default: ""
    },
    // bannerImg: {
    //     type: String,
    //     default: ""
    // },
    redirectType:{
        type: String,
        default: ""
    },
    description: {
        type: String,
        default: ""
    },
    position: {
        type: Number,
        default: 0
    },
    targetUrl: {
        type: String,
        default: ""
    },
    status: {
        type: Boolean,
        default: true
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        default: Date.now
    },
    displayAt: {
        type: String,
        default: "home"
    },
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});
bannerSchema.virtual('bannerImage').get(function () {
    return this.image ? IMG_URL + this.image : `${LOCAL_HOST}profile.png`;
});
// bannerSchema.virtual('icon').get(function () {
//     return this.bannerImg ? IMG_URL + this.bannerImg : `${LOCAL_HOST}profile.png`;
// });
module.exports = mongoose.model("banners", bannerSchema);