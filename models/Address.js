const mongoose = require("mongoose");
const { Schema } = mongoose;
const userSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      require: true,
    },
    name: {
      type: String,
      default: "",
    },
    mobile: {
      type: String,
      default: "",
    },
    temporaryMobile: {
      type: String,
      default: "",
    },
    address: {
      type: {
        type: String,
        default: "Point",
      },
      coordinates: [
        {
          type: Number,
          default: [0, 0],
        },
      ],
      houseNo: {
        type: String,
        default: "",
      },
      locality: {
        type: String,
        default: "",
      },
      city: {
        type: String,
        default: "",
      },
      state: {
        type: String,
        default: "",
      },
      postcode: {
        type: String,
        default: "",
      },
      postalAddress: {
        type: String,
        default: "",
      },
      country: {
        type: String,
        default: "India",
      },
    },
    addressMode: {
      type: String,
      enum: ["billing", "shipping"],
    },
    addressType: {
      type: String,
      enum: ["home", "work"],
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

module.exports = mongoose.model("addresses", userSchema);
