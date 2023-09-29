const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bannerSchema = new Schema({
    type: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    banner: {
        type: Schema.Types.ObjectId,
        ref: 'banners',
        default: null
    },
    description: {
        type: String,
        default: ''
    },
    urlKey: {
        type: String,
        default: ''
    },
    metaTitle: {
        type: String,
        default: ''
    },
    metaKewords: {
        type: String,
        default: ''
    },
    metaDescription: {
        type: String,
        default: ''
    },
    status: {
        type: Boolean,
        default: false
    },
    image: {
        type: String,
        default: ""
    }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});
bannerSchema.virtual('Image').get(function () {
    return this.image ? IMG_URL + this.image : `${LOCAL_HOST}profile.png`;
});

module.exports = mongoose.model("contents", bannerSchema);