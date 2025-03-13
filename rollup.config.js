import resolve from "@rollup/plugin-node-resolve"; // 解析第三方依赖
import commonjs from "@rollup/plugin-commonjs"; // 将 CommonJS 模块转换为 ES6 模块
import terser from "@rollup/plugin-terser"; // 替换 uglify
import json from "@rollup/plugin-json"; // 支持导入 JSON 文件

const packageFiles = ["core", "performance"];

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

      plugins: [resolve(), commonjs(), json()],
    },
  ];
}

export default [...packageFiles.map((path) => output(path)).flat()];
