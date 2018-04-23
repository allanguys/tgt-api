# TGTest Apis

## /api/crawler

### Request:

**Header**

``` http
POST /api/crawler HTTP/1.1
Host: api.devfeed.cn
Content-Type: application/json
```

**Body**

``` json
{
    "url": "http://somedomain/path/file.ext",
    "options": {
        "loadImages":false,
        "loadMedias":false,
        "logRequests": true,
        "logConsole":true,
        "logHtml": false,
        "followRedirect": true,
        "device":"default",
        "media":"screen",
    }
}
```

### Response
**Header**

``` http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 110
ETag: W/"6e-J9Frkr/XeXTwb3V4w8iR3zIQEIU"
Date: Fri, 20 Apr 2018 06:36:30 GMT
Connection: keep-alive
```

**BODY**

``` json
{
    "charset": "utf-8",
    "consoles": {
        "info": [],
        "warn": [],
        "error": []
    },
    "errors": [],
    "headers": {
        "server": "Nginx",
        "date": "Fri, 20 Apr 2018 06:33:24 GMT",
        "cache-control": "max-age=60",
        "expires": "Fri, 20 Apr 2018 06:34:24 GMT",
        "last-modified": "Fri, 20 Apr 2018 06:30:00 GMT",
        "content-type": "text/html",
        "content-length": "13706",
        "content-encoding": "gzip",
        "connection": "keep-alive"
    },
    "html": "...",
    "redirects": ["url1", "url2", "url3"],
    "requests": {
        "http://somedomain/path/file.ext": 200,
        "http://somedomain/path/img.png": "Aborted",
        "http://otherDomain/path/": 302
    },
    "timer": {
        "start": "2018-04-20T06:33:24.079Z",
        "request": 6,
        "navigated": 231,
        "requestfinished": 234,
        "domContentLoaded": 501,
        "load": 662
    },
    "url": "http://somedomain/path/file.ext"
}
```

### Error Response

***Header***

``` http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 110
ETag: W/"6e-J9Frkr/XeXTwb3V4w8iR3zIQEIU"
Date: Fri, 20 Apr 2018 06:36:30 GMT
Connection: keep-alive
```

**Body**

``` json
{"msg":"Stop follow redirec from \"http://tps.qq.com/\" to \"http://tps.qq.com/cp/a2080319yind/index.html\"."}
```

## /api/check

### Request

**Header**

``` http
HTTP/1.1 POST
Content-Type:application/json
```

**Body**

``` json
{"url":"http://somedomain/somepath/somefile.ext", "loadImages":0, "loadMedias":0}
```

### Response

``` http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 110
ETag: W/"6e-J9Frkr/XeXTwb3V4w8iR3zIQEIU"
Date: Fri, 20 Apr 2018 06:36:30 GMT
Connection: keep-alive
```

**Body**

``` json
{
    "list": [
        {
            "pass_info": "",
            "error_id": 2001,
            "name": "页面标题"
        },
        {
            "pass_info": "",
            "error_id": 2002,
            "name": "关键字"
        },
        {
            "pass_info": "",
            "error_id": 2003,
            "name": "描述"
        },
        {
            "error_id": 2004,
            "name": "编码"
        },
        {
            "pass_info": "页面统计代码已添加,URL为：http://pingfore.qq.com/pingd?dm=lol.qq.com&url=/main.shtml&arg=-&rdm=-&rurl=-&rarg=-&ied_rf=--&ied_qq=-&pvid=9046699634&scr=800x600&scl=24-bit&lang=en-us&java=0&cc=undefined&pf=Linux%20x86_64&tz=-8&flash=-&ct=-&vs=3.0.2&custvar=-&ext=3&reserved1=&rand=45492&tt=",
            "error_info": "",
            "error_id": 1001,
            "name": "点击流"
        },
        {
            "error_id": 1002,
            "name": "版号",
            "pass_info": ""
        }
    ],
    "pageStandard": "true",
    "url": "http://lol.qq.com/main.shtml",
    "admin": "openApi",
    "ignore": "none"
}
```
