
/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
    * built-in config
    * @type {Egg.EggAppConfig}
    **/
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1660810955000_2288';

  // add your middleware config here
  config.middleware = [ 'onError' ];

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  // config.redis = {
  //   client: {
  //     port: 6379, // Redis port
  //     host: '127.0.0.1', // Redis host
  //     password: '',
  //     db: 0,
  //   },
  // };

  // 正式项目要开启
  config.security = {
    csrf: {
		  enable: false,
    },
  };

  config.userData = {
    mineBirth: "2004-04-16", // 自己的生日
    gfBirth: "2000-09-27", // 女朋友的生日
    loveDay: "2026-03-29", // 在一起的日期
    weatherCity: '杨浦区' // 需要获取天气的城市
  }

  config.userCity = {
    "adname":"杨浦区",
    "adcode":"310110"
  }

  // 寄言 一旦设置了就不会请求接口，在这里随机返送一条
  config.words = []

  // 手动设置彩虹屁
  config.caihongpi = []

  return {
    ...config,
    ...userConfig,
  };
};