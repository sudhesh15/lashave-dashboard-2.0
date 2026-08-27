const nextConfig = {
  allowedDevOrigins: [
    '127.0.0.1',
    'localhost',
    'staging.thundertribes.com',
    'app.lashvae.com',
  ],

  async rewrites() {
    const gatewayBase = process.env.GATEWAY_BASE || 'http://127.0.0.1:8001';
    return [
      {
        source: '/admin/:path*',
        destination: `${gatewayBase}/admin/:path*`,
        basePath: false,
      },
      {
        source: '/api/:path*',
        destination: `${gatewayBase}/:path*`,
        basePath: false,
      },
    ];
  },
};

export default nextConfig;
