"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const router = (0, express_1.Router)();
router.get('/', async (req, res, next) => {
    try {
        const { data: users, error } = await supabase_1.supabase
            .from('users')
            .select('*')
            .order('name', { ascending: true });
        if (error) {
            return res.status(500).json({
                error: {
                    code: 'DATABASE_ERROR',
                    message: error.message
                }
            });
        }
        return res.status(200).json(users);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
