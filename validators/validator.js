const _ = require('lodash');
const Joi = require('joi');
const Boom = require('@hapi/boom');
const SendResponse = require('./../services/apiHandler');

module.exports = (schema, property) => {
  let lng = 'en';
  const _validationOptions = {
    abortEarly: false, // abort after the last validation error
    allowUnknown: true, // allow unknown keys that will be ignored
    stripUnknown: false, // remove unknown keys from the validated data
    errors: { language: lng }
  };
  return (req, res, next) => {
    const { error } = schema.validate(req[property], _validationOptions);
    let isValid = error == null;
    if (isValid) {
      next();
    }
    else {
      let errMsg = error.details.map(e => e.message.replace(/['"]/g, '') + '.');
      return SendResponse(res, Boom.badData(errMsg));
    }
  }
};
