import { _global } from "./global";

export class Queue {
  stack = [];
  isFlushing = false;

  constructor() {}

  addFn(fn) {
    if (typeof fn !== "function") return;
    if (!("requestIdleCallback" in _global || "Promise" in _global)) {
      fn();
      return;
    }

    this.stack.push(fn);

    if (!this.isFlushing) {
      this.isFlushing = true;
      // 在浏览器空闲时执行任务，避免阻塞主线程
      if ("requestIdleCallback" in _global) {
        requestIdleCallback(() => {
          this.flushStack();
        });
      } else {
        // 利用微任务队列，在当前宏任务结束后立即执行
        Promise.resolve().then(() => {
          this.flushStack();
        });
      }
    }
  }

  clear() {
    this.stack = [];
  }

  getStack() {
    return this.stack;
  }

  flushStack() {
    const temp = this.stack.slice(0);
    this.stack = [];
    this.isFlushing = false;

    for (let i = 0; i < temp.length; i++) {
      temp[i]();
    }
  }
}
