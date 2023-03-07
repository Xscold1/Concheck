const joi = require('joi')


const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^\w\s]).{6,}$/;
const CUT_OFF_DATE = new Date(Date.now() - (1000 * 60 * 60 * 24 * 365 * 16));

const userSchema = joi.object({
    email: joi.string().email()
    .required()
    .messages({
        "string.email": "Must be a valid email address",
        "string.empty": "Email must not be empty",
    }),

    password: joi.string().min(6).pattern(PASSWORD_REGEX, 'password').required().messages({
        "string.min": "Password must have at least 6 characters",
        "string.empty": "Password must not be empty",
        "string.pattern.name": "Password must have at least 12 characters, no white spaces and contain at least one of the following: uppercase letters, lowercase letters, numbers and symbols"
      }),
});

const companyDetailsSchema = joi.object({
    companyName: joi.string()
    .required()
    .messages({
        "string.empty": "Company name must not be empty"
    }),
    address: joi.string()
    .required()
    .messages({
        "string.empty": "address must not be empty"
    }),
    contactNumber: joi.number()
    .required()
    .messages({
        "number.empty": "Company name must not be empty"
    }),
})

const engineerDetailsSchema = joi.object({
    firstName: joi.string()
    .required()
    .messages({
        "string.empty": "fistName name must not be empty"
    }),
    lastName: joi.string()
    .required()
    .messages({
        "string.empty": "lastName name must not be empty"
    }),
    address: joi.string()
    .required()
    .messages({
        "string.empty": "address must not be empty"
    }),
    licenseNumber: joi.number()
    .required()
    .messages({
        "number.empty": "Company name must not be empty"
    }),
})

const projectDetailsSchema = joi.object({
    projectName: joi.string()
    .required()
    .messages({
        "string.empty": "projectName must not be empty"
    }),

    // startDate:joi.date()
    // .max(CUT_OFF_DATE)
    // .required()
    // .message({
    //     "date.max": "Start date must not be empty",
    //     "date.base": "Must be a valid date"
    // }),
    // endDate:joi.date()
    // .max(CUT_OFF_DATE)
    // .required()
    // .message({
    //     "date.max": "endDate date must not be empty",
    //     "date.base": "Must be a valid date"
    // }),

    projectEngineer: joi.string()
    .required()
    .messages({
        "string.empty": "projectEngineer must not be empty"
    }),
    siteEngineer: joi.string()
    .required()
    .messages({
        "string.empty": "siteEngineer must not be empty"
    }),
    safetyOfficer: joi.string()
    .required()
    .messages({
        "string.empty": "safetyOfficer must not be empty"
    }),

    status: joi.string()
    .required()
    .messages({
        "string.empty": "status must not be empty"
    }),

    projectCode: joi.number()
    .required()
    .messages({
        "number.empty": "projectCode must not be empty"
    }),

    budget: joi.number()
    .required()
    .messages({
        "number.empty": "budget must not be empty"
    }),
})

const crewDetailsSchema = joi.object({
    firstName: joi.string()
    .required()
    .messages({
        "string.empty": "fistName must not be empty"
    }),
    lastName: joi.string()
    .required()
    .messages({
        "string.empty": "lastName must not be empty"
    }),
    startShift: joi.string()
    .required()
    .messages({
        "string.empty": "startShift must not be empty"
    }),
    endShift: joi.string()
    .required()
    .messages({
        "string.empty": "endShift must not be empty"
    }),
    dailyRate: joi.number()
    .required()
    .messages({
        "number.empty": "dailyRate must not be empty"
    }),
})
module.exports = {
    userSchema,
    companyDetailsSchema,
    engineerDetailsSchema,
    projectDetailsSchema,
    crewDetailsSchema
}