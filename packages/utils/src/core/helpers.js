import { variableTypeDetection } from "./verifyType";

export function typeofAny(target) {
  return Object.prototype.toString.call(target).slice(8, -1).toLowerCase();
}

export function validateOptions(target, targetName, expectType) {
  if (!target) return false;

  if (typeofAny(target) === expectType) return true;

  console.error(`[Error] ${targetName} must be a ${expectType}`);
  return false;
}

export function getTimestamp() {
  return Date.now();
}

export function getLocationHref() {
  if (typeof document === "undefined" || document.location === null) return "";
  return document.location.href;
}

export function generateUUID() {
  let d = new Date().getTime();
  const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    function (c) {
      const r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    }
  );
  return uuid;
}

// 将未知类型转换成字符串
export function unknownToString(target) {
  if (variableTypeDetection.isString(target)) {
    return target;
  }

  if (variableTypeDetection.isUndefined(target)) {
    return "undefined";
  }

  return JSON.stringify(target);
}

export function interceptStr(str, length) {
  if (variableTypeDetection.isString(str)) {
    return (
      str.slice(0, length) +
      (str.length > length ? `:截取前${length}个字符` : "")
    );
  }

  return "";
}

export function replaceAop(source, name, replacement, isForced = false) {
  if (source === undefined) return;

  if (name in source || isForced) {
    const original = source[name];
    const wrapped = replacement(original);
    if (typeof wrapped === "function") {
      source[name] = wrapped;
    }
  }
}
