import { getFlag, setFlag } from "@hyk-see/utils";

const handlers = {};

// 设置标识，并将处理的方法放置到 handlers 中, { xhr: [function, function]}
export function subscribeEvent(handler) {
  if (!handler || getFlag(handler.type)) return false;

  setFlag(handler.type, true);

  handlers[handler.type] = handlers[handler.type] || [];
  handlers[handler.type].push(handler.callback);

  return true;
}

export function notify(type, data) {
  if (!type || !handlers[type]) return;

  handlers[type].forEach((cb) => {
    nativeTryCatch(
      () => cb(data),
      () => {
        console.error("notify error", error);
      }
    );
  });
}
