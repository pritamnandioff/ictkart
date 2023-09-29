const mongoose = require("mongoose");
const { Schema } = mongoose;
const userSchema = new Schema({
    vender: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        require: true
    },
    currency: {
        type: String,
        default: "AED"
    },
    modelNumber: {
        type: String,
        default: ""
    },
    casingMaterial: {
        type: String,
        default: ""
    },
    colorCategory: {
        type: String,
        default: "White"
    },
    partNumber: {
        type: String,
        default: ""
    },
    countries: [],
    releaseDate: {
        type: Date,
        default: Date.now
    },
    expiryDate: {
        type: Date,
        default: Date.now
    },
    title: {
        type: String,
        default: ""
    },
    about: {
        type: String,
        default: ""
    },
    description: {
        type: String,
        default: ""
    },
    code: {
        type: String,
        default: Date.now()
    },
    categories: {
        type: Schema.Types.ObjectId,
        ref: 'categories',
        default: null
    },
    categories2: {
        type: Schema.Types.ObjectId,
        ref: 'categories',
        default: null
    },
    categories3: {
        type: Schema.Types.ObjectId,
        ref: 'categories',
        default: null
    },
    brand: {
        type: Schema.Types.ObjectId,
        ref: 'brands',
        default: null
    },
    // manufacturer: {
    //     type: Schema.Types.ObjectId,
    //     ref: 'brands',
    //     default: null
    // },
    sellingPrice: {
        type: Number,
        default: 0
    },
    originalPrice: {
        type: Number,
        default: 0
    },
    conditions: {
        type: String,
        default: ""
    },
    ratings: {
        type: Number,
        default: 0
    },
    thumbnail: {
        type: String,
        default: ""
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    images: [{
        type: String,
        default: ""
    }],
    imageUrl: [{
        type: String,
        default: ""
    }],
    specifications: [{
        key: {
            type: String,
            default: ""
        },
        label: {
            type: String,
            default: ""
        },
        value: {
            type: String,
            default: ""
        }
    }],
    totalUnits: {
        type: Number,
        default: 0
    },
    soldUnits: {
        type: Number,
        default: 0
    },
    status: {
        type: Boolean,
        default: true
    },
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

userSchema.virtual('thumbnailImage').get(function () {
    return this.thumbnail ? IMG_URL + this.thumbnail : (this.images && this.images.length ? IMG_URL + this.images[0] : PRODUCT_URL);
});
module.exports = mongoose.model("products", userSchema);