## node 学习
<h3>一：创建一个简单的服务器如下：</h3>
    var http = require('http');
    var url = require('url');
    http.createServer(function(req,res){
      console.log(req.method); // GET
      console.log(req.url);
      var pathname = url.parse(req.url).pathname;
      console.log(pathname);

      res.writeHead(200,{'Content-Type':'text/plain'});
      res.end('Hello World');

    }).listen(1337,'127.0.0.1');
    console.log("Server runnint 127.0.0.1:1337/");
<p>访问 http://127.0.0.1:1337/a?foo=bar 时，req.method 返回get请求，req.url返回 /a?foo=bar
打印pathname 返回 /a; </p>
<h3>二：请求方法的判断</h3>
<p>
  在web中，最常见的请求方法有GET或POST，当然还有HEAD，DELETE，PUT，CONNECT等方法，判断方法的类型
  使用req.method；
</p>
<h3>三：路径解析</h3>
<p>
  HTTP_Parser将其解析为req.url,比如这么一个路径：http://127.0.0.1:3333/a?foo=bar; 当我请求
  这个路径的时候，代码打印出如下：
</p>
    var express = require('express');
    var app = express();
    var url = require('url');
    app.get('/a',function(req,res){
      console.log(req.url); // 打印出 /a?foo=bar
      var pathname = url.parse(req.url).pathname;
      console.log(pathname);// 打印出 /a
    });
    app.listen(3333);
    console.log("Server runnint 127.0.0.1:3333/");
<h3>四：查询字符串</h3>
<p>
  查询字符串是位于路径之后的，比如上面的地址/a?foo=bar，那么字符串就是 ?foo=bar 就是查询字符串。
  Node提供了querystring模块处理这部分数据；比如代码如下：
</p>
    var express = require('express');
    var app = express();
    var url = require('url');
    var querystring = require('querystring');

    app.get('/a',function(req,res){
      var query = url.parse(req.url,true).query;
      console.log(url.parse(req.url,true));
      /* 打印信息如下
      {
        protocol: null,
        slashes: null,
        auth: null,
        host: null,
        port: null,
        hostname: null,
        hash: null,
        search: '?foo=bar',
        query: { foo: 'bar' },
        pathname: '/a',
        path: '/a?foo=bar',
        href: '/a?foo=bar' 
      }
      */ 
      console.log(query); // { foo: 'bar' }
    });
<p>
  如上代码：url.parse(req.url,true).query; 会返回一个json对象，{foo:'bar'};
  注意：如果查询字符串中的键出现多次，那么它的值会是一个数组的形式，比如：
  访问这个路径的时候：http://127.0.0.1:3333/a?foo=bar&foo=1  再打印
  console.log(url.parse(req.url,true).query) 的时候，
  { foo: [ 'bar', '1' ] }
</p>
<h3>五：Cookie</h3>
<p>
  客户端的发送的cookie是在请求报文中的cookie字段中，HTTP_Parser会将所有的报文字段解析到
  req.headers上，那么Cookie就是req.headers.cookie，cookie的值的格式是key=value;
  如果我们需要cookie，可以如下代码解析即可：
</p>
    var parseCookie = function(cookie) {
      var cookies = {};
      if(!cookie) {
        return cookies;
      }
      var list = cookie.split(";");
      for(var i = 0; i < list.length; i++) {
        var pair = list[i].split("=");
        cookies[pair[0].trim()] = pair[1];
      }
      return cookies;
    };
<p>
  因此当我们访问客户端网页的时候，我们可以通过cookie的一些值来判断用户是否是第一次访问我们
  的网站的；如下代码测试：
</p>
    var express = require('express');
    var app = express();

    var parseCookie = function(cookie) {
      var cookies = {};
      if(!cookie) {
        return cookies;
      }
      var list = cookie.split(";");
      for(var i = 0; i < list.length; i++) {
        var pair = list[i].split("=");
        cookies[pair[0].trim()] = pair[1];
      }
      return cookies;
    };
    var hander = function(req,res){
      res.writeHead(200,{'Content-Type':'text/plain'});
      console.log(req.cookies);
      
      if(!req.cookies.isVisit) {
        res.end("欢迎第一次来到动物园");
      }else {
        // 做其他的事情
      }
    };
    app.get('/a',function(req,res){
      req.cookies = parseCookie(req.headers.cookie);
      hander(req,res);
    });

    app.listen(3333);
    console.log("Server runnint 127.0.0.1:3333/");
<p>
  上面代码是判断用户是否是第一次访问过该网站，那么如果用户已经访问过我们的网站的时候，我们是否
  也可以告诉用户已经访问过呢？告诉客户端的方式是通过响应报文中实现的，响应的cookie值在
  Set-Cookie字段中，比如如下：
  Set-Cookie: name=value; Path=/;Expires=xx 23-apr-23 11:11:11 GMT; 
  Domain = .domain.com;
</p>
<p>
  知道了Cookie在报文中的具体格式后，下面我们可以将cookie序列化成符合规范的字符串，代码如下：
</p>
    var serialize = function(name,val,opt){
      var pairs = [name + '=' +encodeURI(val)];
      opt = opt || {};
      if(opt.maxAge) pairs.push('Max-Age='+opt.maxAge);
      if(opt.domain) pairs.push('Domain='+opt.domain);
      if(opt.path) pairs.push('Path='+opt.path);
      if(opt.expires) pairs.push("Expires="+opt.expires.toUTCString());
      if(opt.httpOnly) pairs.push('HttpOnly');
      if(opt.secure) pairs.push('Secure');
      return pairs.join('; ');
    };
<p>因此上面的 hander函数代码可以改为如下了：</p>
    var hander = function(req,res){
      if(!req.cookies.isVisit) {
        res.setHeader('Set-Cookie',serialize('isVisit','1'));
        res.writeHead(200,{'Content-Type':'text/plain'});
        res.end("欢迎第一次来到动物园");
      }else {
        // 做其他的事情
        res.writeHead(200,{'Content-Type':'text/plain'});
        res.end("动物园再次欢迎您");
      }
    };
<h3>cookie的缺点如下:</h3>
<p>1. cookie过大会影响传输性能，http请求中会被传递</p>
<p>
  2. 数据放在cookie中不安全性，因为前后端都可以对cookie进行修改，所以数据很容易被篡改和
  伪造。
</p>
<h3>六：Session</h3>
<p>
  cookie有缺点，最重要的时安全性不高，因此服务器引来Session，客户端是不能更改的来确保安全
  性，数据也不需要在协议中每次都被传递。那么session是如何将每个客户和服务器中的数据一一对应
  起来呢？有如下方式可以解决：
</p>
<h4>6-1: 基于Cookie来实现用户和数据的映射。</h4>
<p>
  把所有的数据放在cookie中是不可取的，但是将口令放在Cookie中还是可以的，因为口令一旦被
  篡改，就丢失了映射关系，也无法修改服务器端存在的数据了；并且session是有有效期的，一般为
  20分钟，如果在20分钟内客户端和服务器端没有交互发生，那么服务器端将会把数据删除掉；
  服务器端，比如Connect默认采用connect_uid作为口令，Tomcat会采用jsessionid作为口令；
  一旦服务器检查到用户请求cookie中没有该值的话，就会为它生成这么一个值，该值是唯一的，并且
  设置超时时间；
</p>
<h3>7. 路由映射</h3>
<p>
  路由映射可以通过手工关联映射，该映射有一个对应的路由文件来将URL映射到对应的控制器。
</p>
<p>7-1 手工关联映射</p>
<p>手工映射比如如下2中URL各式的映射</p>
<p>/user/setting</p>
<p>/setting/user</p>
<p>代码映射如下：</p>
    var express = require('express');
    var app = express();
    var url = require('url');

    var routes = [];
    var use = function(path,action) {
      routes.push([path,action]);
    };
    var setting = function(req,res) {
      // todo
      console.log(req);
    };
    var handle404 = function(req,res) {

    };
    app.get('/user/setting',function(req,res){
      var pathname = url.parse(req.url).pathname;
      console.log(pathname);
      for(var i = 0; i < routes.length; i++) {
        var route = routes[i];
        if(pathname == route[0]) {
          var action = route[1];
          action(req,res);
          return;
        }
      }
      // 处理404请求
      handle404(req,res);
    });
    use('/user/setting',setting);
    use('/setting/user',setting);

    app.listen(3333);
    console.log("Server runnint 127.0.0.1:3333/");
<p>7-2 正则匹配</p>
<p>
  上面是简单的路径匹配，如果对于不同的用户进行匹配的话，那么上面的映射匹配就不能满足需求了。比如说如下：
</p>
<p>/a/user1</p>
<p>/a/user2</p>
<p>上面只是列举了2个用户，那如果有10000个用户或者更多，那需要如何做呢？</p>
<p>因此我们可以这样设想，通过如下方式来匹配任意用户。</p>
    use('/a/:username',function(req,res){
      // todo
      var username = req.params.username;
    });
<p>书上的代码如下就可以实现上面的匹配方式；</p>
    var express = require('express');
    var app = express();
    var url = require('url');

    var routes = [];
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
    var use = function(path,action) {
      routes.push([pathRegexp(path),action]);
    };
    use('/user/:username',function(req,res){
      // todo
      var username = req.params.username;
      console.log(username);
    });
    var handle404 = function(req,res) {};

    app.get('/user/:username',function(req,res){
      var pathname = url.parse(req.url).pathname;
      
      for(var i = 0; i < routes.length; i++) {
        var route = routes[i];
        // 正则匹配
        var reg = route[0].regexp;
        var keys = route[0].keys;
        var matched = reg.exec(pathname);
        if(matched) {
          // 抽取具体值
          var params = {};
          for(var j = 0,jlen = keys.length; j < jlen; j++) {
            var value = matched[i+1];
            if(value) {
              params[keys[j]] = value;
            }
          }
          req.params = params;
          var action = route[1];
          action(req,res);
          return;
        }
      }
      // 处理404请求
      handle404(req,res);
    });

    app.listen(3333);
    console.log("Server runnint 127.0.0.1:3333/");
<h3>8. 理解中间件</h3>
<p>一般中间件提供两种方式，如下是正常的情况下的：</p>
    var middleware = function(req,res,next) {
      // todo
      next();
    };
<p>如上中间件形式，传递三个参数，请求对象req，响应对象res, 调用next()执行下一个中间件；</p>
<p>还有一种方式就是处理异常的情况下的，有四个参数，第一个参数就是error对象</p>
    var middleware = function(err,req,res,next) {
      if(err) {
        // todo
      }
      // todo
      next();
    }
<p>下面我们可以把cookie和querystring都封装起来，直接use调用模块即可，书上的代码如下：</p>
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
