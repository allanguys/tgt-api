# TGTest Apis

## /api/crawler

### Request:

``` http
Header
----
POST /api/crawler HTTP/1.1
Host: api.devfeed.cn
Content-Type: application/json

Body
----
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

### Response

``` http
Headers
----
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 110
ETag: W/"6e-J9Frkr/XeXTwb3V4w8iR3zIQEIU"
Date: Fri, 20 Apr 2018 06:36:30 GMT
Connection: keep-alive

BODY
----
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
``` http
Header
----
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 110
ETag: W/"6e-J9Frkr/XeXTwb3V4w8iR3zIQEIU"
Date: Fri, 20 Apr 2018 06:36:30 GMT
Connection: keep-alive

Body
----
{"msg":"Stop follow redirec from \"http://tps.qq.com/\" to \"http://tps.qq.com/cp/a2080319yind/index.html\"."}
```

### /api/fetch

```
HTTP/1.1 POST
Content-Type:application/json

{"url":"http://somedomain/somepath/somefile.ext", "loadImages":0, "loadMedias":0}
```

### /api/check

```
HTTP/1.1 POST
Content-Type:application/json

{"url":"http://somedomain/somepath/somefile.ext", "loadImages":0, "loadMedias":0}
```
