var gulp = require("gulp")
var autoprefixer = require("gulp-autoprefixer")
var babel = require("gulp-babel")
// var concat  = require("gulp-concat")
// var filter = require("gulp-filter")
// var plumber = require("gulp-plumber")
var sass = require("gulp-sass")
var minifyCSS = require('gulp-minify-css');

var sourcemaps = require("gulp-sourcemaps")
var source = require("vinyl-source-stream")
var buffer = require("vinyl-buffer")
var browserify = require("browserify")
var watchify = require("watchify")
var babelify = require("babelify")

var tinylr = require("tiny-lr")

var onError = function(err) {
  console.log("gulp encountered some Error")
  console.error(err)
  this.emit("end")
}

var ISPRODUCTION = process.env.NODE_ENV === "production"

function compile(isWatch) {
  var bundler = browserify("./src/app_cs.js", { debug: !ISPRODUCTION })
    // .transform(babelify, { presets: ["es2015", "react"] })

  function rebundle() {
    bundler.transform(babelify).bundle()
      .on("error", onError)
      .pipe(source("app_cs.js"))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest("./app/js/"))
  }

  if (isWatch) {
    bundler = watchify(bundler)
    bundler.on('update', function() {
      console.log("-> bundling...")
      rebundle()
      console.log('----- done -----')
    })
  }
  rebundle()
}

function watchSrcJS() {
  return compile(true)
}

gulp.task("watchjs", function() { return watchSrcJS() })
gulp.task("buildjs", function() { return compile(false) })

gulp.task("scripts", function() {
  gulp.src("./src/scripts/**/*.js")
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("./app/js/"))
})

gulp.task("watch-scripts", function() {
  // only transpile changed file
  gulp.watch("./src/scripts/**/*.js", function(event) {
    var destPath ="./app/js/" + event.path.replace(__dirname+"/src/","").replace(/[^\/]+$/,"");
    console.log("file changed >> "+ event.path.replace(__dirname,"") , "  >> ", destPath)
    return gulp.src(event.path)
      .pipe(babel())
      .on("error", onError)
      .pipe(gulp.dest('./app/js/'))
      // .pipe(gulp.dest(destPath))
      // .on('end', function() {
      //   fs.createWriteStream("./dist/.trigger");
      // })
  })
})

// -----------------------------------------------------------------------------
gulp.task("sass", function() {
  gulp.src("./scss/app.scss")
    .pipe(sass())
    .on("error", onError)
    .pipe(autoprefixer({ browsers: ['last 2 versions'] }))
    .pipe(minifyCSS())
    .pipe(gulp.dest("./app/css"))
})

gulp.task("watch-sass", function() {
  gulp.watch("./scss/**/*.scss", ["sass"])
})

gulp.task("reload", function() {
  var lr = tinylr()
  lr.listen(35729)
  gulp.watch(["./app/**/*.{js,css,html}"], function(evt) {
    console.log("---- should live reload ------")
    lr.changed({
      body: { files: [evt.path] },
    })
  })
})

// -----------------------------------------------------------------------------
gulp.task("default", ["watch-sass", "watchjs", "watch-scripts", "reload"])
gulp.task("build", ["sass", "buildjs", "scripts"])



