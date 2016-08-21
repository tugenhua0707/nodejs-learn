



/*
http.createServer(function(req,res){
  console.log(req.method); // GET
  console.log(req.url);
  var pathname = url.parse(req.url).pathname;
  console.log(pathname);

  res.writeHead(200,{'Content-Type':'text/plain'});
  res.end('Hello World');

}).listen(1337,'127.0.0.1');
console.log("Server runnint 127.0.0.1:1337/");
*/

var express = require('express');
var app = express();
var url = require('url');

var routes = [];
// querystring 解析中间件
var querystring = function(req,res,next) {
  req.query = url.parse(req.url,true).query;
  next();
};
// cookie解析中间件
var cookie = function(req,res,next) {
  var cookie = req.headers.cookie;
  var cookies = {};
  if(cookie) {
    var list = cookie.split(";");
    for(var i = 0; i < list.length; i++) {
      var pair = list[i].split("=");
      cookies[pair[0].trim()] = pair[1];
    }
  }
  req.cookies = cookies;
  next();
}
var pathRegexp = function(path) {
  var keys = [];
  path = path
    .concat("strict" ? '' : '/?')
    .replace(/\/\(/g, '(?:/')
    .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?(\*)?/g, 
      function(_, slash, format, key, capture,optional, star) {
        //将匹配到的键值保存起来
        keys.push(key);
        slash = slash || '';
        return ''
        + (optional ? '' : slash)
        + '(?:'
        + (optional ? slash : '')
        + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'
        + (optional || '')
        + (star ? '(/*)?' : '');
      })
    .replace(/([\/.])/g, '\\$1')
    .replace(/\*/g, '(.*)');
    return {
      keys: keys,
      regexp: new RegExp('^' + path + '$')
    };
}
var handle404 = function(req,res) {};
var handle500 = function(err,req,res,stack) {
  // 选取异常处理中间件
};
var handleFunc = function(req,res,stack) {
  var next = function(err){
    if(err) {
      return handle500(err,req,res,stack);
    }
    // 从stack数组中取出中间件并执行
    var middleware = stack.shift();
    if(middleware) {
      // 传入next()函数自身，使中间件能够执行结束后递归
      try {
        middleware(req,res,next);
      }catch(ex) {
        next(err);
      }
    }
  };
  // 启动执行
  next();
};
// 路由分离，
app.use = function(path) {
  var handle;
  if(typeof path === 'string') {
    handle = {
      // 第一个参数作为路径
      path: pathRegexp(path),
      stack: Array.prototype.slice.call(arguments,1)
    };
  }else {
    handle = {
      // 第一个参数作为路径
      path: pathRegexp('/'),
      stack: Array.prototype.slice.call(arguments,0)
    };
  }
  routes.push(handle);
}
// 调用中间件
app.use('/user/:username',querystring,cookie,function(req,res){
  //console.log(req);
});

// 上面的use()方法将中间件都保存到stack数组中，等待匹配后触发执行。
var match = function(pathname,routes) {
  var stacks = [];
  for(var i = 0; i < routes.length; i++) {
    var route = routes[i];
    // 正则匹配
    var reg = route.path.regexp;
    var matched = reg.exec(pathname);
    if(matched) {
      // todo
      // 将中间件保存起来
      stacks = stacks.concat(route.stack);
    }
  }
  return stacks;
};
app.get('/user/:username',function(req,res){
  var pathname = url.parse(req.url).pathname;
  // 将请求方法变为小写
  var method = req.method.toLowerCase();
  // 获取所有的中间件
  var stacks = match(pathname,routes);

  if(routes.hasOwnProperty(method)) {
    // 根据请求分发，获取相关的中间件
    stacks.concat(match(pathname,routes[method]));
  }
  if(stacks.length) {
    handleFunc(req,res,stacks);
  }else {
    // 404处理
    // handle404(req,res);
  }
});
app.listen(3333);
console.log("Server runnint 127.0.0.1:3333/");
