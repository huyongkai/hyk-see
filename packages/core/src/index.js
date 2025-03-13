import {
  log,
  HandleEvents,
  setupReplace,
  subscribeEvent,
  notify,
  breadcrumb,
  transportData,
  handleOptions,
  options,
} from "./core/index";
import { _global, getFlag, setFlag, nativeTryCatch } from "@hyk-see/utils";
import { SDK_VERSION, SDK_NAME, EVENTTYPES } from "@hyk-see/common";
import { BasePlugin } from "./plugin/index";

function install(Vue, options) {
  if (getFlag(EVENTTYPES.VUE)) return;

  setFlag(EVENTTYPES.VUE, true);

  const handler = Vue.config.errorHandler;

  Vue.config.errorHandler = function (err, vm, info) {
    HandleEvents.hanldeError(err);
    if (handler) {
      handler.apply(null, [err, vm, info]);
    }
  };

  init(options);
}

function init(options) {
  if (!options.dsn || !options.apikey) {
    return console.error(
      `hyk-see 缺少必须配置项: ${!options.dsn ? "dsn" : "apikey"}`
    );
  }

  if (!("fetch" in _global) || options.disabled) return;

  handleOptions(options);
  setupReplace();
}

function use(plugin, option) {
  const instance = new plugin(option);
  if (
    !subscribeEvent({
      callback: (data) => {
        instance.transform(data);
      },
      type: instance.type,
    })
  ) {
    return;
  }

  nativeTryCatch(() => {
    instance.core({ transportData, breadcrumb, options, notify });
  });
}

export default {
  install,
  use,
  log,
  init,
  SDK_VERSION,
  SDK_NAME,
  BasePlugin,
};
