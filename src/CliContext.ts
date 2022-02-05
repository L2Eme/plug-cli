/**
 * interface of CliContext
 */
export interface ICliContext {
	readonly isHelp: boolean
	readonly action: string
	readonly params: { [i: string]: string[] | undefined }
	readonly env: { [i: string]: any }
	payload: any

	setHelp(): void

	// used in switch action
	setAction(actionName: string): void

	// used in param
	addParam(name: string, value: any): void
	getParam(name: string, defaultValue: any): any
	getParams(name: string): any[]

	// used in env
}

/**
 * ## Cli Context
 * 
 * basicly, this is used as a data store center, that wrap with some runtime data.
 */
export class CliContext implements ICliContext {

	// private data
	private _isHelp: boolean = false;
	private _action: string = '';

	readonly params: { [i: string]: any[] | undefined }
	readonly env: { [i: string]: any }

	payload: any

	constructor() {
		this.params = {};
		this.env = {};
		this.payload = null;
	}

	get isHelp() { return this._isHelp }
	get action() { return this._action }

	/**
	 * 将context设置成help模式，
	 * 则所有过程都只返回帮助信息
	 */
	setHelp(): void {
		this._isHelp = true;
	}

	setAction(actionName: string): void {
		if (this.action === '') {
			this._action = actionName;
		}
		else {
			throw new Error('CliContext: set action only once.')
		}
	}

	addParam(name: string, value: any): void {
		if (!this.params[name]) {
			this.params[name] = [];
		}
		this.params[name]!.push(value);
	}

	getParam(name: string, defaultValue: any) {
		let params = this.params[name];
		return (params && params[0]) || defaultValue;
	}

	getParams(name: string): any[] {
		return this.params[name] || [];
	}
}