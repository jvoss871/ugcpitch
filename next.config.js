/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        // Pro handle URLs: /sarah-creates/abc1234 → /pitch/view?id=abc1234
        // Negative lookahead excludes all known app route prefixes
        source: '/:handle((?!pitch|dashboard|profile|brand|content|create|admin|login|help|api|_next)[a-z0-9][a-z0-9-]*)/:pitchId',
        destination: '/pitch/view?id=:pitchId',
      },
    ];
  },
}

module.exports = nextConfig
