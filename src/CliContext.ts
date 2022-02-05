/**
 * interface of CliContext
 */
export interface ICliContext {
	readonly isHelp: boolean
	readonly isVerbose: boolean
	readonly action: string
	readonly params: { [i: string]: string[] | undefined }
	readonly env: { [i: string]: any }
	readonly store: { [i: string]: any }

	setHelp(): void
	setVerbose(): void

	// used in switch action
	setAction(actionName: string): void

	// used in param
	addParam(name: string, value: string): void
	getParam(name: string, defaultValue?: string): string | undefined
	getParams(name: string): string[]

	// used in env.
	setEnv(name: string, value: string | undefined): void
	getEnv(name: string): string | undefined

	// used plug communicate, payload transfer.
	putPayload(payload: any): void
	takePayload(): any

	// used in debug, verbose
	debug(...msg: string[]): void
	log(...msg: string[]): void
}

/**
 * ## Cli Context
 * 
 * basicly, this is used as a data store center, that wrap with some runtime data.
 */
export class CliContext implements ICliContext {

	// private data
	private _isHelp: boolean = false;
	private _isVerbose: boolean = false;
	private _action: string = '';
	private _payload: any = null;

	readonly params: { [i: string]: any[] | undefined }
	readonly env: { [i: string]: any }
	readonly store: { [i: string]: any }


	constructor() {
		this.params = {};
		this.env = {};
		this.store = {};
	}

	get isHelp() { return this._isHelp }
	get isVerbose() { return this._isVerbose }
	get action() { return this._action }

	/**
	 * 将context设置成help模式，
	 * 则所有过程都只返回帮助信息
	 */
	setHelp(): void {
		this._isHelp = true;
	}

	setVerbose(): void {
		this._isVerbose = true;
	}

	setAction(actionName: string): void {
		if (this.action === '') {
			this._action = actionName;
		}
		else {
			throw new Error('CliContext: set action only once.')
		}
	}

	addParam(name: string, value: string): void {
		if (!this.params[name]) {
			this.params[name] = [];
		}
		this.params[name]!.push(value);
	}

	getParam(name: string, defaultValue?: string): string | undefined {
		let params = this.params[name];
		return (params && params[0]) || defaultValue;
	}

	getParams(name: string): string[] {
		return this.params[name] || [];
	}

	setEnv(name: string, value: string | undefined): void {
		this.env[name] = value;
	}

	getEnv(name: string): string | undefined {
		return this.env[name];
	}

	putPayload(payload: any): void {
		if (this._payload) {
			throw new Error('there is already a payload in context.')
		}
		this._payload = payload;
	}

	takePayload<T>(): T {
		if (!this._payload) {
			throw new Error('do not get a payload in context.')
		}
		let ret = this._payload as T;
		this._payload = undefined;
		return ret;
	}

	debug(...msg: string[]): void {
		if (this._isVerbose) {
			console.debug('[debug]', ...msg);
		}
	}

	log(...msg: string[]): void {
		console.log(...msg)
	}
}