const { spawn } = require('node:child_process');

const testSteps = [
	{ label: 'Jest', command: 'npm', args: ['test'] },
	{ label: 'Playwright', command: 'npm', args: ['run', 'test:e2e'] },
];

const runStep = ({ label, command, args }) =>
	new Promise((resolve, reject) => {
		console.log(`\n> Running ${label} tests`);

		const child = spawn(command, args, {
			cwd: process.cwd(),
			stdio: 'inherit',
			shell: process.platform === 'win32',
		});

		child.on('error', reject);
		child.on('exit', (code, signal) => {
			if (signal) {
				reject(new Error(`${label} tests exited from signal ${signal}.`));
				return;
			}

			if (code !== 0) {
				reject(new Error(`${label} tests failed with exit code ${code}.`));
				return;
			}

			resolve();
		});
	});

const main = async () => {
	for (const step of testSteps) {
		await runStep(step);
	}

	console.log('\nAll project tests passed.');
};

main().catch((error) => {
	console.error(`\n${error.message}`);
	process.exit(1);
});