# Idregex

Two small tools for extract IP or domain name.

![Follow on Twitter](https://img.shields.io/twitter/follow/Rainmaker_007?label=Follow%20&style=social) ![](https://img.shields.io/github/forks/Secur1ty0/Idregex) ![GitHub stars](https://img.shields.io/github/stars/Secur1ty0/Idregex) ![](https://img.shields.io/github/followers/Secur1ty0) ![GitHub last commit](https://img.shields.io/github/last-commit/Secur1ty0/Idregex) ![](https://img.shields.io/github/v/release/Secur1ty0/Idregex?display_name=tag)


## 1. html+js

![image-20220302104848841](https://gitee.com/JIFENGJIANHAO1/images/raw/master/image-20220302104848841.png)

## 2. Py scripts

Advantage:

- Support Multithreading
- Support directory traversal and reading
- Support large files



### 2.1 Usage

```shell
python extract.py -f D:\\1.txt -a -p -D -t
```

**Attention:** The extraction results are saved in the current directory.

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
