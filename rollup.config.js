import resolve from "@rollup/plugin-node-resolve"; // 解析第三方依赖
import commonjs from "@rollup/plugin-commonjs"; // 将 CommonJS 模块转换为 ES6 模块
import terser from "@rollup/plugin-terser"; // 替换 uglify
import json from "@rollup/plugin-json"; // 支持导入 JSON 文件
import { visualizer } from "rollup-plugin-visualizer"; // 添加性能分析插件

import fs from "fs";
import path from "path";
const packagesDir = path.resolve(__dirname, "packages");
const packageFiles = fs.readdirSync(packagesDir);

function output(path) {
  return [
    {
      input: [`./packages/${path}/src/index.js`],
      output: [
        {
          file: `./packages/${path}/dist/index.cjs.js`, // 输出文件CommonJS
          format: "cjs",
          sourcemap: true,
        },
        {
          file: `./packages/${path}/dist/index.esm.js`, // 输出文件ESM
          format: "es",
          sourcemap: true,
        },
        {
          file: `./packages/${path}/dist/index.js`, // 输出文件UMD
          format: "umd",
          name: "hyk-see",
          sourcemap: true,
        },
        {
          file: `./packages/${path}/dist/index.min.js`, // 输出文件UMD压缩
          format: "umd",
          name: "hyk-see",
          sourcemap: true,
          plugins: [terser()],
        },
      ],

      plugins: [
        resolve(),
        commonjs(),
        json(),
        visualizer({
          filename: "stats.html",
          open: false,
        }),
      ],
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
      },
    },
  ];
}

export default [...packageFiles.map((path) => output(path)).flat()];
