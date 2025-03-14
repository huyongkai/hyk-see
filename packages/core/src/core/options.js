import { validateOptions, _support, setSilentFlag } from "@hyk-see/utils";
import { breadcrumb } from "./breadcrumb";
import { transportData } from "./reportData";

export class Options {
  dsn = "";
  throttleDelayTime = 0;
  overTime = 10;
  whiteBoxElements = ["html", "body", "#app", "#root"];
  silentWhiteScreen = false;
  skeletonProject = false;
  filterXhrUrlRegExp = null;
  handleHttpStatus = null;
  repeatCodeError = false;

  constructor() {}

  bindOptions(options) {
    const {
      dsn,
      filterXhrUrlRegExp,
      throttleDelayTime = 0,
      overTime = 10,
      silentWhiteScreen = false,
      whiteBoxElements = ["html", "body", "#app", "#root"],
      skeletonProject = false,
      handleHttpStatus,
      repeatCodeError = false,
    } = options;

    validateOptions(dsn, "dsn", "sring") && (this.dsn = dsn);

    validateOptions(filterXhrUrlRegExp, "filterXhrUrlRegExp", "regexp") &&
      (this.filterXhrUrlRegExp = filterXhrUrlRegExp);

    validateOptions(throttleDelayTime, "throttleDelayTime", "number") &&
      (this.throttleDelayTime = throttleDelayTime);

    validateOptions(overTime, "overTime", "number") &&
      (this.overTime = overTime);

    validateOptions(silentWhiteScreen, "silentWhiteScreen", "boolean") &&
      (this.silentWhiteScreen = silentWhiteScreen);

    validateOptions(whiteBoxElements, "whiteBoxElements", "array") &&
      (this.whiteBoxElements = whiteBoxElements);

    validateOptions(skeletonProject, "skeletonProject", "boolean") &&
      (this.skeletonProject = skeletonProject);

    validateOptions(handleHttpStatus, "handleHttpStatus", "function") &&
      (this.handleHttpStatus = handleHttpStatus);

    validateOptions(repeatCodeError, "repeatCodeError", "boolean") &&
      (this.repeatCodeError = repeatCodeError);
  }
}

export const options = _support.options || (_support.options = new Options());

export function handleOptions(initOptions) {
  setSilentFlag(initOptions);

  breadcrumb.bindOptions(initOptions);

  transportData.bindOptions(initOptions);

  options.bindOptions(initOptions);
}
