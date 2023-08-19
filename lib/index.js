const { src, dest, series, parallel, watch } = require('gulp')
// yarn add del --dev
const del = require('del')
// 提供开发服务器 支持热更新
// yarn add browser-sync --dev
const browserSync = require('browser-sync')
// 自动加载 yarn add gulp-load-plugins
const loadPlugins = require('gulp-load-plugins')
const path = require('path')
// 使用的依赖 引用关系
// yarn add gulp-useref --dev
// yarn add gulp-htmlmin gulp-uglify --dev
// yarn add gulp-if
// 获取当前工作目录
const cwd = process.cwd()
// 默认配置
let config = {
  // default config
  build: {
    src: 'src',
    dist: 'dist',
    temp: 'temp',
    public: 'public',
    paths: {
      styles: 'assets/styles/*.scss',
      scripts: 'assets/scripts/*.js',
      pages: '*.html',
      images: 'assets/images/**',
      fonts: 'assets/fonts/**',
      extras: '**'
    }
  }
}
// 读取配置文件,如果有配置文件就合并,没有就使用默认配置
try {
  // path.join(cwd, 'pages.config.js') 拼接路径
  const loadConfig = require(path.join(cwd, 'pages.config.js'))
  // Object.assign() 合并对象
  config = Object.assign({}, config, loadConfig)
} catch (e) {}

const plugins = loadPlugins()
// 创建一个开发服务器
const bs = browserSync.create()

const sass = require('gulp-sass')(require('sass'))
// const plugins.cleanCss = require('gulp-clean-css')
// const plugins.babel = require('gulp-babel')
// const plugins.swig = require('gulp-swig')
// yarn add gulp-plugins.imagemin --dev
// const plugins.imagemin = require('gulp-imagemin')
// yarn add del --dev

const clean = () => {
  return del([config.build.dist, config.build.temp])
}

// css压缩打包
const style = () => {
  // { base: 'src' } 保存src后面的目录结构， cwd表示从哪个目录开始查找
  return src(config.build.paths.styles, { base: config.build.src, cwd: config.build.src })
    // css括号完全展开
    .pipe(sass(() => {}, { outputStyle: 'expanded' }))
    // 清除备注和空格
    // .pipe(plugins.cleanCss({  }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true })) // 自动更新浏览器
}
// js压缩打包
const script = () => {
  return src(config.build.paths.scripts, { base: config.build.src, cwd: config.build.src })
    // babel以最新的ECMA进行转换
    // .pipe(plugins.babel({ presets: ['@babel/preset-env'] }))
    // require是为了能在当前目录的node_modules中找到@babel/preset-env
    .pipe(plugins.babel({ presets: [require('@babel/preset-env')] }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}

// 页面压缩
const page = () => {
  return src(config.build.paths.pages, { base: config.build.src, cwd: config.build.src })
    // 通过配置让模板显示
    // .pipe(plugins.swig({ data }))
    .pipe(plugins.swig({ data: config.data, defaults: { cache: false } })) // defaults: { cache: false } } 防止因为缓存而不更新
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}
// 图片压缩打包
const image = () => {
  return src(config.build.paths.images, { base: config.build.src, cwd: config.build.src })
    // 压缩流
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}
// 字体压缩
const font = () => {
  return src(config.build.paths.fonts, { base: config.build.src, cwd: config.build.src })
    // 压缩流
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}
// 其他文件的复制
const extra = () => {
  return src(config.build.paths.extras, { base: 'public', cwd: config.build.public })
    .pipe(dest(config.build.dist))
}

// 启动浏览器
const serve = () => {
  // cwd表示从哪个目录开始查找
  watch(config.build.paths.styles, { cwd: config.build.src }, style)
  watch(config.build.paths.scripts, { cwd: config.build.src }, script)
  watch(config.build.paths.pages, { cwd: config.build.src }, page)
  // 监听image font
  watch([
    config.build.paths.images,
    config.build.paths.fonts
  ], { cwd: config.build.src }, bs.reload)
  watch(config.build.paths.extras, { cwd: config.build.public }, bs.reload)

  bs.init({
    // 关闭成功运行提示
    notify: false,
    // open: false,      // 不自动打开浏览器
    port: 8890, // 端口设置
    // files: 'dist/**', // 监听目录文件并更新到浏览器 使用.pipe(bs.reload({ stream: true }))就可以忽略了
    server: {
      baseDir: [config.build.temp, config.build.dist, config.build.public], // 网页根目录 数组按照先后顺序寻找文件
      routes: { // 路由 优先
        '/node_modules': 'node_modules'
      }
    }
  })
}

// 处理依赖 并压缩
const useref = () => {
  return src(config.build.paths.pages, { base: config.build.temp, cwd: config.build.temp })
    .pipe(plugins.useref({ searchPath: [config.build.temp, '.'] }))
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({ // 默认压缩空白符
      collapseWhitespace: true, // 压缩换行符等
      minifyJS: true, // 压缩js
      minifyCSS: true // 压缩css
    })))
    .pipe(dest(config.build.dist))
}

const compile = parallel(style, script, page)
const build = series(
  clean,
  parallel(
    series(compile, useref), // 有依赖关系所以需要顺序执行
    image,
    font,
    extra
  )
)
// q: 为什么要用series
// a: series是顺序执行的 parallel是并行执行的
const develop = series(compile, serve)

// q: ESmodule和CommonJS 导出的区别
// a: ESmodule导出的是一个对象 CommonJS导出的是一个函数
module.exports = {
  clean,
  build,
  develop
}
