/** 本地缓存统一前缀 **/
const LS_KEY_PREFIX = "com.resintec.aoide.";
/** 本地缓存标记 **/
const LS_KEY_SIGN = LS_KEY_PREFIX + "test";
/** 本地缓存全局配置key **/
const SETTING_KEY = LS_KEY_PREFIX + "global.setting";
/** 本地缓存图片统一前缀 **/
const IMG_KEY_PREFIX = LS_KEY_PREFIX + "img:";
/** 本地缓存图片信息集合key **/
const IMG_KEY_COLLECTION_KEY = LS_KEY_PREFIX + "keys:";

/** 存储操作器 **/
let StoreHandler = function (name, code, getSupport, getSetting, setSetting, swap, getImg, getAllImg, setImg) {
    this.name = typeof name === "string" ? name : null; //名称，此操作器对外显示的称呼
    this.code = typeof code === "number" ? code : null; //数值，用于确定唯一的操作器，不可重复
    this.getSupport = typeof getSupport === "function" ? getSupport : function (){return false}; //检查当前是否支持此操作器
    this.getSetting = typeof getSetting === "function" ? getSetting : function (){return null}; //获取配置
    this.setSetting = typeof setSetting === "function" ? setSetting : function (setting) {}; //设置配置
    this.swap = typeof swap === "function" ? swap : function (map){}; //修改存储模式，当前只需要处理图片的转即可
    this.getImg = typeof getImg === "function" ? getImg : function (){return null}; //获取图片
    this.getAllImg = typeof getAllImg === "function" ? getAllImg : function (){return null}; //获取所有图片
    this.setImg = typeof setImg === "function" ? setImg : function (){}; //设置未持久化的图片（增改）
}

const USELESS_STORE_HANDLER = new StoreHandler("无效存储模式", -1);
/** 存储对象，内部工厂 **/
const STORE = new function (){
    //当前使用的存储操作器
    let current = USELESS_STORE_HANDLER;
    //所有存储操作器
    let all = new Map([[current.code, current]]);
    //获取存储操作器,默认使用当前的
    this.get = function(code){
        return code ? all.get(code) : current;
    }
    //获取当前的存储操作器，仅可设置已注册的操作器
    this.set = function(code){
        let result = false;
        let target = typeof code === "number" ? all.get(code) : null;
        if(target && target.code !== current.code && target.code !== USELESS_STORE_HANDLER.code){
            if(target.getSupport()){
                if(USELESS_STORE_HANDLER.code !== current.code){
                    target.swap(current.getAllImg());
                    target.setSetting(current.getSetting());
                }
                current = target;
                result = true;
            }else{
                notice("当前不支持该存储模式：" + target.name + "，请更换模式，否则后续的修改将无法保存！");
            }
        }
        return result;
    }
    //注册存储操作器
    this.register = function(handler){
        if(handler instanceof StoreHandler && handler.code !== USELESS_STORE_HANDLER.code){
            let code = handler.code;
            if(typeof code === "number" && !all.get(code)){
                all.set(code, handler);
            }
        }
    }
};

/** 生成16位uuid的图片唯一标识 **/
function generateImageId(){
    return IMG_KEY_PREFIX + uuid(16);
}