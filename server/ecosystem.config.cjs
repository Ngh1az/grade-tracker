module.exports = {
  apps: [
    {
      name: 'grade-tracker-api',
      script: 'src/index.js',
      cwd: '/var/www/grade-tracker-api',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: '/var/log/grade-tracker/error.log',
      out_file: '/var/log/grade-tracker/out.log',
      time: true,
    },
  ],
};
