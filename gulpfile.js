var gulp = require("gulp"), 
    nodemon = require("gulp-nodemon");


gulp.task("default", function() {
    nodemon({
        tasks: [],
        ext: "html js",
        script: "server.js"
    });
})