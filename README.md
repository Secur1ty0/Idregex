# Idregex

两个IP域名提取小工具，一个网页版，一个Python脚本版。

## 1. html+js

![image-20220302104848841](./img1.png)

**更新日志** 2023-03-22

- 增加路径以及参数的匹配
- 新增17种协议头识别：`(file,ftp,gopher,glob,expect,mailto,mms,ed2k,flashget,thunder,news,php,bzip2,data,Zlib,ssh2,zip)`。
- 新增主域名匹配可识别国内常见主域名，可识别常见27个二级域名。
- 优化JS判断流程

**Todo**

- Ajax 请求解析域名对应站点百度权重、工商信息

- IP提取增加：匹配协议头、端口、路径以及参数

  

## 2. Py scripts

特点:

- 支持多线程
- 支持目录遍历和读取
- 支持大文件

### 2.1 用法

```shell
python extract.py -f D:\\1.txt -a -p -D -t
```

**注意：**提取的结果是保存在当前目录中，result.csv。

```shell
-f, --file            only set one file to be extracted
-d, --directory       set a directory to be extracted
-D, --delete          Delete Duplicates 
-i,--only-ip          only extract IP
-n,--only-domain      only extract domain name
-a,--all              extract all, include extract IP and extract domain name
-t,--protocol type    matching protocol type, eg:http://127.0.0.1 
-p,--port             matching port,eg:127.0.0.1:1001
-h, --help            display this help and exit
```

