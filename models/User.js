const mongoose = require("mongoose");
const { Schema } = mongoose;
const bcrypt = require('bcryptjs');
const constants = require('../config/keys');
const userSchema = new Schema({
  companyName: {
    type: String,
    default: ""
  },
  userRole: {
    type: Schema.Types.ObjectId,
    ref: 'roles',
    default: null
  },
  vendor: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    default: null
  },
  companyLogo: {
    type: String,
    default: ""
  },
  companyDocument: {
    type: String,
    default: ""
  },
  brands: [{
    brand: {
      type: Schema.Types.ObjectId,
      ref: 'brands',
      default: null
    },
    relationship: {
      type: String,
      default: ""
    }
  }],
  avatar: {
    type: String,
    default: ""
  },
  designation: {
    type: String,
    default: ""
  },
  firstName: {
    type: String,
    default: ""
  },
  lastName: {
    type: String,
    default: ""
  },
  dialCode: {
    type: String,
    default: '91'
  },
  mobile: {
    type: String,
    default: ''
  },
  iso2: {
    type: String,
    default: 'IN'
  },
  email: {
    type: String,
    require: true
  },
  password: {
    type: String,
    default: ""
  },
  role: {
    type: String,
    enum: ["user", "vendor"],
    default: "user",
  },
  vendorDescription: {
    type: String,
    default: ""
  },
  token: {
    type: String,
    default: ""
  },
  socialInfo: {
    facebook: {
      type: String,
      default: ""
    },
    gmail: {
      type: String,
      default: ""
    },
    linkedin: {
      type: String,
      default: ""
    },
    instagram: {
      type: String,
      default: ""
    },
    skype: {
      type: String,
      default: ""
    },
    youtube: {
      type: String,
      default: ""
    },
    twitter: {
      type: String,
      default: ""
    },
    whatsapp: {
      type: String,
      default: ""
    },
  },
  address: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [{
      type: Number,
      default: [0, 0]
    }],
    houseNo: {
      type: String,
      default: ""
    },
    locality: {
      type: String,
      default: ""
    },
    city: {
      type: String,
      default: ""
    },
    state: {
      type: String,
      default: ""
    },
    postcode: {
      type: String,
      default: ""
    },
    postalAddress: {
      type: String,
      default: ""
    },
    country: {
      type: String,
      default: 'India'
    },
    ciso2: {
      type: String,
      default: 'IN'
    },
  },
  verifyVendorAccount:{
    type: Boolean,
    default: false
  },
  hearAboutICT: [{
    type: String,
    default: ""
  }],
  categories: [{
    type: Schema.Types.ObjectId,
    ref: 'categories',
    default: []
  }],
  isVerify: {
    type: Boolean,
    default: false
  },
  status: {
    type: Boolean,
    default: true
  },
  accountStatus: {
    type: String,
    enum: ['pending', 'active', 'inactive'],
    default: 'pending'
  },
  carts: [
    {
      product: {
        type: Schema.Types.ObjectId,
        ref: 'products',
        default: null
      },
      units: {
        type: Number,
        default: 0
      }
    }
  ],
  otp: {
    type: String,
    default: ""
  },
  deviceToken: {
    type: String,
    default: ""
  },
  deviceId: {
    type: String,
    default: ""
  },
  deviceType: {
    type: String,
    default: ""
  },
  dob: {
    type: Date,
    default: ""
  },
  socialId:{
    type: String,
    default: ""
  },
  socialType:{
    type: String,
    default: ""
  }
}, {
  timestamps: true,
  toObject: { virtuals: true },
  toJSON: { virtuals: true }
});
userSchema.virtual('profileImage').get(function () {
  return this.avatar ? this.avatar : `${PRODUCT_URL}`;
});
userSchema.virtual('logo').get(function () {
  return this.companyLogo ? IMG_URL + this.companyLogo : `${LOCAL_HOST}profile.png`;
});
userSchema.virtual('companyDocuments').get(function () {
  return this.companyDocument ? IMG_URL + this.companyDocument : `${LOCAL_HOST}profile.png`;
});
userSchema.methods.hash = password => bcrypt.hashSync(password, constants.saltRounds);
userSchema.methods.toJSON = function () {
  var obj = this.toObject();
  delete obj.password;
  return obj;
}
userSchema.statics.findVendor = function (role = 'vendor') {
  return this.find({ role: role }, { email: 1 });
}
userSchema.statics.findAllUsers = function () {
  return this.find({}, { email: 1, mobile: 1 });
}
module.exports = mongoose.model("users", userSchema);