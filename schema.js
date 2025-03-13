const Joi = require('joi');

module.exports.listingSchema = 
 Joi.object({
    listing: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    price: Joi.number().positive().required(),
    location: Joi.string().required(),
    country: Joi.string().required(),
    image:Joi.string().allow("" , null),
}).required()
});