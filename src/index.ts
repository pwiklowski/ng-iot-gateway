import Gateway from './Gateway';

const logCopy = console.log.bind(console);

console.log = function () {
  if (arguments.length) {
    var timestamp = new Date().toJSON(); // The easiest way I found to get milliseconds in the timestamp
    var args: any = arguments;
    args[0] = timestamp + ' > ' + arguments[0];
    logCopy.apply(this, args);
  }
};

(async () => {
  const gateway = new Gateway();
  console.log('start server');
  gateway.start();
})();
