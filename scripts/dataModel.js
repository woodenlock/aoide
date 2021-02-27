//黑盒任务对象
let Gear = function (written, value) {
    return {
        written: written,
        value: value
    };
}

//黑盒任务链,所有任务仅可操作一次,全部结束后回调
let clockwork = function (total, call) {
    let legal = typeof total === "number" && typeof call === "function";
    let gears = []; //任务操作的常量集合
    let left = total; //剩余的任务数
    let valid = function (index){
        return (index || index === 0) && total && 0 <= index && index < total;
    }
    this.set = function (obj, index) {
        if(legal && valid(index)){
            let loc = gears[index];
            if(!loc || !loc.written){
                gears[index] = Gear( true, obj);
                if(!--left){
                    call();
                }
            }
        }
    }
    this.get = function (index){
        return legal && valid(index) ? gears[index].value : null;
    }
}

//媒体对象
let Media = function (index, name, duration, star, path, picture){
    this.index = index; //序号
    this.name = name; //名称
    this.duration = duration; //时长，秒数
    this.star = star; //是否点赞
    this.path = path; //文件路径
    this.picture = picture; //展示图片路径，暂时没有较好存储额外解析
    //校验
    this.valid = function (){
        let result = true;
        result &= !index || Number.isInteger(index) && 0 <= index;
        result &= Number.isInteger(duration) && 0 <= duration;
        result &= typeof name == "string";
        result &= typeof path == "string";
        result &= !picture || typeof picture == "string";
        result &= typeof star == "boolean";

        return result;
    }
}

//媒体列表
let PlayerList = function (name, listHeight, medias) {
    this.index = null; //序号
    this.name = name || ""; //名称
    this.listHeight = typeof listHeight === "number" ? listHeight : 240; //播放列表最大高度
    this.medias = []; //媒体集合
    if(medias && medias.length){
        for (let i = 0; i < medias.length; i++) {
            this.add(medias[i]);
        }
    }
    //获取大小
    this.size = function (){
        return this.medias.length;
    }
    //校验index
    this.validIndex = function (index){
        return Number.isInteger(index) && 0 <= index && index < this.medias.length;
    }
    //获取对应位置的媒体对象
    this.get = function (index){
        return this.validIndex(index) ? this.medias[index] : null;
    }
    //新增媒体对象
    this.add = function (media){
        let result = null;
        if(media && media.valid()){
            let index = this.medias.length;
            media.index = null === media.index ? this.medias.length : media.index;
            if(this.validIndex(media.index) || media.index === this.medias.length){
                index = media.index;
                for (let i = index + 1; i < this.medias.length; i++) {
                    this.medias[i].index ++;
                }
                result = this.medias.splice(index, 0, media);
            }
        }

        return result;
    }
    //移除对应位置的媒体对象
    this.remove = function (index){
        let result = null;
        if(this.validIndex(index)){
            result = this.medias.splice(index, 1);
            for (let i = index; i < this.medias.length; i++) {
                this.medias[i].index --;
            }
        }

        return result;
    }
    //清空媒体对象
    this.clear = function (){
        this.medias = [];
    }
    //更新媒体对象
    this.update = function (media){
        if(media && media.valid() && this.validIndex(media.index)){
            this.medias[media.index] = media;
        }
    }
    //交换媒体对象位置
    this.swap = function (before, after){
        if(this.validIndex(before) && this.validIndex(after) && before !== after){
            let clone = Object.assign({},this.medias[before]);
            clone.index = after;
            this.medias[after].index = before;
            this.medias[before] = this.medias[after];
            this.medias[after] = clone;
        }
    }
    //移动媒体对象位置
    this.move = function (before, after){
        if(this.validIndex(before) && this.validIndex(after) && before !== after){
            let order = before < after;
            let target = this.medias[after];
            this.medias[after] = this.medias[before];
            let copy;
            for (let i = before, step = order ? 1 : -1; i !== after && (i < after) ^ !order; i + step) {
                copy = i === after - step ? target : this.medias[i + step];
                copy.index -= step;
                this.medias[i] = copy;
            }
        }
    }
}

//播放顺序定义
let PlayOrderDefine = function (value, name, background, next, previous) {
    this.name = name; //名称
    this.value = value; //标识数值
    this.background = background; //背景样式
    this.next = next; //计算下个媒体对象
    this.previous = previous; //计算上个媒体对象
    //获取具体播放的媒体对象
    this.get = function (current,list, forward){
        let result = null;
        if(Number.isInteger(current) && list instanceof PlayerList && list.size() !== 0){
            result = list.get(forward ? this.next(current,list) : this.previous(current,list));
        }
        return result;
    };
}

//正序获取
function orderByAsc(current, list) {
    return ++current % list.size();
}
//倒序获取
function orderByDesc(current, list) {
    return current === 0 ? (list.size() - 1) : --current;
}
//重复获取
function orderByRepeat(current) {
    return current;
}
//随机获取，考虑可逆伪随机
function orderByRandom(current, list) {
    let result = 0;
    if(list && list.size() > 1){
        let max = list.size() - 1;
        do{
            result = Math.round(Math.random() * max);
        }while (result === current);
    }
    return result;
}
//加权随机获取
function orderByBalance(current,list) {
    let ran = 0;
    if(list && list.size() > 1){
        let seed = Math.round(Math.random() * 99);
        let star = ~~(seed / 3) !== 0;
        let max = list.size() - 1;
        do{
            ran = Math.round(Math.random() * max);
        }while (ran === current || list.get(ran).star !== star);
    }
    return ran;
}

//播放顺序集合，暂时只支持这几种
const ORDER_MAP = new Map();
ORDER_MAP.set(0, new PlayOrderDefine(0, "顺序播放", "url(images/asc.svg) no-repeat",orderByAsc, orderByDesc));
ORDER_MAP.set(1, new PlayOrderDefine(1, "倒序循环","url(images/desc.svg) no-repeat",orderByDesc, orderByAsc));
ORDER_MAP.set(2, new PlayOrderDefine(2, "单曲循环","url(images/circle.svg) no-repeat",orderByRepeat, orderByRepeat));
ORDER_MAP.set(3, new PlayOrderDefine(3, "随机播放","url(images/random.svg) no-repeat",orderByRandom, orderByRandom));
ORDER_MAP.set(4, new PlayOrderDefine(4, "加权随机","url(images/balance.svg) no-repeat",orderByBalance, orderByBalance));

//播放速度定义
let SpeedDefine = function (index, value, title) {
    this.index = index; //显示顺序
    this.value = value; //值
    this.title = title; //标题
}

//播放速度集合，暂时只支持这几种
const SPEED_MAP = new Map();
SPEED_MAP.set(0, new SpeedDefine(0, 1, "常速"));
SPEED_MAP.set(1, new SpeedDefine(1, 2, "快速"));
SPEED_MAP.set(2, new SpeedDefine(2, 0.5, "慢速"));

//颜色定义
let Color = function (index, name, value) {
    this.index = index; //序号
    this.name = name; //名称
    this.value = value; //颜色的16进制字符串
}

//颜色集合，暂时只支持这几种
const COLOR_MAP = new Map();
COLOR_MAP.set(0, new Color(0, "红色", "DC143C"));
COLOR_MAP.set(1, new Color(1, "橙色", "FFA500"));
COLOR_MAP.set(2, new Color(2, "黄色", "FFD700"));
COLOR_MAP.set(3, new Color(3, "绿色", "3CB371"));
COLOR_MAP.set(4, new Color(4, "蓝色", "00BFFF"));
COLOR_MAP.set(5, new Color(5, "靛青", "4B0082"));
COLOR_MAP.set(6, new Color(6, "紫色", "800080"));

//个人设置
let Setting = function (soundUp, soundPercent, order, speed, currentMediaIndex, currentListIndex, appear, distance, stretch, color, mode, extra, lists) {
    this.soundUp = (typeof soundUp === "boolean") ? soundUp : true; //声音是否打开，默认打开
    this.soundPercent = (typeof soundPercent === "number") ? soundPercent : 0.8; //音量(0~1)，默认80%
    this.order = (typeof order === "number") ? order : 0; //播放顺序，默认正序循环
    this.speed = (typeof speed === "number") ? speed : 0; //播放速度，默认常速播放
    this.currentMediaIndex = (typeof currentMediaIndex === "number") ? currentMediaIndex : 0; //当前播放的媒体序号，默认为0
    this.currentListIndex = (typeof currentListIndex === "number") ? currentListIndex : 0; //当前展示的列表序号，默认为0
    this.appear = (typeof appear === "boolean") ? appear : true; //当前播放器是否展示，默认展示
    this.distance = (typeof distance === "number") ? distance : 50; //当前播放器距浏览器顶端的距离（px），默认50px
    this.stretch = (typeof stretch === "boolean") ? stretch : true; //当前播放列表是否伸展开来，默认展开
    this.color = (typeof color === "number") ? color : 0; //颜色值，默认红色
    this.mode = (typeof mode === "number") ? mode : 0; //存储模式值，默认本地存储
    this.extra = extra; //额外信息存储，预留
    this.lists = []; //媒体列表集合对象
    if(lists && lists.length){
        for (let i = 0; i < lists.length; i++) {
            this.lists.push(lists[i]);
        }
    }
    this.validIndex = function (index){
        return Number.isInteger(index) && 0 <= index && index < this.lists.length;
    }
    this.get = function (index){
        let result = null;
        if(this.validIndex(index)){
            result = this.lists[index];
        }
        return result;
    }
    this.append = function (play){
        if(play instanceof PlayerList){
            play.index = this.lists.length;
            this.lists[play.index] = play;
        }
    }
    this.remove = function (index){
        if(this.validIndex(index)){
            for (let i = index; i < this.lists.length - 1; i++) {
                this.lists[i + 1].index --;
                this.lists[i] = this.lists[i + 1];
            }
            this.lists = this.lists.slice(0, this.lists.length - 1);
        }
    }
    this.size = function (){
        return this.lists.length;
    }
    this.moveRight = function (index) {
        if(typeof index === "number" && index >= 0 && index < this.size() - 1){
            let left = this.lists[index];
            this.lists[index] = this.lists[index + 1];
            this.lists[index + 1] = left;
            this.lists[index].index = index;
            this.lists[index + 1].index = index + 1;
        }
    }
    this.getCurrentPlayList = function (){
        return this.get(this.currentListIndex);
    }
    //获取正在播放的媒体（当前为第一个列表）
    this.getPlayingMedia = function (){
        return this.get(0).get(this.currentMediaIndex);
    }
}

//从json中解析出Setting实例
function parseSettingFromJson(json){
    let result = null;
    if(json && json !== "null" && json !== "undefined"){
        json = JSON.parse(json);
        result = new Setting(json.soundUp, json.soundPercent, json.order, json.speed, json.currentMediaIndex, json.currentListIndex, json.appear, json.distance, json.stretch, json.color, json.mode, json.extra);
        let pls = json.lists;
        if(pls && pls.length){
            let pl, medias, media;
            for (let i = 0; i < pls.length; i++) {
                pl = new PlayerList(pls[i].name);
                medias = pls[i].medias;
                if(medias && medias.length){
                    for (let j = 0; j < medias.length; j++) {
                        media = new Media(null, medias[j].name, medias[j].duration, medias[j].star, medias[j].path, medias[j].picture);
                        pl.add(media);
                    }
                }
                result.append(pl);
            }
        }
    }

    return result;
}