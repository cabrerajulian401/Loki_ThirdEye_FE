/* eslint-disable no-undef */

const devCerts = require("office-addin-dev-certs");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");

const urlDev = "https://localhost:3000/";
const urlProd = "https://proud-mud-0beae3510.7.azurestaticapps.net/"; // Azure Static Web App (Scout FE)

async function getHttpsOptions() {
  const httpsOptions = await devCerts.getHttpsServerOptions();
  return { ca: httpsOptions.ca, key: httpsOptions.key, cert: httpsOptions.cert };
}

module.exports = async (env, options) => {
  const dev = options.mode === "development";
  const config = {
    devtool: "source-map",
    entry: {
      polyfill: ["core-js/stable", "regenerator-runtime/runtime"],
      react: ["react", "react-dom"],
      taskpane: {
        import: ["./src/taskpane/index.jsx", "./src/taskpane/taskpane.html"],
        dependOn: "react",
      },
      commands: "./src/commands/commands.js",
    },
    output: {
      clean: true,
    },
    resolve: {
      extensions: [".js", ".jsx", ".html"],
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          use: {
            loader: "babel-loader",
          },
          exclude: /node_modules/,
        },
        {
          test: /\.html$/,
          exclude: /node_modules/,
          use: "html-loader",
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.(png|jpg|jpeg|ttf|woff|woff2|gif|ico)$/,
          type: "asset/resource",
          generator: {
            filename: "assets/[name][ext][query]",
          },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: "taskpane.html",
        template: "./src/taskpane/taskpane.html",
        chunks: ["polyfill", "taskpane", "react"],
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "assets/*",
            to: "assets/[name][ext][query]",
          },
          {
            from: "manifest*.xml",
            to: "[name]" + "[ext]",
            transform(content) {
              if (dev) {
                return content;
              } else {
                // WebApplicationInfo's Resource uses the api:// scheme, which the
                // https:// rewrite below can't match — both identifier URIs are
                // registered on the Azure AD app.
                return content
                  .toString()
                  .replace(new RegExp(urlDev, "g"), urlProd)
                  .replace(/api:\/\/localhost:3000\//g, "api://proud-mud-0beae3510.7.azurestaticapps.net/");
              }
            },
          },
        ],
      }),
      new HtmlWebpackPlugin({
        filename: "commands.html",
        template: "./src/commands/commands.html",
        chunks: ["polyfill", "commands"],
      }),
      // Azure Static Web Apps requires an index.html default file; it just
      // redirects to taskpane.html (the add-in's real entry).
      new HtmlWebpackPlugin({
        filename: "index.html",
        template: "./src/index.html",
        chunks: [],
      }),
      // Static pages the store listing and manifest SupportUrl point at.
      new HtmlWebpackPlugin({
        filename: "support.html",
        template: "./src/pages/support.html",
        chunks: [],
      }),
      new HtmlWebpackPlugin({
        filename: "privacy.html",
        template: "./src/pages/privacy.html",
        chunks: [],
      }),
      new webpack.ProvidePlugin({
        Promise: ["es6-promise", "Promise"],
      }),
    ],
    devServer: {
      hot: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      server: {
        type: "https",
        options: env.WEBPACK_BUILD || options.https !== undefined ? options.https : await getHttpsOptions(),
      },
      port: process.env.npm_package_config_dev_server_port || 3000,
    },
  };

  return config;
};
