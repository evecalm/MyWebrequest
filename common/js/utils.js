// Generated by CoffeeScript 1.10.0
var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

(function(root, factory) {
  if (typeof define === 'function' && (define.amd || define.cmd)) {
    define(function() {
      return factory(root);
    });
  } else if (typeof exports === 'object') {
    module.exports = factory(root);
  } else {
    root.utils = factory(root);
  }
})(this, function(root) {
  var RESERVED_HOLDERS, escapeRegExp, fillPattern, getRedirectParamList, getTargetUrl, getUrlFromClipboard, getUrlParam, hasReservedWord, hasUndefinedWord, hostReg, i18n, ipReg, isHost, isIp, isPath, isProtocol, isRegValid, isRouteValid, namedParam, optionalParam, pathReg, protocols, route2reg, splatParam, urlComponentReg;
  ipReg = /^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])$/;
  isIp = function(ip) {
    return ipReg.test(ip);
  };
  hostReg = /^(\*((\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,4})?|([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,4})$/;
  isHost = function(host) {
    return hostReg.test(host);
  };
  pathReg = /^[a-z0-9-_\+=&%@!\.,\*\?\|~\/]+$/i;
  isPath = function(path) {
    return pathReg.test(path);
  };
  protocols = ['*', 'https', 'http'];
  isProtocol = function(protocol) {
    return indexOf.call(protocols, protocol) >= 0;
  };
  optionalParam = /\((.*?)\)/g;
  namedParam = /(\(\?)?:\w+/g;
  splatParam = /\*\w+/g;
  escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;

  /**
   * convert a url pattern to a regexp
   * @param  {String} route url pattern
   * @return {Object}
   *                 {
   *                    reg: regexp string can match an url
   *                    params: var name of each named param
   *                 }
   */
  route2reg = function(route) {
    var params, reg;
    params = [];
    route = route.replace(escapeRegExp, '\\$&').replace(optionalParam, '(?:$1)?').replace(namedParam, function(match, optional) {
      params.push(match.replace(/^[^:]*?:/, ''));
      if (optional) {
        return match;
      } else {
        return '([^/?]+)';
      }
    }).replace(splatParam, function(match) {
      params.push(match.replace(/^[^*]*?\*/, ''));
      return '([^?]*?)';
    });
    reg = '^' + route + '(?:\\?([\\s\\S]*))?$';
    return {
      reg: reg,
      params: params
    };
  };

  /**
   * check the route
   * return undefined if valid
   * return false params is empty
   * return an array of duplicated names if found in params
   * @param  {Object}  res result returned by route2reg
   * @return {Boolean|Array|undefined}
   */
  isRouteValid = function(res) {
    var params;
    params = res.params;
    if (!params.length) {
      return false;
    }
    res = params.filter(function(v, k) {
      return k !== params.indexOf(v);
    });
    if (res.length) {
      return res;
    }
  };
  urlComponentReg = /^(\w+):\/\/([^\/]+)\/([^?]+)?(\?(.*))?$/;

  /**
   * get a key-value object from the url which match the pattern
   * @param  {Object} r   {reg: ..., params: ''} from route2reg
   * @param  {String} url a real url that match that pattern
   * @return {Object}
   */
  getUrlParam = function(r, url) {
    var e, error, j, k, len, matchs, ref, res, v;
    res = {};
    try {
      matchs = (new RegExp(r.reg)).exec(url);
    } catch (error) {
      e = error;
      matchs = '';
    }
    if (!matchs) {
      return null;
    }
    ref = r.params;
    for (k = j = 0, len = ref.length; j < len; k = ++j) {
      v = ref[k];
      res[v] = matchs[k + 1] || '';
    }
    matchs = urlComponentReg.exec(url);
    res.p = RegExp.$1;
    res.h = RegExp.$2;
    res.m = res.h.split('.').slice(-2).join('.');
    res.r = RegExp.$3;
    res.q = RegExp.$5;
    return res;
  };
  isRegValid = function(reg) {
    var e, error;
    try {
      new RegExp(reg);
    } catch (error) {
      e = error;
      return e.message;
    }
  };
  getRedirectParamList = function(url) {
    return url.match(/\{([%=]?[\w]+)\}/g).map(function(v) {
      return v.slice(1, -1);
    });
  };

  /**
   * return undefined if no undefined word, or a list contains undefined words
   * @param  {Object}  refer a defined word list
   * @param  {String}  url   a url pattern that use words in refer
   * @return {Array|undefined}
   */
  hasUndefinedWord = function(refer, url) {
    var j, len, ref, res, sample, v;
    res = [];
    sample = getRedirectParamList(url);
    for (j = 0, len = sample.length; j < len; j++) {
      v = sample[j];
      if ((ref = v.charAt(0)) === '%' || ref === '=') {
        v = v.slice(1);
      }
      if (indexOf.call(refer, v) < 0) {
        res.push(v);
      }
    }
    if (res.length) {
      return res;
    }
  };
  RESERVED_HOLDERS = ['p', 'h', 'm', 'r', 'q'];
  hasReservedWord = function(params) {
    var j, len, ref, ref1, res, v;
    res = [];
    for (j = 0, len = RESERVED_HOLDERS.length; j < len; j++) {
      v = RESERVED_HOLDERS[j];
      if (indexOf.call(params, v) >= 0 || (ref = "%" + v, indexOf.call(params, ref) >= 0) || (ref1 = "=" + v, indexOf.call(params, ref1) >= 0)) {
        res.push(v);
      }
    }
    res = res.filter(function(v, k) {
      return k !== res.indexOf(v);
    });
    if (res.length) {
      return res;
    }
  };
  fillPattern = function(pattern, data) {
    return pattern.replace(/\{([%=]?)([\w]+)\}/g, function($0, $1, $2) {
      var e, error, ref, ref1, v;
      if (!$1) {
        return (ref = data[$2]) != null ? ref : '';
      } else {
        v = (ref1 = data[$2]) != null ? ref1 : '';
        try {
          if ($1 === '%') {
            v = encodeURIComponent(v);
          } else {
            v = decodeURIComponent(v);
          }
        } catch (error) {
          e = error;
        }
        return v;
      }
    });
  };

  /**
   * get target url
   * @param  {String} route   url pattern to match a url
   * @param  {String} pattern url pattern that to get a new url
   * @param  {String} url     a real url that match route
   * @return {String}         converted url
   */
  getTargetUrl = function(route, pattern, url) {
    var params, r;
    r = route2reg(route);
    params = getUrlParam(r, url);
    if (!params) {
      return '';
    }
    return fillPattern(pattern, params);
  };

  /**
   * get i18n text
   * @param  {String} msgid text label id
   * @return {String}
   */
  i18n = function(msgid) {
    return chrome.i18n.getMessage(msgid);
  };

  /**
   * GET url info url the clipboard, returns {protocol, host, path}
   * @param  {Event} e  paste event
   * @return {Object}
   */
  getUrlFromClipboard = function(e) {
    var i, result, url;
    result = {};
    url = e.originalEvent.clipboardData.getData('text/plain');
    if (!url) {
      return result;
    }
    i = url.indexOf('://');
    if (i === -1) {
      url = '*://' + url;
    }
    if (!url.match(/^([a-z]+|\*):\/\/([^\/]+)(\/.*)?$/i)) {
      return result;
    }
    result.protocol = RegExp.$1.toLowerCase();
    result.host = RegExp.$2;
    result.path = RegExp.$3;
    return result;
  };
  return {
    isIp: isIp,
    isHost: isHost,
    isPath: isPath,
    isProtocol: isProtocol,
    i18n: i18n,
    route2reg: route2reg,
    getUrlParam: getUrlParam,
    isRegValid: isRegValid,
    hasUndefinedWord: hasUndefinedWord,
    hasReservedWord: hasReservedWord,
    getTargetUrl: getTargetUrl,
    getUrlFromClipboard: getUrlFromClipboard
  };
});


//# sourceMappingURL=utils.js.map