'use strict';

const Controller = require('egg').Controller;
const amapData = require('../../utils/amap.js')
// const fs = require('fs')
// const jsonPath = './utils/usercity.json'
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

class HomeController extends Controller {
    async verify() {
        const { ctx, service } = this
        const { signature, echostr, timestamp, nonce } = ctx.query
        const verifyRes = await service.wx.verifySignature(timestamp, nonce, signature)
        if (verifyRes) {
        // 这里不要返回其他任何东西过去，only echostr is 好
            ctx.body = echostr
        } else {
            ctx.fail()
        }
    }

    // 获取access_token
    async getAccessToken() {
        const { ctx, service } = this
        const accessToken = await service.wx.getAccessToken()
        ctx.ok({
            data: accessToken
        })
    }

    // 监听微信订阅消息
    async onListen() {
        const { ctx, service } = this
        const message = ctx.request.body
        let reply
        if(message.MsgType === 'event') {
            reply = await service.wxNotify.handleEvent(message)
        } else {
            reply = await service.wxNotify.handleMsg(message)
        }
        if (reply) {
            const result = await service.wxNotify.replyMsg(message, reply)
            ctx.body = result
        } else {
            ctx.body = 'success'
        }
    }

    // 发送订阅通知
    async sendNotify() {
        const runId = `sendNotify_${Date.now()}`
        // #region agent log
        postDebug(this.ctx.app, {sessionId:'04abb4',runId,hypothesisId:'H1',location:'app/controller/wx.js:sendNotify',message:'enter sendNotify',data:{method:'POST'},timestamp:Date.now()})
        // #endregion
        try {
            const { ctx, service } = this
            await service.wxNotify.snedNotify(runId)
            // #region agent log
            postDebug(this.ctx.app, {sessionId:'04abb4',runId,hypothesisId:'H1',location:'app/controller/wx.js:sendNotify',message:'sendNotify finished',data:{ok:true},timestamp:Date.now()})
            // #endregion
            ctx.ok({ msg: '推送任务执行完成' })
        } catch (error) {
            console.log(error)
            // #region agent log
            postDebug(this.ctx.app, {sessionId:'04abb4',runId,hypothesisId:'H5',location:'app/controller/wx.js:sendNotify',message:'sendNotify failed',data:{errorMessage:error && error.message ? error.message : 'unknown',stackTop:error && error.stack ? String(error.stack).split('\n')[0] : ''},timestamp:Date.now()})
            // #endregion
            // #region agent log
            ctx.fail({
                msg: error.message || '推送失败',
                data: {
                    stackTop: error && error.stack ? String(error.stack).split('\n').slice(0, 5).join(' | ') : '',
                },
            })
            // #endregion
        }
    }

    async createWxMenu() {
        const { service } = this
        await service.wx.createMenu()
    }

    async clearRedis() {
        const { service, ctx } = this
        await service.redisModule.flushall()
        ctx.ok()
    }

    async clearquota() {
        const { ctx, service } = this
        const res = await service.wx.clearQuota()
        if(res) {
            ctx.ok({
                msg: res
            })
        }
    }

    async setCity() {
        const { ctx, app, service } = this
        try {
            const { city } = ctx.query
            if(!city) return ctx.fail({msg: '设置失败'})
            const findCity = amapData.find(i => i.adname === city)
            if(!findCity) return ctx.fail({msg: '没有找到城市'})
            // fs.writeFileSync(jsonPath, JSON.stringify(findCity), 'utf8')
            // await service.redisModule.del('cacheWether')
            app.config.userCity = findCity
            ctx.ok({msg: '设置成功'})
        } catch (error) {
            ctx.fail({msg: error})
        }
    }

    async test() {
        const { ctx, app } = this
        ctx.ok({data: app.config.userData, msg: '测试接口成功'})
    }
}

module.exports = HomeController;
