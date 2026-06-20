"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const errors_1 = require("../utils/errors");
function errorHandler(err, req, res, next) {
    // If headers already sent, delegate to default express error handler
    if (res.headersSent) {
        return next(err);
    }
    // Handle AppError
    if (err instanceof errors_1.AppError) {
        let status = 500;
        if (err.statusCode) {
            status = err.statusCode;
        }
        else {
            switch (err.code) {
                case 'NOT_FOUND':
                    status = 404;
                    break;
                case 'FORBIDDEN':
                    status = 403;
                    break;
                case 'CONFLICT':
                    status = 409;
                    break;
                case 'BAD_REQUEST':
                    status = 400;
                    break;
                default:
                    status = 500;
            }
        }
        return res.status(status).json({
            error: {
                code: err.code,
                message: err.message
            }
        });
    }
    // Fallback to 500
    return res.status(500).json({
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: err.message || 'An unexpected error occurred'
        }
    });
}
