const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const faqsSchema = new Schema({
    question: {
        type: String,
        default: ""
    },
    answer: {
        type: String,
        default: ""
    },
    visibleStatus: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    status: {
        type: Boolean,
        default: true
    },
    position: {
        type: Number,
        default: 0
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'products',
        default: null
    },
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});
faqsSchema.statics.findAllQuestion = function () {
    return this.find({}, { question: 1 });
}
module.exports = mongoose.model("faqs", faqsSchema);