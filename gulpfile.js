// ----------------------------------------

const fs = require('fs');
const spawn = require('child_process').spawn;
const gulp = require('gulp');
const runSequence = require('gulp4-run-sequence');
const sass = require('gulp-sass')(require('node-sass'));
const minify = require('gulp-minify');
const cleanCSS = require('gulp-clean-css');
const rename = require('gulp-rename');
let node;

// CONFIGURATION

// FOLDER constIABLES
const publicFolder = './dist/public';
const publicAssetsFolder = publicFolder + '/assets';
const publicFolderCss = publicAssetsFolder + '/css';
const publicFolderJs = publicAssetsFolder + '/js';
const publicFolderVendor = publicFolder + '/vendor';
const publicFolderImages = publicAssetsFolder + '/images';
const publicFolderI18n = publicAssetsFolder + '/i18n';
const viewsFolder = './dist/views';

// ----------------------------------------
// ----- - -- -- SERVER TASK - ---  -------
// ----------------------------------------

/**
 * $ gulp server
 * description: launch the server. If there's a server already running, kill it
 */
gulp.task('server', async () => {
    if (node) node.kill();
    node = spawn('node', ['app.js'], {
        stdio: 'inherit'
    });
    node.on('close', code => {
        if (code === 8) {
            gulp.log('Error detected, waiting for changes...');
        }
    });
});

// ----------------------------------------
// ----- - -- - STYLES AND JS - ---  -------
// ----------------------------------------

/**
 * $ gulp build-js
 * description: Builds the complete set of css files for styling the web
 */
gulp.task('build-js', async () => {
    gulp.src('./src/resources/js/*.js')
        .pipe(
            minify({
                noSource: true,
                ext: {
                    src: '-debug.js',
                    min: '.min.js'
                },
                ignoreFiles: ['.min.js']
            })
        )
        .pipe(gulp.dest(publicFolderJs));

    gulp.src('./src/resources/js/i18n/*.js')
        .pipe(
            minify({
                noSource: true,
                ext: {
                    src: '-debug.js',
                    min: '.min.js'
                },
                ignoreFiles: ['.min.js']
            })
        )
        .pipe(gulp.dest(publicFolderJs + '/i18n'));
});

/**
 * $ gulp build-sass
 * description: Builds the css from a Sass engine
 */
gulp.task('build-sass', async () => {
    gulp.src('./src/resources/scss/*.scss')
        .pipe(sass())
        .pipe(
            cleanCSS({
                compatibility: 'ie8'
            })
        )
        .pipe(
            rename({
                suffix: '.min'
            })
        )
        .pipe(gulp.dest(publicFolderCss));
});

/**
 * $ gulp build-css
 * description: Builds the complete set of css files for styling the web
 */
gulp.task('build-css', async () => {
    runSequence('build-sass');
});

// ----------------------------------------
// ----- VENDOR RESOURCES TASKS --  -------
// ----------------------------------------
gulp.task('copy-vendor', async () => {
    const vendors = JSON.parse(fs.readFileSync('./src/vendor.json', 'utf8'));

    vendors.forEach(vendor => {
        const vendorFiles = vendor.files.map(file => vendor.moduleFolder + file);
        gulp.src(vendorFiles).pipe(gulp.dest(publicFolderVendor + vendor.distfolder));
    });
});

// ----------------------------------------
// ----- STATIC RESOURCES TASKS --  -------
// ----------------------------------------
gulp.task('copy-statics', async () => {
    gulp.src('./src/resources/favicon.ico').pipe(gulp.dest(publicFolder));
    gulp.src('./src/resources/images/**.*').pipe(gulp.dest(publicFolderImages));
    gulp.src('./src/i18n/**.*').pipe(gulp.dest(publicFolderI18n));
    gulp.src('./src/views/**/**.*').pipe(gulp.dest(viewsFolder));
});

// ----------------------------------------
// ----- - -- - BUILD TASKS - - --  -------
// ----------------------------------------

/**
 * $ gulp build
 * description: prepare all assets
 */
gulp.task('build', gulp.parallel(['build-css', 'build-js', 'copy-vendor', 'copy-statics']));

/**
 * & gulp watch
 * description:
 */
gulp.task('watch', async () => {
    gulp.watch(['./src/resources/scss/*.scss'], gulp.series('build-sass'));
    gulp.watch(['./src/resources/css/*.css'], gulp.series('minify-css', 'copy-css'));
    gulp.watch(['./src/resources/js/*.js'], gulp.series('build-js'));
    gulp.watch(
        ['./app.js', './routes/*.js', './models/*.js', './controllers/*.js', './**/*.html'],
        gulp.series('server')
    );
});

/**
 * $ gulp
 * description: start the development environment
 */
gulp.task('default', gulp.series('build', 'server', 'watch'));

// clean up if an error goes unhandled.
process.on('exit', () => {
    if (node) node.kill();
});
