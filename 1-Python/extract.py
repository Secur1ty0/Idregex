#!/usr/bin/env python
# -*- coding:UTF-8 -*-
# 2021/03/18 周四 17:05:48.52
# By  Hasaki-h1


import os
import sys
import threading
import re
import getopt
import pandas as pd

banner = r"""  ______      _                  _   _               _____         _____        
 |  ____|    | |                | | (_)             |_   _|       |  __ \       
 | |__  __  _| |_ _ __ __ _  ___| |_ _  ___  _ __     | |  _ __   | |  | |_ __  
 |  __| \ \/ / __| '__/ _` |/ __| __| |/ _ \| '_ \    | | | '_ \  | |  | | '_ \ 
 | |____ >  <| |_| | | (_| | (__| |_| | (_) | | | |  _| |_| |_) | | |__| | | | |
 |______/_/\_\\__|_|  \__,_|\___|\__|_|\___/|_| |_| |_____| .__/  |_____/|_| |_|
                                                          | |                   
                                                          |_|                   """

help = """
☀☀☀ IP域名提取工具 [Version is 1.0] ☀☀☀

Usage:python extract.py -f D:\\\\1.txt -a -p -D -t

Attention:
The extraction results are saved in the current directory.

    -f, --file            only set one file to be extracted
    -d, --directory       set a directory to be extracted
    -D, --delete          Delete Duplicates 
    -i,--only-ip          only extract IP
    -n,--only-domain      only extract domain name
    -a,--all              extract all, include extract IP and extract domain name
    -t,--protocol type    matching protocol type, eg:http://127.0.0.1 
    -p,--port             matching port,eg:127.0.0.1:1001
    -h, --help            display this help and exit

    """


class MyThread (threading.Thread):
    def __init__(self, func, args):
        super (MyThread, self).__init__ ()
        self.func = func
        self.args = args

    def run(self):
        self.result = self.func (*self.args)

    def get_result(self):
        try:
            return self.result
        except Exception:
            return None


class IpDomainNameExtrations:
    """IP域名提取"""
    # 生成线程锁
    threadLock = threading.Lock ()

    def getFileSize(self, filename):
        """获取文件大小判断是否进行分割"""
        files_list = []  # 要读取的文件列表
        if os.path.exists (filename):
            file_size = os.path.getsize (filename)
            file_path, file_name = os.path.split (filename)
            filename0, file_suffix = os.path.splitext (file_name)

            # 已经生成的目录
            file_path_e = file_path + "\\" + "data---split"

            # 已经生成的首个分割文件，用于判断是否继续分割
            file_e = file_path_e + "\\" + filename0 + "-split-0" + ".txt"
            if file_size >= 100000000:
                # 存在分割后的目录
                if os.path.exists (file_e):
                    print ("文件名: {} 文件大小：{}  ------已经存在分割目录---".format (file_name, file_size / 1024 / 1024))
                    # 此时首次遍历获取文件夹下文件名已经读取，不在继续遍历
                    files_list = []

                # 不存在分割后目录继续运行
                else:
                    print ("文件名: {} 文件大小：{}  ---判定为大文件---开始分割---".format (file_name, file_size / 1024 / 1024))
                    files_list = self.splitFile (filename)
                    print ("---------------------------------------- %s --分割完毕-------------------" % file_name)
            else:
                # print ("文件名: {} 文件大小：{}  ---判定为小文件---".format (file_name, file_size / 1024 / 1024))
                files_list.append (filename)
        else:
            print ('文件不存在!')
            sys.exit ()
        return files_list

    @staticmethod
    def splitFile(filename):
        """分割大文件，耗时比较慢，100M12秒"""
        n = 0  # n代表文件分割数
        LINE_NUM = 2000000  # 文件分割的行数设置

        # 文件生成列表
        filename_split_list = []

        # os.path.dirname (filename)
        # 获取文件路径以及file_name
        file_path1, file_name = os.path.split (filename)
        # 获取提取文件路径
        os.chdir (file_path1)

        # 获取文件后缀
        filename0, file_suffix = os.path.splitext (file_name)

        # 创建大文件分割目录data
        if os.path.exists ("data---split"):
            pass
        else:
            os.mkdir ("data---split")
        # 打开分割的大文件
        with open (file_name, "r", encoding="utf-8") as f0:
            buf = f0.readlines ()
            all_line_num = len (buf)
            counter = all_line_num // LINE_NUM
            print ("------------------------------------------分割总数： %s-------------------" % counter)
            tail_counter = all_line_num % LINE_NUM
            # print ("tail_counter-> ", tail_counter)
            # 行数不够直接跳出，前去匹配
            if all_line_num <= LINE_NUM:
                print ("行数不够", all_line_num)
            else:
                while n < counter + 2:
                    # 在data目录下构造需要分割的大文件的每一个小文件文件名，eg：abc.txt -> abc-split-1.txt
                    filename_write_path = file_path1 + "\\data---split\\" + filename0 + "-split-%s" % n + ".txt"
                    # 分割后的小文件名
                    # filename_split = filename0 + "-split-%s" % n + file_suffix
                    # 分割后小文件存储列表
                    filename_split_list.append (filename_write_path)
                    # 最后不满2000000行的直接从末尾计算
                    if n == counter + 1:
                        with open (filename_write_path, "w") as f1:
                            for b in buf[-tail_counter:]:
                                f1.write (b)
                    else:
                        with open (filename_write_path, "w") as f2:
                            for b1 in buf[(n * LINE_NUM):((n + 1) * LINE_NUM)]:
                                f2.write (b1)
                    n = n + 1
                return filename_split_list

    def one_file(self, filename):
        """单独一个文件"""
        # print (filename)
        if os.path.isfile (filename):
            files_list = self.getFileSize (filename)
            return files_list
        else:
            print ("%s 不是一个有效的文件！！！" % filename)
            sys.exit ()

    def directory(self, directory):
        """单独一个目录"""
        files_list = []
        files_path_list = []

        if os.path.exists (directory):
            if not os.path.isabs (directory):
                directory_n = os.getcwd () + "\\" + directory
        else:
            print ("%s 不是一个有效的目录！！！" % directory)
            sys.exit ()

        # 遍历目录下读取可读文件
        all_files_directory = os.walk (directory_n, topdown=True, followlinks=True)
        for root, dirs, files in all_files_directory:
            # 获取文件路径
            for f_name in files:
                file_path = os.path.join (root, f_name)
                files_path_list.append (file_path)

        # 遍历文件进行大文件检测
        for f_p_l in files_path_list:
            fs = self.one_file (f_p_l)
            files_list = files_list + fs
        return files_list

    def readfile(self, filename, arg_list, patter):
        """分情况读文件"""
        dict_r = {'r1': [], 'r2': [], 'r3': [], 'r4': []}
        rr1 = []
        rr2 = []
        rr3 = []
        rr4 = []
        try:
            # extract_domain_name, extract_ip
            if ('-a' in arg_list) or ('-n' in arg_list and '-i' in arg_list):
                # ISO-8859-1
                f = open (filename, "r", encoding="utf-8", errors="ignore")
                all_read = f.readlines ()
                for fl in all_read:
                    ra, rb, rc = self.extract_ip (fl, patter)
                    rd = self.extract_domain_name (fl, patter)
                    rr1 = rr1 + ra
                    rr2 = rr2 + rb
                    rr3 = rr3 + rc
                    rr4 = rr4 + rd
                f.close ()
                dict_r = {"r1": rr1, "r2": rr2, "r3": rr3, "r4": rr4}
            # extract_ip
            elif '-i' in arg_list and '-n' not in arg_list:
                f = open (filename, "r", encoding="ISO-8859-1", errors="ignore")
                all_read = f.readlines ()
                for fl in all_read:
                    ra, rb, rc = self.extract_ip (fl, patter)
                    rr1 = rr1 + ra
                    rr2 = rr2 + rb
                    rr3 = rr3 + rc
                f.close ()
                dict_r['r1'] = rr1
                dict_r['r2'] = rr2
                dict_r["r3"] = rr3
            # extract_domain_name
            elif '-n' in arg_list and '-i' not in arg_list:
                f = open (filename, "r", encoding="utf-8", errors="ignore")
                all_read = f.readlines ()
                for fl in all_read:
                    rd = self.extract_domain_name (fl, patter)
                    rr4 = rr4 + rd
                f.close ()
                dict_r['r4'] = rr4

        except Exception as e:
            file_path, file_name = os.path.split (filename)
            print ("---------文件名 %s 读取错误--> " % file_name, e)
        finally:
            pass
        return dict_r

    @staticmethod
    def get_regular(args1):
        """正则匹配生成"""
        # 无端口 无协议头
        pa = []
        if '-p' not in args1 and '-t' not in args1:
            pattern = re.compile (
                r"((?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))|(localho"
                r"st)", re.IGNORECASE)
            pattern1 = re.compile (
                r"^(127\.0\.0\.1)|(localhost)|(10\.\d{1,3}\.\d{1,3}\.\d{1,3})|(172\.((1[6-9])|(2\d)|(3[01]))\.\d{1,"
                r"3}\.\d{1,3})|(192\.168\.\d{1,3}\.\d{1,3})$", re.IGNORECASE)
            pattern2 = re.compile (r"[a-zA-Z0-9_][-a-zA-Z0-9_]{0,62}(\.[a-zA-Z0-9_][-a-zA-Z0-9_]{0,62})+\.?", re.IGNORECASE)

        # 无端口 有协议头
        elif '-p' not in args1 and '-t' in args1:
            pattern = re.compile (
                r"(((file\:\/\/\/)|(ftp\:/\/)|(gopher\:\/\/)|(glob\:\/\/)|(expect\:\/\/)|(http(s)?\:\/\/)|(mailt"
                r"o\:\/\/)|(mms\:\/\/)|(ed2k\:\/\/)|(flashget\:\/\/)|(thunder\:\/\/)|(news\:\/\/)|(php\:\/\/)|(bz"
                r"ip2\:\/\/)|(data\:\/\/)|(Zlib\:\/\/)|(ssh2\:\/\/)|(zip\:\/\/))?)(((?:(?:25[0-5]|2[0-4][0-9]|[0"
                r"1]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))|(localhost))", re.IGNORECASE)

            pattern1 = re.compile (
                r"((((file\:\/\/\/)|(ftp\:/\/)|(gopher\:\/\/)|(glob\:\/\/)|(expect\:\/\/)|(http(s)?\:\/\/)|(mail"
                r"to\:\/\/)|(mms\:\/\/)|(ed2k\:\/\/)|(flashget\:\/\/)|(thunder\:\/\/)|(news\:\/\/)|(php\:\/\/)|(b"
                r"zip2\:\/\/)|(data\:\/\/)|(Zlib\:\/\/)|(ssh2\:\/\/)|(zip\:\/\/))?)((127\.0\.0\.1)|(localhost)|(1"
                r"0\.\d{1,3}\.\d{1,3}\.\d{1,3})|(172\.((1[6-9])|(2\d)|(3[01]))\.\d{1,3}\.\d{1,3})|(192\.168\.\d{1,"
                r"3}\.\d{1,3})))", re.IGNORECASE)

            pattern2 = re.compile (
                r"((((file\:\/\/\/)|(ftp\:/\/)|(gopher\:\/\/)|(glob\:\/\/)|(expect\:\/\/)|(http(s)"
                r"?\:\/\/)|(mailto\:\/\/)|(mms\:\/\/)|(ed2k\:\/\/)|(flashget\:\/\/)|(thunder\:\/\/)"
                r"|(news\:\/\/)|(php\:\/\/)|(bzip2\:\/\/)|(data\:\/\/)|(Zlib\:\/\/)|(ssh2\:\/\/)|(zi"
                r"p\:\/\/))?)([a-zA-Z0-9_][-a-zA-Z0-9_]{0,62}(\.[a-zA-Z0-9_][-a-zA-Z0-9_]{0,62})+\.?))", re.IGNORECASE)

        # 有端口 无协议头
        elif '-p' in args1 and '-t' not in args1:
            pattern = re.compile (
                r"(((?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}((?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)("
                r":[0-9]{1,5})?))|((localhost)(:[0-9]{1,5})?))", re.IGNORECASE)
            pattern1 = re.compile (
                r"((127\.0\.0\.1)(:[0-9]{1,5})?)|((localhost)(:[0-9]{1,5})?)|((10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:["
                r"0-9]{1,5})?)|((172\.((1[6-9])|(2\d)|(3[01]))\.\d{1,3}\.\d{1,3})(:[0-9]{1,5})?)|((192\.168\.\d{1,"
                r"3}\.\d{1,3})(:[0-9]{1,5})?)", re.IGNORECASE)
            pattern2 = re.compile (
                r"(([a-zA-Z0-9_][-a-zA-Z0-9_]{0,62}((\.[a-zA-Z0-9_][-a-zA-Z0-9_]{0,62})(:[0-9]{1,5})?)+\.?))",
                re.IGNORECASE)

        # 有端口 有协议头
        elif '-p' in args1 and '-t' in args1:
            pattern = re.compile (
                r"((((file\:\/\/\/)|(ftp\:/\/)|(gopher\:\/\/)|(glob\:\/\/)|(expect\:\/\/)|(http(s)?\:\/\/)|(mailt"
                r"o\:\/\/)|(mms\:\/\/)|(ed2k\:\/\/)|(flashget\:\/\/)|(thunder\:\/\/)|(news\:\/\/)|(php\:\/\/)|(bzi"
                r"p2\:\/\/)|(data\:\/\/)|(Zlib\:\/\/)|(ssh2\:\/\/)|(zip\:\/\/))?)((?:(?:25[0-5]|2[0-4][0-9]|[01]?["
                r"0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(:[0-9]{1,5})?))|((((file\:\/\/\/)|(ft"
                r"p\:/\/)|(gopher\:\/\/)|(glob\:\/\/)|(expect\:\/\/)|(http(s)?\:\/\/)|(mailto\:\/\/)|(mms\:\/\/)|("
                r"ed2k\:\/\/)|(flashget\:\/\/)|(thunder\:\/\/)|(news\:\/\/)|(php\:\/\/)|(bzip2\:\/\/)|(data\:\/\/)|(Z"
                r"lib\:\/\/)|(ssh2\:\/\/)|(zip\:\/\/))?)(localhost)(:[0-9]{1,5})?)", re.IGNORECASE)
            pattern1 = re.compile (
                r"(((file\:\/\/\/)|(ftp\:/\/)|(gopher\:\/\/)|(glob\:\/\/)|(expect\:\/\/)|(http(s)?\:\/\/)|(mailt"
                r"o\:\/\/)|(mms\:\/\/)|(ed2k\:\/\/)|(flashget\:\/\/)|(thunder\:\/\/)|(news\:\/\/)|(php\:\/\/)|(bzi"
                r"p2\:\/\/)|(data\:\/\/)|(Zlib\:\/\/)|(ssh2\:\/\/)|(zip\:\/\/))?)(((127\.0\.0\.1)(:[0-9]{1,5})?)|((l"
                r"ocalhost)(:[0-9]{1,5})?)|((10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:[0-9]{1,5})?)|((172\.((1[6-9])|(2\d)|(3[0"
                r"1]))\.\d{1,3}\.\d{1,3})(:[0-9]{1,5})?)|((192\.168\.\d{1,3}\.\d{1,3})(:[0-9]{1,5})?))", re.IGNORECASE)
            pattern2 = re.compile (
                r"(((file\:\/\/\/)|(ftp\:/\/)|(gopher\:\/\/)|(glob\:\/\/)|(expect\:\/\/)|(http(s)?\:\/\/)|(mailt"
                r"o\:\/\/)|(mms\:\/\/)|(ed2k\:\/\/)|(flashget\:\/\/)|(thunder\:\/\/)|(news\:\/\/)|(php\:\/\/)|(bz"
                r"ip2\:\/\/)|(data\:\/\/)|(Zlib\:\/\/)|(ssh2\:\/\/)|(zip\:\/\/))?)(([a-zA-Z0-9_][-a-zA-Z0-9_]{0,62"
                r"}((\.[a-zA-Z0-9_][-a-zA-Z0-9_]{0,62})(:[0-9]{1,5})?)+\.?))", re.IGNORECASE)

        pa.append (pattern)
        pa.append (pattern1)
        pa.append (pattern2)

        return pa

    @staticmethod
    def extract_ip(file_line, pat):
        """提取ip"""
        list1 = []  # 存储外网IP
        list2 = []  # 存储内网IP
        list3 = []  # 存储所有IP
        pattern2, pattern1 = pat[0], pat[1]
        # 全部IP匹配结果
        all_ip_list = pattern2.finditer (file_line)
        for a_i_l in all_ip_list:
            list3.append (a_i_l.group ())

        # 子网IP匹配结果
        all_lan_ip_list = pattern1.finditer (file_line)
        for a_l_i_l in all_lan_ip_list:
            list2.append (a_l_i_l.group ())

        # 外网IP匹配结果
        for a_i in list3:
            if a_i in list2:
                pass
            else:
                list1.append (a_i)
        return list1, list2, list3

    @staticmethod
    def extract_domain_name(file_line, patter):
        """域名提取"""
        list4 = []  # 存储域名结果
        pattern3 = patter[2]
        all_domain_name = pattern3.finditer (file_line)
        for a_d_n in all_domain_name:
            if a_d_n == '1.1':
                pass
            else:
                list4.append (a_d_n.group ())
        # 删除不必要的后缀造成的脏数据
        for l4 in list4:
            suffix1 = l4.split(".")[-1]
            if suffix1 in ["html","do","action","php","jsp","asp","aspx","jspx","bak","xml","json","csv","htm","0"]:
                list4.remove(l4)
        #print("---",list4)
        return list4

    def case(self):
        """不同的情况匹配"""
        path = ""  # 输入的路径
        filename = ""  # 输入的文件路径+文件名
        files_list = []  # 文件路径+文件名列表
        error = []  # 参数列表
        opts, args1 = getopt.getopt (sys.argv[1:], '-f:-d:-D-i-n-a-t-p-h', ['file=', 'directory=', 'Delete', 'ip',
                                                                            'domain', 'all', 'type', 'port', 'help'])

        # 参数列表合法性检查
        if opts:
            for opt_name, opt_value in opts:
                error.append (opt_name)
                # 有-h 输出help
                if opt_name in ('-h', '--help'):
                    print (help)
                    sys.exit ()
                    # 文件类型提取
                if opt_name in ('-f', '--file'):
                    # 文件存在判断
                    if os.path.isfile (opt_value):
                        filename = opt_value
                    else:
                        print ("%s 不是一个有效的文件！！！" % opt_value)
                        sys.exit ()
                # 目录类型提取
                if opt_name in ('-d', '--directory'):
                    # 目录存在判断
                    if os.path.exists (opt_value):
                        path = opt_value
                    else:
                        print ("%s 不是一个有效的目录！！！" % opt_value)
                        sys.exit ()
        # 无参数输出help
        else:
            print (help)
            sys.exit()

        # 避免文件和目录同时输入
        if ('-f' in error or '--file' in error) and ('-d' in error or '--directory' in error):
            print ("文件和目录只能选取一项，-f 或者 -d ")
            sys.exit ()
        # 避免文件或目录参数未设置
        if ('-f' not in error and '--file' not in error) and ('-d' not in error and '--directory' not in error):
            print ("文件夹或目录未设置，请使用参数 -d 设置提取的目录，或者使用 -f 设置提取的文件 ！！！")
            sys.exit ()
        # 避免提取类型未设置
        if ('-n' not in error and '--domain' not in error) and ('-a' not in error and '--all' not in error) and ('-i' not in error and '--ip' not in error):
            print ("提取类型未设置，请选择 -i (ip提取)      或 -n (域名提取)       或 -a (提取IP和域名)")
            sys.exit ()
        # 划分提取类型
        if '-d' in error or '--directory' in error:
            files_list = self.directory (path)
        if '-f' in error or '--file' in error:
            files_list = self.one_file (filename)

        # 获取不同类型的正则特征
        p = self.get_regular (error)

        # 返回读取文件列表和参数列表
        return files_list, error, p

    def smaller10(self, files_list_all, args, pattern0):
        """遍历文件列表,报告小于20个文件时的匹配情况"""
        dict_rea = {'r1': [], 'r2': [], 'r3': [], 'r4': []}
        for f_l_l in files_list_all:
            dict_re = self.readfile (f_l_l, args, pattern0)
            file_path, file_name = os.path.split (f_l_l)
            # print ("---------文件名", file_name)
            for k0, v0 in dict_re.items ():
                if k0 in dict_rea.keys ():
                    dict_rea[k0] += v0
                else:
                    pass
        return dict_re

    @staticmethod
    def report(dict_re, args):
        if '-D' in args or '--delete' in args:
            if 'r1' in dict_re and dict_re['r1'] is not None:
                dict_re['r1'] = list (set (dict_re['r1']))
                print ("外网IP", dict_re['r1'])
            else:
                print ("外网IP 参数未设置")
            if 'r2' in dict_re and dict_re['r2'] is not None:
                dict_re['r2'] = list (set (dict_re['r2']))
                print ("内网IP", dict_re['r2'])
            else:
                print ("内网IP 参数未设置")
            if 'r3' in dict_re and dict_re['r3'] is not None:
                dict_re['r3'] = list (set (dict_re['r3']))
                print ("所有IP", dict_re['r3'])
            else:
                print ("所有IP 参数未设置")
            if 'r4' in dict_re and dict_re['r4'] is not None:
                dict_re['r4'] = list (set (dict_re['r4']))
                print ("域名：", dict_re['r4'])
            else:
                print ("域名： 参数未设置")
        else:
            if 'r1' in dict_re and dict_re['r1'] is not None:
                print ("外网IP", dict_re['r1'])
            else:
                print ("外网IP 参数未设置")
            if 'r2' in dict_re and dict_re['r2'] is not None:
                print ("内网IP", dict_re['r2'])
            else:
                print ("内网IP 参数未设置")
            if 'r3' in dict_re and dict_re['r3'] is not None:
                print ("所有IP", dict_re['r3'])
            else:
                print ("所有IP 参数未设置")
            if 'r4' in dict_re and dict_re['r4'] is not None:
                print ("域名：", dict_re['r4'])
            else:
                print ("域名： 参数未设置")
        return dict_re


    @staticmethod
    def write_csv(dict_result):
        """保存结果为CSV格式文件"""
        # 获取值
        r1 = dict_result['r1']
        r2 = dict_result['r2']
        r3 = dict_result['r3']
        r4 = dict_result['r4']

        # 添加列长度，保持一致
        max_length = max (len (r1), len (r2), len (r3), len (r4))
        add_r1 = max_length - len (r1)
        add_r2 = max_length - len (r2)
        add_r3 = max_length - len (r3)
        add_r4 = max_length - len (r4)
        r1.extend (add_r1 * [''])
        r2.extend (add_r2 * [''])
        r3.extend (add_r3 * [''])
        r4.extend (add_r4 * [''])

        dataframe = pd.DataFrame ({'外网IP': r1, '内网IP': r2, '所有IP': r3, '域名': r4})
        dataframe.to_csv ("result.csv", sep=',', encoding="utf_8_sig", index=False)

    def read_file_list(self, dict_res, args, pattern0):
        """多线程读取文件"""
        self.threadLock.acquire ()  # 同步锁
        dict_rea = {'r1': [], 'r2': [], 'r3': [], 'r4': []}
        for f_l_l in dict_res:
            dict_re = self.readfile (f_l_l, args, pattern0)
            for k, v in dict_re.items ():
                if k in dict_rea.keys ():
                    dict_rea[k] += v
                else:
                    pass
        self.threadLock.release ()
        return dict_rea


def main():
    # 初始化测试实例
    test = IpDomainNameExtrations ()
    files_list_all, args, pattern0 = test.case ()
    # print(files_list_all, args, pattern0)
    print ("读取文件总数： ", len (files_list_all), "-----------------使用参数列表： %s-------------\n" % args)

    if len (files_list_all) > 10:
        # list_num分割后单个列表长度
        list_num = len (files_list_all) // 10
        # 线程池
        threads = []
        # 列表存储结果
        result = {'r1': [], 'r2': [], 'r3': [], 'r4': []}
        # 按照10个线程拆分读取的文件列表
        for i in range (10):
            list_f = files_list_all[i * (list_num + 1):(i + 1) * (list_num + 1)]
            if len (list_f) != 0:
                thread1 = MyThread (func=test.read_file_list, args=(files_list_all, args, pattern0))
                thread1.start ()
                threads.append (thread1)
        # 阻塞主线程，获取每个线程执行结果
        for j in threads:
            j.join ()
            ree = j.get_result ()
            # print (ree)
            # 判断key键是否存在
            for k, v in ree.items ():
                if k in result.keys ():
                    result[k] = ree[k] + result[k]
                else:
                    pass
        final = test.report (result, args)
        test.write_csv (final)
    else:
        ree = test.smaller10 (files_list_all, args, pattern0)
        final = test.report (ree, args)
        test.write_csv (final)


if __name__ == '__main__':
    print (banner)
    try:
        main ()
    except getopt.GetoptError as e:
        print("参数设置错误! 详见 ip_domain.py -h")
    #print ("耗时------>>> ", time.process_time ())
