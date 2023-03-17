# Idregex

两个IP域名提取小工具，一个网页版，一个Python脚本版。

## 1. html+js

![image-20220302104848841](./img1.png)

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

