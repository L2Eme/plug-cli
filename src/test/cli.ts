import * as plug from '@line100/plug';
import * as cli from '../index';

const handler = plug.createHandler(
	new cli.CliContext(),
	[
		cli.logError,
	]
)

export function run() {
	handler(process.argv.slice(2))
}