module.exports = (config) => {
  config.set({
    browsers: ['Chrome'],
    frameworks: ['browserify', 'jasmine'],
    files: ['test/*.spec.js'],
    preprocessors: {
      'src/**/*.js': ['browserify'],
      'test/**/*.js': ['browserify']
    },
    browserify: {
      debug: true,
      transform: ['babelify']
    }
  })
}
