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
  var rebundle
  var bundler = browserify("./src/app_cs.js", {
    basedir: __dirname,
    debug: !ISPRODUCTION,
    cache: {}, // required for watchify
    packageCache: {}, // required for watchify
    fullPaths: isWatch // required to be true only for watchify
  })
    // .transform(babelify, { presets: ["es2015", "react"] })
  if (isWatch) {
    console.log("----- use watchify -----")
    bundler = watchify(bundler)
  }

  rebundle = function() {
    var startTime = Date.now()
    bundler.transform(babelify).bundle()
      .on("error", onError)
      .pipe(source("app_cs.js"))
      .pipe(buffer())
      // .pipe(sourcemaps.init({ loadMaps: true }))
      // .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest("./app/js/"))
      .on("end", function() {
        console.log("bounle ended ", (startTime - Date.now()) / 1000, 's')
      })
  }

  if (isWatch) {
    bundler.on('update', function() {
      console.log("-> bundling...")
      rebundle()
    })
  }
  rebundle()
}

gulp.task("watchjs", function() { return compile(true) })
gulp.task("buildjs", function() { return compile(false) })

gulp.task("scripts", function() {
  gulp.src("./src/scripts/**/*.js")
    // .pipe(sourcemaps.init())
    .pipe(babel())
    // .pipe(sourcemaps.write("."))
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
  gulp.watch(["./scss/**/*.scss", "./src/**/*.scss"], ["sass"])
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



