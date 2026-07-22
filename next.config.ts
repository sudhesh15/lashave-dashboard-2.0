const nextConfig = {
  allowedDevOrigins: [
    '127.0.0.1',
    'localhost',
    'staging.thundertribes.com',
    'app.lashvae.com',
  ],

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8001/:path*',
      },
    ];
  },
};

export default nextConfig;
