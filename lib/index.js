const { src, dest, series, parallel, watch } = require('gulp')
// yarn add del --dev
const del = require('del')
// 提供开发服务器 支持热更新
// yarn add browser-sync --dev
const browserSync = require('browser-sync')
// 自动加载 yarn add gulp-load-plugins
const loadPlugins = require('gulp-load-plugins')
// 使用的依赖 引用关系
// yarn add gulp-useref --dev
// yarn add gulp-htmlmin gulp-uglify --dev
// yarn add gulp-if

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
  return del(['dist', 'temp'])
}

// css压缩打包
const style = () => {
  // { base: 'src' } 保存src后面的目录结构
  return src('src/assets/styles/*.scss', { base: 'src' })
    // css括号完全展开
    .pipe(sass(() => {}, { outputStyle: 'expanded' }))
    // 清除备注和空格
    // .pipe(plugins.cleanCss({  }))
    .pipe(dest('temp'))
    .pipe(bs.reload({ stream: true })) // 自动更新浏览器
}
// js压缩打包
const script = () => {
  return src('src/assets/scripts/*.js', { base: 'src' })
    // babel以最新的ECMA进行转换
    .pipe(plugins.babel({ presets: ['@babel/preset-env'] }))
    .pipe(dest('temp'))
    .pipe(bs.reload({ stream: true }))
}

const data = {
  menus: [
    {
      name: 'Home',
      icon: 'aperture',
      link: 'index.html'
    },
    {
      name: 'Features',
      link: 'features.html'
    },
    {
      name: 'About',
      link: 'about.html'
    },
    {
      name: 'Contact',
      link: '#',
      children: [
        {
          name: 'Twitter',
          link: ''
        },
        {
          name: 'About',
          link: ''
        },
        {
          name: 'divider'
        },
        {
          name: 'About',
          link: ''
        }
      ]
    }
  ],
  pkg: require('./package.json'),
  date: new Date()
}

// 页面压缩
const page = () => {
  return src('src/*.html', { base: 'src' })
    // 通过配置让模板显示
    // .pipe(plugins.swig({ data }))
    .pipe(plugins.swig({ data, defaults: { cache: false } })) // defaults: { cache: false } } 防止因为缓存而不更新
    .pipe(dest('temp'))
    .pipe(bs.reload({ stream: true }))
}
// 图片压缩打包
const image = () => {
  return src('src/assets/images/**', { base: 'src' })
    // 压缩流
    .pipe(plugins.imagemin())
    .pipe(dest('dist'))
}
// 字体压缩
const font = () => {
  return src('src/assets/fonts/**', { base: 'src' })
    // 压缩流
    .pipe(plugins.imagemin())
    .pipe(dest('dist'))
}
// 其他文件的复制
const extra = () => {
  return src('public/**', { base: 'public' })
    .pipe(dest('dist'))
}

// 启动浏览器
const serve = () => {
  watch('src/assets/styles/*.scss', style)
  watch('src/assets/scripts/*.js', script)
  watch('src/*.html', page)
  // 监听image font
  watch([
    'src/assets/images/**',
    'src/assets/fonts/**',
    'public/**'
  ], bs.reload)

  bs.init({
    // 关闭成功运行提示
    notify: false,
    // open: false,      // 不自动打开浏览器
    port: 8890, // 端口设置
    // files: 'dist/**', // 监听目录文件并更新到浏览器 使用.pipe(bs.reload({ stream: true }))就可以忽略了
    server: {
      baseDir: ['temp', 'src', 'public'], // 网页根目录 数组按照先后顺序寻找文件
      routes: { // 路由 优先
        '/node_modules': 'node_modules'
      }
    }
  })
}

// 处理依赖 并压缩
const useref = () => {
  return src('temp/**', { base: 'temp' })
    .pipe(plugins.useref({ searchPath: ['dist', '.'] }))
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({ // 默认压缩空白符
      collapseWhitespace: true, // 压缩换行符等
      minifyJS: true, // 压缩js
      minifyCSS: true // 压缩css
    })))
    .pipe(dest('dist'))
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
