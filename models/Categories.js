const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const categoriesSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true
    },
    position: {
        type: Number,
        default: 0
    },
    image: {
        type: String,
        default: ""
    },
    icon: {
        type: String,
        default: ""
    },
    status: {
        type: Boolean,
        default: true
    },
    description: {
        type: String,
        default: ""
    },
    urlKey: {
        type: String,
        default: ''
    },
    metaTitle: {
        type: String,
        default: ''
    },
    keyWords: {
        type: String,
        default: ''
    },
    metaDescription: {
        type: String,
        default: ''
    },
    parentId: {
        type: Schema.Types.ObjectId,
        ref: 'categories',
        default: null
    },
    serviceSubCategory: [{
        type: Schema.Types.ObjectId,
        ref: 'categories'
    }],
    type: {
        type: String,
        enum: ['product', 'service', 'solution'],
        default: 'product'
    }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});
categoriesSchema.virtual('categoryImage').get(function () {
    return this.image ? IMG_URL + this.image : `${LOCAL_HOST}profile.png`;
});
categoriesSchema.virtual('iconImg').get(function () {
    return this.icon ? IMG_URL + this.icon : `${LOCAL_HOST}profile.png`;
});
categoriesSchema.statics.findAllSlug = function (type = 'product') {
    return this.find({ type: type }, { slug: 1 });
}
categoriesSchema.statics.findAllSlugs = function () {
    return this.find({}, { slug: 1, type: 1, parentId: 1 });
}
module.exports = mongoose.model("categories", categoriesSchema);