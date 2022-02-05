import assert from 'assert';
import * as plug from '@line100/plug';
import * as cli from '../index';

const versionCmdPlug: plug.TPlug<cli.ICliContext> = function(_h) {
	return (cmd: cli.TCmd) => {
		// command is ['version', ... ]
		assert(cmd[0] === 'version');
		if (this.isHelp) {
			this.log('show version of this package')
		}
		else {
			// show version in package.json file.
			let packageConfig = require('../../package.json');
			this.log(packageConfig['version']);
		}
	}
}

const searchCmdPlug: plug.TPlug<cli.ICliContext> = plug.combinePlugs(
	function (_h) {
		return (cmd: cli.TCmd) => {
			assert(cmd[0] === 'search')
			if (this.isHelp) {
				this.log('search something', cmd.slice(1).join(','))
			}
			else {
				this.debug('do some search')
				this.log('search result!!')
			}
		}
	}
)

export const handler = plug.createHandler(
	new cli.CliContext(),
	[
		cli.logError,

		cli.helpCheck,
		cli.verboseCheck,

		cli.SwitchAction({
			'version': versionCmdPlug,
			'search': searchCmdPlug,
		}),
		(_h) => (_cmd) => { throw new Error('do not expected reach here.') }
	]
)

export function run() {
	handler(process.argv.slice(2))
}