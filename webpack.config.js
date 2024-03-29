const path = require("path");

module.exports = {
  target: "node",
  entry: {
    room: "./src/room/index.ts",
    server: "./src/server/index.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name]-bundle.js",
  },
  watch: true,
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  mode: "production",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
      },
    ],
  },
};
