/* @flow */
// general config that is also available from client code can be found in
// src/core/constants.js
import path from 'path';

if (process.env.BROWSER) {
  throw new Error(
    'Do not import `config.js` from inside the client-side code.',
  );
}

export const PORT = process.env.PORT || 80;

export const GMAIL_USER = process.env.GMAIL_USER || null;
export const GMAIL_PW = process.env.GMAIL_PW || null;

const TILE_FOLDER_REL = process.env.TILE_FOLDER || 'tiles';
export const TILE_FOLDER = path.join(__dirname, `./${TILE_FOLDER_REL}`);

export const ASSET_SERVER = process.env.ASSET_SERVER || '.';

export const USE_XREALIP = process.env.USE_XREALIP || false;

export const BACKUP_URL = process.env.BACKUP_URL || null;
export const BACKUP_DIR = process.env.BACKUP_DIR || null;

// Proxycheck
export const USE_PROXYCHECK = parseInt(process.env.USE_PROXYCHECK, 10) || false;

export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6380';
// Database
export const MYSQL_HOST = process.env.MYSQL_HOST || 'localhost';
export const MYSQL_DATABASE = process.env.MYSQL_DATABASE || 'pixelplanet';
export const MYSQL_USER = process.env.MYSQL_USER || 'pixelplanet';
export const MYSQL_PW = process.env.MYSQL_PW || 'password';

// Social
export const DISCORD_INVITE = process.env.DISCORD_INVITE
  || 'https://discordapp.com/';

// Logging
export const LOG_MYSQL = parseInt(process.env.LOG_MYSQL, 10) || false;

// Accounts
export const APISOCKET_KEY = process.env.APISOCKET_KEY || 'changethis';
// Comma seperated list of user ids of Admins
export const ADMIN_IDS = (process.env.ADMIN_IDS)
  ? process.env.ADMIN_IDS.split(',').map((z) => parseInt(z, 10)) : [];

export const analytics = {
  // https://analytics.google.com/
  google: {
    trackingId: process.env.GOOGLE_TRACKING_ID, // UA-XXXXX-X
  },
};

export const auth = {
  // https://developers.facebook.com/
  facebook: {
    clientID: process.env.FACEBOOK_APP_ID || 'dummy',
    clientSecret: process.env.FACEBOOK_APP_SECRET || 'dummy',
  },
  // https://discordapp.com/developers/applications/me
  discord: {
    clientID: process.env.DISCORD_CLIENT_ID || 'dummy',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || 'dummy',
  },
  // https://cloud.google.com/console/project
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID || 'dummy',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy',
  },
  // vk.com/dev
  vk: {
    clientID: process.env.VK_CLIENT_ID || 'dummy',
    clientSecret: process.env.VK_CLIENT_SECRET || 'dummy',
  },
  // https://www.reddit.com/prefs/apps
  reddit: {
    clientID: process.env.REDDIT_CLIENT_ID || 'dummy',
    clientSecret: process.env.REDDIT_CLIENT_SECRET || 'dummy',
  },
};

// o: none
// 1: reCaptcha
// 2: hCaptcha
export const CAPTCHA_METHOD = Number(process.env.CAPTCHA_METHOD || 0);
export const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET || false;
export const CAPTCHA_SITEKEY = process.env.CAPTCHA_SITEKEY || false;
// time on which to display captcha in minutes
export const CAPTCHA_TIME = parseInt(process.env.CAPTCHA_TIME, 10) || 30;

export const SESSION_SECRET = process.env.SESSION_SECRET || 'dummy';
