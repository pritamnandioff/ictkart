const Joi = require('joi');
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdRegMsg = 'Object ID';
module.exports = {
	register: Joi.object({
		companyName: Joi.string().when('role', { is: 'vendor', then: Joi.required(), otherwise: Joi.allow('').optional() }),
		firstName: Joi.string().when('role', { is: 'user', then: Joi.required(), otherwise: Joi.allow('').optional() }),
		lastName: Joi.string().allow('').optional(),
		email: Joi.string().email({ minDomainSegments: 2 }).required(),
		mobile: Joi.string().min(8).max(14).required(),
		password: Joi.string().required(),
		country: Joi.string().required(),
		iso2: Joi.string().optional(),
		hearAboutICT: Joi.string().required(),
		role: Joi.string().valid('user', 'vendor').required()
	}).unknown(false),
};