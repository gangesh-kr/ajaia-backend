"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    code;
    statusCode;
    constructor(code, message, statusCode) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.AppError = AppError;
