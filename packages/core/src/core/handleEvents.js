import ErrorStackParser from "error-stack-parser";
import { EVENTTYPES, STATUS_CODE } from "@hyk-see/common";
import {
  getErrorUid,
  hashMapExist,
  getTimestamp,
  parseUrlToObj,
  unknownToString,
} from "@hyk-see/utils";
import { breadcrumb } from "./breadcrumb";
import { options } from "./options";
import { transportData } from "./reportData";
import { openWhiteScreen } from "./whiteScreen";

export const HandleEvents = {
  // 处理 xhr fetch 回调
  handleHttp(data, type) {
    const result = httpTransform(data);
    // 添加用户行为, 去掉自身上报的接口行为
    if (!data.url.includes(options.dsn)) {
      breadcrumb.push({
        type,
        status: result.status,
        category: breadcrumb.getCategory(type),
        data: result,
        time: data.time,
      });
    }

    if (result.status === "error") {
      // 上报接口错误
      transportData.send({ ...result, type, status: STATUS_CODE.ERROR });
    }
  },

  handleError(event) {
    const target = event.target;
    if (!target || (event.target && !event.target.localName)) {
      // vue 和 react 捕获的报错使用 event 解析， 异步错误使用 event.error 解析
      const stackFrame = ErrorStackParser.parse(
        !target ? event : event.error
      )[0];
      const { fileName, columnNumber, lineNumber } = stackFrame;
      const errorData = {
        type: EVENTTYPES.ERROR,
        status: STATUS_CODE.ERROR,
        time: getTimestamp(),
        message: event.message,
        fileName,
        line: lineNumber,
        column: columnNumber,
      };

      breadcrumb.push({
        type: EVENTTYPES.ERROR,
        category: breadcrumb.getCategory(EVENTTYPES.ERROR),
        data: errorData,
        time: getTimestamp(),
        status: STATUS_CODE,
      });

      // 在用户的一次会话中，如果产生了同一个错误，那么将这同一个错误上报多次是没有意义的；
      // 在用户的不同会话中，如果产生了同一个错误，那么将不同会话中产生的错误进行上报是有意义的.
      const hash = getErrorUid(
        `${EVENTTYPES.ERROR}-${ev.message}-${fileName}-${columnNumber}`
      );
      // 开启 repeatCodeError 第一次报错才上报
      if (
        !options.repeatCodeError ||
        (options.repeatCodeError && !hashMapExist(hash))
      ) {
        return transportData.send(errorData);
      }
    }

    // 资源加载报错
    if (target.localName) {
      // 提取资源加载的信息
      const data = resourceTransform(target);
      breadcrumb.push({
        type: EVENTTYPES.RESOURCE,
        category: breadcrumb.getCategory(EVENTTYPES.RESOURCE),
        data,
        time: getTimestamp(),
        status: STATUS_CODE.ERROR,
      });

      return transportData.send({
        ...data,
        type: EVENTTYPES.RESOURCE,
        status: STATUS_CODE.ERROR,
      });
    }
  },

  handleHistory(data) {
    const { from, to } = data;
    const { relative: parsedFrom } = parseUrlToObj(from);
    const { relative: parsedTo } = parseUrlToObj(to);

    breadcrumb.push({
      type: EVENTTYPES.HISTORY,
      category: breadcrumb.getCategory(EVENTTYPES.HISTORY),
      data: {
        from: parsedFrom ? parsedFrom : "/",
        to: parsedTo ? parsedTo : "/",
      },
      time: getTimestamp(),
      status: STATUS_CODE.OK,
    });
  },

  handleHashChange(data) {
    const { oldURL, newURL } = data;
    const { relative: from } = parseUrlToObj(oldURL);
    const { relative: to } = parseUrlToObj(newURL);

    breadcrumb.push({
      type: EVENTTYPES.HASHCHANGE,
      category: breadcrumb.getCategory(EVENTTYPES.HASHCHANGE),
      data: {
        from,
        to,
      },
      time: getTimestamp(),
      status: STATUS_CODE.OK,
    });
  },

  handleUnhandledRejection(event) {
    const stackFrame = ErrorStackParser.parse(event.reason)[0];
    const { fileName, columnNumber, lineNumber } = stackFrame;
    const message = unknownToString(event.reason.message || event.reason.stack);

    const data = {
      type: EVENTTYPES.UNHANDLEDREJECTION,
      status: STATUS_CODE.ERROR,
      time: getTimestamp(),
      message,
      fileName,
      line: lineNumber,
      column: columnNumber,
    };

    breadcrumb.push({
      type: EVENTTYPES.UNHANDLEDREJECTION,
      category: breadcrumb.getCategory(EVENTTYPES.UNHANDLEDREJECTION),
      data,
      time: getTimestamp(),
      status: STATUS_CODE.ERROR,
    });
    // 在用户的一次会话中，如果产生了同一个错误，那么将这同一个错误上报多次是没有意义的；
    // 在用户的不同会话中，如果产生了同一个错误，那么将不同会话中产生的错误进行上报是有意义的.
    const hash = getErrorUid(
      `${EVENTTYPES.UNHANDLEDREJECTION}-${message}-${fileName}-${columnNumber}`
    );
    // 开启 repeatCodeError 第一次报错才上报
    if (
      !options.repeatCodeError ||
      (options.repeatCodeError && !hashMapExist(hash))
    ) {
      return transportData.send(data);
    }
  },

  handleWhiteScreen() {
    openWhiteScreen((res) => {
      // 上报白屏检测信息
      transportData.send({
        type: EVENTTYPES.WHITESCREEN,
        time: getTimestamp(),
        ...res,
      });
    }, options);
  },
};
