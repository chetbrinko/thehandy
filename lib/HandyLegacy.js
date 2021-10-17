"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const baseUrl = "https://www.handyfeeling.com/api/v1/";
/** Class to connect to and control a Handy using the HandyFeeling API V1 for devices with firmware v2.x. Will probably stop working eventually. And is no longer being suppoorted */
class Handy {
    constructor(connectionKey) {
        if (connectionKey) {
            this._connectionKey = connectionKey;
            localStorage.setItem("connectionKey", connectionKey);
        }
        else {
            const storedConnectionKey = localStorage.getItem("connectionKey");
            if (storedConnectionKey)
                this._connectionKey = storedConnectionKey;
            else
                this._connectionKey = "";
        }
        this.serverTimeOffset = 0;
    }
    get connectionKey() {
        return this._connectionKey;
    }
    set connectionKey(connectionKey) {
        this._connectionKey = connectionKey;
        localStorage.setItem("connectionKey", connectionKey);
    }
    //---------------------------------------------
    //                  GET DATA
    //---------------------------------------------
    setMode(mode) {
        return __awaiter(this, void 0, void 0, function* () {
            this.enforceConnectionKey();
            const url = this.getUrl("setMode") + "?mode=" + mode;
            const response = yield fetch(url);
            const json = yield response.json();
            if (json.error)
                throw json;
            return json;
        });
    }
    toggleMode(mode) {
        return __awaiter(this, void 0, void 0, function* () {
            this.enforceConnectionKey();
            const url = this.getUrl("toggleMode") + "?mode=" + mode;
            const response = yield fetch(url);
            const json = yield response.json();
            if (json.error)
                throw json;
            return json;
        });
    }
    setSpeed(speed, absolute) {
        return __awaiter(this, void 0, void 0, function* () {
            this.enforceConnectionKey();
            const type = absolute ? "mm/s" : "%";
            const url = this.getUrl("setSpeed") + "?speed=" + speed + "&type=" + type;
            const response = yield fetch(url);
            const json = yield response.json();
            if (json.error)
                throw json;
            return json;
        });
    }
    setStroke(speed, absolute) {
        return __awaiter(this, void 0, void 0, function* () {
            this.enforceConnectionKey();
            const type = absolute ? "mm" : "%";
            const url = this.getUrl("setStroke") + "?stroke=" + speed + "&type=" + type;
            const response = yield fetch(url);
            const json = yield response.json();
            if (json.error)
                throw json;
            return json;
        });
    }
    setStrokeZone(min, max) {
        return __awaiter(this, void 0, void 0, function* () {
            this.enforceConnectionKey();
            const url = this.getUrl("setStrokeZone") + "?min=" + min + "&max=" + max;
            const response = yield fetch(url);
            const json = yield response.json();
            if (json.error)
                throw json;
            return json;
        });
    }
    stepSpeed(directionUp) {
        return __awaiter(this, void 0, void 0, function* () {
            this.enforceConnectionKey();
            const url = this.getUrl("stepSpeed") + "?step=" + directionUp;
            const response = yield fetch(url);
            const json = yield response.json();
            if (json.error)
                throw json;
            return json;
        });
    }
    stepStroke(directionUp) {
        return __awaiter(this, void 0, void 0, function* () {
            this.enforceConnectionKey();
            const url = this.getUrl("stepStroke") + "?step=" + directionUp;
            const response = yield fetch(url);
            const json = yield response.json();
            if (json.error)
                throw json;
            return json;
        });
    }
    //---------------------------------------------
    //                  GET DATA
    //---------------------------------------------
    getVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            this.enforceConnectionKey();
            const url = this.getUrl("getVersion");
            const response = yield fetch(url);
            const json = yield response.json();
            if (json.error)
                throw json;
            return json;
        });
    }
    getSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            this.enforceConnectionKey();
            const url = this.getUrl("getSettings");
            const response = yield fetch(url);
            const json = yield response.json();
            if (json.error)
                throw json;
            return json;
        });
    }
    getStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            this.enforceConnectionKey();
            const url = this.getUrl("getStatus");
            const response = yield fetch(url);
            const json = yield response.json();
            if (json.error)
                throw json;
            return json;
        });
    }
    //---------------------------------------------
    //             SERVER TIME SYNC
    //---------------------------------------------
    getServerTimeOffset(trips = 30, onProgress) {
        return __awaiter(this, void 0, void 0, function* () {
            this.enforceConnectionKey();
            const url = this.getUrl("getServerTime");
            //don't count the first one
            yield (yield fetch(url)).json();
            let offsets = [];
            for (let i = 0; i < trips; i++) {
                const startTime = new Date().valueOf();
                const response = yield fetch(url);
                const json = yield response.json();
                const endTime = new Date().valueOf();
                const rtd = endTime - startTime;
                const estimatedServerTime = Number(json.serverTime) + rtd / 2;
                const offset = estimatedServerTime - endTime;
                offsets.push(offset);
                if (onProgress)
                    onProgress(i / trips);
            }
            //discard all readings more than one standard deviation from the mean, to reduce error
            const mean = offsets.reduce((acc, offset) => acc + offset, 0) / offsets.length;
            const errors = offsets.map(offset => Math.pow(offset - mean, 2));
            const sd = Math.sqrt(errors.reduce((acc, offset) => acc + offset, 0) / errors.length);
            offsets = offsets.filter(offset => Math.abs(offset - mean) < sd);
            //get average offset
            const offsetAggregate = offsets.reduce((acc, offset) => acc + offset) / offsets.length;
            this.serverTimeOffset = offsetAggregate;
            return this.serverTimeOffset;
        });
    }
    //---------------------------------------------
    //                 VIDEO SYNC
    //---------------------------------------------
    syncPrepare(scriptUrl, name, size) {
        return __awaiter(this, void 0, void 0, function* () {
            this.enforceConnectionKey();
            let url = this.getUrl("syncPrepare") + "?url=" + scriptUrl + "&timeout=30000";
            if (name)
                url += "&name=" + name;
            if (size)
                url += "&size=" + size;
            const response = yield fetch(url);
            const json = yield response.json();
            if (json.error)
                throw json;
            return json;
        });
    }
    syncPlay(play = true, time = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            this.enforceConnectionKey();
            const serverTime = Math.round(new Date().valueOf() + this.serverTimeOffset);
            const url = this.getUrl("syncPlay") +
                "?play=" +
                play +
                "&serverTime=" +
                serverTime +
                "&time=" +
                time;
            const response = yield fetch(url);
            const json = yield response.json();
            if (json.error)
                throw json;
            return json;
        });
    }
    syncOffset(offset) {
        return __awaiter(this, void 0, void 0, function* () {
            this.enforceConnectionKey();
            const url = this.getUrl("syncOffset") + "?offset=" + offset;
            const response = yield fetch(url);
            const json = yield response.json();
            if (json.error)
                throw json;
            return json;
        });
    }
    syncAdjustTimestamp(videoTimeSeconds, filter = 0.5) {
        return __awaiter(this, void 0, void 0, function* () {
            this.enforceConnectionKey();
            const url = this.getUrl("syncAdjustTimestamp") +
                "?currentTime=" +
                videoTimeSeconds * 1000 +
                "&serverTime=" +
                Math.round(new Date().valueOf() + this.serverTimeOffset) +
                "&filter=" +
                filter;
            const response = yield fetch(url);
            const json = yield response.json();
            if (json.error)
                throw json;
            return json;
        });
    }
    uploadCsv(csv, filename) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = "https://www.handyfeeling.com/api/sync/upload";
            if (!filename)
                filename = "script_" + new Date().valueOf() + ".csv";
            const formData = new FormData();
            formData.append("syncFile", csv, filename);
            const response = yield fetch(url, {
                method: "post",
                body: formData,
            });
            const newUrl = yield response.json();
            return newUrl;
        });
    }
    //---------------------------------------------
    //                  UTILS
    //---------------------------------------------
    enforceConnectionKey() {
        if (!this.connectionKey)
            throw new Error("connection key not set");
    }
    getUrl(cmd) {
        return baseUrl + this.connectionKey + "/" + cmd;
    }
}
exports.default = Handy;
//# sourceMappingURL=HandyLegacy.js.map