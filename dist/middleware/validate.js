"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const zod_1 = require("zod");
function validate(schema) {
    return (req, res, next) => {
        try {
            const parsed = schema.parse(req.body);
            req.body = parsed;
            next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                return res.status(422).json({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Validation failed',
                        details: err.errors.map(e => ({
                            path: e.path.join('.'),
                            message: e.message
                        }))
                    }
                });
            }
            next(err);
        }
    };
}
