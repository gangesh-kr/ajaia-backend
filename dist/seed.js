"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seed = seed;
const supabase_1 = require("./lib/supabase");
const USERS_TO_SEED = [
    { email: 'alice@example.com', name: 'Alice' },
    { email: 'bob@example.com', name: 'Bob' },
    { email: 'charlie@example.com', name: 'Charlie' }
];
async function seed() {
    console.log('Starting database seeding...');
    for (const user of USERS_TO_SEED) {
        try {
            const { data, error } = await supabase_1.supabase
                .from('users')
                .select('*')
                .eq('email', user.email)
                .maybeSingle();
            if (error) {
                console.error(`Error checking user ${user.email}:`, error.message);
                continue;
            }
            if (data) {
                console.log(`User ${user.email} already exists.`);
            }
            else {
                const { error: insertError } = await supabase_1.supabase
                    .from('users')
                    .insert([user]);
                if (insertError) {
                    console.error(`Error inserting user ${user.email}:`, insertError.message);
                }
                else {
                    console.log(`User ${user.email} successfully seeded.`);
                }
            }
        }
        catch (err) {
            console.error(`Unexpected error seeding user ${user.email}:`, err.message || err);
        }
    }
    console.log('Seeding completed.');
}
if (require.main === module) {
    seed().catch(err => {
        console.error('Failed to run seed script:', err);
        process.exit(1);
    });
}
