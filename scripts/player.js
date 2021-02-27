/* -------------------------------------- 全局常量/变量 --------------------------------------- */
/** 单个播放单类名 **/
const SINGLE_GROUP_CLASS = "player_group_single";
/** 被选中的播放单类名 **/
const CHOSE_GROUP_CLASS = "player_group_choose";
/** 被选中的播放单类名 **/
const CHOSE_MEDIA_CLASS = "chose_media";
/** 不可选中类名 **/
const UNSELECTABLE_CLASS = "unselectable";
/** 单个媒体类名 **/
const SINGLE_MEDIA_CLASS = "player_list_single";
/** 单个媒体序号类名 **/
const SINGLE_MEDIA_INDEX_CLASS = "player_list_single_index";
/** 单个媒体标题类名 **/
const SINGLE_MEDIA_TITLE_CLASS = "player_list_single_title";
/** 单个媒体点赞类名 **/
const SINGLE_MEDIA_STAR_CLASS = "player_list_single_star";
/** 单个媒体重命名类名 **/
const SINGLE_MEDIA_RENAME_CLASS = "player_list_single_rename";
/** 单个媒体移除类名 **/
const SINGLE_MEDIA_REMOVE_CLASS = "player_list_single_remove";
/** 已点赞媒体类名 **/
const STAR_UP_CLASS = "player_list_single_star_up";
/** 未点赞媒体类名 **/
const STAR_DOWN_CLASS = "player_list_single_star_down";
/** 媒体创建区域id **/
const CREATE_AREA_ID = "player_list_create";
/** 隐藏的类名 **/
const HIDDEN_CLASS = "toggle_hidden";
/** 镜像翻转的类名 **/
const REVERSE_CLASS = "toggle_reverse";
/** 高透明度类名 **/
const HIGH_OPACITY_CLASS = "high_opacity";
/** 最大的双击鼠标点击间隔：300MS **/
const MAX_DOUBLE_CLICK_INTERVAL = 300;
/** 是否是IOS系统 **/
const IS_IOS = !!navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);

/** 全局使用的配置，默认先从本地缓存中读取，没有再实例化一个空的 **/
let setting = STORE.get().getSetting();
if(!setting){
    setting = new Setting(null, null, null, null, null, null, null, null, null, null, null, null, [new PlayerList("正在播放",null, [])]);
    //TODO 示例数据，请删除
    setting.get(0).add(new Media(null, "Libertango - Yo-Yo Ma",187, true,
        "http://music.163.com/song/media/outer/url?id=1699535.mp3", "http://p2.music.126.net/DArW5ONJzLHd4JKgIl7yzA==/705886465073370.jpg"));
    setting.get(0).add(new Media(null, "似水柔情 - 王备",201, false,
        "http://music.163.com/song/media/outer/url?id=166351.mp3", "http://p1.music.126.net/EN2oaemrTlTvP-rlo5dP2A==/86861418607028.jpg"));
    setting.get(0).add(new Media(null, "Awake - Trazer/Lightscape",201, false,
        "http://music.163.com/song/media/outer/url?id=33419765.mp3", "http://p1.music.126.net/-yL1mqucqeSeJobt0-u7oQ==/7987951977288342.jpg"));
}

/* -------------------------------------- DOM加载后执行 --------------------------------------- */
/* --------------- DOM节点变量定义 --------------- */
let fc = document.getElementById("player_container");
let containerNotice = document.getElementById("player_container_notice");
let containerInput = document.getElementById("player_container_input");
let containerMask = document.getElementById("player_container_mask");
let playResource = document.getElementById("play_resource");
let soundSwitch = document.getElementById("player_controller_sound_sign");
let playSwitch = document.getElementById("player_controller_switch");
let playSpeed = document.getElementById("player_controller_speed");
let playOrder = document.getElementById("player_controller_order");
let totalProcess = document.getElementById("player_main_process_total");
let playerLocation = document.getElementById("player_location");
let playDisplay = document.getElementById("player_main_display");
let currentMediaImg = playDisplay.children[0];
let playerOuterSwitch = document.getElementById("player_container_switch");
let playerStoreOuter = document.getElementById("player_store_outer");
let playerStoreSwitch = document.getElementById("player_store_switch");
let processCurrent = document.getElementById("player_main_process_current");
let soundController = document.getElementById("player_controller_sound_process");
let processController = document.getElementById("player_process_outer");
let currentProcess = document.getElementById("player_process_current");
let mediaSingleContainer = document.getElementById("player_list_outer");
let mediaSingleSlider = document.getElementById("player_list_slide");
let playerListRename = document.getElementById("player_group_rename");
let PlayerListWrapper = document.getElementById("player_group_wrapper");
let createArea = document.getElementById(CREATE_AREA_ID);

/* -------------------------------------- 功能性的DOM操作调用函数 --------------------------------------- */
/* --------------- 全局DOM操作 --------------- */
/** 显示提示层 **/
let noticeInter = null;
function showNotice(message, faded, fadeTime) {
    if(message){
        clearInterval(noticeInter);
        containerNotice.classList.remove(HIDDEN_CLASS);
        let div = containerNotice.children[0];
        div.title = div.innerText = message;
        let current = noticeInter = fade(div, faded, fadeTime, function (){
            if(current === noticeInter){
                containerNotice.classList.add(HIDDEN_CLASS);
            }
        });
    }
}

/** 覆盖通用的通知方法实现 **/
noticeHandler = function(message, content){
    let con = {
        "message":message,
        "content":content
    }
    return new Promise(function (){
        console.log(con);
        showNotice(message);
    });
}

/** 显示遮罩层 **/
let shown_mask = false, maskInter, maskIds = [];
function showMask(maskId){
    if(!shown_mask){
        if(maskId){
            if(maskIds.includes(maskId)){
                return;
            }else maskIds.push(maskId);
        }
        shown_mask = true;
        displayToggle(containerMask);
        maskInter = circle(containerMask.children[0], 5);
    }
}

/** 隐藏遮罩层 **/
function hideMask(maskId){
    if(shown_mask){
        if(maskId){
            let ind = maskIds.indexOf(maskId);
            if(ind < 0){
                //被重复删除，后续的操作忽略
                return;
            }
            maskIds.splice(ind, 1);
            if(maskIds.length > 0){
                //还有其他的遮罩请求也忽略
                return;
            }
        }
        shown_mask = false;
        maskIds = [];
        displayToggle(containerMask);
        clearInterval(maskInter);
    }
}

/** 展示全局输入框 **/
function showInput(placeholder, init, press, blur, maskId){
    showMask(maskId);
    let input = containerInput.children[0].children[0];
    input.value = typeof init === "string" ? trimString(init) : "";
    //替换内容
    input.placeholder = typeof placeholder === "string" ? trimString(placeholder) : "";
    //绑定按键操作
    if(press && typeof press === "function"){
        input.onkeypress = function (event){press(this.value, event)};
    }
    //绑定失去焦点操作
    if(blur && typeof blur === "function"){
        input.onblur = function (){blur(this.value)};
    }
    //展示输入框样式
    containerInput.classList.remove(HIDDEN_CLASS);
    input.focus();
}

/** 隐藏全局输入框 **/
function hideInput(maskId){
    containerInput.classList.add(HIDDEN_CLASS);
    let input = containerInput.children[0].children[0];
    input.onblur = input.onkeypress = null;
    hideMask(maskId);
}

/** 通用的元素的拖动操作绑定 **/
function bindDrag (ele, start, process, end){
    if(ele instanceof Element){
        addHandler(ele, "mousedown", function (ev){
            //防止拖动的时候误选中
            fc.classList.add(UNSELECTABLE_CLASS);
            let params;
            if(typeof start === "function")params = start(ev);
            if(typeof process === "function")document.onmousemove = function (eve) {
                process(eve, params);
            }
            //拖动结束的触发绑定在document上以增加可靠性
            document.onmouseout = document.onmouseup = function (eve) {
                fc.classList.remove(UNSELECTABLE_CLASS);
                if(typeof end === "function")end(eve);
                document.onmousemove = document.onmouseout = document.onmouseup = null;
            };
            return false;
        });
    }
}

/* --------------- 主界面的DOM操作 --------------- */

/** 更换当前媒体封面动作提交 **/
function changeMediaPictureSubmit(ev){
    let reader = new FileReader();
    reader.readAsDataURL(ev.target.files[0]);
    reader.onload = function () {
        //修改数据模型
        let media = setting.get(setting.currentListIndex).get(setting.currentMediaIndex);
        if(media){
            media.picture = this.result;
            STORE.get().setSetting(setting);
            //修改界面样式
            currentMediaImg.src = this.result ? this.result : currentMediaImg.src;
        }
    }
}

/** 载入当前媒体对象 **/
let currentMediaSrc = null;
function loadCurrentMedia(){
    let media = setting.getPlayingMedia();
    if(media){
        //重新载入资源则展示的图片旋转角度将会重置为0
        currentImgDegree = 0;
        //設置封面圖片路徑。优先用配置中的，如果是缓存前缀的字符串则查找缓存，找到则使用缓存的值，找不到则重置配置；然后使用默认的图片
        let defaultUrl = "images/disk.png";
        let url = media.picture;
        if(url && url.startsWith(IMG_KEY_PREFIX)){
            let cache = STORE.get().getImg(url);
            if(cache){
                url = cache;
            }else{
                media.picture = url = null;
                STORE.get().setSetting(setting);
            }
        }
        currentMediaImg.src = url || defaultUrl;
        //图片访问不到则展示默认的
        currentMediaImg.onerror = function (e) {
            notice("无效的展示图片路径:" + this.src, e);
            currentMediaImg.src = defaultUrl;
            playResource.onerror = null;
        };
        //载入媒体资源
        currentMediaSrc = playResource.src = media.path;
        //重新设置播放速度
        playResource.playbackRate = SPEED_MAP.get(setting.speed).value;
        //修改界面样式
        let nameEle = document.getElementById("player_main_current_title");
        document.title = nameEle.title = media.name;
        nameEle.innerHTML = media.name;
        totalProcess.innerHTML = calculateTime(media.duration);
        processCurrent.innerHTML = calculateTime(0);
    }
}

/** 切换正在播放的资源 **/
function switchResources(forward){
    let list = setting.get(setting.currentListIndex);
    let order = ORDER_MAP.get(setting.order);
    let media = order.get(setting.currentMediaIndex, list, forward);
    if(media){
        setting.currentMediaIndex = media.index;
        STORE.get().setSetting(setting);
        loadCurrentMedia();
    }
    playSwitch.click();
}

/** 静音/取消 **/
function mute(up){
    let soundUp = (typeof up === "boolean") ? up : !setting.soundUp;
    //修改数据模型
    setting.soundUp = soundUp;
    STORE.get().setSetting(setting);
    //操作播放器
    playResource.muted = !soundUp;
    //改变样式
    soundSwitch.title = soundUp ? "静音" : "取消静音";
    soundSwitch.classList.remove("sound_up", "sound_down");
    soundSwitch.classList.add(soundUp ? "sound_up" : "sound_down");
}

/** 改变音量百分比 **/
function changeSound(percent){
    percent = percent < 0 ? 0 : percent;
    percent = percent > 1 ? 1 : percent;
    //修改数据模型
    setting.soundPercent = percent;
    STORE.get().setSetting(setting);
    //操作播放器
    playResource.volume = percent;
    //改变样式
    soundController.children[0].style.width = percent * 100 + "%";
    soundController.title = "音量：" + ~~(percent * 100);
}

/** 设置播放速度 **/
function setPlaySpeed(index){
    let define = SPEED_MAP.get(index);
    if(define){
        setting.speed = index;
        STORE.get().setSetting(setting);
        playSpeed.innerText = "X" + define.value;
        playSpeed.title = define.title;
        playResource.playbackRate = define.value;
    }
}

/** 设置播放顺序 **/
function setPlayOrder(value){
    let define = ORDER_MAP.get(value);
    if(define){
        setting.order = value;
        STORE.get().setSetting(setting);
        playOrder.style.background = define.background;
        playOrder.title = define.name;
    }
}

/** 接收提交的配置文件 **/
function submitSetting(ev) {
    let reader = new FileReader();
    reader.readAsText(ev.target.files[0], "UTF-8");
    reader.onload = function (evt) {
        //修改数据模型并重新载入整个播放器的界面
        loadConfig(parseSettingFromJson(evt.target.result));
    }
}

/** 重置播放百分比进度 **/
function resetProcess(percent, reload){
    if(percent || percent === 0){
        percent = percent < 0 ? 0 : percent;
        percent = percent > 1 ? 1 : percent;
        if(setting.getPlayingMedia()){
            //修改媒体的实际进度
            if(reload){
                playResource.currentTime = percent * playResource.duration;
            }
            //修改进度条元素的长度
            currentProcess.style.width = percent * 100 + "%";
            //修改当前时间元素的文本
            processCurrent.innerHTML = calculateTime(playResource.currentTime);
            //如果当前播放结束自动切换到下一首
            if(percent === 1){
                switchResources(true);
            }
        }
    }
}

/** 改变主题颜色 **/
function changeColor(color){
    color = COLOR_MAP.get(color);
    color = color || COLOR_MAP.get((setting.color + 1) % COLOR_MAP.size);
    setting.color = color.index;
    STORE.get().setSetting(setting);
    fc.style.backgroundColor = "#" + bleachColor(color.value, -0.4);
    playerOuterSwitch.style.backgroundColor = "#" + bleachColor(color.value, -0.6);
    let splits = document.getElementsByClassName("player_main_split");
    for (let i = 0; i < splits.length; i++) {
        splits[i].firstElementChild.style.backgroundColor = "#" + bleachColor(color.value, -0.6);
    }
    //document.getElementById("player_main_split").children[0].style.backgroundColor = "#" + bleachColor(color.value, -0.6);
    processController.style.backgroundColor = "#" + bleachColor(color.value, -0.6);
    currentProcess.style.backgroundColor = "#" + bleachColor(color.value, 0.8);
    soundController.style.backgroundColor = "#" + bleachColor(color.value, -0.6);
    soundController.children[0].style.backgroundColor = "#" + bleachColor(color.value, 0.8);
    document.getElementsByClassName(CHOSE_GROUP_CLASS)[0].style.backgroundColor = "#" + bleachColor(color.value, 0.4);
    let choseMedia = document.getElementsByClassName(CHOSE_MEDIA_CLASS)[0];
    if(choseMedia){
        choseMedia.style.backgroundColor = "#" + bleachColor(color.value, 0.3);
    }
    document.getElementById("player_setting_color").title = "更换颜色：" + color.name;
}

/* ----------- 播放单 ----------- */
/** 重新载入播放列表的选项集合界面（默认的“正在播放”列表序号固定为0，不参与重构） **/
function reloadPlayListNodes(){
    let list = setting.lists;
    if(list && list.length){
        let olds = PlayerListWrapper.children;
        //删除旧有的播放列表
        if(olds.length > 1){
            for (let i = 1; i < olds.length; i++) {
                PlayerListWrapper.removeChild(olds[i]);
            }
        }
        //增加新的的播放列表
        for (let i = 1; i < list.length; i++) {
            addSingleListNode(list[i], false);
        }
        //选中默认的播放列表
        PlayerListWrapper.children[setting.currentListIndex].click();
    }
}

/** 根据播放列表对象来重新载入对应的媒体列表页 **/
function reloadMediaWrapper(list){
    mediaSingleSlider.innerHTML = "";
    mediaSingleSlider.style.marginTop = "";
    for (let i = 0; i < list.size(); i++) {
        mediaSingleSlider.appendChild(buildSingleMediaNode(list.get(i)));
    }
}

/** 计算播放列表当前最大的可位移值 **/
function calculateMaxListMargin(){
    let max = 0;
    for (let i = 0; i < PlayerListWrapper.children.length; i++) {
        max += PlayerListWrapper.children[i].offsetWidth;
    }
    max -= PlayerListWrapper.clientWidth;

    return max;
}

/** 增加单个播放列表 **/
function addSingleListNode(list, temp){
    let outer = document.createElement("div");
    let button = document.createElement("input");
    button.type = "button";
    let text = document.createElement("input");
    text.type = "text";
    text.classList.add(HIDDEN_CLASS);
    text.placeholder = "播放列表名称不可为空";
    outer.title = button.value = text.value = list.name;
    outer.classList.add(SINGLE_GROUP_CLASS);
    outer.appendChild(button);
    outer.appendChild(text);
    PlayerListWrapper.appendChild(decorateSingleListNode(list.index, outer, temp));
}

/** 装饰单个播放列表结点：增加监听、DOM属性等客户端不可见操作 **/
function decorateSingleListNode(index, ele, temp) {
    let button = ele.children[0];
    let text = ele.children[1];
    let sign = "temp";
    if(temp){
        text.setAttribute(sign, sign);
    }
    text.onkeypress = function (ev){
        if(this.value && ev.keyCode === 13){
            this.removeAttribute(sign);
            renamePlayListSubmit(this);
        }
    }
    text.onblur = function (){
        displayToggle(button);
        displayToggle(this);
        fc.classList.remove(UNSELECTABLE_CLASS);
        //失去焦点的时候如果还带有新增标志说明是用户没有确认过的，会将自己移除掉
        if(this.getAttribute(sign)){
            setting.remove(index);
            STORE.get().setSetting(setting);
            PlayerListWrapper.removeChild(ele);
            //重置选中的列表
            document.getElementsByClassName(CHOSE_GROUP_CLASS)[0].click();
        }
    }

    ele.onclick = function (){choosePlayList(this)}
    ele.ondragover = function (ev) {ev.preventDefault()}
    ele.ondrop = function (){joinPlayList(this);}

    return ele;
}

/** 选中单个播放列表 **/
function choosePlayList(element){
    //修改界面样式
    let old = document.getElementsByClassName(CHOSE_GROUP_CLASS)[0];
    if(old){
        old.style.backgroundColor = "";
    }
    let index = toggleChose(element, CHOSE_GROUP_CLASS);
    element.style.backgroundColor = "#" + bleachColor(COLOR_MAP.get(setting.color).value, 0.3);
    //加载当前播放单的列表
    let playList = setting.get(index);
    reloadMediaWrapper(playList);
    //当前播放单有内容则默认选中第一个
    if(playList.size() !== 0){
        findDirectChildByClassName(mediaSingleSlider.children[0], SINGLE_MEDIA_TITLE_CLASS).click();
    }
    setting.currentListIndex = index;
    STORE.get().setSetting(setting);
    calculateListSliderHeight();
    return false;
}

/** 获取当前选中播放单的序号 **/
function getChosePlayListIndex(){
    let ele = document.getElementsByClassName(CHOSE_GROUP_CLASS)[0];
    return [].indexOf.call(ele.parentNode.children, ele);
}

/** 新建一个播放列表 **/
function createPlayList(){
    //新增数据模型
    let playList = new PlayerList();
    playList.name = "新建列表";
    playList.index = setting.size();
    setting.append(playList);
    STORE.get().setSetting(setting);
    //增加对应的节点元素
    addSingleListNode(playList, true);
    reloadMediaWrapper(playList);
    //将该新增的列表置为选中与重命名状态以方便用户操作
    PlayerListWrapper.children[playList.index].click();
    playerListRename.click();
}

/** 准备重命名单个播放列表 **/
function renamePlayListPrepare(){
    let parent = document.getElementsByClassName(CHOSE_GROUP_CLASS)[0];
    let index = [].indexOf.call(parent.parentNode.children, parent);
    //默认播放列表则忽略
    if(index){
        fc.classList.add(UNSELECTABLE_CLASS);
        let text = parent.children[1];
        displayToggle(parent.children[0]);
        displayToggle(text);
        text.focus();
    }
}

/** 提交重命名单个播放列表 **/
function renamePlayListSubmit(text){
    setting.get(getChosePlayListIndex()).name = text.value;
    STORE.get().setSetting(setting);
    let ele = text.parentNode;
    ele.title = ele.children[0].value = text.value;
    text.blur();
    return false;
}

/** 清空播放单 **/
function clearPlayList(index){
    //修改数据模型
    setting.get((typeof index === "number") ? index : getChosePlayListIndex()).clear();
    STORE.get().setSetting(setting);
    //清空媒体详情列表的内容
    mediaSingleSlider.innerHTML = "";
    mediaSingleSlider.style.marginTop = "";
    calculateListSliderHeight();
}

/** 搜索此列表 **/
function searchPlayList(){
    let index = getChosePlayListIndex();
    let maskId = uuid(10);
    showInput("输入空格分隔的任意个关键词,回车搜索", null, function (val, event){
        if(val && event.keyCode === 13){
            val = val.replace(/\s/g, " ");
            let olds = val.split(" ");
            let keys = [];
            for (let i = 0; i < olds.length; i++) {
                if(olds[i]){
                    keys.push(olds[i]);
                }
            }
            let medias = setting.get(index).medias;
            if(medias.length && keys.length){
                let matched;
                for (let i = 0; i < medias.length; i++) {
                    matched = true;
                    for (let j = 0; j < keys.length; j++) {
                        if(medias[i].name.indexOf(keys[j]) === -1){
                            matched = false;
                            break;
                        }
                    }
                    if(matched){
                        //修正上边距以定位到对应的位置
                        let distance = 0;
                        for (let j = 0; j < i; j++) {
                            distance += mediaSingleSlider.children[j].offsetHeight;
                        }
                        let max = totalMediaSliderHeight - mediaSingleContainer.offsetHeight;
                        distance = distance > max ? max : distance;
                        mediaSingleSlider.style.marginTop = -distance + "px";
                        //模拟点击选中
                        findDirectChildByClassName(mediaSingleSlider.children[i], SINGLE_MEDIA_TITLE_CLASS).click();
                        //隐藏输入框
                        hideInput(maskId);
                        return;
                    }
                }
            }
            hideInput(maskId);
        }
    }, function (){hideInput(maskId)}, maskId);
}

/** 播放此列表(用当前播放列表的内容替换“正在播放”) **/
function movePlayList(){
    let index = getChosePlayListIndex();
    if(index){
        if(index < setting.size() - 1){
            //修改样式
            let clone = PlayerListWrapper.children[index].cloneNode(true);
            clone = PlayerListWrapper.replaceChild(decorateSingleListNode(index, clone, false), PlayerListWrapper.children[index + 1]);
            PlayerListWrapper.replaceChild(decorateSingleListNode(index + 1, clone, false), PlayerListWrapper.children[index]);
            //修改数据模型
            setting.moveRight(index);
            if(setting.currentListIndex === index){
                setting.currentListIndex = index + 1;
            }
            STORE.get().setSetting(setting);
        }
    }else{
        notice("默认列表不可移动！");
    }
}

/** 播放此列表(用当前播放列表的内容替换“正在播放”) **/
function appendPlayList(){
    let index = getChosePlayListIndex();
    if(index){
        //清空“正在播放”列表
        clearPlayList(0);
        //添加当前的列表内容到“正在播放”列表
        let playList = setting.get(index);
        if(playList){
            let target = setting.get(0);
            let media;
            for (let i = 0; i < playList.size(); i++) {
                media = playList.get(i);
                media.index = null;
                target.add(media);
            }
            STORE.get().setSetting(setting);
        }
        //模拟用户切换为当前播放列表
        PlayerListWrapper.children[0].click();
        mediaSingleSlider.children[0].children[1].click();
    }
}

/** 手动将单个媒体拖入目标播放列表 **/
function joinPlayList(element){
    let sourceIndex = getChosePlayListIndex();
    if(typeof sourceIndex === "number" && droppedMediaNode && element instanceof Element && element.classList.contains(SINGLE_GROUP_CLASS)){
        let targetIndex = [].indexOf.call(element.parentNode.children, element);
        if(sourceIndex !== targetIndex){
            let mediaIndex = parseInt(droppedMediaNode.children[0].textContent) - 1;
            droppedMediaNode = null;
            let media = setting.get(sourceIndex).get(mediaIndex);
            media = JSON.parse(JSON.stringify(media));
            media = new Media(null, media.name, media.duration, media.star, media.path, media.picture);
            setting.get(targetIndex).add(media);
            STORE.get().setSetting(setting);
        }
    }
}

/** 移除播放单 **/
function removePlayList(){
    let ele = document.getElementsByClassName(CHOSE_GROUP_CLASS)[0];
    let lists = ele.parentNode.children;
    let index = [].indexOf.call(lists, ele);
    //默认播放列表不可删
    if(index){
        //修改数据模型
        setting.remove(index);
        STORE.get().setSetting(setting);
        //移除当前元素
        let total = PlayerListWrapper.clientWidth;
        ele.parentNode.removeChild(ele);
        //如果剩余的列表元素已经足够展示则重置默认列表的左边界
        total -= PlayerListWrapper.clientWidth;
        let max = calculateMaxListMargin();
        let defaultList = PlayerListWrapper.children[0];
        let current = defaultList.style.marginLeft;
        current = "" === current ? 0 : parseInt(current);
        current += total;
        current = current > 0 ? 0 : current;
        let expect = max <= 0 ? 0 : (-current > max ? -max : current);
        defaultList.style.marginLeft = expect + "px";
        //当前选中的播放列表重置为下一个播放列表，不存在则为默认的“正在播放”
        let next = index < lists.length ? index : 0;
        lists[next].click();
    }else{
        notice("默认列表不可删除！");
    }
}

/* ----------- 媒体详情页 ----------- */

/** 构建单个媒体详情元素 **/
function buildSingleMediaNode(media){
    let minute = ~~(media.duration / 60), second = media.duration % 60;
    let time = (minute >= 10 ? minute : "0" + minute) + ":" + (second >= 10 ? second : "0" + second);
    let outer = document.createElement("dev"), ind = document.createElement("dev"),
        title = document.createElement("dev"), duration = document.createElement("dev"),
        star = document.createElement("dev"), rename = document.createElement("dev"),
        remove = document.createElement("dev");
    outer.classList.add(SINGLE_MEDIA_CLASS, UNSELECTABLE_CLASS);
    ind.classList.add(SINGLE_MEDIA_INDEX_CLASS);
    ind.innerHTML = media.index + 1;
    title.classList.add(SINGLE_MEDIA_TITLE_CLASS);
    title.title = media.name;
    title.innerText = media.name;
    duration.classList.add("player_list_single_duration");
    duration.innerText = time;
    star.classList.add(SINGLE_MEDIA_STAR_CLASS, HIGH_OPACITY_CLASS);
    star.classList.add(media.star ? STAR_UP_CLASS : STAR_DOWN_CLASS);
    star.title = "点赞";
    rename.classList.add(SINGLE_MEDIA_RENAME_CLASS, HIGH_OPACITY_CLASS);
    rename.title = "重命名";
    remove.classList.add(SINGLE_MEDIA_REMOVE_CLASS, HIGH_OPACITY_CLASS);
    remove.title = "移除";
    outer.appendChild(ind);
    outer.appendChild(title);
    outer.appendChild(duration);
    outer.appendChild(star);
    outer.appendChild(rename);
    outer.appendChild(remove);
    return decorateSingleMediaNode(outer);
}

/** 装饰单个媒体结点：增加监听、DOM属性等客户端不可见操作 **/
function decorateSingleMediaNode(ele) {
    if(ele){
        ele.draggable = true;
        ele.ondragover = function (ev) {ev.preventDefault()}
        ele.ondragstart = function (){startDropMediaNode(this)}
        ele.ondrop = function (){dropMediaNode(this)}
        findDirectChildByClassName(ele, SINGLE_MEDIA_TITLE_CLASS).onclick = function () {clickMedia(this, true)}
        findDirectChildByClassName(ele, SINGLE_MEDIA_STAR_CLASS).onclick = function () {toggleStar(this)}
        findDirectChildByClassName(ele, SINGLE_MEDIA_RENAME_CLASS).onclick = function () {renameSingleMedia(this)}
        findDirectChildByClassName(ele, SINGLE_MEDIA_REMOVE_CLASS).onclick = function () {removeSingleMedia(this)}
    }

    return ele;
}

/** 单个媒体结点开始拖动 **/
let droppedMediaNode = null;
function startDropMediaNode(ele) {
    droppedMediaNode = ele;
    return false;
}

/** 点击单个媒体 **/
let lastMediaClickedTime = 0, lastMediaElement = null;
function clickMedia(ele, play){
    if(ele){
        let now = window.performance.now();
        let copy = ele;
        ele = ele.parentNode;
        //300ms内连着点击同一元素两次视为双击
        let doubleClick = (now - lastMediaClickedTime) < MAX_DOUBLE_CLICK_INTERVAL && lastMediaElement === ele;
        lastMediaClickedTime = now;
        lastMediaElement = ele;
        //如果是双击，则：1、添加到正在播放队列；2、当前播放的资源改为当前点击的媒体；3、开始播放
        if(doubleClick){
            setting.currentMediaIndex = addToQueue(copy);
            STORE.get().setSetting(setting);
            loadCurrentMedia();
            //防止被chrome静音策略拦截:https://goo.gl/xX8pDD
            if(play){
                playSwitch.click();
            }
            //重置计时
            lastMediaClickedTime = 0;
        }
        let old = document.getElementsByClassName(CHOSE_MEDIA_CLASS)[0];
        if(old){
            old.style.backgroundColor = "";
        }
        //更换样式
        toggleChose(ele, CHOSE_MEDIA_CLASS);
        ele.style.backgroundColor = "#" + bleachColor(COLOR_MAP.get(setting.color).value, 0.3);
    }
}

/** 取消/点赞单个媒体 **/
function toggleStar(ele){
    let classes = ele.classList;
    let star = classes.contains(STAR_DOWN_CLASS);
    let mi = [].indexOf.call(ele.parentNode.parentNode.children, ele.parentNode);
    //修改数据模型
    setting.get(getChosePlayListIndex()).get(mi).star = star;
    STORE.get().setSetting(setting);
    //修改样式
    if(star){
        ele.classList.remove(STAR_DOWN_CLASS);
        ele.classList.add(STAR_UP_CLASS);
    }else {
        ele.classList.remove(STAR_UP_CLASS);
        ele.classList.add(STAR_DOWN_CLASS);
    }
}

/** 移除单个媒体 **/
function removeSingleMedia(ele){
    ele = ele.parentNode;
    let index = getChosePlayListIndex();
    let medias = ele.parentNode.children;
    let mediaIndex = [].indexOf.call(medias, ele);
    let next = medias.length > 1 ? medias[mediaIndex + 1] : null;
    //先选中为同列表的下一个媒体元素
    clickMedia(findDirectChildByClassName(next, SINGLE_MEDIA_TITLE_CLASS), true);
    //移除数据模型中对应的媒体对象
    setting.get(index).remove(mediaIndex);
    STORE.get().setSetting(setting);
    // 同一个列表下如果还有剩余媒体，重置后面的兄弟元素中的序号文本值，并将下一个节点选中,如果当前
    if(next !== null){
        for (let i = mediaIndex + 1; i < medias.length; i++) {
            let ie = findDirectChildByClassName(medias[i], SINGLE_MEDIA_INDEX_CLASS);
            if(ie){
                ie.innerText = i;
            }
        }
    }
    let oldHeight = mediaSingleContainer.offsetHeight;
    //DOM中移除该节点元素
    ele.parentNode.removeChild(ele);
    calculateListSliderHeight();
    let distance = oldHeight - mediaSingleContainer.offsetHeight;
    let current = parseInt(mediaSingleSlider.style.marginTop);
    //有明显变短且位移为负数则自动调整位移
    if(distance > 5 && current < 0){
        mediaSingleSlider.style.marginTop = current + distance + "px";
    }
}

/** 重命名单个媒体 **/
function renameSingleMedia(ele){
    let maskId = uuid(10);
    let columns = ele.parentNode.children;
    showInput("请输入新的媒体名称", columns[1].textContent, function (val, ev){
        if(val && ev.keyCode === 13){
            val = trimString(val);
            //重命名的列表必定为当前选中的列表
            let listIndex = getChosePlayListIndex();
            let mediaIndex = parseInt(columns[0].textContent) - 1;
            //修改显示名称
            columns[1].textContent = val;
            //修改数据模型
            setting.get(listIndex).get(mediaIndex).name = val;
            STORE.get().setSetting(setting);
            hideInput(maskId);
        }
    }, function (){hideInput(maskId)}, maskId);
}

/** 将媒体加入到“正在播放”列表，同时返回该媒体的数据对象在"正在播放"列表中的最终下标 **/
function addToQueue (ele){
    let listIndex = getChosePlayListIndex();
    let result, mi = result = [].indexOf.call(ele.parentNode.parentNode.children, ele.parentNode);
    let media = setting.get(listIndex).get(mi);
    //默认的正在播放列表不操作
    if(listIndex){
        let copy = new Media(null, media.name, media.duration, media.star, media.path, media.picture);
        setting.get(0).add(copy);
        result = setting.get(0).size() - 1;
        STORE.get().setSetting(setting);
    }
    return result;
}

/** 单个媒体结点开始拖动 **/
function dropMediaNode(ele) {
    if(droppedMediaNode !== ele && droppedMediaNode !== null){
        let oldIndex = droppedMediaNode.children[0].innerHTML;
        let newIndex = ele.children[0].innerHTML;
        //拷贝旧节点数据
        let newClone = ele.cloneNode(true);
        newClone.children[0].innerHTML = oldIndex;
        let oldClone = droppedMediaNode.cloneNode(true);
        oldClone.children[0].innerHTML = newIndex;
        //修改数据模型
        setting.get(getChosePlayListIndex()).swap(parseInt(oldIndex) - 1, parseInt(newIndex) - 1);
        STORE.get().setSetting(setting);
        //交换DOM节点
        mediaSingleSlider.replaceChild(decorateSingleMediaNode(oldClone), ele);
        mediaSingleSlider.replaceChild(decorateSingleMediaNode(newClone), droppedMediaNode);
        droppedMediaNode = null;
    }
    return false;
}

/* ----------- 添加新内容区域 ----------- */

/** 重新计算播放列表的最大高度 **/
let totalMediaSliderHeight = 0;
function calculateListSliderHeight(){
    totalMediaSliderHeight = 0;
    for (let i = 0; i < mediaSingleSlider.children.length; i++) {
        totalMediaSliderHeight += mediaSingleSlider.children[i].offsetHeight;
    }
    let max = setting.getCurrentPlayList().listHeight;
    mediaSingleContainer.style.maxHeight = max + "px";
    let height = mediaSingleContainer.offsetHeight < max ? max : mediaSingleContainer.offsetHeight;
    height = height > totalMediaSliderHeight ? totalMediaSliderHeight : height;
    mediaSingleContainer.style.height = height + "px";
}

/** 打开远程媒体文件 **/
function openRemoteMediaFile(url, event, maskId){
    if (url && event.keyCode === 13) {
        showMask(maskId);
        url = trimString(url);
        url = encodeURI(url);
        //设置数据模型
        let index = getChosePlayListIndex();
        let audio = new Audio();
        audio.preload = "metadata";
        audio.onloadedmetadata = function (){
            let duration = parseInt(this.duration);
            showInput("请输入媒体名称", null, function (val, ev){
                if(val && ev.keyCode === 13){
                    //修改数据模型
                    setting.get(index).add(new Media(null, val, duration, false, url, null));
                    STORE.get().setSetting(setting);
                    //重新载入当前播放列表
                    PlayerListWrapper.children[index].click();
                    hideInput(maskId);
                }
            }, hideInput(maskId), maskId);
        }
        audio.onerror = function (e){
            notice("远程媒体加载失败：" + url, e);
        };
        audio.src = url;
        audio.load();
    }
}

/** 等待用户输入文件的路径前缀 **/
function openLocalMediaFile(isDirectory, prefix, event, maskId){
    if (event.keyCode === 13) {
        showMask(maskId);
        prefix = trimString(prefix);
        prefix = prefix ? (prefix.endsWith("/") ? prefix : prefix + "/") : "/";
        let picker = createArea.children[3];
        picker.webkitdirectory = isDirectory;
        picker.onchange = function (event){pickLocalMediaFile(event, prefix, maskId)};
        picker.click();
    }
}

/** 等待用户最终选择文件实体 **/
function pickLocalMediaFile(event, prefix, maskId){
    hideInput(maskId);
    let newMaskId = uuid(10);
    showMask(newMaskId);
    let files = event.target.files;
    let total = files.length;
    let clock = new clockwork(total, function (){
        //设置数据模型
        let index = getChosePlayListIndex();
        for (let i = 0; i < total; i++) {
            setting.get(index).add(clock.get(i));
        }
        STORE.get().setSetting(setting);
        //重新载入当前播放列表
        PlayerListWrapper.children[index].click();
        hideMask(maskId);
        hideMask(newMaskId);
    });
    let paths = [];
    //遍历所有文件来构建媒体对象数组
    for (let i=0; i < total; i++) {
        let url = buildLocalUrl(paths[i] = prefix + (files[i].webkitRelativePath ? files[i].webkitRelativePath : files[i].name));
        resolveMediaDuration(url, function (duration){
            resolveMediaPicture(files[i], function (picture){
                let fileName = files[i].name;
                let ind = fileName ? fileName.lastIndexOf("."): -1;
                fileName = ind === -1 ? fileName : fileName.substr(0, ind);
                let imgId = generateImageId();
                if(picture){
                    STORE.get().setImg(imgId, picture);
                }
                clock.set(new Media(null, fileName, parseInt(duration), false, url, picture ? imgId : null), i);
            });
        }, function (e){
            notice("本地媒体加载失败：" + paths[i], e);
            clock.set(null, i);
        });
    }
}

/* ----------- 配置相关DOM处理 ----------- */

/** 加载配置 **/
function loadConfig(config){
    if(config instanceof Setting && config.size() !== 0){
        setting = config;
        //设置播放器上端位置
        fc.style.top = setting.distance +"px";
        //设置播放器主界面是否展示
        if(setting.appear){
            fc.style.left = "0px";
            playerOuterSwitch.children[0].classList.remove(REVERSE_CLASS);
        }else{
            fc.style.left = 0 - fc.offsetWidth + "px";
            playerOuterSwitch.children[0].classList.add(REVERSE_CLASS);
        }
        //设置播放列表是否展示
        if(setting.stretch){
            playerStoreOuter.classList.remove(HIDDEN_CLASS);
        }else{
            playerStoreOuter.classList.add(HIDDEN_CLASS);
        }
        //设置是否静音
        mute(setting.soundUp);
        //设置默认的音量
        changeSound(setting.soundPercent);
        //设置默认的播放速度
        setPlaySpeed(setting.speed);
        //设置默认的播放顺序
        setPlayOrder(setting.order);
        //如果当前在播放则停止
        if (!playResource.paused && !playResource.ended){
            playSwitch.click();
        }
        //重新载入播放界面
        loadCurrentMedia();
        //重新载入播放列表展示
        reloadPlayListNodes();
        //设置主题色
        changeColor(setting.color);
        //选中初始化的媒体
        clickMedia(findDirectChildByClassName(mediaSingleSlider.children[setting.currentMediaIndex], SINGLE_MEDIA_TITLE_CLASS), false);
        fc.classList.remove("no_opacity");
        //配置文件存入本地缓存
        STORE.get().setSetting(setting);
    }
}

/* ----------------------- 开始加载DOM事件监听 -------------------------- */
/** 绑定外部的隐藏开关 **/
//是否正在执行动画
let containerSwitchSign = false;
addHandler(playerOuterSwitch, "click", function (){
    if(!containerSwitchSign){
        containerSwitchSign = true;
        let startLoc = fc.style.left;
        let start = setting.appear ? (startLoc.length <= 2 ? 0 : parseInt(startLoc)) : 0 - fc.offsetWidth;
        let end = setting.appear ? 0 - fc.offsetWidth : 0;
        let total = 256, inter = 64, begin = 0;
        let sign = setInterval(function(){
            if(++begin <= inter){
                fc.style.left = (end - start) / inter * begin + start + "px";
            }else clearInterval(sign);
        }, total / inter);
        //修改数据模型
        setting.appear = !setting.appear;
        STORE.get().setSetting(setting);
        //修改样式
        playerOuterSwitch.title = setting.appear ? "隐藏播放器" : "展示播放器";
        toggleClass(playerOuterSwitch.children[0], REVERSE_CLASS);
        containerSwitchSign = false;
    }
});

/** 绑定最外层容器的拖动按钮 **/
bindDrag(playerLocation, function (startEve) {
    let result = [];
    result.push(startEve.clientX - fc.offsetLeft);
    result.push(startEve.clientY - fc.offsetTop);
    return result;
}, function (processEve, params) {
    let x = processEve.clientX - params[0];
    x = x < 0 ? 0 : x;
    let maxX = document.documentElement.clientWidth - fc.offsetWidth;
    x = maxX > 0 && x > maxX ? maxX : x;
    x = maxX <= 0 ? 0 : x;
    let y = processEve.clientY - params[1];
    y = y < 0 ? 0 : y;
    let maxY = document.documentElement.clientHeight - fc.offsetHeight;
    y = maxY > 0 && y > maxY ? maxY : y;
    y = maxY <= 0 ? 0 : y;
    fc.style.left = x + "px";
    fc.style.top = y + "px";
    setting.distance = y;
}, function (){
    STORE.get().setSetting(setting);
});

/** 绑定播放单的左右拖动效果 **/
let globalSign = 1, released;
addHandler(PlayerListWrapper, "mousedown", function (e){
    fc.classList.add(UNSELECTABLE_CLASS);
    let dpl = PlayerListWrapper.children[0];
    let lastLocation, start = lastLocation = e.clientX;
    let max = calculateMaxListMargin();
    released = true;
    if(max > 0){
        max += 10;
        let currentSign = globalSign = Math.random();
        let thisTime, lastTime = thisTime = window.performance.now();
        document.onmousemove = function (ev){
            if(released){
                lastTime = thisTime;
                thisTime = window.performance.now();
                lastLocation = ev.clientX;
                let distance = lastLocation - start;
                resetMaxMarginLeft(dpl, distance, max);
            }
        }
        document.onmouseout = document.onmouseup = function (ev){
            if(lastLocation !== start){
                lastTime = thisTime;
                thisTime = window.performance.now();
                released = false;
                let speed = (ev.clientX - lastLocation) / (thisTime - lastTime) / 2;
                //超过边界时将会惯性减速运动，运动间隔20ms，共运动25次，共计500ms
                let step = 20, times = 0;
                let inter = setInterval(function (){
                    if(times ++ < 25){
                        resetMaxMarginLeft(dpl, step * speed, max);
                        speed = speed * 0.9;
                    }else {
                        clearInterval(inter);
                        if(currentSign === globalSign){
                            fc.classList.remove(UNSELECTABLE_CLASS);
                            document.onmouseout = document.onmouseup = document.onmousemove = null;
                        }
                    }
                }, step);
            }else{
                fc.classList.remove(UNSELECTABLE_CLASS);
                document.onmouseout = document.onmouseup = document.onmousemove = null;
            }
        }
    }
});
/** 重置元素左边界的最大值 **/
function resetMaxMarginLeft(ele, distance, max){
    let current = ele.style.marginLeft;
    current = "" === current ? 0 : parseInt(current);
    current += distance;
    current = current > -max ? current : -max;
    current = current < 0 ? current : 0;
    ele.style.marginLeft = current + "px";
}

/** 绑定媒体列表页的滚轮监听 **/
let lastScrollTime = 0, continuousScrollTimes = 0;
addHandler(mediaSingleContainer, "wheel", function (event){
    let now = window.performance.now();
    if(now - lastScrollTime < 400){
        continuousScrollTimes ++;
    }else continuousScrollTimes = 0;
    lastScrollTime = now;
    //step为每次滚动后页面移动的距离，基数为24，连续滚动后的每次滚动都会使此值增长，连续滚动的次数越多，增长的速度也更快;
    let step = 12 * ~~(Math.pow(1.1,continuousScrollTimes / 3 + 10));
    let max = totalMediaSliderHeight - mediaSingleContainer.offsetHeight;
    let current = mediaSingleSlider.style.marginTop;
    current = "" === current ? 0 : -parseInt(current);
    // Win平台网页滚动与鼠标滚动方向相反，Mac相同
    let direction = getScrollDirection(event);
    direction = IS_IOS ? direction : !direction;
    current -= (direction ? -1 : 1) * step;
    current = current > max ? max : current;
    current = current < 0 ? 0 : current;
    mediaSingleSlider.style.marginTop = -current + "px";
});
/** 绑定媒体封面图片触发动作，交由隐藏的文件上传input实际操作 **/
addHandler(playDisplay, "click", function (){playDisplay.children[2].click()});
/** 绑定音量进度条点击事件 **/
addHandler(soundController, "click", function (event){
    let width = event.pageX - soundController.getBoundingClientRect().left;
    changeSound(width / soundController.offsetWidth);
});
/** 绑定音量进度条拖动事件 **/
bindDrag(soundController.children[1], null, function (event){
    let width = event.pageX - soundController.getBoundingClientRect().left;
    changeSound(width / soundController.offsetWidth);
});
/** 播放按钮 **/
let progressFlag, circleFlag, currentImgDegree = 0;
addHandler(playSwitch, "click", function (){
    clearInterval(progressFlag);
    clearInterval(circleFlag);
    if (playResource.paused || playResource.ended) {
        if (playResource.ended) {
            playResource.currentTime = 0;
        }
        if(!currentMediaSrc){
            notice("请选择播放的媒体资源");
            return;
        }
        try{
            playResource.play();
        }catch (e) {
            notice("无效的媒体资源：" + playResource.src, e);
            return;
        }
        playSwitch.title = "暂停";
        playSwitch.style.background = "url(images/square.svg)";
        playResource.onloadedmetadata = function (){
            totalProcess.innerHTML = calculateTime(this.duration);
            playResource.onloadedmetadata = null;
        }
        progressFlag = setInterval(function (){
            let percent = playResource.currentTime / playResource.duration;
            resetProcess(percent, false);
        }, 25);
        circleFlag = circle(currentMediaImg, 25, currentImgDegree);
    } else {
        playResource.pause();
        playSwitch.title = "播放";
        playSwitch.style.background = "url(images/triangle_right.svg)";
        currentImgDegree = parseInt(currentMediaImg.style.transform.replace(/[^0-9]/ig,""));
    }
});
/** 绑定播放进度条点击 **/
addHandler(processController, "click", function (event){
    resetProcess((event.pageX - processController.getBoundingClientRect().left) / processController.offsetWidth, true);
});
/** 绑定播放进度条拖动 **/
bindDrag(processController.children[1], null, function (ev) {
    resetProcess((ev.pageX - processController.getBoundingClientRect().left) / processController.offsetWidth, true);
});
/** 绑定播放界面的播放顺序切换 **/
addHandler(playOrder, "click", function (){
    setPlayOrder((setting.order + 1) % ORDER_MAP.size);
});
/** 绑定播放界面的播放速度切换 **/
addHandler(playSpeed, "click", function (){
    setPlaySpeed((setting.speed + 1) % SPEED_MAP.size);
});
/** 绑定配置界面的导出配置按钮 **/
addHandler(document.getElementById("player_setting_in"), "click", function (){downloadFile("Setting.conf", JSON.stringify(setting))});
/** 绑定配置界面的导入配置按钮 **/
addHandler(document.getElementById("player_setting_out"), "click", function (){this.children[0].click()});
/** 绑定播放界面的隐藏开关 **/
addHandler(playerStoreSwitch, "click", function (){
    setting.stretch = !setting.stretch;
    STORE.get().setSetting(setting);
    displayToggle(playerStoreOuter);
    this.title = setting.stretch ? "隐藏播放列表" : "展开播放列表";
});
/** 绑定播放列表的重置高度功能 **/
bindDrag(createArea, function (oldEve){
    let result = [];
    result.push(oldEve.clientY);
    result.push(mediaSingleContainer.offsetHeight);
    return result;
}, function (ev, params) {
    let target = ev.clientY - params[0] + params[1];
    target = target < 0 ? 0 : target;
    setting.getCurrentPlayList().listHeight = target = target > totalMediaSliderHeight ? totalMediaSliderHeight : target;
    mediaSingleContainer.style.height = mediaSingleContainer.style.maxHeight = target + "px";
    let margin = mediaSingleSlider.style.marginTop;
    margin = "" === margin ? 0 : -parseInt(margin);
    if((margin + target) > totalMediaSliderHeight){
        mediaSingleSlider.style.marginTop = (target - totalMediaSliderHeight) + "px";
    }
}, function (){
    STORE.get().setSetting(setting);
});
/** 绑定添加界面的三个按钮点击事件 **/
let initMaskId = uuid(10);
addHandler(createArea.children[0], "click", function (){
    showInput("请输入远程媒体全路径", null, function (val, event){openRemoteMediaFile(val, event, initMaskId)}, function (){hideInput(initMaskId)}, initMaskId);
});
addHandler(createArea.children[1], "click", function (){
    showInput("请输入本地文件夹前缀", null, function (val, event){openLocalMediaFile(false, val, event, initMaskId)}, function (){hideInput(initMaskId)}, initMaskId);
});
addHandler(createArea.children[2], "click", function (){
    showInput("请输入本地文件夹前缀", null, function (val, event){openLocalMediaFile(true, val, event, initMaskId)}, function (){hideInput(initMaskId)}, initMaskId);
});

/* --------------------- 渲染初始值 ------------------------ */
/* ----------- 初始化界面 ---------- */
loadConfig(setting);