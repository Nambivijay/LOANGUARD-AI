const bcrypt = require('bcryptjs');
(async () => {
    console.log('Testing bcryptjs basic functionality...');
    try {
        const hash = await bcrypt.hash('password123', 10);
        console.log('Hash:', hash);
        const match = await bcrypt.compare('password123', hash);
        console.log('Match:', match);
        console.log('SUCCESS');
    } catch (e) {
        console.log('ERROR:', e.message);
        console.log(e.stack);
    }
    process.exit(0);
})();
