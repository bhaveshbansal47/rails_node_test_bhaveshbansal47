require('dotenv').config();
const Queue = require('bull');

const redisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
};

const uploadsQueue = new Queue('uploads', {
    redis: redisOptions,
});

async function flush() {
    console.log('Flushing uploads queue...');
    try {
        await uploadsQueue.obliterate({ force: true });
        console.log('Queue obliterated.');
    } catch (err) {
        console.error('Error flushing queue:', err);
    } finally {
        await uploadsQueue.close();
        process.exit(0);
    }
}

flush();
