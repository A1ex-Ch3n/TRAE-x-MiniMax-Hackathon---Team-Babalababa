/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n: {
    locales: ['en', 'zh-TW', 'zh-CN'],
    defaultLocale: 'zh-TW',
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? false : false,
  },
};

export default nextConfig;
