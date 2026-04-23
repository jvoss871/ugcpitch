/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        // Pro handle URLs: /sarah-creates/abc1234 → /pitch/view?id=abc1234
        // File-system routes (dashboard, profile, pitch/*, etc.) take priority
        source: '/:handle/:pitchId',
        destination: '/pitch/view?id=:pitchId',
      },
    ];
  },
}

module.exports = nextConfig
