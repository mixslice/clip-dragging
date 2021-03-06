var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var config = require('./webpack.config');

var devPort = process.env.DEV_SERVER_PORT || 3000;

new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  hot: true,
}).listen(devPort, '0.0.0.0', function (err, result) {
  if (err) {
    return console.log(err);
  }

  console.log(`Listening at http://localhost:${devPort}/`);
});
