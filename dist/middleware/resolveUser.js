"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveUser = resolveUser;
const supabase_1 = require("../lib/supabase");
async function resolveUser(req, res, next) {
    const email = req.headers['x-user-email'];
    if (!email || typeof email !== 'string') {
        return res.status(401).json({
            error: {
                code: 'UNAUTHORIZED',
                message: 'Missing or invalid X-User-Email header'
            }
        });
    }
    try {
        const { data: user, error } = await supabase_1.supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle();
        if (error) {
            return res.status(500).json({
                error: {
                    code: 'DATABASE_ERROR',
                    message: error.message
                }
            });
        }
        if (!user) {
            return res.status(401).json({
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Missing or invalid X-User-Email header'
                }
            });
        }
        req.user = user;
        next();
    }
    catch (err) {
        next(err);
    }
}
