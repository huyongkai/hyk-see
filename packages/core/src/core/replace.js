import { variableTypeDetection } from "@hyk-see/utils";
import { EVENTTYPES } from "@hyk-see/common";
import { notify } from "./subscribe";
import { options } from "./options";
import { subscribeEvent } from "./subscribe";
import { transportData } from "./reportData";

export function addReplaceHandler(handler) {
  if (!subscribeEvent(handler)) return;

  replace(handler.type);
}

function replace(type) {
  switch (type) {
    case EVENTTYPES.WHITESCREEN:
      whiteScreen();
      break;
    case EVENTTYPES.XHR:
      xhrReplace();
      break;
    case EVENTTYPES.FETCH:
      fetchReplace();
      break;
    case EVENTTYPES.ERROR:
      listenError();
      break;
    case EVENTTYPES.HISTORY:
      historyReplace();
      break;
    case EVENTTYPES.UNHANDLEDREJECTION:
      unhandledrejectionReplace();
      break;
    case EVENTTYPES.CLICK:
      domReplace();
      break;
    case EVENTTYPES.HASHCHANGE:
      listenHashchange();
      break;
    default:
      break;
  }
}


function xhrReplace() {
    if (!('XMLHttpRequest' in window)) return;

    const originalXhrProto = XMLHttpRequest.prototype;
    
    replaceAop(originalXhrProto, 'open',  (originalOpen) => {
        return function (this, ...args) {
            this.hyk_see_xhr = {
                method: variableTypeDetection.isString(args[0]) ? args[0].toUpperCase() : args[0],
                url: args[1],
                sTime: getTimestamp(),
                type: HTTPTYPE.XHR
            }
            originalOpen.apply(this, args);
        }
    })

    replaceAop(originalXhrProto, 'send', (originalSend) => {
        return function (this, ...args) {
            const { method, url, sTime } = this.hyk_see_xhr;

            // 监听 loaded 事件，接口成功或者失败都会执行
          on(this, 'loaded', function (this) {
              // isSdkTransportUrl 判断当前接口是否为上报的接口
              // isFilterHttpUrl 判断当前接口是否为需要过滤掉的接口
                if ((method === EMethods.Post && transportData.isSdkTransportUrl(url)) || isFilterHttpUrl(url)) {
                    return;
                }

                const { responseType, response, status } = this;
                this.hyk_see_xhr.requestData = args[0];
                const eTime = getTimestamp();

                // 设置该接口的 time, 用户行为按时间排序
                this.hyk_see_xhr.time = this.hyk_see_xhr.sTime;
                this.hyk_see_xhr.Status = status;

                if (['', 'json', 'text'].indexOf(responseType) !== -1) {
                    // 用户设置 handleHttpStatus 函数来判断接口是否正确, 只有接口报错时才保留 response
                    if (options.handleHttpStatus && typeof options.handleHttpStatus === 'function') {
                        this.hyk_see_xhr.response = response && JSON.parse(response);
                    }
                }

                // 接口的执行时长
                this.hyk_see_xhr.elapsedTime = eTime - this.hyk_see_xhr.sTime;
                // 执行之前注册的 xhr 回调函数
                notify(EVENTTYPES.XHR, this.hyk_see_xhr);
            })
            originalSend.apply(this, args);
        }
    })
}

function fetchReplace() {
  if (!('fetch' in _global)) {
    return;
  }
    
  replaceAop(_global, EVENTTYPES.FETCH, originalFetch => {
    return function (url, config = {}) {
      const sTime = getTimestamp();
      const method = (config && config.method) || 'GET';
      let fetchData = {
        type: HTTPTYPE.FETCH,
        method,
        requestData: config && config.body,
        url,
        response: '',
      };
      // 获取配置的headers
      const headers = new Headers(config.headers || {});
      Object.assign(headers, {
        setRequestHeader: headers.set,
      });
      config = Object.assign({}, config, headers);
      return originalFetch.apply(_global, [url, config]).then(
        (res) => {
          // 克隆一份，防止被标记已消费
          const tempRes = res.clone();
          const eTime = getTimestamp();
          fetchData = Object.assign({}, fetchData, {
            elapsedTime: eTime - sTime,
            Status: tempRes.status,
            time: sTime,
          });
          tempRes.text().then((data) => {
            // 同理，进接口进行过滤
            if (
              (method === EMethods.Post && transportData.isSdkTransportUrl(url)) ||
              isFilterHttpUrl(url)
            )
              return;
            // 用户设置handleHttpStatus函数来判断接口是否正确，只有接口报错时才保留response
            if (options.handleHttpStatus && typeof options.handleHttpStatus == 'function') {
              fetchData.response = data;
            }
            notify(EVENTTYPES.FETCH, fetchData);
          });
          return res;
        },
        // 接口报错
        (err) => {
          const eTime = getTimestamp();
          if (
            (method === EMethods.Post && transportData.isSdkTransportUrl(url)) ||
            isFilterHttpUrl(url)
          )
            return;
          fetchData = Object.assign({}, fetchData, {
            elapsedTime: eTime - sTime,
            status: 0,
            time: sTime,
          });
          notify(EVENTTYPES.FETCH, fetchData);
          throw err;
        }
      );
    };
  });
}

function listenHashchange() {
  // 通过onpopstate事件，来监听hash模式下路由的变化
  if (isExistProperty(_global, 'onhashchange')) {
    on(_global, EVENTTYPES.HASHCHANGE, function (e) {
      notify(EVENTTYPES.HASHCHANGE, e);
    });
  }
}

function listenError() {
  on(
    _global,
    'error',
    function (e) {
      console.log(e);
      notify(EVENTTYPES.ERROR, e);
    },
    true
  );
}

// last time route
let lastHref = getLocationHref();

function historyReplace() {
  // 是否支持history
  if (!supportsHistory()) return;
  const oldOnpopstate = _global.onpopstate;
  // 添加 onpopstate事件
  _global.onpopstate = function (this, ...args) {
    const to = getLocationHref();
    const from = lastHref;
    lastHref = to;
    notify(EVENTTYPES.HISTORY, {
      from,
      to,
    });
    oldOnpopstate && oldOnpopstate.apply(this, args);
  };
  function historyReplaceFn(originalHistoryFn) {
    return function (this, ...args) {
      const url = args.length > 2 ? args[2] : undefined;
      if (url) {
        const from = lastHref;
        const to = String(url);
        lastHref = to;
        notify(EVENTTYPES.HISTORY, {
          from,
          to,
        });
      }
      return originalHistoryFn.apply(this, args);
    };
  }
  // 重写pushState、replaceState事件
  replaceAop(_global.history, 'pushState', historyReplaceFn);
  replaceAop(_global.history, 'replaceState', historyReplaceFn);
}

function unhandledrejectionReplace() {
  on(_global, EVENTTYPES.UNHANDLEDREJECTION, function (ev) {
    // ev.preventDefault() 阻止默认行为后，控制台就不会再报红色错误
    notify(EVENTTYPES.UNHANDLEDREJECTION, ev);
  });
}

function domReplace() {
  if (!('document' in _global)) return;
  // 节流，默认0s
  const clickThrottle = throttle(notify, options.throttleDelayTime);
  on(
    _global.document,
    'click',
    function (this) {
      clickThrottle(EVENTTYPES.CLICK, {
        category: 'click',
        data: this,
      });
    },
    true
  );
}

function whiteScreen() {
  notify(EVENTTYPES.WHITESCREEN);
}

function isFilterHttpUrl(url) {
  return options.filterXhrUrlRegExp && options.filterXhrUrlRegExp.test(url);
}
