const mongoose = require("mongoose");
const { Schema } = mongoose;
const userSchema = new Schema({
    status: {
      type: Boolean,
      default: true,
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'products',
        default: null
    },
    offers:[{
        description: {
        type: String,
        default: ""
        },
        status:{
            type: Boolean,
            default: false
        }
    }]
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  });
module.exports = mongoose.model("productoffers", userSchema);
