#!/usr/bin/env node
// 为了在项目中不必再添加gulpfile，使gulpfile可以自动被加载
// mac需要将文件权限改为755
// process.argv可以获取命令行参数，是个数组
process.argv.push('--cwd')
process.argv.push(process.cwd())
process.argv.push('--gulpfile')
// require.resolve 用于获取模块的绝对路径
// process.argv.push(require.resolve('../lib/index.js'))
// require.resolve会默认找到package.json中的main字段
process.argv.push(require.resolve('..'))

// 所以导入即可使用gulp
require('gulp/bin/gulp')
