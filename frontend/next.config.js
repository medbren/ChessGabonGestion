/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hostnames autorisés à charger /_next/* en mode dev
  // (sans schéma ni port — voir docs Next.js allowedDevOrigins)
  allowedDevOrigins: [
    '192.168.1.68',
    'localhost',
    '127.0.0.1',
  ],
};

module.exports = nextConfig;
