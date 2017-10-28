do ->
  gsearchRuleBasic = ['*://www.google.com/url*', '*://www.google.com.hk/url*']
  gstaticBasic = ['http://ajax.googleapis.com/*', 'http://fonts.googleapis.com/*']

  RULES_TYPE = [ 'custom', 'block', 'hsts', 'log', 'hotlink', 'gsearch', 'gstatic']
  # to avoid uglify dropb console in log feature
  logger = window.console

  feature_rules =
    block: { urls: [] }
    hsts: { urls: [] }
    log: { urls: [] }
    hotlink: { urls: [] }
    custom: { urls: [] }
    gsearch: { urls: gsearchRuleBasic }
    gstatic: { urls: gstaticBasic }

  logNum = 0
  requestCache = {}

  # 克隆对象
  cloneObj = (o) ->
    if o is null or o not instanceof Object
      return o
    if Array.isArray o
      if o.length > 1
        obj = []
        for i, k in o
          obj[ k ] = if i instanceof Object then cloneObj(i) else i
        obj
      else
        o[0]
    else
      obj = {}
      for val, key of o
        obj[ val ] = if key instanceof Object then cloneObj(key) else key
      obj


  # format query string
  formatQstr = (url) ->
    qs = utils.getQs url
    params = utils.parseQs qs
    return false unless qs

    result = {}
    for own k, v of params
      if Array.isArray v
        # remove the [] suffix in array key name for readability
        k = k.replace /[]$/, ''
      result[ k ] = v

    {
      formatedData: result
      rawData: qs
    }


  # 格式化http headers
  formatHeaders = (headers) ->
    obj = {}
    for val in headers
      obj[ val.name ] = val.value
    obj

  # 推送消息提醒, Chrome不同版本的API不一致, 故添加此函数
  pushNotification = do->
    fn = null
    if chrome.notifications
      cbs = {}
      fn = (title, content, notifiId, cb)->
        notifiId = notifiId or ''
        chrome.notifications.create notifiId,
          type: 'basic'
          iconUrl: '/img/icon38.png'
          title: title
          message: content
        , ->
        if notifiId and cb instanceof Function
          cbs[ notifiId ] = cb
        return
      chrome.notifications.onClicked.addListener (nId)->
        cbs[ nId ] and do cbs[ nId ]
        return
      chrome.notifications.onClosed.addListener (nId)->
        delete cbs[ nId ]
        return
    else if window.webkitNotifications
      fn = (title, content)->
        notifi = webkitNotifications.createNotification '/img/icon48.png', title, content
        do notifi.show
    else
      fn = ->
    fn
    

  # 请求的监听事件
  onRequests =
    # 取消Google搜索结果重定向
    gsearch:
      fn:  (details) ->
        url = formatQstr(details.url).formatedData
        url = url?.url
        if !url
          url = details.url
        { redirectUrl: url }
      permit: [ 'blocking' ]
      on: 'onBeforeRequest'
    # 自定义请求跳转
    custom:
      fn: (details)->
        rules = collection.getLocal 'custom', 'o'
        for own k, rule of rules
          console.log "get target Url, rule: %o, url: %s", rule, details.url
          url = utils.getTargetUrl rule, details.url
          console.log 'then target url is: %s', url
          if url
            return { redirectUrl: url }

      permit: [ 'blocking' ]
      on: 'onBeforeRequest'
    # 屏蔽请求
    block:
      fn: (details)->
        console.log 'block url: ' + details.url
        {cancel: true}
      permit: [ 'blocking' ]
      on: 'onBeforeRequest'
    # 强制加密链接
    hsts:
      fn: (details)->
        { redirectUrl: details.url.replace /^http\:\/\//, 'https://' }
      permit: [ 'blocking' ]
      on: 'onBeforeRequest'
    # 修改HTTP header中的referrer
    hotlink:
      fn: (details) ->
        headers = details.requestHeaders
        for i, k in headers
          if i.name is 'Referer'
            headers.splice k, 1
            break
        { requestHeaders: headers }
      permit: [ 'requestHeaders', 'blocking' ]
      on: 'onBeforeSendHeaders'
    # 记录请求的body, 主要针对post, put请求
    logBody:
      fn:  (details) ->
        if details.requestBody
          requestCache[ details.requestId ] = cloneObj details.requestBody
      permit: [ 'requestBody' ]
      on: 'onBeforeRequest'
    # 记录请求
    logRequest:
      fn: (details) ->
        ++logNum
        url = details.url
        rid = details.requestId
        queryBody = formatQstr details.url
        domain = /^(?:[\w-]+):\/\/([^/]+)\//.exec(url)
        domain = if domain then domain[1] else url
        if requestCache[ rid ]
          details.requestBody = requestCache[ rid ]
        details.requestHeaders = formatHeaders details.requestHeaders
        if queryBody
          details.queryBody = queryBody
        logger.log '%c%d %o %csent to domain: %s', 'color: #086', logNum, details, 'color: #557c30', domain
        # 删除已打印的请求的缓存
        delete requestCache[ rid ]
        return
      permit: [ 'requestHeaders' ]
      on: 'onSendHeaders'
    # Google cdn 跳转至360镜像cdn
    gstatic:
      fn: (details)->
        { redirectUrl: details.url.replace 'googleapis.com', 'useso.com' }
      permit: [ 'blocking' ]
      on: 'onBeforeRequest'
  
  # 更新浏览器ICON
  updateExtIcon = (iconStyle)->
    iconStyle = '' if iconStyle isnt 'grey'
    iconStyle += '-' if iconStyle
    chrome.browserAction.setIcon
      path:
        {
          "19": "/img/#{iconStyle}icon19.png",
          "38": "/img/#{iconStyle}icon38.png"
        }
    return

  # init, 检测配置中各个功能的开启状态, 予以开启或关闭
  init = ->
    onoff = collection.getLocal 'onoff', 'o'
    reqApi = chrome.webRequest
    onRequest = null
    # 启用各个特性
    for k in RULES_TYPE
      if onoff[ k ]
        _rule = collection.getRules k
        rule = feature_rules[ k ]
        continue unless rule

        unless rule.urls.length or _rule.length
          onoff[ k ] = false
          continue
        console.log 'enable feature: %s', k
        rule = urls : rule.urls.concat _rule if _rule
        if k is 'log'
          pushNotification utils.i18n('bg_logison'), utils.i18n('bg_logon_tip'), 'log-enabled-hint', ->
            window.open '/options/index.html#log'
            return
          onRequest = onRequests['logBody']
          reqApi[ onRequest.on ].addListener onRequest.fn, rule, onRequest.permit
          onRequest = onRequests['logRequest']
          reqApi[ onRequest.on ].addListener onRequest.fn, rule, onRequest.permit
        else
          onRequest = onRequests[ k ]
          # console.log rule, onRequest.on, onRequest.fn, onRequest.permit
          reqApi[ onRequest.on ].addListener onRequest.fn, rule, onRequest.permit
      else
        onoff[ k ] = false

    # 保存规则
    collection.setLocal 'onoff', onoff

    # 修改浏览器默认图标
    updateExtIcon collection.getConfig 'iconStyle'
    return

  do init

  # 监听localStroage的storage事件, 即监听配置信息的变化
  window.addEventListener 'storage', (event) ->
    console.log 'storage event fired %o', event
    type = event.key
    reqApi = chrome.webRequest
    try
      newData = JSON.parse event.newValue or '[]'
      oldData = JSON.parse event.oldValue or '[]'
    catch e
      logger.warn "values(#{newData}/#{oldData}) of #{type} is invalid"

    do collection.initCollection

    onRequest = null
    if type is 'config'
      # icon 风格变化
      if newData.iconStyle isnt oldData.iconStyle
        updateExtIcon newData.iconStyle
      return
    
    if type is 'onoff'
      
      for k in RULES_TYPE
        if newData[ k ] isnt oldData[ k ]
          method = if newData[ k ] then 'addListener' else 'removeListener'
          rule = feature_rules[ k ]
          console.log 'onoff change, feature: %s turned %s', k, newData[ k ]
          # return if this onoff is not supported
          return unless rule
          rule = urls: rule.urls.concat collection.getRules k
          unless rule.urls.length
            console.log 'disable feature because %s has no rule', k
            collection.setSwitch k, false
            return
          console.log 'method %s', method
          if k is 'log'
            onRequest = onRequests['logBody']
            reqApi[ onRequest.on ][ method ] onRequest.fn, rule, onRequest.permit
            onRequest = onRequests['logRequest']
            reqApi[ onRequest.on ][ method ] onRequest.fn, rule, onRequest.permit
          else
            onRequest = onRequests[ k ]
            console.log 'feature onrequest object %o', onRequest
            reqApi[ onRequest.on ][ method ] onRequest.fn, rule, onRequest.permit
      return

    # 如果当前功能未开启
    return unless collection.getSwitch type
    
    rule = feature_rules[ type ]
    # return if this type is not supported
    return unless rule

    rule = urls: rule.urls.concat collection.getRules type
    if type is 'log'
      reqApi[ onRequests['logBody'].on ].removeListener onRequests['logBody'].fn
      reqApi[ onRequests['logRequest'].on ].removeListener onRequests['logRequest'].fn
    else
      onRequest = onRequests[ type ]
      reqApi[ onRequest.on ].removeListener onRequest.fn

    if rule.urls.length
      if type is 'log'
        onRequest = onRequests['logBody']
        reqApi[ onRequest.on ].addListener onRequest.fn, rule, onRequest.permit
        onRequest = onRequests['logRequest']
        reqApi[ onRequest.on ].addListener onRequest.fn, rule, onRequest.permit
      else
        onRequest = onRequests[ type ]
        reqApi[ onRequest.on ].addListener onRequest.fn, rule, onRequest.permit
      return
    else
      console.log 'turn off feature %s bacause rules is empty', type
      collection.setSwitch type, false
    # tell chrome to clear the rule cache
    reqApi.handlerBehaviorChanged()
    return

  return