// import * as rl from 'readline-sync';
import { readFileSync, existsSync } from 'fs';
import { THandler, TPlug, combinePlugs } from '@line100/plug';
import { ICliContext } from './CliContext';

export { ICliContext, CliContext } from './CliContext';

/**
 * the process.argv
 */
export type TCmd = string[]

/**
 * Log Error Plug
 * 
 * 将后续的plug的运行action的error显示出来
 * 
 * @param this 
 * @param handler 
 * @returns 
 */
export function logError(this: ICliContext, handler: THandler) {
	return (cmd: TCmd) => {
		try {
			handler(cmd);
		}
		catch (err) {
			console.log(err);
			process.exit(-1);
		}
	}
}

export function logContext(this: ICliContext, handler: THandler) {
	return (cmd: TCmd) => {
		console.log(JSON.stringify(this, null, '  '))
		return handler(cmd);
	}
}

/**
 * ## Help Plug
 * 
 * Tag the `context.isHelp`, while the sub-command is `help`.
 * * 输出信息，使用`HelpDocPlug`包装
 * * 所有plug均可在action中判断`context.isHelp`
 * 
 * @param this 
 * @param handler 
 * @returns 
 */
export function helpCheck(this: ICliContext, handler: THandler) {
	return (cmd: TCmd) => {
		if (cmd[0] === 'help') {
			this.setHelp();
			return handler(cmd.slice(1));
		}
		return handler(cmd);
	}
}

/**
 * Wrap a message to print of a sub-command.
 * @param doc 
 * @returns 
 */
export const HelpDoc = (...docs: string[]) =>
	function (this: ICliContext, handler: THandler) {
		return (cmd: TCmd) => {
			if (this.isHelp) {
				docs.forEach(d => console.log(d));
			}
			return handler(cmd);
		}
	}

/**
 * Skip the rest plug while the `context.isHelp` is true.
 */
export const helpSkip = function(this: ICliContext, handler: THandler) {
	return (cmd: TCmd) => {
		if (this.isHelp) return;
		else return handler(cmd);
	}
}

/**
 * 创建SwitchAction Plug
 * 将cmd的第一个视为sub cmd。
 * 在map上寻找
 * @param actionMap 
 * @returns 
 */
export const SwitchAction = (actionMap: { [i: string]: TPlug<ICliContext> | undefined }) =>
	function (this: ICliContext, handler: THandler) {

		let handlerMap: { [i: string]: THandler | undefined } = {};
		for (let i in actionMap) {
			handlerMap[i] = actionMap[i]?.bind(this)(handler);
		}

		return (cmd: TCmd) => {

			if (this.isHelp && cmd.length === 0) {

				console.log('Switch Sub Commands:')
				for (let k in handlerMap) {
					console.log('command', k);
				}

				return;
			}

			let actionName = handlerMap[cmd[0]] ? cmd[0] : '_default_';
			let h = handlerMap[actionName];
			if (h) {
				this.setAction(actionName)
				return h(cmd);
			}
			else {
				throw new Error(`Do not found a sub command on SwitchPlug map. Or you may set a '_default_' plug.`)
			}
		}
	}

/**
 * If Plug
 * 
 * 更具条件判断执行过程，
 * 可中断执行，可继续执行，
 * 
 * @param tester 
 * @param thenPlug 
 * @param elsePlug 
 * @returns 
 */
export const Ifp = (
	tester: (this: ICliContext, cmd: TCmd) => boolean,
	thenPlug: TPlug<ICliContext>,
	elsePlug?: TPlug<ICliContext>
) =>
	function (this: ICliContext, handler: THandler) {
		let test = tester.bind(this);
		let thenHandler = thenPlug.bind(this)(handler);
		let elseHandler = elsePlug?.bind(this)(handler) ?? handler;
		return (cmd: TCmd) => {

			if (this.isHelp) { // log all help message
				thenHandler(cmd);
				console.log();
				return elseHandler(cmd);
			}
			else {
				if (test(cmd)) return thenHandler(cmd);
				else return elseHandler(cmd);
			}
		}
	}

// /**
//  * 执行下一个plug前，与控制台交互，请求输入隐秘内容。
//  * @param paramName 
//  * @param msg 
//  * @param convert may throw an error to print some error message.
//  * @returns 
//  */
// export const SecretQuestion = (paramName: string, msg: string, convert?: (msg: string) => any) =>
// 	function (this: ICliContext, handler: THandler) {
// 		return (cmd: TCmd) => {

// 			if (this.isHelp) {
// 				console.log(`- SecretQuestion: prompt secret input to ${paramName}.`)
// 				return handler(cmd);
// 			}

// 			let inputMessage = rl.question(msg, { hideEchoBack: true });

// 			convert && convert(inputMessage);

// 			this.params[paramName] = inputMessage;
// 			return handler(cmd);
// 		}
// 	}

// /**
//  * 确认密码输入，对比两次输入是否相同
//  * @param paramName 
//  * @param msg 
//  * @param convert may throw an error to print some error message.
//  * @returns 
//  */
// export const ConfirmedPasswordInput = (paramName: string, msg: string, convert?: (msg: string) => any) =>
// 	function (this: ICliContext, handler: THandler) {
// 		return (cmd: TCmd) => {

// 			if (this.isHelp) {
// 				console.log(`- PasswordInput: get password by input twice ${paramName}.`)
// 				return handler(cmd);
// 			}

// 			let inputPasswd = rl.question(msg, { hideEchoBack: true });
// 			let confirmedPasswd = rl.question(msg, { hideEchoBack: true });

// 			if (inputPasswd != confirmedPasswd) {
// 				throw new Error('two Password is not the same.')
// 			}

// 			convert && convert(inputPasswd);

// 			this.params[paramName] = inputPasswd;
// 			return handler(cmd);
// 		}
// 	}

/**
 * 
 * 在cmd上收集指定param的数据，存放于数组中
 * 
 * 指定名字和数据个数
 * 
 * this is collect param data in an array
 * ```
 * {
 *   "params": {
 *   "-f": [
 *     "./tsconfig.json"
 *   ]
 * },
 * }
 * ```
 * 
 * @param paramName 
 * @param dataCount 
 * @returns 
 */
export const CollectParams = (paramName: string, dataCount: number = 1, convert?: (data: string[]) => string[]) =>
	function (this: ICliContext, handler: THandler) {
		return (cmd: TCmd) => {

			if (this.isHelp) {
				console.log(`- CollectParams: ${paramName} with ${dataCount} input data.`);
				return handler(cmd);
			}

			const findParamIndex = cmd.indexOf(paramName);
			if (findParamIndex > 0) {
				let data: string[] = cmd.slice(findParamIndex + 1, findParamIndex + 1 + dataCount);
				data.forEach(d => {
					if (!d || d.startsWith('-')) {
						throw new Error(`expected to get param ${paramName} for ${dataCount} data.`);
					}
				})
				this.params[paramName] = convert ? convert(data): data;
				return handler(cmd);
			}
			else {
				throw new Error(`expected to get param ${paramName}.`);
			}
		}
	}

/**
 * 获取param的string类型的value，或者用defaultValue代替
 * @param paramName 
 * @param defaultValue 
 * @returns 
 */
export const GetParamOr = (paramName: string, defaultValue: any) =>
	CollectParams(paramName, 1, (data) => {
		if (data.length == 0) return defaultValue;
		else return data[0];
	})

export const GetEnvOr = (envName: string, defaultValue?: any) =>
	function (this: ICliContext, handler: THandler) {
		return (cmd: TCmd) => {

			if (this.isHelp) {
				console.log(`- GetEnvOr: ${envName}, default is ${defaultValue ? defaultValue : 'undefined'}`)
				return handler(cmd);
			}

			this.env[envName] = process.env[envName] || defaultValue;
			handler(cmd);
		}
	}

export const GetFileParam = (paramName: string, convert?: (data: string) => any) =>
	combinePlugs(
		CollectParams(paramName, 1), // 根据param name获取文件名
		function (this: ICliContext, handler: THandler) {
			// 读取文件
			return (cmd: TCmd) => {

				if (this.isHelp) {
					console.log(`  GetFileParam: read file with param ${paramName}.`)
					return handler(cmd);
				}

				let fileName = this.getParam(paramName, undefined);
				if (fileName && existsSync(fileName)) {

					// save file content to replace FileName
					let d = readFileSync(fileName).toString();
					this.params[paramName] = convert ? convert(d) : d;

					return handler(cmd);
				}
				else {
					throw new Error(`file ${fileName} is not exist.`)
				}
			}
		}
	);