const gulp=require('gulp');
const sass=require('gulp-sass');
const postcss=require('gulp-postcss');
const cssnext=require('postcss-cssnext');
const cssnano=require('cssnano');
const rename=require('gulp-rename');
const babel=require('gulp-babel');
const sourcemaps=require('gulp-sourcemaps');
const uglify=require('gulp-uglify');

const paths={
  sass:['./src/**/*.scss'],
  scripts:['./src/**/*.js']
};

gulp.task('style',function () {
  return gulp.src(paths.sass)
    .pipe(sass().on('error',sass.logError))
    .pipe(postcss([cssnext({
      browsers:'last 50 versions'
    }),cssnano()]))
    .pipe(rename({
      dirname: "./",
      basename: "full-modal",
      prefix: "jquery.plugin.",
      suffix: ".min",
      extname: ".css"
    }))
    .pipe(gulp.dest('./dist'))
});

gulp.task('es62es5',function () {
  gulp.src(paths.scripts)
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets:['babel-preset-es2015']
    }))
    .pipe(uglify())
    .pipe(rename({
      dirname: "./",
      basename: "full-modal",
      prefix: "jquery.plugin.",
      suffix: ".min",
      extname: ".js"
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist'))
});

gulp.task('build',['es62es5','style']);

gulp.task('watch',function () {
  gulp.watch(paths.sass,['style']);
  gulp.watch(paths.scripts,['es62es5']);
});
