import { ChildProcess, spawn } from 'child_process';
import { unlinkSync } from 'fs';

import { getScreen } from './interface/screen';
import { addCommits, updateStatus } from './redux/action-creators';
import { store } from './redux/store';
import { IScreen, Status } from './types/types';
import { KEY_TEMP_FILES, stash } from './util/stash';

export const run = (args: string[]): void => {
	const gitLogProcess: ChildProcess = spawn(
		'git', ['log', '--color=always', ...args]);
	const screen: IScreen = getScreen();

	let errorString = '';

	gitLogProcess.stdout.setEncoding('utf8');
	gitLogProcess.stdout.on('data', (data: string) => {
		store.dispatch(addCommits(data.trim().split('\n')));
	});

	gitLogProcess.stderr.on('data', (data: string) => errorString += data);

	gitLogProcess.on('close', (code: number) => {
		if (code > 0) {
			screen.destroy();

			process.stderr.write(
				'jack encountered an error with the call to "git log":\n\n');
			process.stderr.write(errorString);

			process.exit(code);
		} else {
			store.dispatch(updateStatus(Status.LOG_COMPLETED));
		}
	});

	process.on('exit', () => {
		if (stash.has(KEY_TEMP_FILES)) {
			const tempFilesArray: string[] = stash.get(KEY_TEMP_FILES);

			tempFilesArray.forEach((file) => unlinkSync(file));
		}
	});

	screen.render();
};

export const runFromPipedData = (): void => {
	process.stderr.write('Piping into jack is not currently supported.\n');
	process.stderr.write(
		'If you would like to contribute or comment, please see the issue on ' +
		'GitHub at https://github.com/drewbrokke/jack/issues/9.\n');

	process.exit(1);
};
