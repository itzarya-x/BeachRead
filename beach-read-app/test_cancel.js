const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'api/.env.local') });
const backendService = require('./api/services/backendService');

async function test() {
    try {
        const job = await backendService.cancelSyncJob('88686d1b-02f8-47bc-ad3b-afc3baeb1ce4', 'd02128f0-c6aa-4250-a331-a9ce86f500db');
        console.log("Success:", job);
    } catch (err) {
        console.error("Error:", err.message);
    }
}
test();
