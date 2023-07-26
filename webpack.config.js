module.exports = {
  // Other configurations...
  resolve: {
    fallback: {
      timers: require.resolve('timers-browserify'),
    },
  },
};