"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const resolveUser_1 = require("./middleware/resolveUser");
const errorHandler_1 = require("./middleware/errorHandler");
const users_1 = __importDefault(require("./routes/users"));
const documents_1 = __importDefault(require("./routes/documents"));
const shares_1 = __importDefault(require("./routes/shares"));
const upload_1 = __importDefault(require("./routes/upload"));
dotenv_1.default.config();
function createApp() {
    const app = (0, express_1.default)();
    // CORS configuration
    const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
    app.use((0, cors_1.default)({
        origin: allowedOrigin,
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'X-User-Email'],
        credentials: true
    }));
    app.use(express_1.default.json());
    // Unauthenticated routes
    app.use('/api/v1/users', users_1.default);
    // Authenticated routes
    app.use(resolveUser_1.resolveUser);
    app.use('/api/v1/documents', documents_1.default);
    app.use('/api/v1/shares', shares_1.default);
    app.use('/api/v1/upload', upload_1.default);
    // Global Error Handler
    app.use(errorHandler_1.errorHandler);
    return app;
}
