/** 图片存储額外信息对象 **/
let ImgInfo = function (id) {
    this.id = id; //唯一标识（uuid）
    this.last = new Date().getTime(); //最后的读写时间
}

/** 本地存储的外部包装，防止内部的方法被其他地方直接调用导致的内部数据不统一 **/
const LOCAL_STORE_WRAPPER = new function (){
    /** 是否支持存储(本地缓存的chrome系列隐身模式支持但是无效) **/
    let SUPPORT;

    /** 本地缓存图片信息集合 **/
    let imgKeys = JSON.parse(window.localStorage.getItem(IMG_KEY_COLLECTION_KEY)) || [];

    /** 检查是否支持本地缓存 **/
    function checkSupport(){
        let result = SUPPORT;
        if(typeof result !== "boolean"){
            try {
                window.localStorage.setItem(LS_KEY_SIGN, 1);
                result = SUPPORT = true;
            }catch (e) {
                result = SUPPORT = false;
                notice("浏览器当前不支持本地缓存，后续操作将无法保存到本地。", e);
            }
        }

        return result;
    }

    /** 异步保存配置到本地缓存，失败的时候将会优先删除最早的图片 **/
    function setSetting(setting){
        return !checkSupport() ? null : new Promise(function (){
            cleanExtraImgLocal(setting);
            setItemSafely(SETTING_KEY, JSON.stringify(setting));
        });
    }

    /** 安全设置本地缓存值 **/
    function setItemSafely(key, value){
        if(key && key.startsWith(LS_KEY_PREFIX)){
            let result = false, full = false, resort = true, error = null, max = 5;
            while (!result && max){
                try{
                    window.localStorage.setItem(key, value);
                    result = true;
                }catch (e){
                    if(!max--){
                        notice("本次本地缓存设置由于失败次数过多已放弃，key: " + key + "\rvalue: " + value, error);
                        return;
                    }
                    error = error || e;
                    if(e instanceof DOMException && e.message && e.message.endsWith("exceeded the quota.")){
                        removeFirstImgInfo(resort);
                        full = true;
                        resort = false;
                    }
                }
            }
            if(error){
                notice(full ? "数据本地存储已满，已自动清理部分缓存图片信息，请及时导出数据后清理本地缓存" : "数据持久化失败：" + error.message, error);
            }
        }
    }

    /** 获取存储的配置 **/
    function getSetting(){
        return checkSupport() ? parseSettingFromJson(window.localStorage.getItem(SETTING_KEY)) : null;
    }

    /** 删除本地最早的图片缓存 **/
    function removeFirstImgInfo(resort){
        if(resort){
            //图片缓存集合排序
            imgKeys.sort(function (a, b){
                return a.last - b.last;
            });
        }
        //删除最早的图片
        let del = imgKeys.shift();
        if(del){
            window.localStorage.setItem(IMG_KEY_COLLECTION_KEY, JSON.stringify(imgKeys));
            window.localStorage.removeItem(del.id);
        }
    }

    /** 清理图片缓存，不可用的将会被清空 **/
    function cleanExtraImgLocal(setting){
        if(setting instanceof Setting){
            let futures = [], playList, pic;
            for (let i = 0; i < setting.size(); i++) {
                playList = setting.get(i);
                for (let j = 0; j < playList.size(); j++) {
                    pic = playList.get(j).picture;
                    if(pic && pic.startsWith(IMG_KEY_PREFIX)){
                        futures.push(pic);
                    }
                }
            }
            let inc;
            imgKeys = imgKeys.filter(function (key) {
                inc = futures.includes(key.id);
                if(!inc){
                    removeImgLocal(key.id);
                }
                return inc;
            });
            window.localStorage.setItem(IMG_KEY_COLLECTION_KEY, JSON.stringify(imgKeys));
        }
    }

    /** 删除本地指定图片缓存 **/
    function removeImgLocal(key){
        if(checkSupport() && key && key.startsWith(IMG_KEY_PREFIX)){
            let exist = false;
            imgKeys.forEach(function(item, index, arr) {
                if(item.id === key) {
                    exist = true;
                    arr.splice(index, 1);
                }
            });
            if(exist){
                window.localStorage.setItem(IMG_KEY_COLLECTION_KEY, JSON.stringify(imgKeys));
                window.localStorage.removeItem(key);
            }
        }
    }

    /** 获取本地缓存所有图片 **/
    function getAllImg(){
        let result = new Map();
        if(checkSupport()){
            imgKeys.forEach(function (item){
                result.set(item.id, window.localStorage.getItem(item.id));
            });
        }
        return result;
    }

    /** 获取图片缓存并刷新其时间 **/
    function getImg(key){
        return restoreImgKeys(key, function () {
            return window.localStorage.getItem(key);
        });
    }

    /** 设置图片 **/
    function setImg(key, content){
        key = restoreImgKeys(key, function () {
            if(content){
                setItemSafely(key, content);
            }else window.localStorage.removeItem(key);
            return key;
        }, !content);
    }

    /** 处理图片KEY本地缓存 **/
    function restoreImgKeys(key, call, remove){
        let result = null;
        if(checkSupport() && key && key.startsWith(IMG_KEY_PREFIX)){
            let exist = false;
            imgKeys.filter(function (item) {
                let hit = true;
                if(item.id === key) {
                    exist = true;
                    item.last = new Date().getTime();
                    hit = remove;
                }
                return hit;
            });
            if(!exist){
                imgKeys.push(new ImgInfo(key));
            }
            setItemSafely(IMG_KEY_COLLECTION_KEY, JSON.stringify(imgKeys));
            result = (typeof call === "function") ? call() : null;
        }

        return result;
    }

    /** 切换为本地缓存模式 **/
    function swapMode(map){
        if(map instanceof Map){
            //清空旧有图片缓存
            imgKeys.forEach(function(item) {
                window.localStorage.removeItem(item.id);
            });
            imgKeys = [];
            //新增新的图片缓存
            map.forEach(function(value, key) {
                imgKeys.push(new ImgInfo(key));
                setItemSafely(key, value);
            });
            setItemSafely(IMG_KEY_COLLECTION_KEY, JSON.stringify(imgKeys));
        }
    }

    //注册并使用本地存储模式
    let localStoreHandler = new StoreHandler("浏览器缓存", 0, checkSupport, getSetting, setSetting, swapMode, getImg, getAllImg, setImg);
    STORE.register(localStoreHandler);
    STORE.set(localStoreHandler.code);
};

/** 刪除存储信息 TODO 删除 **/
function removeLocal(){
    let key;
    for (let i = 0; i < window.localStorage.length; i++){
        key = window.localStorage.key(i);
        //限定前缀以隔离当前应用
        if(key.startsWith(LS_KEY_PREFIX)){
            window.localStorage.removeItem(key);
        }
    }
}

//TODO 删除
function printAll(){
    let key;
    for (let i = 0; i < window.localStorage.length; i++){
        key = window.localStorage.key(i);
        console.log(key +"----------------" + window.localStorage.getItem(key));
    }
}