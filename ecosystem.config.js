module.exports = {
  apps: [
    {
      name: "stream-api",
      script: "npm",
      args: "run start",
      cwd: "./server",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
