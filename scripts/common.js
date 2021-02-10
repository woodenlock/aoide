/* -------------------------------------- 杀死IE --------------------------------------- */
if (!Number.isInteger) {
    Number.isInteger = function(num) {
        return typeof num == "number" && num % 1 === 0;
    };
}
String.prototype.startsWith = String.prototype.startsWith || function (str) {
    let reg = new RegExp("^" + str);
    return reg.test(this);
}
String.prototype.endsWith = String.prototype.endsWith || function (str) {
    let reg = new RegExp(str + "$");
    return reg.test(this);
}
String.prototype.replaceAll = String.prototype.replaceAll || function(s1, s2) {
    return this.replace(new RegExp(s1, "gm"), s2);
}
if (!Array.prototype.includes) {
    Object.defineProperty(Array.prototype, 'includes', {
        value: function(valueToFind, fromIndex) {
            if (this == null) {
                throw new TypeError('"this" is null or not defined');
            }
            let o = Object(this);
            let len = o.length >>> 0;
            if (len === 0) {
                return false;
            }
            let n = fromIndex | 0;
            let k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
            function sameValueZero(x, y) {
                return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
            }
            while (k < len) {
                if (sameValueZero(o[k], valueToFind)) {
                    return true;
                }
                k++;
            }
            return false;
        }
    });
}
if (typeof Object.assign != 'function') {
    Object.assign = function(target) {
        'use strict';
        if (target !== null) {
            target = Object(target);
            for (let index = 1; index < arguments.length; index++) {
                let source = arguments[index];
                if (source != null) {
                    for (let key in source) {
                        if (Object.prototype.hasOwnProperty.call(source, key)) {
                            target[key] = source[key];
                        }
                    }
                }
            }
        }
        return target;
    };
}
/* -------------------------------------- 通用工具类 --------------------------------------- */
/** 绑定监听器 **/
function addHandler(element, type, func) {
    if(element.addEventListener){
        element.addEventListener(type, func);
    }else if(element.attachEvent){
        element.attachEvent("on" + type, func);
    }
}

/** 移除监听器 **/
function removeHandler(element, type, func) {
    if(element.removeEventListener){
        element.removeEventListener(type, func);
    }else if(element.detachEvent){
        element.detachEvent("on" + type, func);
    }
}

/** 获取鼠标滚动方向，向上为true **/
function getScrollDirection(e){
    let result = false;
    if(e){
        result = (e.wheelDelta ? e.wheelDelta : e.detail) > 0;
    }

    return result;
}

/** 添加/移除类 **/
function toggleClass(element, clazz){
    if(element && clazz){
        let classes = element.classList;
        if(classes.contains(clazz)){
            classes.remove(clazz);
        }else {
            classes.add(clazz);
        }
    }
}

/** 显示/隐藏元素 **/
function displayToggle(element){
    toggleClass(element, HIDDEN_CLASS);
}

/** 切换选中项，返回当前元素的下标 **/
function toggleChose(element, className){
    let histories = document.getElementsByClassName(className);
    //有选中历史且与当前的选择不同则取消历史的选中
    toggleClass(histories[0], className);
    //改变当前选中的样式
    toggleClass(element, className);
    return [].indexOf.call(element.parentNode.children, element);
}

/** 设置元素周期旋转 **/
function circle(element, speed, init) {
    let degree = init || 0;
    return setInterval(function (){
        degree = ++degree % 360;
        element.style.mozTransform = "rotate(" + degree + "deg)";
        element.style.msTransform = "rotate(" + degree + "deg)";
        element.style.oTransform = "rotate(" + degree + "deg)";
        element.style.transform = "rotate(" + degree + "deg)";
    }, speed);
}

/** 淡入淡出 **/
function fade(ele, out, time, call){
    let result = null;
    if(ele instanceof HTMLElement){
        out = typeof out === "boolean" || true;
        time = typeof time === "number" ? ~~time : 2000;
        let start = out ? 100 : 0, target = 100 - start;
        result = setInterval(function (){
            ele.style.opacity = ~~(target + (out ? 1 : -1) * start--) / 100 + "";
            if(start === target){
                ele.style.opacity = target / 100 + "";
                clearInterval(result);
                if(typeof call === "function"){
                    call();
                }
            }
        }, time / 100);
    }
    return result;
}

/** 根据类名查找特定的直接子元素 **/
function findDirectChildByClassName(ele, className){
    let children = ele ? ele.children : null;
    if(children){
        let result = null;
        for (let i = 0; i < children.length; i++) {
            result = children[i];
            if(result.classList.contains(className)){
                return result;
            }
        }
    }

    return null;
}

/** 根据秒数计算时间字符串 **/
function calculateTime(total){
    let result = ~~(total / 60);
    result = result ? (result > 10 ? result : "0" + result) : "00";
    result += ":";
    let second = ~~(total % 60);
    second = second ? (second < 10 ? "0" + second : second) : "00";
    return result + second;
}

/** 从url对应的媒体中获取媒体时长 **/
function resolveMediaDuration(url, success, fail){
    if(url){
        let audio = new Audio(url);
        audio.preload = "metadata";
        audio.onloadedmetadata = function (){success(audio.duration)}
        audio.onerror = function (e){fail(e)}
        audio.load();
    }
}

/** 从文件二进制数据中获取媒体图片(主流的只有mp3与flac可以包含) **/
function resolveMediaPicture(file, call){
    if(file && typeof call === "function"){
        new jsmediatags.Reader(file)
            .setTagsToRead(["picture"])
            .read({
                onSuccess: function(detail) {
                    let store = (detail.type === "FLAC" || detail.type === "ID3") ? detail.tags.picture : null;
                    call(store && store.data ? encodeBase64Img(store.data) : null);
                },
                onError: function(error) {
                    notice("媒体封面获取失败：" + file.name, error);
                    call();
                }
            });
    }
}

/** byte数组转换成base64图片内容字符串 **/
function encodeBase64Img(arr){
    let result = null;
    if(arr && arr.length){
        let binary = '';
        let bytes = new Uint8Array(arr);
        let len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        result = "data:image/png;base64," + window.btoa(binary);
    }
    return result;
}

/** 统一通知，方法埋点 **/
let noticeHandler = function (message, content) {
    console.log(message + "," + JSON.stringify(content));
}
function notice(message, content, call){
    let handler = (typeof call === "function") ? call : noticeHandler;
    handler(message, content);
}

/** 生成uuid，注意并不保证不重复 **/
function uuid(len, radix) {
    let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    let uuid = [], i;
    radix = radix || chars.length;
    if (len) {
        for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random()*radix];
    } else {
        let r;
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        uuid[14] = '4';
        for (i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | Math.random()*16;
                uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r];
            }
        }
    }

    return uuid.join('');
}

/** Map转json **/
function mapToJson(map) {
    let result = null;
    if(map instanceof Map){
        let obj = Object.create(null);
        let iterator = map.keys();
        for (let i = 0; i < map.size; i++) {
            let key = iterator.next().value;
            obj[key] = map.get(key);
        }
        result = JSON.stringify(obj);
    }

    return result;
}

/** json转换为map **/
function jsonToMap(json){
    let result = null;
    if(typeof json === "string"){
        result = new Map();
        let obj = JSON.parse(json);
        let keys = Object.keys(obj);
        for (let i = 0; i < keys.length; i++) {
            result.set(keys[i],obj[keys[i]]);
        }
    }

    return result;
}

/**
 * 创建并下载文件
 * @param fileName 文件名
 * @param content  文件内容
 */
function downloadFile(fileName, content) {
    let aTag = document.createElement('a');
    let blob = new Blob([content]);
    aTag.download = fileName;
    aTag.href = URL.createObjectURL(blob);
    aTag.click();
    URL.revokeObjectURL(blob);
}

/** 构建本地文件路径 **/
function buildLocalUrl(url){
    return url ? url.replaceAll("%", "%25").replaceAll("#", "%23") : null;
}

//16进制的颜色数值匹配表达式
const COLOR_HEX_REG = /^[0-9A-Fa-f]{6}$/;
/** 清洗颜色(16进制值表示) **/
function bleachColor(origin, add){
    let result = null;
    if(typeof origin === "string" && COLOR_HEX_REG.test(origin)
        && typeof add === "number" && add >= -1 && add <= 1){
        origin = parseInt(origin, 16);
        let r = (origin & 0xFF0000) / 0x10000;
        let g = (origin & 0xFF00) / 0x100;
        let b = origin & 0xFF;
        if(add < 0){
            add ++;
            r *= add;
            g *= add;
            b *= add;
        }else{
            r += (0xFF - r) * add;
            g += (0xFF - g) * add;
            b += (0xFF - b) * add;
        }
        r = Math.round(r);
        g = Math.round(g);
        b = Math.round(b);
        let rs = (r <= 0xF ? "0" : "") + r.toString(16);
        let gs = (g <= 0xF ? "0" : "") + g.toString(16);
        let bs = (b <= 0xF ? "0" : "") + b.toString(16);
        result = rs + gs + bs;
    }

    return result;
}

/** 发送ajax请求 **/
function ajax(url, type, async, headers, params, jsonObj, success, failure){
    let result = null;
    if(typeof url === "string" && url.length > 0){
        let request = new XMLHttpRequest(), content = null;
        if(params instanceof Map){
            let add = "";
            params.forEach(function (value, key) {
                add += key + "=" + value;
            });
            url = url.endsWith("?") ? url : (url + "?");
            url += encodeURI(add);
        }
        if(!(headers instanceof Map)){
            headers = new Map();
        }
        if(jsonObj){
            if(type === "GET"){
                let add = "";
                let keys = Object.keys(jsonObj);
                for (let i = 0; i < keys.length; i++) {
                    add += keys[i] + "=" + jsonObj[keys[i]];
                }
                url = url.endsWith("?") ? url : (url + "?");
                url += encodeURI(add);
            }else {
                headers.set('Content-Type', 'application/json');
                if(jsonObj instanceof Map){
                    let mapObj = Object.create(null);
                    jsonObj.forEach(function (value, key) {
                        mapObj[key] = jsonObj.get(key);
                    });
                    jsonObj = mapObj;
                }
                content = JSON.stringify(jsonObj);
            }
        }
        request.onreadystatechange = function () {
            if (request.readyState === XMLHttpRequest.DONE){
                if(request.status === 200){
                    if(typeof success === "function"){
                        success(request.responseText);
                    }
                }else{
                    notice("请求：" + url + "失败，服务器响应状态码：" + request.status);
                    if(typeof failure === "function"){
                        failure(request.status, request.responseText);
                    }
                }
            }
        }
        request.open(type, url, typeof async === "boolean" ? async : true);
        headers.forEach(function (value, key) {
            request.setRequestHeader(key + "", value + "");
        });
        request.send(content);
        if(request.responseText){
            result = JSON.parse(request.responseText);
        }
    }

    return result;
}

/** base64处理器 **/
const Base64 = function () {
    let _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    this.encode = function (e) {
        let t = "";
        let n, r, i, s, o, u, a;
        let f = 0;
        e = encodeUtf8(e);
        while (f < e.length) {
            n = e.charCodeAt(f++);
            r = e.charCodeAt(f++);
            i = e.charCodeAt(f++);
            s = n >> 2;
            o = (n & 3) << 4 | r >> 4;
            u = (r & 15) << 2 | i >> 6;
            a = i & 63;
            if (isNaN(r)) {
                u = a = 64
            } else if (isNaN(i)) {
                a = 64
            }
            t = t + _keyStr.charAt(s) + _keyStr.charAt(o) + _keyStr.charAt(u) + _keyStr.charAt(a)
        }
        return t
    };
    this.decode = function (e) {
        let t = "";
        let n, r, i;
        let s, o, u, a;
        let f = 0;
        e = e.replace(/[^A-Za-z0-9+/=]/g, "");
        while (f < e.length) {
            s = _keyStr.indexOf(e.charAt(f++));
            o = _keyStr.indexOf(e.charAt(f++));
            u = _keyStr.indexOf(e.charAt(f++));
            a = _keyStr.indexOf(e.charAt(f++));
            n = s << 2 | o >> 4;
            r = (o & 15) << 4 | u >> 2;
            i = (u & 3) << 6 | a;
            t = t + String.fromCharCode(n);
            if (u !== 64) {
                t = t + String.fromCharCode(r)
            }
            if (a !== 64) {
                t = t + String.fromCharCode(i)
            }
        }
        t = decodeUtf8(t);
        return t
    };
    let encodeUtf8 = function (e) {
        e = e.replace(/rn/g, "n");
        let t = "";
        for (let n = 0; n < e.length; n++) {
            let r = e.charCodeAt(n);
            if (r < 128) {
                t += String.fromCharCode(r)
            } else if (r > 127 && r < 2048) {
                t += String.fromCharCode(r >> 6 | 192);
                t += String.fromCharCode(r & 63 | 128)
            } else {
                t += String.fromCharCode(r >> 12 | 224);
                t += String.fromCharCode(r >> 6 & 63 | 128);
                t += String.fromCharCode(r & 63 | 128)
            }
        }
        return t
    };
    let decodeUtf8 = function (e) {
        let t = "";
        let n = 0;
        let c2, c3, r = 0;
        while (n < e.length) {
            r = e.charCodeAt(n);
            if (r < 128) {
                t += String.fromCharCode(r);
                n++
            } else if (r > 191 && r < 224) {
                c2 = e.charCodeAt(n + 1);
                t += String.fromCharCode((r & 31) << 6 | c2 & 63);
                n += 2
            } else {
                c2 = e.charCodeAt(n + 1);
                c3 = e.charCodeAt(n + 2);
                t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
                n += 3
            }
        }
        return t
    }
}();