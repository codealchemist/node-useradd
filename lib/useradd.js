var child_process = require('child_process');

module.exports = function useradd(options, callback) {
  if (typeof options === 'string') {
    options = { login: options };
  }

  var args = [];

  if (options.gid) {
    args.push('-g', options.gid);
  }

  if (typeof options.shell !== 'undefined') {
    if (options.shell === false) {
      args.push('-s', '/bin/false');
    }
    else {
      args.push('-s', options.shell);
    }
  }

  if (typeof options.home !== 'undefined') {
    if (options.home === true) {
      args.push('-m');
    }
    else if (options.home === false) {
      if (process.platform !== 'sunos') {
        //
        // SunOS doesn't support -M and doesn't create home directory by
        // default.
        //
        args.push('-M');
      }
    }
    else {
      args.push('-d', options.home);
    }
  }

  args.push(options.login);

  var child = child_process.spawn(options.executable || 'useradd', args);
  child.on('exit', function (code) {
    var err;

    if (code) {
      err = new Error('Invalid exit code: ' + code);
      err.code = code;
      return callback(err);
    }

    if (options.password) {
      setPassword(options.login, options.password, callback);
    }
  });
};

var validUsernameRegex = /^([a-z_][a-z0-9_]{0,30})$/;

function validate (username) {
  return validUsernameRegex.test(username);
}

function setPassword (username, password, callback) {
  if(!username || !password) {
    return callback(new Error('setPassword: Invalid arguments'));
  }
  if(!validate(username)) {
    return callback(new Error('setPassword: Invalid username'));
  }

  var child = child_process.spawn('passwd', [username]);
  child.stdin.end(password);
  child.on('error', callback);
  child.on('exit', function () {
    callback();
  });
};
