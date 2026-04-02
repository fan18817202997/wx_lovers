
// /**
//  * @description Controller 和 Service 抛出异常处理
//  * @author ruiyong-lee
//  * @return {function} function
//  */
'use strict';

module.exports = () => {
	return async (ctx, next) => {
		const method = ctx.request.method;
    // 当请求方法为OPTIONS，通常为axios做验证请求，直接响应httpStatus204 no content即可
    if (method === 'OPTIONS') {
      ctx.status = 204;
      return;
    }
		try {
			await next()
		} catch (err) {
			// 所有异常都在app上触发一个error事件，框架会自动记录一条错误日志
			ctx.app.emit('error', err, ctx)
			// #region agent log
			console.error('[agent-debug][onError]', JSON.stringify({
				path: ctx.path,
				method: ctx.method,
				message: err && err.message ? err.message : '',
				stackTop: err && err.stack ? String(err.stack).split('\n').slice(0, 3).join(' | ') : '',
			}))
			ctx.app.curl('http://127.0.0.1:7771/ingest/41b92aae-4107-48cd-9382-74fd1c77ea66', {
				method: 'POST',
				dataType: 'json',
				headers: { 'X-Debug-Session-Id': '04abb4' },
				contentType: 'json',
				data: {
					sessionId: '04abb4',
					runId: `onError_${Date.now()}`,
					hypothesisId: 'H5',
					location: 'app/middleware/onError.js:catch',
					message: 'middleware caught error',
					data: {
						path: ctx.path,
						method: ctx.method,
						errorMessage: err && err.message ? err.message : '',
						stackTop: err && err.stack ? String(err.stack).split('\n')[0] : '',
					},
					timestamp: Date.now(),
				},
			}).catch(() => {})
			// #endregion

			const status = err.status || 500
			//生产环境时500错误的详细信息不返回给客户端
			const error = status === 500 && ctx.app.config.env === 'prod' ? '服务器错误' : err.message

			// 从error对象上读出各个属性，设置到响应中
			if (status === 422) {
				return ctx.body = {
					code: status,
					msg: '参数检验失败',
					data: err.errors
				}
			}
			ctx.body = {
				code: status,
				msg: error,
				data: null
			}
			ctx.status = status
		}
	}
}