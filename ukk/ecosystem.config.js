module.exports = {
  apps: [
    {
      name: "ukk-project-management",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "./",
      instances: "max", // Use all available CPU cores
      exec_mode: "cluster", // Cluster mode for load balancing
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_file: "./logs/pm2-combined.log",
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      max_memory_restart: "1G",
      watch: false,
      merge_logs: true,
      kill_timeout: 5000,
    },
  ],
};
