/* eslint-disable */
const webpack = require('webpack');

module.exports = {
  // chainWebpack: config => {
  //   config.module
  //     .rule(/jquery-mousewheel/)
  //     .use('imports-loader?define=>false&this=>window')
  //     .loader('imports-loader');
  //   config.module
  //     .rule(/malihu-custom-scrollbar-plugin/)
  //     .use('imports-loader?define=>false&this=>window')
  //     .loader('imports-loader')
  //   config.resolve.alias
  //     .set('$', 'jquery')
  //     .set('jQuery', 'jquery')
  //     .set('window.jQuery', 'jquery');
  //   config.plugin('providePlugin')
  //     .use(new webpack.ProvidePlugin({
  //       $: "jquery",
  //       jQuery: "jquery"
  //     }))
  // },
  configureWebpack: {
    devtool: 'source-map',
  },

  configureWebpack: {
    plugins: [
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
        'window.jQuery': 'jquery',
        _: 'lodash',
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        'process.env.BASE_URL': JSON.stringify('/'),
      }),
      // new webpack.NormalModuleReplacementPlugin(/element-ui[\/\\]lib[\/\\]locale[\/\\]lang[\/\\]zh-CN/, 'element-ui/lib/locale/lang/en')
    ],
    resolve: {
      alias: {
        jquery: 'jquery',
        _: 'lodash',
      },
    },
    module: {
      rules: [
        { test: /jquery-mousewheel/, loader: 'imports-loader?define=>false&this=>window' },
        { test: /malihu-custom-scrollbar-plugin/, loader: 'imports-loader?define=>false&this=>window' },
      ],
    },
  },
  css: {
    loaderOptions: {
      postcss: {}
    }
  }
};
