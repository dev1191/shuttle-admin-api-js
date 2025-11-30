module.exports = {
  apps: [
    {
      name: "admin-shuttle-bus-api",
      script: "./src/index.js",
      env: {
        NODE_ENV: "production",
        TZ: "Africa/Libreville"
      }
    }
  ]
};
