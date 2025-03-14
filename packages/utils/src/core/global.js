import { UAParser } from "ua-parser-js";
import { variableTypeDetection } from "./verifyType";

const _global = window;
const _support = getGlobalSupport();
const uaResult = new UAParser().getResult();

// 获取设备信息
_support.deviceInfo = {
  browserVersion: uaResult.browser.version,
  browser: uaResult.browser.name,
  osVersion: uaResult.os.version,
  os: uaResult.os.name,
  ua: uaResult.ua,
  device: uaResult.device.model ? uaResult.device.model : "Unknow",
  device_type: uaResult.device.type ? uaResult.device.type : "PC",
};

_support.hasError = false;

_support.errorMap = new Map();

_support.replaceFlag = _support.replaceFlag || {};

const replaceFlag = _support.replaceFlag;

export function setFlag(replaceType, isSet) {
  if (replaceFlag[replaceType]) return;
  replaceFlag[replaceType] = isSet;
}

export function getFlag(replaceType) {
  return replaceFlag[replaceType] ? true : false;
}

export function getGlobalSupport() {
  _global._hykSee_ = _global._hykSee_ || {};
  return _global._hykSee_;
}

const isBrowserEnv = variableTypeDetection.isWindow(
  typeof window !== "undefined" ? window : undefined
);

export function supportsHistory() {
  const chrome = _global.chrome;
  const isChromePackagedApp = chrome && chrome.app && chrome.app.runtime;
  const hasHistoryApi =
    "history" in _global &&
    !!_global.history.pushState &&
    !!_global.history.replaceState;

  return !isChromePackagedApp && hasHistoryApi;
}

export { _global, _support, isBrowserEnv };
