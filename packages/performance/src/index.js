import { EVENTTYPES, STATUS_CODE } from "@hyk-see/common";
import { getTimestamp, _global, on } from "@hyk-see/utils";
import { getWebVitals, getResource } from "./core/performance";

export default class Performance {
  type = "";

  constructor() {
    this.type = EVENTTYPES.PERFORMANCE;
  }

  bindOptions() {}

  core({ transportData }) {
    // 获取 FCP, LCP, TTFB, FID 等指标
    getWebVitals((res) => {
      // name 指标名称 rating 评级 value 数值
      const { name, rating, value } = res;
      transportData.send({
        type: EVENTTYPES.PERFORMANCE,
        status: STATUS_CODE.OK,
        time: getTimestamp(),
        name,
        rating,
        value,
      });
    });

    const observer = new PerformanceObserver((list) => {
      for (const long of list.getEntries()) {
        transportData.send({
          type: EVENTTYPES.PERFORMANCE,
          name: "longTask",
          longTask: long,
          time: getTimestamp(),
          status: STATUS_CODE.OK,
        });
      }
    });
    observer.observe({ entryTypes: ["longtask"] });

    on(_global, "load", function () {
      // 上报资源列表
      transportData.send({
        type: EVENTTYPES.PERFORMANCE,
        name: "resourceList",
        time: getTimestamp(),
        status: STATUS_CODE.OK,
        resourceList: getResource(),
      });

      // 上报内存情况
      if (performance.memory) {
        transportData.send({
          type: EVENTTYPES.PERFORMANCE,
          name: "memory",
          time: getTimestamp(),
          status: STATUS_CODE.OK,
          memory: {
            // JS 堆内存限制
            jsHeapSizeLimit:
              performance.memory && performance.memory.jsHeapSizeLimit,
            // 总内存大小
            totalJSHeapSize:
              performance.memory && performance.memory.totalJSHeapSize,
            // 已使用内存大小
            usedJSHeapSize:
              performance.memory && performance.memory.usedJSHeapSize,
          },
        });
      }
    });
  }

  transform() {}
}
