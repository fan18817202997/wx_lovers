'use strict';
const Service = require('egg').Service;
const WEEKS  = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
const dayjs = require('dayjs')
const apiUrl = {
    gdWether: 'https://restapi.amap.com/v3/weather/weatherInfo',
    tianxing: 'http://api.tianapi.com',
    aitext: 'http://api.qingyunke.com/api.php',
    words: 'https://v1.hitokoto.cn'
}
const fs = require('fs')
const DEBUG_ENDPOINT = 'http://127.0.0.1:7771/ingest/41b92aae-4107-48cd-9382-74fd1c77ea66'

function postDebug(app, payload) {
    app.curl(DEBUG_ENDPOINT, {
        method: 'POST',
        dataType: 'json',
        headers: { 'X-Debug-Session-Id': '04abb4' },
        contentType: 'json',
        data: payload,
    }).catch(() => {})
}
class NotifyUtils extends Service {
    // 星期几
    getWeek() {
        return WEEKS[dayjs().day()]
    }

    // 在一起的天数
    getTogetherDays(cur, old) {
        return dayjs(cur).diff(old, 'day') + 1
    }

    // 计算距离生日时间
    birthDays(birthDay) {
        const curDate = Date.now()
        const dateArr = birthDay.split('-')
        dateArr[0] = dayjs(curDate).format('YYYY')
        const curBirthStand = dayjs(dateArr.join('-')).valueOf() // 今年的生日
        if(curDate > curBirthStand) {
            const nextBirth = dayjs(curBirthStand).add(1, 'year')
            return dayjs(nextBirth).diff(curDate, 'day') + 1
        } else {
            return dayjs(curBirthStand).diff(curDate, 'day') + 1 
        }
    }

    // 获取随机励志吉言
    async getLizhi() {
        const { app } = this
        const res = await app.curl(apiUrl.words, {
            method: 'GET',
            dataType: 'json'
        })
        if(res.status === 200) {
            return res.data.hitokoto || null
        } else {
            throw new Error("随机励志吉言获取失败，这是一个免费的借口")
        }
    }

    // 获取天气
    async getWether() {
        const { app, service } = this
        // let cityData = fs.readFileSync('./utils/usercity.json', 'utf8')
        let cityData = app.config.userCity || null
        if(!cityData) return null
        // #region agent log
        postDebug(app, {
            sessionId: '04abb4',
            runId: `getWether_${Date.now()}`,
            hypothesisId: 'H6',
            location: 'app/service/notifyUtils.js:getWether',
            message: 'weather request params',
            data: {
                hasAmapKey: !!(app.config.apiConfig && app.config.apiConfig.amap && app.config.apiConfig.amap.appKey),
                adname: cityData.adname || '',
                adcode: cityData.adcode || '',
            },
            timestamp: Date.now(),
        })
        // #endregion
        const res = await app.curl(`${apiUrl.gdWether}`, {
            method: 'GET',
            dataType: 'json',
            data: {
                key: app.config.apiConfig.amap.appKey,
                city: app.config.userData.city,
                city: cityData.adcode
            }
        })
        // #region agent log
        postDebug(app, {
            sessionId: '04abb4',
            runId: `getWether_${Date.now()}`,
            hypothesisId: 'H7',
            location: 'app/service/notifyUtils.js:getWether',
            message: 'weather response summary',
            data: {
                httpStatus: res.status,
                status: res.data && res.data.status ? res.data.status : '',
                info: res.data && res.data.info ? res.data.info : '',
                infocode: res.data && res.data.infocode ? res.data.infocode : '',
                count: res.data && res.data.count ? res.data.count : '',
            },
            timestamp: Date.now(),
        })
        // #endregion
        
        if(res.status === 200 && res.data.status === '1') {
            const wether = res.data.lives[0]
            return wether
        } else {
            throw new Error(`天气接口请求失败: ${res.data && res.data.info ? res.data.info : 'unknown'} (${res.data && res.data.infocode ? res.data.infocode : 'no_code'})`)
        }
            
    }

    // 获取彩虹屁
    async getCaihongPi() {
        const { app } = this
        const res = await app.curl(`${apiUrl.tianxing}/caihongpi/index?key=${app.config.apiConfig.tianxingKey}`, {
            method: 'GET',
            dataType: 'json'
        })
        if(res.status === 200 && res.data.code === 200) {
            return res.data.newslist[0].content
        } else {
            throw new Error('第三方天行彩虹屁接口请求失败')
        }
    }

    // aiText
    async sendAiText(text) {
        try {
            const { app } = this
            if(!text || typeof text !== 'string') return '请输入内容'
            const { key, appid }= app.config.apiConfig.aiChat
            const res = await app.curl(`${apiUrl.aitext}?key=${key}&appid=${appid}&msg=${encodeURI(text)}`, {
                method: 'GET',
                dataType: 'json'
            })
            if(res.data.result === 0) {
                return res.data.content
            } else {
                return 'ai接口错误'
            }
        } catch (error) {
            return 'ai接口错误'
        }
    }


}

module.exports = NotifyUtils;
