let currentMode = "ip";
/**
 * 设置当前提取模式（IP或域名），并根据模式显示/隐藏主域名匹配选项
 */
function setMode(mode) {
    currentMode = mode;
    if (mode === "domain") {
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
    if (withProtocol && withPort && withPath) return [fullRegex, 1];
    if (withProtocol && withPort) return [fullRegex, 2];
    if (!withProtocol && withPort && withPath) return [fullRegex, 3];
    if (!withProtocol && withPath) return [fullRegex, 7];
    if (!withProtocol && withPort) return [fullRegex, 4];
    if (withProtocol) return [fullRegex, 5];
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
    let matches = [];
    let match;
    const withUnique = document.getElementById("check-uniq").checked;
    const withAddHttps = document.getElementById("check-http").checked;
    const regIsIP = /\d{1,3}(\.\d{1,3}){3}/;
    const regEndsWithDash = /-$/;
    const regEndsWithFile = /\.(xml|xhtml|html?|asp(x)?|jsp|php|jsf)$/i;
    const regPath = /\/\S+/;
    const fileExtBlacklist = /\.(json|js|css|png|jpg|jpeg|gif|svg|ico|bmp|webp|mp4|avi|mov|wmv|flv|mp3|wav|ogg|zip|rar|7z|tar|gz|pdf|docx?|xlsx?|pptx?|txt|csv|xml)$/i;
    while ((match = regex.exec(rawText)) !== null) {
        let result = match[0];
        if (flag === 0) {
            if (regIsIP.test(result)) continue;
            if (regEndsWithDash.test(result)) continue;
            if (regEndsWithFile.test(result)) continue;
            if (fileExtBlacklist.test(result)) continue;
            const hostname = result.replace(/^https?:\/\//, "");
            const parts = hostname.split(".");
            if (parts.length < 2) continue;
            const suffix2 = "." + parts.slice(-2).join(".");
            const suffix3 = "." + parts.slice(-3).join(".");
            const specialSuffixRe = /.*\.(com|org|net|gov|edu|idv|club|game|tech|info|xyz|me|biz|ac|co|mil|公司|网络|政务)\.(tw|cn|hk|mo|au|pe|za|bw|jp|uk|us|com)$/i;
            if (specialSuffixRe.test(suffix3)) {
                matches.push(suffix3.split(".").slice(-3).join("."));
            } else {
                matches.push(suffix2.split(".").slice(-2).join("."));
            }
        } else {
            if (![3, 7].includes(flag) && fileExtBlacklist.test(result)) continue;
            if ([4, 5, 6].includes(flag) && (regEndsWithDash.test(result) || regEndsWithFile.test(result))) continue;
            if (flag === 7) {
                const pathMatch = regPath.exec(result);
                if (pathMatch) matches.push(pathMatch[0]);
            } else {
                matches.push(result);
            }
        }
    }
    let output = matches;
    if (withUnique) output = unique(output);
    if (withAddHttps) output = withUnique ? uniquehttps(output) : nonuniquehttps(output);
    console.log("输出结果:", output);
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
    if (text3Value && text3Value !== "域名提取结果") {
        const lines = unique(text3Value.split("\n"));
        const regIsIP = /^\d{1,3}(\.\d{1,3}){3}$/;
        for (const line of lines) {
            if (!line || regIsIP.test(line.trim())) continue;
            result += `domain = "${line}" || cert = "${line}" || `;
            result1 += `domain.suffix = "${line}" || cert.subject = "${line}" || `;
        }
        result = result.slice(0, -4);
        result1 = result1.slice(0, -4);
    }
    if (text4Value && text4Value !== "icp提取结果") {
        const lines4 = unique(text4Value.split("\n"));
        for (const line of lines4) {
            if (!line || line.trim() === "") continue;
            res4 += `cert = "${line}" || `;
            res41 += `icp.name = "${line}" || cert.subject = "${line}" || `;
        }
        res4 = res4.slice(0, -4);
        res41 = res41.slice(0, -4);
    }
    if (text5Value && text5Value !== "备案号输入") {
        const lines5 = unique(text5Value.split("\n"));
        for (const line of lines5) {
            if (!line || line.trim() === "") continue;
            res5 += `icp = "${line}" || `;
            res51 += `icp.number = "${line}" || `;
        }
        res5 = res5.slice(0, -4);
        res51 = res51.slice(0, -4);
    }
    const arr6 = [];
    const arr7 = [];
    if (result) arr6.push(result);
    if (res4) arr6.push(res4);
    if (res5) arr6.push(res5);
    if (result1) arr7.push(result1);
    if (res41) arr7.push(res41);
    if (res51) arr7.push(res51);
    const syntaxArea = document.getElementById("syntax-area");
    syntaxArea.style.display = "flex";
    if (arr6.length === 0 && arr7.length === 0) {
        alert("生成失败：无有效数据用于生成语法表达式");
        document.getElementById("text6").value = "";
        document.getElementById("text7").value = "";
    } else {
        document.getElementById("text6").value = arr6.join(" || ");
        document.getElementById("text7").value = arr7.join(" || ");
    }
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
        await navigator.clipboard.writeText(text);
    } catch (err) {
        textarea.select();
        const success = document.execCommand('copy');
        if (!success) {
            console.error('Copy failed:', err);
            return;
        }
    }
    btn.classList.remove("copy-icon");
    btn.classList.add("copied-icon");
    setTimeout(() => {
        btn.classList.remove("copied-icon");
        btn.classList.add("copy-icon");
    }, 2000);
}
function toggleSyntaxArea() {
    const area = document.getElementById("syntax-area");
    area.style.display = area.style.display === "none" ? "flex" : "none";
}
/**
 * 清空所有文本框内容并重置复选框状态
 */
function clearAll() {
    const textAreas = ['text1', 'text2', 'text3', 'text4', 'text5', 'text6', 'text7'];
    textAreas.forEach(id => {
        document.getElementById(id).value = '';
    });
    const checkboxes = [
        'check-proto',
        'check-port',
        'check-path',
        'check-http',
        'check-uniq',
        'check-rootdomain'
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
    for (const line of rawText) {
        let match;
        while ((match = regex.exec(line)) !== null) {
            matches.push(match[0]);
        }
    }
    if (flag === 7) {
        matches = matches.map(m => {
            const pathMatch = extractPath.exec(m);
            return pathMatch ? pathMatch[0] : null;
        }).filter(Boolean);
    }
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
