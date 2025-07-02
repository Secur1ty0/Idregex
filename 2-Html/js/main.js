let currentMode = "ip"; // 当前模式，默认IP

/**
 * 设置当前提取模式（IP或域名），并根据模式显示/隐藏主域名匹配选项
 */
function setMode(mode) {
    currentMode = mode;
    if (mode === "domain") {
        // 仅在域名模式下显示主域名匹配复选框
        document.getElementById("check-root").style.display = mode === "domain" ? "inline" : "none";
    }
}

/**
 * 根据复选框构建 URL/域名/IP 正则
 */
function buildMatchRe() {
    /**
 * 动态构造 URL/IP/域名 的通用匹配正则
 */
    const regexParts = {
        protocol: "(file:///|ftp://|gopher://|glob:///|expect://|https?://|mailto://|mms://|ed2k://|flashget://|thunder://|news://|php://|bzip2://|data://|Zlib://|ssh2://|zip://)",
        ip: "(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)",
        domain: "([a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+)",
        localhost: "(localhost)",
        port: "(:[0-9]{1,5})",
        path: "(/[^\\s]*)?",
    };
    const withProtocol = document.getElementById("check-proto").checked;
    const withPort = document.getElementById("check-port").checked;
    const withPath = document.getElementById("check-path").checked;
    const withMainDomain = document.getElementById("check-rootdomain").checked;

    if (withMainDomain) return [regexParts.domain, 0];

    const prefix = withProtocol ? `(${regexParts.protocol})?` : "";
    const suffixPort = withPort ? `(${regexParts.port})?` : "";
    const suffixPath = withPath ? `(${regexParts.path})?` : "";

    const fullRegex = `(${prefix}(${regexParts.ip}|${regexParts.domain}|${regexParts.localhost})${suffixPort}${suffixPath})`;
    // 全选项组合的正则表达式
    if (withProtocol && withPort && withPath) return [fullRegex, 1];
    // 选择协议和端口，但不选择路径
    if (withProtocol && withPort) return [fullRegex, 2];
    // 选择端口和路径，但不选择协议
    if (!withProtocol && withPort && withPath) return [fullRegex, 3];
    // 只选择路径
    if (!withProtocol && withPath) return [fullRegex, 7];
    // 只选择端口
    if (!withProtocol && withPort) return [fullRegex, 4];
    // 只选择协议
    if (withProtocol) return [fullRegex, 5];
    // 全不选，默认
    if (!withProtocol && !withPort && !withPath) return [fullRegex, 6];

    alert("错误的组合，请勾选端口匹配！");
    return ["", -1];
}


/**
 * 域名/URL 提取函数，支持协议/端口/路径选项，并处理主域名
 */
function matchResult() {
    const rawText = $("#text1").val();
    const [regexStr, flag] = buildMatchRe();
    const regex = new RegExp(regexStr, "ig");
    // console.log("regexStr:", regexStr, flag);
    let matches = [];
    let match;

    const withUnique = document.getElementById("check-uniq").checked;
    const withAddHttps = document.getElementById("check-http").checked;

    const regIsIP = /\d{1,3}(\.\d{1,3}){3}/;
    const regEndsWithDash = /-$/;
    // const regEndsWithFile = /\.(xml|xhtml|html?|asp(x)?|jsp|php|jsf)$/i;
    const regEndsWithFile = /\.(json|js|css|jpg|jpeg|png|gif|bmp|ico|svg|ttf|woff|woff2|eot|mp3|mp4|avi|flv|swf|doc|docx|xls|xlsx|ppt|pptx|pdf|txt|md|xml|xhtml|htm(l)?|asp(x)?|jsp(x)?|php|jsf)$/i;
    // const regPath = /\/\S+/;

    // 黑名单：常见静态资源和数据文件后缀
    // 域名/URL 提取主逻辑
    // 遍历所有正则匹配结果
    // flag 不同代表不同的匹配模式（如主域名、带协议、带端口、带路径等）
    // 这里只对没有路径匹配的情况做黑名单过滤，避免误伤路径中的文件名
    while ((match = regex.exec(rawText)) !== null) {
        let result = match[0];

        // flag === 0 时，表示只提取主域名（不带协议、端口、路径等），此时需要严格过滤脏数据
        if (flag === 0) {
            // 跳过纯IP、以“-”结尾、常见网页后缀的内容
            if (regIsIP.test(result)) continue;
            if (regEndsWithDash.test(result)) continue;
            // 跳过黑名单后缀（仅在无路径时生效，防止如 example.com.json 被误收录为域名）
            if (regEndsWithFile.test(result)) continue;

            // 提取主域名逻辑
            // 1. 去掉协议头
            const hostname = result.replace(/^https?:\/\//, "");
            // 2. 按点分割
            const parts = hostname.split(".");
            if (parts.length < 2) continue;

            // 3. 处理特殊后缀（如 com.cn、org.cn 等），主域名需取后三段，否则取后两段
            const suffix2 = "." + parts.slice(-2).join(".");
            const suffix3 = "." + parts.slice(-3).join(".");
            // 4. 特殊后缀处理：如果是 com.cn、org.cn 等，取后三段，否则取后两段
            const specialSuffixRe = /.*\.(com|org|net|gov|edu|idv|club|game|tech|info|xyz|me|biz|ac|co|mil|公司|网络|政务)\.(tw|cn|hk|mo|au|pe|za|bw|jp|uk|us|com)$/i;

            // matches.push("." + specialSuffixRe.test(suffix3) ? suffix3 : suffix2);
            if (specialSuffixRe.test(suffix3)) {
                matches.push(suffix3.split(".").slice(-3).join("."));
            } else {
                matches.push(suffix2.split(".").slice(-2).join("."));
            }

            // 说明：这里不是用一连串if判断，是因为主域名提取需要综合判断后缀类型，不能简单分支处理
        } else {
            // console.log("result:", result);
            // 其它flag模式（如带协议、端口、路径等），只在无路径时做黑名单过滤
            // 如果没有路径匹配（即withPath未勾选），才过滤黑名单
            if (![1, 3, 7].includes(flag) && regEndsWithFile.test(result)) {
                continue;
            }
            // 针对flag 4/5/6，继续过滤“-”结尾和常见网页后缀
            else if ([4, 5, 6].includes(flag) && (regEndsWithDash.test(result) || regEndsWithFile.test(result))) {
                continue;
            } else {
                matches.push(result);
                // console.log("matches:", matches);
            }
        }
    }

    let output = matches;
    if (withUnique) output = unique(output);
    if (withAddHttps) output = withUnique ? uniquehttps(output) : nonuniquehttps(output);
    // console.log("输出结果:", output);
    // 输出结果到 text3
    $("#text3").val(output.join("\n"));
}


/**
 * 根据文本框中的数据生成语法表达式，用于显示在 text6 和 text7 中。
 */
function create_grammar() {
    const text3Value = document.getElementById("text3").value;
    const text4Value = document.getElementById("text4").value;
    const text5Value = document.getElementById("text5").value;

    let result = "", result1 = "", res4 = "", res41 = "", res5 = "", res51 = "";

    // 处理 text3：域名提取结果
    if (text3Value && text3Value !== "域名提取结果") {
        const lines = unique(text3Value.split("\n"));
        const regIsIP = /^\d{1,3}(\.\d{1,3}){3}$/; // 匹配纯IP
        for (const line of lines) {
            if (!line || regIsIP.test(line.trim())) continue; // 跳过空行和IP
            result += `domain = "${line}" || cert = "${line}" || `;
            result1 += `domain.suffix = "${line}" || cert.subject = "${line}" || `;
        }
        result = result.slice(0, -4);   // 去除最后的 " || "
        result1 = result1.slice(0, -4);
    }

    // 处理 text4：ICP 名称
    if (text4Value && text4Value !== "icp提取结果") {
        const lines4 = unique(text4Value.split("\n"));
        for (const line of lines4) {
            if (!line || line.trim() === "") continue; // 跳过空行
            res4 += `cert = "${line}" || `;
            res41 += `icp.name = "${line}" || cert.subject = "${line}" || `;
        }
        res4 = res4.slice(0, -4);
        res41 = res41.slice(0, -4);
    }

    // 处理 text5：ICP 编号
    if (text5Value && text5Value !== "备案号输入") {
        const lines5 = unique(text5Value.split("\n"));
        for (const line of lines5) {
            if (!line || line.trim() === "") continue; // 跳过空行
            res5 += `icp = "${line}" || `;
            res51 += `icp.number = "${line}" || `;
        }
        res5 = res5.slice(0, -4);
        res51 = res51.slice(0, -4);
    }

    // 只拼接有内容的部分，避免出现 "||" 空值
    const arr6 = [];
    const arr7 = [];
    if (result) arr6.push(result);
    if (res4) arr6.push(res4);
    if (res5) arr6.push(res5);
    if (result1) arr7.push(result1);
    if (res41) arr7.push(res41);
    if (res51) arr7.push(res51);

    // 新增逻辑：强制显示语法区
    const syntaxArea = document.getElementById("syntax-area");
    syntaxArea.style.display = "flex"; // 确保语法区显示

    // 新增逻辑：空数据提示
    if (arr6.length === 0 && arr7.length === 0) {
        alert("生成失败：无有效数据用于生成语法表达式");
        document.getElementById("text6").value = "";
        document.getElementById("text7").value = "";
    } else {
        document.getElementById("text6").value = arr6.join(" || ");
        document.getElementById("text7").value = formatText7(arr7.join(" || "));
    }
}

function formatText7(text7) {
    // 拆分条件，去除空项和首尾空格，并去重
    let parts = text7
        .split('||')
        .map(s => s.trim())
        .filter(Boolean);

    // 去重
    let uniqueParts = Array.from(new Set(parts));

    let result = [];
    for (let i = 0; i < uniqueParts.length; i += 6) {
        result.push(uniqueParts.slice(i, i + 6).join(' || '));
    }
    return result.join('\n');
}

/**
 * 数组去重
 */
function unique(arr) {
    return [...new Set(arr)];
}

async function copyText(id, btn) {
    const textarea = document.getElementById(id);
    const text = textarea.value;

    try {
        // 优先使用现代 Clipboard API
        await navigator.clipboard.writeText(text);
    } catch (err) {
        // 回退到 execCommand (兼容旧浏览器)
        textarea.select();
        const success = document.execCommand('copy');
        if (!success) {
            console.error('Copy failed:', err);
            return;
        }
    }

    // 复制成功后的视觉反馈
    btn.classList.remove("copy-icon");
    btn.classList.add("copied-icon");

    setTimeout(() => {
        btn.classList.remove("copied-icon");
        btn.classList.add("copy-icon");
    }, 2000);
}

function toggleSyntaxArea() {
    const area = document.getElementById("syntax-area");
    // 兼容旧浏览器的显示隐藏逻辑
    area.style.display = area.style.display === "none" ? "flex" : "none";
}

/**
 * 清空所有文本框内容并重置复选框状态
 */
function clearAll() {
    // 清空所有 textarea 内容
    const textAreas = ['text1', 'text2', 'text3', 'text4', 'text5', 'text6', 'text7'];
    textAreas.forEach(id => {
        document.getElementById(id).value = '';
    });

    // 重置所有复选框为未选中状态
    const checkboxes = [
        'check-proto',
        'check-port',
        'check-path',
        'check-http',
        'check-uniq',
        'check-rootdomain' // 主域名匹配复选框（可能隐藏但仍需重置）
    ];
    checkboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) checkbox.checked = false;
    });
}


/**
 * 对域名数组统一添加 https/http 前缀（并去重）
 */
function uniquehttps(arr) {
    const result = new Set();
    for (const item of arr) {
        if (item.startsWith("http://") || item.startsWith("https://")) {
            result.add(item);
        } else {
            result.add(`https://${item}`);
            result.add(`http://${item}`);
        }
    }
    return [...result];
}

/**
 * 对域名数组统一添加 https/http 前缀（不去重）
 */
function nonuniquehttps(arr) {
    const result = [];
    for (const item of arr) {
        if (item.startsWith("http://") || item.startsWith("https://")) {
            result.push(item);
        } else {
            result.push(`https://${item}`);
            result.push(`http://${item}`);
        }
    }
    return result;
}

/**
 * 生成匹配 IP 的正则表达式字符串及对应匹配模式编号
 */
function buildMatchipRe() {
    const withProtocol = document.getElementById("check-proto").checked;
    const withPort = document.getElementById("check-port").checked;
    const withPath = document.getElementById("check-path").checked;

    // IP 正则主体
    const ipPattern = "((?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))";
    const portPattern = "(:[0-9]{1,5})?";
    const pathPattern = "(\\/\\S+)?";

    const protocolPattern = "((file:\\/\\/\\/|ftp:\\/\\/|gopher:\\/\\/|glob:\\/\\/|expect:\\/\\/|https?:\\/\\/|mailto:\\/\\/|mms:\\/\\/|ed2k:\\/\\/|flashget:\\/\\/|thunder:\\/\\/|news:\\/\\/|php:\\/\\/|bzip2:\\/\\/|data:\\/\\/|Zlib:\\/\\/|ssh2:\\/\\/|zip:\\/\\/))?";

    if (withPort) {
        if (withProtocol && withPath)
            return [`${protocolPattern}${ipPattern}${portPattern}${pathPattern}`, 1];
        if (withProtocol && !withPath)
            return [`${protocolPattern}${ipPattern}${portPattern}`, 2];
        if (!withProtocol && withPath)
            return [`${ipPattern}${portPattern}${pathPattern}`, 3];
        if (!withProtocol && !withPath)
            return [`${ipPattern}${portPattern}`, 4];
    } else {
        if (withProtocol && !withPath)
            return [`${protocolPattern}${ipPattern}`, 5];
        if (!withProtocol && !withPath)
            return [ipPattern, 6];
        if (!withProtocol && withPath)
            return [`${ipPattern}${portPattern}${pathPattern}`, 7];
        if (withProtocol && withPath)
            alert("错误的组合，请勾选端口匹配！");
    }
    return ["", -1];
}


/**
 * 提取 IP（支持选项控制），填充到 text2 中
 */
function getIP() {
    const rawText = $("#text1").val().split("\n");
    let matches = [];
    const [regexStr, flag] = buildMatchipRe();
    const regex = new RegExp(regexStr, "ig");

    const extractPath = /\/\S+/i;
    const withUnique = document.getElementById("check-uniq").checked;
    const withAddHttps = document.getElementById("check-http").checked;

    // 遍历每一行，支持一行多 IP 匹配
    for (const line of rawText) {
        let match;
        while ((match = regex.exec(line)) !== null) {
            matches.push(match[0]);
        }
    }

    // 若仅提取 path
    if (flag === 7) {
        matches = matches.map(m => {
            const pathMatch = extractPath.exec(m);
            return pathMatch ? pathMatch[0] : null;
        }).filter(Boolean);
    }

    // 处理最终输出逻辑
    let output = matches;
    if (withUnique && withAddHttps) {
        output = unique(uniquehttps(matches));
    } else if (withUnique) {
        output = unique(matches);
    } else if (withAddHttps) {
        output = nonuniquehttps(matches);
    }

    $("#text2").val(output.join("\n"));
}





