import ErrorStackParser from "error-stack-parser";
import { breadcrumb } from "./breadcrumb";
import { transportData } from "./reportData";
import { EVENTTYPES, STATUS_CODE } from "@hyk-see/common";
import { isError, getTimestamp, unknownToString } from "@hyk-see/utils";

export function log({
  message = "customMsg",
  error = "",
  type = EVENTTYPES.CUSTOM,
}) {
  try {
    let errorInfo = {};

    if (isError(error)) {
      const result = ErrorStackParser.parse(
        !error.target ? error : error.error || error.reason
      )[0];
      errorInfo = {
        ...result,
        line: result.lineNumber,
        column: result.columnNumber,
      };
    }

    breadcrumb.push({
      type,
      status: STATUS_CODE.ERROR,
      category: breadcrumb.getCategory(EVENTTYPES.CUSTOM),
      data: unknownToString(message),
      time: getTimestamp(),
    });

    transportData.send({
      type,
      status: STATUS_CODE.ERROR,
      message: unknownToString(message),
      time: getTimestamp(),
      ...errorInfo,
    });
  } catch (error) {
    console.error("hyk-see 自定义日志上报失败", error);
  }
}
