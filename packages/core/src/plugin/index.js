export class BasePlugin {
  type = "";

  constructor(type) {
    this.type = type;
  }

  bindOptions(options) {}
  core(sdkBase) {}
  transform(data) {}
}
