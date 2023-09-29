const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const UserModel = require("../../models/User");
const companyInfoModel = require("../../models/companyInfo");
const verificationDocsModel = require("../../models/verificationDocuments");
const socialIdModel = require("../../models/socialIds");
const brandPartenshipModel = require("../../models/brandPartenship");
const ProductModel = require("../../models/Product");
const regionalPresenceModel = require("../../models/regionalPresence");
const SendResponse = require("../../services/apiHandler");
const Boom = require('@hapi/boom');
const constant = require("../../config/keys");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const UserService = require("../../services/user-service");
const EmailService = require("../../services/email-service");
const { generatePassword, generateOtp } = require("../../util/index");
const FileService = require("../../services/file-service");
const HelperService = require("../../services/helper");
const fs = require('fs');
const countryData = fs.readFileSync('countryData.json', 'utf8');
const currenciesJson = fs.readFileSync('currencies.json', 'utf8');
var moment = require("moment");
const { VERIFICATION_DOCUMENTS } = require("../../config/constant")
module.exports = {
  registration: async (req, res) => {
    try {
      if(req.body.userRole!=null || req.body.userRole!=undefined){
        let isVendorDocs = await HelperService.checkActiveStatus(req.body.vender);
        if (!isVendorDocs) {
          return SendResponse(res, {isVendorDocs}, "please, upload your documents and get verify first from your admin");
        }
      }
      let existEmail = await UserModel.findOne({ email: req.body.email });
      if (existEmail) {
        return SendResponse(res, Boom.badRequest("Email already used"));
      }
      let existMobile = await UserModel.findOne({ mobile: req.body.mobile });
      if (existMobile) {
        return SendResponse(res, Boom.badRequest("mobile number already used"));
      }
      if (req.files && req.files.companyLogo) {
        req.body.companyLogo = await FileService.uploadImage(req.files.companyLogo);
      }
      if (req.files && req.files.companyDocument) {
        req.body.companyDocument = await FileService.uploadImage(req.files.companyDocument);
      }
      if (req.files && req.files.avatar) {
        req.body.avatar = await FileService.uploadImage(req.files.avatar);
      }
      if (req.body.categories != undefined && req.body.categories != "") {
        req.body.categories = JSON.parse(req.body.categories);
      }
      if (req.body.vendor != undefined && req.body.vendor != "") {
        req.body.role = 'vendor';
      }
      req.body.address = {
        coordinates: [0, 0],
        postcode: (req.body.postcode || ""),
        country: (req.body.country || ""),
        state: (req.body.state || ""),
        city: (req.body.city || ""),
        postalAddress: (req.body.postalAddress || ""),
      };
      var otp = generateOtp();
      req.body.otp = otp
      let newUser = new UserModel(req.body);
      newUser.password = newUser.hash(req.body.password);
      let userData = await newUser.save();
      await EmailService.RegistrationEmail(userData, otp);
      if(req.body.userRole!=null){
        await EmailService.Email(req.body.email,`Hi There,
        Your Account is created and assigned a role under a seller.
        Thanks 
        ictkart support team.`);
        }
      if (req.body.role == 'vendor') {
        let ciObj = {};
        if (req.body.vendor) {
          ciObj = await companyInfoModel.findOne({ vendorId: req.body.vendor });
        }
        else {
          ciObj = { vendorId: userData._id };
        }
        await companyInfoModel.create(ciObj)
      }
      return SendResponse(res, userData, `User registered successfully `);
    } catch (error) {
      console.log(error);
      return SendResponse(res, Boom.badImplementation("Opps something wents wrong"));
    }
  },
  login1: async (req, res) => {
    try {
      let user = await UserModel.findOne({ email: req.body.email }).select("+password").lean().exec();
      if (user) {
        let userDataObj = { ...user };
        let isPwd = await bcrypt.compare(req.body.password, user.password);
        if (isPwd) {
          let sObj = {
            data: {
              id: user._id,
              email: user.email,
              userRole: user.userRole,
              vendor: ([null, undefined, '', 'null', 'undefined', ' '].includes(user.vendor) ? user._id : user.vendor),
              isVerify: user.isVerify
            },
          };
          let authToken = jwt.sign(sObj,
            `${constant.JWT_SECRET}`,
            { expiresIn: "168h" }
          );
          delete user.password;
          req.query.userId = user._id;
          req.query.from = 'rtn';
          user = await module.exports.userDetail(req, res);
          let role = await HelperService.getUserRole(user._id);
          let isVerifyAccount = true;
          if (user && user.role == 'vendor' && !user.isVerify && [null, undefined, '', 'null', 'undefined', ' '].includes(userDataObj.vendor)) {
            var otp = generateOtp();
            await UserModel.findOneAndUpdate({ _id: user._id }, { $set: { otp: otp } });
            await EmailService.RegistrationEmail(user, otp);
            isVerifyAccount = false;
          }
          return SendResponse(
            res,
            { isVerifyAccount, role, user: user, token: authToken },
            "User successfully logged In"
          );
        }
        else {
          return SendResponse(
            res,
            Boom.badRequest("Invalid user name or password")
          );
        }
      }
      else {
        return SendResponse(res, Boom.badRequest("User not found"));
      }
    } catch (error) {
      console.log(error);
      return SendResponse(
        res,
        Boom.badImplementation("Opps something wents wrong")
      );
    }
  },
  login: async (req, res) => {
    try {
      if(req.body.userID){
        let userData = await UserModel.findOne({ socialId: req.body.userID }) 
        var user = userData
        if(!userData){
          // var otp = generateOtp();
          let name = req.body.name.split(' ')
          req.body.firstName = name.splice(0,1).join('')
          req.body.lastName = name.join(' ')
          req.body.otp = ""
          req.body.role = 'user'
          req.body.socialType= req.body.graphDomain
          req.body.socialId= req.body.userID
          req.body.isVerify = true
          let newUser = new UserModel(req.body);
          user = await newUser.save();
          // await EmailService.RegistrationEmail(user, otp);
        }
          let sObj = {
            data: {
              id: user._id,
              email: user.email,
              userRole: user.userRole,
              vendor: ([null, undefined, '', 'null', 'undefined', ' '].includes(user.vendor) ? user._id : user.vendor),
              isVerify: user.isVerify
            },
          };
          let authToken = jwt.sign(sObj,
            `${constant.JWT_SECRET}`,
            { expiresIn: "168h" }
          );
          delete user.password;
          req.query.userId = user._id;
          req.query.from = 'rtn';
          user = await module.exports.userDetail(req, res);
          let role = await HelperService.getUserRole(user._id);
          let isVerifyAccount = true;
          return SendResponse(
            res,
            { isVerifyAccount, role, user: user, token: authToken },
            "User successfully logged In please update your profile"
          );
      }else if(req.body.profileObj!=undefined){
        let userData = await UserModel.findOne({ socialId: req.body.profileObj.googleId }) 
        var user = userData
        if(!userData){
          // var otp = generateOtp();
          req.body.firstName = req.body.profileObj.givenName
          req.body.lastName = req.body.profileObj.familyName
          req.body.otp = ""
          req.body.email = req.body.profileObj.email
          req.body.role = 'user'
          req.body.socialType= req.body.login
          req.body.socialId= req.body.profileObj.googleId
          req.body.isVerify = true
          let newUser = new UserModel(req.body);
          user = await newUser.save();
          // await EmailService.RegistrationEmail(user, otp);
        }
          let sObj = {
            data: {
              id: user._id,
              email: user.email,
              userRole: user.userRole,
              vendor: ([null, undefined, '', 'null', 'undefined', ' '].includes(user.vendor) ? user._id : user.vendor),
              isVerify: user.isVerify
            },
          };
          let authToken = jwt.sign(sObj,
            `${constant.JWT_SECRET}`,
            { expiresIn: "168h" }
          );
          delete user.password;
          req.query.userId = user._id;
          req.query.from = 'rtn';
          user = await module.exports.userDetail(req, res);
          let role = await HelperService.getUserRole(user._id);
          let isVerifyAccount = true;
          return SendResponse(
            res,
            { isVerifyAccount, role, user: user, token: authToken },
            "User successfully logged In please update your profile"
          );
        
      }else{
      let user = await UserModel.findOne({ email: req.body.email }).select("+password").lean().exec();
      if (user) {
        let userDataObj = { ...user };
        let isPwd = await bcrypt.compare(req.body.password, user.password);
        if (isPwd) {
          let sObj = {
            data: {
              id: user._id,
              email: user.email,
              userRole: user.userRole,
              vendor: ([null, undefined, '', 'null', 'undefined', ' '].includes(user.vendor) ? user._id : user.vendor),
              isVerify: user.isVerify
            },
          };
          let authToken = jwt.sign(sObj,
            `${constant.JWT_SECRET}`,
            { expiresIn: "168h" }
          );
          delete user.password;
          req.query.userId = user._id;
          req.query.from = 'rtn';
          req.body.avatar = ""
          user = await module.exports.userDetail(req, res);
          let role = await HelperService.getUserRole(user._id);
          let isVerifyAccount = true;
          if (user && user.role == 'vendor' && !user.isVerify && [null, undefined, '', 'null', 'undefined', ' '].includes(userDataObj.vendor)) {
            var otp = generateOtp();
            await UserModel.findOneAndUpdate({ _id: user._id }, { $set: { otp: otp } });
            await EmailService.RegistrationEmail(user, otp);
            isVerifyAccount = false;
          }
          return SendResponse(
            res,
            { isVerifyAccount, role, user: user, token: authToken },
            "User successfully logged In"
          );
        }
        else {
          return SendResponse(
            res,
            Boom.badRequest("Invalid user name or password")
          );
        }
      }
      else {
        return SendResponse(res, Boom.badRequest("User not found"));
      }
    }
    } catch (error) {
      console.log(error);
      return SendResponse(
        res,
        Boom.badImplementation("Opps something wents wrong")
      );
    }
  },
  verify: async (req, res) => {
    try {
      let existUser = await UserModel.findOne({ _id: req.body.userId });
      let fullName = (req.body.name).split(" ");
      req.body.firstName = fullName.length > 0 ? fullName[0] : "";
      req.body.lastName = fullName.length > 1 ? fullName[1] : "";
      req.body.isVerify = true;
      if (existUser) {
        existUser = await UserModel.findOneAndUpdate(
          { _id: req.body.userId },
          { $set: req.body },
          { new: true }
        );
        let authToken = jwt.sign(
          {
            data: {
              id: existUser._id,
              email: existUser.email,
              mobile: existUser.mobile,
              dialCode: existUser.dialCode,
            },
          },
          `${constant.JWT_SECRET}`,
          { expiresIn: "168h" }
        );
        return SendResponse(res, { user: existUser, token: authToken }, "verification has been done successfully");
      } else {
        return SendResponse(res, {}, "user not found");
      }
    } catch (err) {
      console.log(err);
      SendResponse(res, Boom.badImplementation(err));
    }
  },
  getUser: async (req, res) => {
    try {
      let existUser = await UserModel.findOne({ _id: req.query.userId });
      return SendResponse(res, { user: existUser }, "user details");
    } catch (err) {
      console.log(err);
      SendResponse(res, Boom.badImplementation(err));
    }
  },
  userDetail: async (req, res) => {
    try {
      let userData = await UserModel.findOne({ _id: req.query.userId }, { hearAboutICT: 0, categories: 0 });
      userData.avatar = userData.avatar ? IMG_URL + userData.avatar : "";
      userData.vendor = [null, undefined, '', 'null', 'undefined', ' '].includes(userData.vendor) ? userData._id : userData.vendor
      if (req.query.from == 'rtn') {
        return userData;
      }
      return SendResponse(res, { user: userData }, "user details");
    } catch (err) {
      console.log(err);
      SendResponse(res, Boom.badImplementation(err));
    }
  },
  vendorDetail: async (req, res) => {
    try {
      let existVendor = await UserModel.aggregate([
        {
          $match: {
            _id: ObjectId(req.query.userId)
          }
        },
        {
          $lookup: {
            from: "categories",
            foreignField: "_id",
            localField: "categories",
            as: "categories"
          }
        },
        // {
        //   $lookup: {
        //     from: "brandpartenships",
        //     foreignField: "vendorId",
        //     localField: "_id",
        //     as: "brandPartenships"
        //   }
        // },
        {
          $lookup: {
              from: 'brandpartenships',
              let: { id: "$_id" },
              pipeline: [
                  {
                      $match: {
                        vendorId: ObjectId(req.query.userId)
                      }
                  },
                  {
                    $project:{
                      relationship: 1,
                      documentFile: {
                        $cond: {
                          if: { $eq: ["$documentFile", ``] },
                          then: "",
                          else: {
                            $concat: [IMG_URL, "$documentFile"],
                          },
                        },
                      },
                      vendorId: 1,
                      brand: 1
                    }
                  }
              ],
              as: 'brandpartenships'
          }
      },
        {
          $lookup: {
            from: "companyinfos",
            localField: "_id",
            foreignField: "vendorId",
            as: "companyInfo"
          }
        },
        {
          $lookup: {
            from: "regionalpresences",
            foreignField: "vendorId",
            localField: "_id",
            as: "regionalPresences"
          }
        },
        {
          $lookup: {
            from: "socialids",
            foreignField: "vendorId",
            localField: "_id",
            as: "socialIds"
          }
        },
        // {
        //   $lookup: {
        //     from: "verificationdocs",
        //     foreignField: "vendorId",
        //     localField: "_id",
        //     as: "verificationDocs"
        //   }
        // },
        {
          $lookup: {
              from: 'verificationdocs',
              let: { id: "$_id" },
              pipeline: [
                  {
                      $match: {
                        vendorId: ObjectId(req.query.userId)
                      }
                  },
                  {
                    $project:{
                      title: 1,
                      slug: 1,
                      expiryDate: 1,
                      status: 1,
                      identityType: 1,
                      documentURL: {
                        $cond: {
                          if: { $eq: ["$documentURL", ``] },
                          then: "",
                          else: {
                            $concat: [IMG_URL, "$documentURL"],
                          },
                        },
                      },
                      isIdentityType:1

                    }
                  }
              ],
              as: 'verificationDocs'
          }
      },
      ]);
      delete existVendor[0].password;
      existVendor[0].profileImage = existVendor[0].avatar ? IMG_URL + existVendor[0].avatar : "";
      existVendor[0].avatar = existVendor[0].avatar ? IMG_URL + existVendor[0].avatar : "";
      let uplodedDOCS = existVendor[0].verificationDocs;
      existVendor[0].verificationDocs = VERIFICATION_DOCUMENTS.map((vd) => {
        let existDOCS = uplodedDOCS.find((uvd) => uvd.slug == vd.slug);
        if (existDOCS) {
          existDOCS.documentURL = existDOCS.documentURL ? IMG_URL+existDOCS.documentURL : "";
          vd = existDOCS;
        }
        return vd;
      });
      existVendor[0].companyInfo = existVendor[0].companyInfo[0] ? existVendor[0].companyInfo[0] : {};
      let productAnalysis = await HelperService.userAnanlysis(req.query.userId);
      let serviceAnalysis = await HelperService.userServiceAnanlysis(req.query.userId);
      let solutionAnalysis = await HelperService.userSolutionAnanlysis(req.query.userId);
      let dashboardAnalysis = { ...productAnalysis, ...serviceAnalysis, ...solutionAnalysis };
      let checkProductExist = await HelperService.checkProductExist(req.query.userId);
      existVendor[0].editableCurrency = false;
      if (checkProductExist) { existVendor[0].editableCurrency = true; }
      return SendResponse(res, { user: existVendor[0], analysis: dashboardAnalysis }, "user details");
    } catch (err) {
      console.log(err);
      SendResponse(res, Boom.badImplementation(err));
    }
  },
  edit: async (req, res) => {
    try {
      if ('userId' in req.body && req.body.userId) {
        req.body.id = req.body.userId;
      }
      let existUser = await UserModel.findOne({ _id: req.body.id });
      if (!existUser) {
        return SendResponse(res, Boom.notFound("User not found"));
      }
      let user = {};
      if (req.body.firstName != undefined && req.body.firstName != "") {
        user.firstName = req.body.firstName;
      }
      if (req.body.lastName != undefined && req.body.lastName != "") {
        user.lastName = req.body.lastName;
      }
      if (req.body.socialInfo != undefined && req.body.socialInfo != "") {
        user.socialInfo = req.body.socialInfo;
      }
      if (req.body.dialCode != undefined && req.body.dialCode != "") {
        user.dialCode = req.body.dialCode;
      }
      if (req.body.designation != undefined && req.body.designation != "") {
        user.designation = req.body.designation;
      }
      if (req.body.vendorDescription != undefined && req.body.vendorDescription != "") {
        user.vendorDescription = req.body.vendorDescription;
      }
      if (req.body.dob != undefined && req.body.dob != "") {
        user.dob = req.body.dob;
      }
      if (req.body.iso2 != undefined && req.body.iso2 != "") {
        user.iso2 = req.body.iso2;
      }
      if (req.body.categories != undefined && req.body.categories != "") {
        user.categories = JSON.parse(req.body.categories);
      }
      if (req.files) {
        user.avatar = await FileService.uploadImage(req.files.avatar);
      }
      if (req.body.mobile != undefined && req.body.mobile != "") {
        let exists = await UserModel.findOne({ mobile: req.body.mobile, _id: { $ne: existUser._id } });
        if (exists) {
          return SendResponse(res, Boom.conflict("Mobile number is linked with another account"));
        }
        user.mobile = req.body.mobile;
      }
      if (req.body.email != undefined && req.body.email != "") {
        let exists = await UserModel.findOne({ email: req.body.email, _id: { $ne: existUser._id } });
        if (exists) {
          return SendResponse(res, Boom.conflict("Email is linked with another account"));
        }
        user.email = req.body.email;
      }
      // Number(req.body.long || existUser.long), Number(req.body.lat || existUser.lat)
      user.address = {
        coordinates: [0, 0],
        postcode: (req.body.postcode || existUser.address.postcode),
        country: (req.body.country || existUser.address.country),
        state: (req.body.state || existUser.address.state),
        city: (req.body.city || existUser.address.city),
        postalAddress: (req.body.postalAddress || existUser.address.postalAddress),
        ciso2: (req.body.ciso2 || existUser.address.ciso2),
      };

      await UserModel.findOneAndUpdate({ _id: req.body.id }, { $set: user }, { new: true });
      req.query.userId = req.body.id;
      req.query.from = 'rtn';
      user = await module.exports.userDetail(req, res);
      return SendResponse(res, user, "profile been updated successfully");
    } catch (err) {
      console.log(err);
      SendResponse(res, Boom.badImplementation(err));
    }
  },
  changeStatus: async (req, res) => {
    try {
      if(!req.body.verifyVendorAccount){
        let existUser = await UserModel.findOneAndUpdate({ _id: req.body.id }, { $set: { status: req.body.status } }, { new: true })
        if (existUser) {
          return SendResponse(res, existUser, 'Record updated');
        } else {
          return SendResponse(res, {}, 'Record not found', 0);
        }
      }else{
        let existUser = await UserModel.findOneAndUpdate({ _id: req.body.id }, { $set: { verifyVendorAccount: req.body.verifyVendorAccount } }, { new: true })
        if (existUser) {
          await EmailService.Email(existUser.email,`Hi There,


          Your Account is approved by ICTKart Admin. if you are already login logout and relogin and continue as Seller.
          
          Thanks 
          ictkart support team.`);
          return SendResponse(res, existUser, 'Record updated');
        } else {
          return SendResponse(res, {}, 'Record not found', 0);
        }
      }
      
    } catch (error) {
      return SendResponse(res, Boom.badImplementation());
    }
  },
  //active inactive
  changeAccessStatus: async (req, res) => {
    try {
      let existUser = await UserModel.findOneAndUpdate({ _id: req.body.id }, { $set: { accountStatus: req.body.status } }, { new: true })
      if (existUser) {
        return SendResponse(res, existUser, 'Record updated');
      } else {
        return SendResponse(res, {}, 'Record not found', 0);
      }
    } catch (error) {
      return SendResponse(res, Boom.badImplementation());
    }
  },
  userList: async (req, res) => {
    try {
      let { page, limit = 10, sort, order = "desc", search, status, date_to, date_from, role = 'user', radius, lat, long } = req.body;
      let skip = page * limit - limit || 0;
      limit = parseInt(limit) || 10;
      order = order == "desc" ? -1 : 1;
      sort = {
        [sort || 'createdAt']: order
      };
      let params = {
        role: role
      };
      if (search != null && search != undefined && search != "") {
        params = Object.assign(params, {
          $or: [
            { firstName: { $regex: ".*" + search + ".*", $options: 'i' } },
            { mobile: { $regex: ".*" + search + ".*", $options: 'i' } },
            { email: { $regex: ".*" + search + ".*", $options: 'i' } }
          ]
        });
      }
      if (status != null && status != undefined && status != "") {
        if (status == '1')
          params = Object.assign(params, { status: true });
        if (status == '0')
          params = Object.assign(params, { status: false });
      }
      let totalUser = await UserModel.countDocuments(params);
      let user = await UserModel.aggregate([{
        $match: params
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          role: 1,
          companyName: 1,
          fullName: { $concat: ["$firstName", " ", "$lastName"] },
          mobile: 1,
          dialCode: 1,
          email: 1,
          createdAt: 1,
          status: 1,
        }
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
      ]).exec();
      return SendResponse(res, { users: user, total: totalUser }, "User list");
    } catch (error) {
      console.log(error);
      return SendResponse(
        res,
        Boom.badImplementation("Opps something wents wrong")
      );
    }
  },
  vendorList: async (req, res) => {
    try {
      let { page, limit = 10, sort, order = "desc", search, status, date_to, date_from, role = 'vendor', radius, lat, long } = req.body;
      let skip = page * limit - limit || 0;
      limit = parseInt(limit) || 10;

      order = order == "desc" ? -1 : 1;
      sort = {
        [sort || 'createdAt']: order
      };
      let params = {
        role: role
      };
      if (search != null && search != undefined && search != "") {
        params = Object.assign(params, {
          $or: [
            { firstName: { $regex: ".*" + search + ".*", $options: 'i' } },
            { mobile: { $regex: ".*" + search + ".*", $options: 'i' } },
            { email: { $regex: ".*" + search + ".*", $options: 'i' } }
          ]
        });
      }
      if (status != null && status != undefined && status != "") {
        if (status == '1')
          params = Object.assign(params, { status: true });
        if (status == '0')
          params = Object.assign(params, { status: false });
      }
      let totalUser = await UserModel.countDocuments(params);
      let user = await UserModel.aggregate([{
        $match: params
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          verifyVendorAccount:1,
          role: 1,
          companyName: 1,
          fullName: { $concat: ["$firstName", " ", "$lastName"] },
          mobile: 1,
          dialCode: 1,
          email: 1,
          createdAt: 1,
          status: 1,
          otp: 1
        }
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
      ]).exec();
      return SendResponse(res, { users: user, total: totalUser }, "User list");
    } catch (err) {
      return SendResponse(res, Boom.badImplementation());
    }
  },
  changePassword: async (req, res) => {
    try {
      let user = await UserModel.findOne({ _id: req.body.userId })
        .select("+password")
        .lean()
        .exec();
      let isPwd = await bcrypt.compare(req.body.oldPassword, user.password);
      if (isPwd) {
        let newUser = new UserModel({ password: req.body.newPassword });
        let newPass = newUser.hash(req.body.newPassword);
        await UserModel.findOneAndUpdate({ _id: req.body.userId }, { $set: { password: newPass } }, { new: true });
        return SendResponse(res, {}, "Your password has been changed successfully");
      }
      else {
        return SendResponse(res, Boom.notAcceptable('Your password not match with previous password'));
      }
    } catch (error) {
      console.log(error);
      return SendResponse(res, Boom.badImplementation());
    }
  },
  ForgotPassword: async (req, res) => {
    try {
      await UserModel.findOne({ email: req.body.email }).lean()
        .then(async (user) => {
          if (user) {
            let password = generatePassword();
            EmailService.forgotPasswordEmail(req.body.email, password)
            let newPassword = await bcrypt.hash(password, constant.saltRounds)
            UserModel.findOneAndUpdate({ email: req.body.email }, { $set: { password: newPassword } }, { new: true })
              .then(async (doc) => {
                return SendResponse(res, doc, "Password Has Been Sent To Your Mail");
              })
              .catch((err) => {
                return SendResponse(res, Boom.badImplementation());
              })
          } else {
            return SendResponse(res, Boom.badRequest('Please Enter Correct Email Address'));
          }
        }).catch((err) => {
          console.log(err);
          return SendResponse(res, Boom.badRequest());
        })
    } catch (error) {
      console.log(error);
      return SendResponse(res, Boom.badImplementation());
    }
  },
  generateOtp: async (req, res) => {
    try {
      let existUser = await UserModel.findOne({ email: req.body.email });
      if (existUser) {
        var otp = generateOtp();
        await UserModel.findOneAndUpdate({ email: req.body.email }, { $set: { otp: otp } })
        EmailService.otpMail(existUser.email, otp)
        return SendResponse(res, {}, 'OTP sent successfully.')
      } else {
        return SendResponse(res, Boom.badRequest('Please enter valid user'));
      }
    } catch (err) {
      console.log(err);
      SendResponse(res, Boom.badImplementation(err));
    }
  },
  verifyOtp: async (req, res) => {
    try {
      let existUser = await UserModel.findOne({ email: req.body.email, status: true });
      if (existUser) {
        let a = await UserModel.findOne({ mobile: existUser.mobile, otp: req.body.otp });
        if (a) {
          req.body.deviceToken = req.body.deviceToken ? (req.body.deviceToken).toString() : "";
          await UserModel.findByIdAndUpdate(a._id, {
            $set: {
              otp: '',
              deviceToken: req.body.deviceToken,
              isVerify: true,
              // accountStatus:"active"
            }
          })
          let authToken = jwt.sign(
            {
              data: {
                id: existUser._id,
                email: existUser.email,
              },
            },
            `${constant.JWT_SECRET}`,
            { expiresIn: "168h" }
          );
          req.query.userId = existUser._id;
          req.query.from = 'rtn';
          user = await module.exports.userDetail(req, res);
          if(user.role === "vendor" && user.verifyVendorAccount === false){
            await EmailService.Email(user.email,`Hi There,


            To get your Account active from please go to you profile and submit business document,
            once our admin verify and approved your account you will be notified on email. 
            
            
            Thanks 
            ictkart support team.`);
          }
          return SendResponse(res, { user, token: authToken }, 'Login successfully.')
        } else {
          return SendResponse(res, Boom.badRequest('Please enter valid otp'));
        }
      } else {
        return SendResponse(res, Boom.badRequest('Please enter valid user'));
      }

    } catch (err) {
      console.log(err);
      SendResponse(res, Boom.badImplementation(err));
    }
  },
  addCompanyInfo: async (req, res) => {
    try {
      // req.body.dateOfEstablishment = new Date(moment(req.body.dateOfEstablishment).format("YYYY-MM-DD"));
      let newUser = new companyInfoModel(req.body);
      let userData = await newUser.save();
      return SendResponse(res, userData, `company info added successfully `);
    } catch (err) {
      console.log(err);
      SendResponse(res, Boom.badImplementation(err));
    }
  },
  updateCompanyInfo: async (req, res) => {
    try {
      let existUser = await companyInfoModel.findOne({ vendorId: req.body.vendorId });
      if (existUser) {
        existUser = await companyInfoModel.findOneAndUpdate(
          { vendorId: req.body.vendorId },
          { $set: req.body },
          { new: true }
        );
      }
      else {
        let newUser = new companyInfoModel(req.body);
        let userData = await newUser.save();
      }
      // await UserModel.findOneAndUpdate(
      //   { _id: req.body.vendorId },
      //   { $set: req.body },
      //   { new: true }
      // );
      return SendResponse(res, {}, `company info updated successfully `);
    } catch (err) {
      console.log(err);
      SendResponse(res, Boom.badImplementation(err));
    }
  },
  updateVerificationDocs: async (req, res) => {
    try {
      let existUser = await verificationDocsModel.findOne({ slug: req.body.slug });
      if (req.files && req.files.documentURL) {
        req.body.documentURL = await FileService.uploadImage(req.files.documentURL);
      }
      if (existUser) {
        existUser = req.body.documentURL = req.body.documentURL ? req.body.documentURL : existUser.documentURL;
        await verificationDocsModel.findOneAndUpdate(
          { slug: req.body.slug },
          { $set: req.body },
          { new: true }
        );
      }
      else {
        let vd = new verificationDocsModel(req.body);
        existUser = await vd.save();
      }
      return SendResponse(res, {existUser}, `verificationDocs updated successfully `);
    } catch (err) {
      console.log(err);
      SendResponse(res, Boom.badImplementation(err));
    }
  },
  updateBrandPartnerShip: async (req, res) => {
    try {
      if (req.files) {
        req.body.documentFile = await FileService.uploadImage(req.files.documentFile);
      }
      let newUser = new brandPartenshipModel(req.body);
      await newUser.save();
      return SendResponse(res, {}, `brandPartenships updated successfully `);
    } catch (err) {
      console.log(err);
      SendResponse(res, Boom.badImplementation(err));
    }
  },
  updateRegionalPresence: async (req, res) => {
    try {
      let existRP = await regionalPresenceModel.countDocuments({ vendorId: req.body.vendorId });
      if (existRP) {
        await regionalPresenceModel.deleteMany({ vendorId: req.body.vendorId }, { multi: true })
      }
      if (req.body.rp) {
        req.body.rp = JSON.parse(req.body.rp);
        for (let ck = 0; ck < (req.body.rp).length; ck++) {
          let rpelement = req.body.rp[ck];
          rpelement.vendorId = req.body.vendorId;
          let newUser = new regionalPresenceModel(rpelement);
          await newUser.save();
        }
      }
      let existUser = await UserModel.findOne({ _id: req.body.vendorId});
      if(existUser.role === "vendor" && existUser.verifyVendorAccount === false){
        await EmailService.Email("nitish11@yopmail.com",`Hi There,


        a new Seller have submitted his business document to review. 
        
        Seller Email Id : ${existUser.email}
        Name : ${existUser.firstName} ${existUser.lastName}
        
        
        Thanks 
        ictkart support team.`);
      }
      return SendResponse(res, {}, `regionalPresence added successfully `);
    } catch (err) {
      console.log(err);
      SendResponse(res, Boom.badImplementation(err));
    }
  },
  allCountry: async (req, res) => {
    try {
      let country = JSON.parse(countryData)
      return SendResponse(res, country, "All country")
    } catch (error) {
      console.log(error);
      return SendResponse(res, Boom.badImplementation(error))
    }
  },
  addToCart: async (req, res) => {
    try {
      let existProduct = await UserModel.findOne({ _id: req.body.userId, "carts.product": req.body.carts.product }, { "carts.$": 1 });
      if (existProduct) {
        existProduct = await UserModel.findOneAndUpdate({
          _id: req.body.userId
        }, {
          $inc: {
            "carts.$[outer].units": 1
          }
        }, {
          "arrayFilters": [
            { "outer.product": req.body.carts.product }
          ],
          new: true
        });
      }
      else {
        existProduct = await UserModel.findOneAndUpdate({
          _id: req.body.userId
        }, {
          $push: { carts: req.body.carts }
        }, { new: true });
      }
      return SendResponse(res, { carts: existProduct.carts }, "Product added in cart successfully")
    } catch (error) {
      console.log(error);
      return SendResponse(res, Boom.badImplementation(error))
    }
  },
  getUserCart: async (req, res) => {
    try {
      let carts = await UserModel.findOne({ _id: req.body.userId }, { carts: 1 });
      return SendResponse(res, carts, "Product in cart")
    } catch (error) {
      console.log(error);
      return SendResponse(res, Boom.badImplementation(error))
    }
  },
  cartList: async (req, res) => {
    try {
      let userCarts = [];
      if (req.body.productId && req.body.productId != "bycart") {
        let product = await ProductModel.findOne({ _id: req.body.productId }).populate('vender', "firstName lastName");
        let obj = {
          quantity: 1,
          title: product.title,
          originalPrice: product.originalPrice,
          sellingPrice: product.sellingPrice,
          currency: product.currency,
          _id: product._id,
          thumbnail: product.images && product.images.length ? IMG_URL + product.images[0] : PRODUCT_URL,
          seller: product.vender,
        }
        userCarts.push(obj);
      }
      else {
        let cart = await UserModel.findOne({ _id: req.body.userId }, {
          carts: 1
        }).populate({
          path: "carts.product",
          select: "title originalPrice sellingPrice currency thumbnail images",
          populate: {
            path: "vender",
            select: "firstName lastName"
          }
        });

        cart.carts.map((cartObj) => {
          let product = cartObj.product || {};
          let obj = {
            quantity: cartObj.units,
            title: product.title,
            originalPrice: product.originalPrice,
            sellingPrice: product.sellingPrice,
            currency: product.currency,
            _id: product._id,
            thumbnail: product.images && product.images.length ? IMG_URL + product.images[0] : PRODUCT_URL,
            seller: product.vender,
          }
          userCarts.push(obj);
          return cartObj;
        })
      }
      return SendResponse(res, { list: userCarts }, "cart list")
    } catch (error) {
      console.log(error);
      return SendResponse(res, Boom.badImplementation(error))
    }
  },
  removeProduct: async (req, res) => {
    try {
      let existProduct = await UserModel.findOne({ _id: req.body.userId, "carts.product": req.body.product }, { "carts.$": 1 });
      if (existProduct) {
        existProduct = await UserModel.findOneAndUpdate({
          _id: req.body.userId
        }, {
          $pull: {
            "carts": {
              product: req.body.product
            }
          }
        }, {
          new: true
        });
      }
      return SendResponse(res, { carts: existProduct.carts }, "product removed")
    } catch (error) {
      console.log(error);
      return SendResponse(res, Boom.badImplementation(error))
    }
  },
  sellerProfile: async (req, res) => {
    try {
      let user = await HelperService.userProfile(req.body.userId);
      user['shop'] = await HelperService.userCompanyInfo(req.body.userId);
      return SendResponse(res, { user: user }, "user details");
    } catch (err) {
      console.log(err);
      SendResponse(res, Boom.badImplementation(err));
    }
  },
  allCurrency: async (req, res) => {
    try {
      let currencies = JSON.parse(currenciesJson)
      return SendResponse(res, currencies, "All currencies")
    } catch (error) {
      console.log(error);
      return SendResponse(res, Boom.badImplementation(error))
    }
  },
  teamMembers: async (req, res) => {
    try {
      let count = await UserModel.countDocuments({ vendor: req.body.vendorId });
      let list = await UserModel.find({ vendor: req.body.vendorId }, {
        firstName: 1,
        lastName: 1,
        dialCode: 1,
        mobile: 1,
        email: 1,
      }).populate({
        path: "userRole",
        select: "name",
      });
      return SendResponse(res, { count, list }, "cart list")
    } catch (error) {
      console.log(error);
      return SendResponse(res, Boom.badImplementation(error))
    }
  },
}

