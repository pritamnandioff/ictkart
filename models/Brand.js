const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const brandSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    manufactur: {
        type: Schema.Types.ObjectId,
        ref: 'brands',
        default: null
    },
    description: {
        type: String,
        default: ""
    },
    slug: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: ""
    },
    status: {
        type: Boolean,
        default: true
    },
    type: {
        type: String,
        // enum: ['brand', 'manufactur'],
        default: "brand"
    }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});
brandSchema.virtual('Image').get(function () {
    return this.image ? IMG_URL + this.image : `${LOCAL_HOST}profile.png`;
});
brandSchema.statics.findAllSlug = function (type = 'brand') {
    return this.find({ type: type }, { slug: 1 });
}
module.exports = mongoose.model("brands", brandSchema);