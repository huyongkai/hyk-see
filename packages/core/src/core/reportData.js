import { _support, generateUUID, getLocationHref, validateOptions, isEmpty, Queue, isBrowserEnv } from "@hyk-see/utils";
import { SDK_VERSION, EVENTTYPES } from "@hyk-see/common";
import { breadcrumb } from "./breadcrumb";
import { options } from "./options";

// 用来上报数据，包含图片打点上报，xhr 请求
export class TransportData {
    queue = new Queue(); // 消息队列
    apikey = ""; // 每个项目对应的唯一标识
    errorDsn = ""; // 监控上报接口的地址
    userId = ""; // 用户 id
    uuid = ""; // 每次页面加载的唯一标识
    beforeDataReport = null; // 上报数据前的 hook
    getUserId = null; // 用户地定义获取 userId 的方法
    useImgUpload = false; // 是否使用图片打点上报

    constructor() {
        this.uuid = generateUUID(); // 每次页面加载的唯一标识
    }

    beacon(url, data) {
        return navigator.sendBeacon(url, JSON.stringify(data));
    }

    imgRequest(data, url) {
        const requestFun = () => {
            const img = new Image();
            const spliceStr = url.indexOf("?") === -1 ? "?" : "&";
            img.src = `${url}${spliceStr}data=${encodeURIComponent(
                JSON.stringify(data)
            )}`;
        };

        this.queue.addFn(requestFun);
    }
    
    async beforePost(this, data) {
        let transportData = this.getTransportData(data);

        if (typeof this.beforeDataReport === 'function') {
            transportData = this.beforeDataReport(transportData);
            if (!transportData) return false;
        }

        return transportData;
    }

    async xhrPost(data, url) {
        const requestFun = () => {
            fetch(`${url}`, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
        }

        this.queue.addFn(requestFun);
    }

    // 获取用户信息
    getAuthInfo() {
        return {
            userId: this.userId || this.getAuthId() || '',
            sdkVersion: SDK_VERSION,
            apikey: this.apikey,
        }
    }

    getAuthId() {
        if (typeof this.getUserId === 'function') {
            const id = this.getUserId();
            if (typeof id === 'string' || typeof id === 'number') {
                return id;
            } else {
                console.error(`useId：${id} 期望返回 string 或 number 类型，实际返回值为：${typeof id}`);
            }
        }
        return '';
    }

    // 添加公共信息
    // 不要添加时间戳，比如接口报错，发送的时间和上报时间不一致
    getTransportData(data) {
        const info = {
            ...data,
            ...this.getAuthInfo(), // 用户信息
            uuid: this.uuid,
            pageUrl: getLocationHref(),
            deviceInfo: _support.deviceInfo, // 设备信息
        }

        // 性能数据，录屏，白屏检测等不需要附带用户行为
        const excludeBreadcrumb = [
            EVENTTYPES.PERFORMANCE,
            EVENTTYPES.RECORDSCREEN,
            EVENTTYPES.WHITESCREEN,
        ]

        if (!excludeBreadcrumb.includes(info.type)) {
            info.breadcrumb = breadcrumb.getStack(); // 用户行为栈
        }

        return info;
    }
    

    // 判断请求是否为 SDK 配置的接口
    isSdkTransportUrl(targetUrl) {
        let isSdkDsn = false;
        if (this.errorDsn && targetUrl.indexOf(this.errorDsn) !== -1) {
            isSdkDsn = true;
        }

        return isSdkDsn;
    }

    bindOptions(initOptions) {
        const { dsn, apikey, beforeDataReport, userId, getUserId, useImgUpload } = initOptions;
        validateOptions(dsn, 'dsn', 'string') && (this.errorDsn = dsn);
        validateOptions(apikey, 'apikey', 'string') && (this.apikey = apikey);
        validateOptions(beforeDataReport, 'beforeDataReport', 'function') && (this.beforeDataReport = beforeDataReport);
        validateOptions(userId, 'userId', 'string') && (this.userId = userId || '');
        validateOptions(getUserId, 'getUserId', 'function') && (this.getUserId = getUserId);
        validateOptions(useImgUpload, 'useImgUpload', 'boolean') && (this.useImgUpload = useImgUpload || false);
    }

    // 上报数据
    async send(data) {
        const dsn = this.errorDsn;
        if (!isEmpty(dsn)) {
            console.error('dsn 不能为空');
            return;
        }

        // 开启录屏, 由@hyk-see/recordscreen 插件处理
        if (_support.options.silentRecordScreen) {
            if (options.recordScreenTypeList.includes(data.type)) {
                _support.hasError = true;
                data.recordScreenId = _support.recordScreenId;
            }
        }

        const result = await this.beforePost(data);
        if (isBrowserEnv && result) {
            // 优先使用 sendBeacon 上报, 若数据量大，再使用图片打点上报和 fetch 上报
            const value = this.beacon(dsn, result);
            if (!value) { 
                return this.useImgUpload ? this.imgRequest(result, dsn) : this.xhrPost(result, dsn);
            }
        }
    }
}

const transportData = _support.transportData || (_support.transportData = new TransportData());
export { transportData };
