import { setFlag, _support } from "./global";
import { EVENTTYPES } from "@hyk-see/common";

export function setSilentFlag({
  silentXhr = true,
  silentFetch = true,
  silentClick = true,
  silentHistory = true,
  silentError = true,
  silentHashChange = true,
  silentUnhandledrejection = true,
  silentWhiteScreen = false,
}) {
  setFlag(EVENTTYPES.XHR, !silentXhr);
  setFlag(EVENTTYPES.FETCH, !silentFetch);
  setFlag(EVENTTYPES.CLICK, !silentClick);
  setFlag(EVENTTYPES.HISTORY, !silentHistory);
  setFlag(EVENTTYPES.ERROR, !silentError);
  setFlag(EVENTTYPES.HASHCHANGE, !silentHashChange);
  setFlag(EVENTTYPES.UNHANDLEDREJECTION, !silentUnhandledrejection);
  setFlag(EVENTTYPES.WHITESCREEN, !silentWhiteScreen);
}

// 返回包含id、class、innerTextde字符串的标签
export function htmlElementAsString(target) {
  const tagName = target.tagName.toLowerCase();
  if (tagName === "body") {
    return "";
  }

  let classNames = target.classList.value;

  classNames = classNames !== "" ? ` class="${classNames}"` : "";

  const id = target.id ? ` id="${target.id}"` : "";
  const innerText = target.innerText;
  return `<${tagName}${id}${
    classNames !== "" ? classNames : ""
  }>${innerText}</${tagName}>`;
}

// 生成错误唯一标识
export function getErrorUid(input) {
  return window.btoa(encodeURIComponent(input));
}

// 判断错误是否存在
export function hashMapExist(hash) {
  const exist = _support.errorMap.has(hash);
  if (exist) {
    _support.errorMap.set(hash, true);
  }
  return exist;
}

/**
 * 将地址字符串转换成对象，
 * 输入：'https://github.com/xy-sea/web-see?token=123&name=11'
 * 输出：{
 *  "host": "github.com",
 *  "path": "/xy-sea/web-see",
 *  "protocol": "https",
 *  "relative": "/xy-sea/web-see?token=123&name=11"
 * }
 */
export function parseUrlToObj(url) {
  if (!url) {
    return {};
  }

  const match = url.match(
    /^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/
  );
  if (!match) {
    return {};
  }

  const query = match[6] || "";
  const fragment = match[8] || "";
  return {
    host: match[4],
    path: match[5],
    protocol: match[2],
    relative: match[5] + query + fragment,
  };
}
