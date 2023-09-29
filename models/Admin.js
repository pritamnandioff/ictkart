const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const constants = require('../config/keys');

const { Schema } = mongoose;

const adminSchema = new Schema({
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
        default: ""
    },
    iso2: {
        type: String,
        default: ""
    },
    mobileNo: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    profileImage: {
        type: String,
        default: ""
    },
    temparoryMobileNo: {
        type: String,
        default: ""
    },
    about: {
        type: String,
        default: ""
    },
    address: {
        postalAddress: {
            type: String,
            default: ""
        },
        country: {
            type: String,
            default: ""
        },
        state: {
            type: String,
            default: ""
        },
        city: {
            type: String,
            default: ""
        },
        zipCode: {
            type: String,
            default: ""
        },
        location: {
            type: String,
            default: ""
        },
        lat: {
            type: String,
            default: ""
        },
        long: {
            type: String,
            default: ""
        },
    },
    otp: {
        type: String,
        default: "",
        select: false
    },
    createdBy: {
        type: String,
        enum: ['subadmin', 'admin'],
        default: 'subadmin'
    },
    status: {
        type: String,
        default: false
    },
    accountStatus: {
        type: String,
        enum: ['approved', 'applied', 'suspend'],
        default: 'applied'
    },
    role: {
        type: String,
        enum: ['subadmin', 'admin'],
        default: 'subadmin'
    },
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

adminSchema.methods.hash = password => bcrypt.hashSync(password, constants.saltRounds);
adminSchema.methods.toJSON = function () {
    var obj = this.toObject();
    delete obj.password;
    delete obj.otp;
    return obj;
}
adminSchema.virtual('avatar').get(function () {
    return this.profileImage ? IMG_URL + this.profileImage : `${LOCAL_HOST}profile.png`;
});
module.exports = mongoose.model('admins', adminSchema);