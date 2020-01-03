/**
 * @flow
 * */

import fetch from '../utils/proxiedFetch.js';
import IP from 'ip';

import redis from '../data/redis';
import { Blacklist, Whitelist } from '../data/models';
import logger from './logger';


/*
 * check getipintel if IP is proxy
 * Use proxiedFetch with random proxies and random mail for it, to not get blacklisted
 * @param ip IP to check
 * @return true if proxy, false if not
 */
async function getIPIntel(ip: string): Promise<boolean> {
  const email = `${Math.random().toString(36).substring(8)}-${Math.random().toString(36).substring(4)}@gmail.com`;
  const url = `http://check.getipintel.net/check.php?ip=${ip}&contact=${email}&flags=m`;
  logger.info('fetching getipintel', url);
  const response = await fetch(url, {
    headers: {
      Accept: '*/*',
      'Accept-Language': 'de,en-US;q=0.7,en;q=0.3',
      Referer: 'http://check.getipintel.net/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
    },
  });
  // TODO log response code
  logger.debug('getipintel?', ip);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`getipintel not ok ${response.status}/${text}`);
  }
  const body = await response.text();
  logger.info('fetch getipintel is proxy?', ip, body);
  // returns tru iff we found 1 in the response and was ok (http code = 200)
  const value = parseFloat(body);
  return value > 0.995;
}

/*
 * check proxycheck.io if IP is proxy
 * Use proxiedFetch with random proxies
 * @param ip IP to check
 * @return true if proxy, false if not
 */
async function getProxyCheck(ip: string): Promise<boolean> {
  const url = `http://proxycheck.io/v2/${ip}?risk=1&vpn=1&asn=1`;
  logger.info('fetching proxycheck', url);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`proxycheck not ok ${response.status}/${text}`);
  }
  const data = await response.json();
  logger.info('proxycheck is proxy?', ip, data);
  return data.status == 'ok' && data[ip].proxy === 'yes';
}

/*
 * check shroomey if IP is proxy
 * NOTE: shroomey can not check IPv6
 * User random proxies for request, just to be sure
 * @param ip IP to check
 * @return true if proxy, false if not
 */
async function getShroomey(ip: string): Promise<boolean> {
  logger.info('fetching shroomey', ip);
  const response = await fetch(`http://www.shroomery.org/ythan/proxycheck.php?ip=${ip}`, {
    headers: {
      Accept: '*/*',
      'Accept-Language': 'es-ES,es;q=0.8,en;q=0.6',
      Referer: 'http://www.shroomery.org/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36',
    },
  });
  if (!response.ok) throw new Error('shroomery.org not ok');
  const body = await response.text();
  logger.info('fetch shroomey is proxy?', ip, body);
  return body === 'Y';
}

/*
 * check shroomey, and if positive there, check
 * getipintel
 * @param ip IP to check
 * @return true if proxy, false if not
 */
async function getCombined(ip: string): Promise<boolean> {
  if (ip.indexOf(':') == -1) {
    const shroom = await getShroomey(ip);
    if (!shroom) return false;
  }
  const ipintel = await getIPIntel(ip);
  return ipintel;
}

/*
 * check MYSQL Blacklist table
 * @param ip IP to check
 * @return true if blacklisted
 */
async function isBlacklisted(ip: string): Promise<boolean> {
  const numIp = IP.toLong(ip);
  const count = await Blacklist
    .count({
      where: {
        numIp,
      },
    });
  return count !== 0;
}

/*
 * check MYSQL Whitelist table
 * @param ip IP to check
 * @return true if whitelisted
 */
async function isWhitelisted(ip: string): Promise<boolean> {
  const numIp = IP.toLong(ip);
  const count = await Whitelist
    .count({
      where: {
        numIp,
      },
    });
  return count !== 0;
}

/*
 * dummy function to include if you don't want any proxycheck
 */
async function dummy(ip: string): Promise<boolean> {
  return false;
}

/*
 * execute proxycheck without caring about cache
 * @param f function for checking if proxy
 * @param ip IP to check
 * @return true if proxy or blacklisted, false if not or whitelisted
 */
async function withoutCache(f, ip) {
  if (!ip) return true;
  return !(await isWhitelisted(ip)) && (await isBlacklisted(ip) || await f(ip));
}

/*
 * execute proxycheck without caching results for 3 days
 * do not check more than 3 at a time, do not check ip double
 * @param f function for checking if proxy
 * @param ip IP to check
 * @return true if proxy or blacklisted, false if not or whitelisted
 */
let lock = 4;
const checking = new Array();
async function withCache(f, ip) {
  if (!ip) return true;
  // get from cache, if there
  const key = `isprox:${ip}`;
  const cache = await redis.getAsync(key);
  if (cache) {
    const str = cache.toString('utf8');
    logger.debug('fetch isproxy from cache', key, cache, typeof cache, str, typeof str);
    return str === 'y';
  }
  logger.debug('fetch isproxy not from cache', key);

  // else make asynchronous ipcheck and assume no proxy in the meantime
  // use lock to just check three at a time
  // do not check ip that currently gets checked
  if (checking.indexOf(ip) == -1 && lock > 0) {
    lock -= 1;
    checking.push(ip);
    withoutCache(f, ip)
      .then((result) => {
        const value = result ? 'y' : 'n';
        redis.setAsync(key, value, 'EX', 3 * 24 * 3600); // cache for three days
        const pos = checking.indexOf(ip);
        if (~pos) checking.splice(pos, 1);
        lock += 1;
      })
      .catch((error) => {
        logger.error('withCache', error.message || error);
        const pos = checking.indexOf(ip);
        if (~pos) checking.splice(pos, 1);
        lock += 1;
      });
  }
  return false;
}

export async function cheapDetector(ip: string): Promise<boolean> {
  return (await withCache(getProxyCheck, ip));
}

export async function strongDetector(ip: string): Promise<boolean> {
  return (await withCache(getShroomey, ip));
}

export async function blacklistDetector(ip: string): Promise<boolean> {
  return (await withCache(dummy, ip));
}

// export default cheapDetector;