/** 本地客户端指纹id **/
const LS_GINGER_ID = LS_KEY_PREFIX + "finger";

/** 远程请求api信息对象 **/
let Api = function (name, url, type) {
    this.name = typeof name === "string" ? name : null; //请求名称
    this.url = typeof url === "string" ? url : null; //请求路径
    this.type = typeof type === "string" ? type : null; //请求方式
}

/** 用户身份信息 **/
let Auth = function (subject, uniqueClientId, token, expire) {
    this.subject = (typeof subject === "string") ? subject : null; //账号名，服务器返回的用户标识
    this.uniqueClientId = (typeof uniqueClientId === "string") ? uniqueClientId : null; //身份指纹id，不能为空，用于辅助判断唯一客户端
    this.token = (typeof token === "string") ? token : null; //身份验证token
    this.expire = (typeof expire === "number") ? ~~expire : null; //token有效期
}
/** 将json解析为户身份信息 **/
function parseAuthFromJson(json){
    let result = null;
    if(typeof json === "string"){
        let obj = JSON.parse(json);
        if(typeof obj.uniqueClientId === "string"){
            result = new Auth(obj.uniqueClientId, obj.token, obj.expire);
        }
    }

    return result;
}

/** 获取canvas指纹id,简易版，移动端请求容易重复 **/
let getFingerId = function () {
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    let txt = LS_KEY_SIGN;
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = txt;
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText(txt, 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText(txt, 4, 17);
    let b64 = canvas.toDataURL().replace("data:image/png;base64,", "");
    let str = atob(b64).slice(-16, -12);
    let result = "",si,x;
    for (let i = 0; i < str.length; i++) {
        x = 0;
        si = str.charCodeAt(i).toString(16);
        while (x + si.length < 4) {
            si = "0" + si;
            x++;
        }
        result += si;
    }
    return result;
}

/** 默认远程存储的外部包装，防止内部的方法被其他地方直接调用导致的内部数据不统一 **/
const REMOTE_STORE_WRAPPER = new function (){
    const defaultApiPrefix = "https://www.baidu.com/open/aoide/aiode/";
    const checkAvailableApi = new Api("检查远程服务器是否可用", defaultApiPrefix + "check", "POST");
    const getSettingApi = new Api("获取配置信息", defaultApiPrefix + "setting", "GET");
    const setSettingApi = new Api("修改配置信息", defaultApiPrefix + "setting", "POST");
    const getImgApi = new Api("获取单个图片信息", defaultApiPrefix + "image/single/", "GET");
    const getAllImgApi = new Api("获取所有图片信息", defaultApiPrefix + "image/all", "GET");
    const setImgApi = new Api("批量设置图片信息", defaultApiPrefix + "image", "POST");
    let auth = new Auth();
    const SUCCESS_RESPONSE_CODE = 1;
    let headers = new Map([["identity", "AOIDE"], ["Cache-Control", "no-cache"]]);

    //允许后期手动设置身份信息
    this.setAuth = function (json){
        auth = parseAuthFromJson(json);
    }

    //获取身份信息的副本
    this.copyAuth = function (){
        return JSON.parse(JSON.stringify(auth));
    }

    //默认的ajax请求
    function defaultAjax(api, async, jsonObj, arg, success, failure){
        let result = null;
        if(api instanceof Api){
            //身份信息失效时将会先重新请求token，有效期1H
            if(!auth.token || (auth.expire && (auth.expire + 60 * 60) < new Date().getTime() / 1000)){
                auth.token = null;
                //优先使用已有的subject，然后是本地缓存, uniqueClientId为空则重新计算指纹id
                auth.subject = auth.subject || (localStorage ? localStorage.getItem(LS_GINGER_ID) : null);
                auth.uniqueClientId = auth.uniqueClientId || getFingerId();
                let res = ajax(checkAvailableApi.url, checkAvailableApi.type, false, headers, null, auth);
                if(SUCCESS_RESPONSE_CODE === res.code){
                    auth = new Auth(res.data.subject, res.data.uniqueClientId, res.data.token, res.data.expire);
                    localStorage.setItem(LS_GINGER_ID, auth.subject);
                }else{
                    notice("刷新身份信息失败:" + res.message);
                    return null;
                }
            }
            headers.set("Authorization", "Bearer " + auth.token);
            let resp = ajax(api.url + (arg ? arg : ""), api.type, async, headers, null, jsonObj, success, failure);
            //同步的时候，执行成功直接返回值
            if(!async && SUCCESS_RESPONSE_CODE === resp.code){
                result = resp ? resp.data : null;
            }
        }

        return result;
    }

    /** 检查远程服务器是否可用 **/
    function check(){
        return defaultAjax(checkAvailableApi, false, auth);
    }

    /** 获取配置信息 **/
    function getSetting(){
        return parseSettingFromJson(defaultAjax(getSettingApi, false));
    }

    /** 修改配置信息 **/
    function setSetting(setting){
        if(setting instanceof Setting){
            defaultAjax(setSettingApi, true, setting);
        }
    }

    /** 修改为远程服务器存储 **/
    function swapMode(map){
        if(map instanceof Map){
            map.forEach(function (value, key) {
                sendImg(key, value);
            });
        }
    }

    /** 获取单个图片信息 **/
    function getImg(id){
        return id ? defaultAjax(getImgApi, false, null, id) : null;
    }

    /** 获取所有图片信息 **/
    function getAllImg(){
        return jsonToMap(defaultAjax(getAllImgApi, false));
    }

    /** 保存单张图片信息 **/
    function setImg(key, value){
        if(key && value){
            sendImg(key, value);
        }
    }

    //发送单张图片到服务器，最多尝试5次，批量发送容易超过上限失败
    function sendImg(key, value, times){
        times = times || 0;
        defaultAjax(setImgApi, true, new Map([[key, value]]), null , null, function (){
            if(times++ < 5){
                sendImg(key, value, times);
            }else{
                notice("发送图片到服务器失败次数过多已放弃。key:" + key + ",value:" + value);
            }
        });
    }

    //注册并使用默认远程存储模式
    let remoteStoreHandler = new StoreHandler("默认远程存储", 1, check, getSetting, setSetting, swapMode, getImg, getAllImg, setImg);
    STORE.register(remoteStoreHandler);
    STORE.set(remoteStoreHandler.code);
};