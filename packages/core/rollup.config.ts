import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2'
import json  from '@rollup/plugin-json'
import cleaner from 'rollup-plugin-cleaner'
import dts from 'rollup-plugin-dts'
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { babel } from '@rollup/plugin-babel';
export default [{
    input: 'src/index.ts',
    output: [
        {
            file: 'dist/js-analyzer-core.es.js',
            format: 'esm'
        },
        {
            file: 'dist/js-analyzer-core.cjs.js',
            format: 'cjs'
        },
    ],
    external: [/node_modules/],
    watch: {
      include: 'src/**/*',
    },
    plugins: [
        cleaner({
            targets: ['./dist/']
        }),
        json(),
        nodeResolve(),
        commonjs(),
        typescript({
            tsconfig: "tsconfig.json",
        }),
        babel({
            include: 'src/*.ts',
        }),
    ]
  },
  {
    input: 'types/index.d.ts',
    output: [
      {
        file: 'dist/js-analyzer-core.d.ts',
        format: 'esm',
      },
    ],
    plugins: [dts()],
  }
];