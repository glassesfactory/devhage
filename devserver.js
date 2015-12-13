const browserSync = require('browser-sync');

browserSync({
  server: {
    baseDir: 'dist'
  }
});
