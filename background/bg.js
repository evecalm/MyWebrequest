// Generated by CoffeeScript 1.12.0
var hasProp = {}.hasOwnProperty;

(function() {
  var RULES_TYPE, cloneObj, feature_rules, formatHeaders, formatQstr, gsearchRuleBasic, gstaticBasic, init, logNum, logger, onRequests, pushNotification, requestCache, updateExtIcon;
  gsearchRuleBasic = ['*://www.google.com/url*', '*://www.google.com.hk/url*'];
  gstaticBasic = ['http://ajax.googleapis.com/*', 'http://fonts.googleapis.com/*'];
  RULES_TYPE = ['custom', 'block', 'hsts', 'log', 'hotlink', 'gsearch', 'gstatic'];
  logger = window.console;
  feature_rules = {
    block: {
      urls: []
    },
    hsts: {
      urls: []
    },
    log: {
      urls: []
    },
    hotlink: {
      urls: []
    },
    custom: {
      urls: []
    },
    gsearch: {
      urls: gsearchRuleBasic
    },
    gstatic: {
      urls: gstaticBasic
    }
  };
  logNum = 0;
  requestCache = {};
  cloneObj = function(o) {
    var i, j, k, key, len, obj, val;
    if (o === null || !(o instanceof Object)) {
      return o;
    }
    if (Array.isArray(o)) {
      if (o.length > 1) {
        obj = [];
        for (k = j = 0, len = o.length; j < len; k = ++j) {
          i = o[k];
          obj[k] = i instanceof Object ? cloneObj(i) : i;
        }
        return obj;
      } else {
        return o[0];
      }
    } else {
      obj = {};
      for (val in o) {
        key = o[val];
        obj[val] = key instanceof Object ? cloneObj(key) : key;
      }
      return obj;
    }
  };
  formatQstr = function(url) {
    var k, params, qs, result, v;
    qs = utils.getQs(url);
    params = utils.parseQs(qs);
    if (!qs) {
      return false;
    }
    result = {};
    for (k in params) {
      if (!hasProp.call(params, k)) continue;
      v = params[k];
      if (Array.isArray(v)) {
        k = k.replace(/[]$/, '');
      }
      result[k] = v;
    }
    return {
      formatedData: result,
      rawData: qs
    };
  };
  formatHeaders = function(headers) {
    var j, len, obj, val;
    obj = {};
    for (j = 0, len = headers.length; j < len; j++) {
      val = headers[j];
      obj[val.name] = val.value;
    }
    return obj;
  };
  pushNotification = (function() {
    var cbs, fn;
    fn = null;
    if (chrome.notifications) {
      cbs = {};
      fn = function(title, content, notifiId, cb) {
        notifiId = notifiId || '';
        chrome.notifications.create(notifiId, {
          type: 'basic',
          iconUrl: '/img/icon38.png',
          title: title,
          message: content
        }, function() {});
        if (notifiId && cb instanceof Function) {
          cbs[notifiId] = cb;
        }
      };
      chrome.notifications.onClicked.addListener(function(nId) {
        cbs[nId] && cbs[nId]();
      });
      chrome.notifications.onClosed.addListener(function(nId) {
        delete cbs[nId];
      });
    } else if (window.webkitNotifications) {
      fn = function(title, content) {
        var notifi;
        notifi = webkitNotifications.createNotification('/img/icon48.png', title, content);
        return notifi.show();
      };
    } else {
      fn = function() {};
    }
    return fn;
  })();
  onRequests = {
    gsearch: {
      fn: function(details) {
        var url;
        url = formatQstr(details.url).formatedData;
        url = url != null ? url.url : void 0;
        if (!url) {
          url = details.url;
        }
        return {
          redirectUrl: url
        };
      },
      permit: ['blocking'],
      on: 'onBeforeRequest'
    },
    custom: {
      fn: function(details) {
        var k, rule, rules, url;
        rules = collection.getLocal('custom', 'o');
        for (k in rules) {
          if (!hasProp.call(rules, k)) continue;
          rule = rules[k];
          console.log("get target Url, rule: %o, url: %s", rule, details.url);
          url = utils.getTargetUrl(rule, details.url);
          console.log('then target url is: %s', url);
          if (url) {
            return {
              redirectUrl: url
            };
          }
        }
      },
      permit: ['blocking'],
      on: 'onBeforeRequest'
    },
    block: {
      fn: function(details) {
        console.log('block url: ' + details.url);
        return {
          cancel: true
        };
      },
      permit: ['blocking'],
      on: 'onBeforeRequest'
    },
    hsts: {
      fn: function(details) {
        return {
          redirectUrl: details.url.replace(/^http\:\/\//, 'https://')
        };
      },
      permit: ['blocking'],
      on: 'onBeforeRequest'
    },
    hotlink: {
      fn: function(details) {
        var headers, i, j, k, len;
        headers = details.requestHeaders;
        for (k = j = 0, len = headers.length; j < len; k = ++j) {
          i = headers[k];
          if (i.name === 'Referer') {
            headers.splice(k, 1);
            break;
          }
        }
        return {
          requestHeaders: headers
        };
      },
      permit: ['requestHeaders', 'blocking'],
      on: 'onBeforeSendHeaders'
    },
    logBody: {
      fn: function(details) {
        if (details.requestBody) {
          return requestCache[details.requestId] = cloneObj(details.requestBody);
        }
      },
      permit: ['requestBody'],
      on: 'onBeforeRequest'
    },
    logRequest: {
      fn: function(details) {
        var domain, queryBody, rid, url;
        ++logNum;
        url = details.url;
        rid = details.requestId;
        queryBody = formatQstr(details.url);
        domain = /^(?:[\w-]+):\/\/([^\/]+)\//.exec(url);
        domain = domain ? domain[1] : url;
        if (requestCache[rid]) {
          details.requestBody = requestCache[rid];
        }
        details.requestHeaders = formatHeaders(details.requestHeaders);
        if (queryBody) {
          details.queryBody = queryBody;
        }
        logger.log('%c%d %o %csent to domain: %s', 'color: #086', logNum, details, 'color: #557c30', domain);
        delete requestCache[rid];
      },
      permit: ['requestHeaders'],
      on: 'onSendHeaders'
    },
    gstatic: {
      fn: function(details) {
        return {
          redirectUrl: details.url.replace('googleapis.com', 'useso.com')
        };
      },
      permit: ['blocking'],
      on: 'onBeforeRequest'
    }
  };
  updateExtIcon = function(iconStyle) {
    if (iconStyle !== 'grey') {
      iconStyle = '';
    }
    if (iconStyle) {
      iconStyle += '-';
    }
    chrome.browserAction.setIcon({
      path: {
        "19": "/img/" + iconStyle + "icon19.png",
        "38": "/img/" + iconStyle + "icon38.png"
      }
    });
  };
  init = function() {
    var _rule, j, k, len, onRequest, onoff, reqApi, rule;
    onoff = collection.getLocal('onoff', 'o');
    reqApi = chrome.webRequest;
    onRequest = null;
    for (j = 0, len = RULES_TYPE.length; j < len; j++) {
      k = RULES_TYPE[j];
      if (onoff[k]) {
        _rule = collection.getRules(k);
        rule = feature_rules[k];
        if (!rule) {
          continue;
        }
        if (!(rule.urls.length || _rule.length)) {
          onoff[k] = false;
          continue;
        }
        console.log('enable feature: %s', k);
        if (_rule) {
          rule = {
            urls: rule.urls.concat(_rule)
          };
        }
        if (k === 'log') {
          pushNotification(utils.i18n('bg_logison'), utils.i18n('bg_logon_tip'), 'log-enabled-hint', function() {
            window.open('/options/index.html#log');
          });
          onRequest = onRequests['logBody'];
          reqApi[onRequest.on].addListener(onRequest.fn, rule, onRequest.permit);
          onRequest = onRequests['logRequest'];
          reqApi[onRequest.on].addListener(onRequest.fn, rule, onRequest.permit);
        } else {
          onRequest = onRequests[k];
          reqApi[onRequest.on].addListener(onRequest.fn, rule, onRequest.permit);
        }
      } else {
        onoff[k] = false;
      }
    }
    collection.setLocal('onoff', onoff);
    updateExtIcon(collection.getConfig('iconStyle'));
  };
  init();
  window.addEventListener('storage', function(event) {
    var e, j, k, len, method, newData, oldData, onRequest, reqApi, rule, type;
    console.log('storage event fired %o', event);
    type = event.key;
    reqApi = chrome.webRequest;
    try {
      newData = JSON.parse(event.newValue || '[]');
      oldData = JSON.parse(event.oldValue || '[]');
    } catch (error) {
      e = error;
      logger.warn("values(" + newData + "/" + oldData + ") of " + type + " is invalid");
    }
    collection.initCollection();
    onRequest = null;
    if (type === 'config') {
      if (newData.iconStyle !== oldData.iconStyle) {
        updateExtIcon(newData.iconStyle);
      }
      return;
    }
    if (type === 'onoff') {
      for (j = 0, len = RULES_TYPE.length; j < len; j++) {
        k = RULES_TYPE[j];
        if (newData[k] !== oldData[k]) {
          method = newData[k] ? 'addListener' : 'removeListener';
          rule = feature_rules[k];
          console.log('onoff change, feature: %s turned %s', k, newData[k]);
          if (!rule) {
            return;
          }
          rule = {
            urls: rule.urls.concat(collection.getRules(k))
          };
          if (!rule.urls.length) {
            console.log('disable feature because %s has no rule', k);
            collection.setSwitch(k, false);
            return;
          }
          console.log('method %s', method);
          if (k === 'log') {
            onRequest = onRequests['logBody'];
            reqApi[onRequest.on][method](onRequest.fn, rule, onRequest.permit);
            onRequest = onRequests['logRequest'];
            reqApi[onRequest.on][method](onRequest.fn, rule, onRequest.permit);
          } else {
            onRequest = onRequests[k];
            console.log('feature onrequest object %o', onRequest);
            reqApi[onRequest.on][method](onRequest.fn, rule, onRequest.permit);
          }
        }
      }
      return;
    }
    if (!collection.getSwitch(type)) {
      return;
    }
    rule = feature_rules[type];
    if (!rule) {
      return;
    }
    rule = {
      urls: rule.urls.concat(collection.getRules(type))
    };
    if (type === 'log') {
      reqApi[onRequests['logBody'].on].removeListener(onRequests['logBody'].fn);
      reqApi[onRequests['logRequest'].on].removeListener(onRequests['logRequest'].fn);
    } else {
      onRequest = onRequests[type];
      reqApi[onRequest.on].removeListener(onRequest.fn);
    }
    if (rule.urls.length) {
      if (type === 'log') {
        onRequest = onRequests['logBody'];
        reqApi[onRequest.on].addListener(onRequest.fn, rule, onRequest.permit);
        onRequest = onRequests['logRequest'];
        reqApi[onRequest.on].addListener(onRequest.fn, rule, onRequest.permit);
      } else {
        onRequest = onRequests[type];
        reqApi[onRequest.on].addListener(onRequest.fn, rule, onRequest.permit);
      }
      return;
    } else {
      console.log('turn off feature %s bacause rules is empty', type);
      collection.setSwitch(type, false);
    }
    reqApi.handlerBehaviorChanged();
  });
})();
