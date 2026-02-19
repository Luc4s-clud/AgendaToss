/**
 * PM2 - Rodar na VPS Hostinger:
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup  (para iniciar com o servidor)
 */
module.exports = {
  apps: [
    {
      name: 'agenda-toss-api',
      script: 'src/server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      env_file: '.env',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
