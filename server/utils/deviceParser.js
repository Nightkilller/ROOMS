const UAParser = require('ua-parser-js');
const geoip = require('geoip-lite');

const parseDevice = (req) => {
    const ua = new UAParser(req.headers['user-agent']);
    const browser = ua.getBrowser();
    const os = ua.getOS();
    const device = ua.getDevice();

    let ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'Unknown';
    if (ip.includes(',')) ip = ip.split(',')[0].trim();
    if (ip === '::1' || ip === '127.0.0.1') ip = '127.0.0.1';

    const geo = geoip.lookup(ip);

    return {
        ipAddress: ip,
        userAgent: req.headers['user-agent'] || '',
        device: device.type || (os.name ? `${os.name} ${os.version || ''}`.trim() : 'Desktop'),
        browser: browser.name ? `${browser.name} ${browser.version || ''}`.trim() : 'Unknown',
        city: geo?.city || 'Unknown',
        country: geo?.country || 'Unknown',
    };
};

module.exports = { parseDevice };
