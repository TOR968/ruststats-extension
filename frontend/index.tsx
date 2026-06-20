import { definePlugin } from '@steambrew/client';
import { INJECTION_CODE } from './inject';

const PROFILE_URL_PATTERN = /steamcommunity\.com\/(id|profiles)\//;

async function setupCommunityInjection() {
	const CDP = (window as any).MILLENNIUM_API?.ChromeDevToolsProtocol;
	if (!CDP) { console.error('[Ruststats] No CDP available'); return; }

	await CDP.send('Target.setDiscoverTargets', { discover: true });

	const pending = new Map<string, ReturnType<typeof setTimeout>>();

	const injectIntoTarget = async (targetId: string) => {
		const res = await CDP.send('Target.attachToTarget', { targetId, flatten: true });
		const sessionId = res?.sessionId;
		if (!sessionId) return;
		await CDP.send('Runtime.evaluate', { expression: INJECTION_CODE, awaitPromise: true }, sessionId);
	};

	const processTarget = (targetInfo: any) => {
		const url: string = targetInfo?.url ?? '';
		if (!PROFILE_URL_PATTERN.test(url)) return;
		const targetId: string = targetInfo.targetId;
		clearTimeout(pending.get(targetId));
		pending.set(targetId, setTimeout(() => {
			pending.delete(targetId);
			injectIntoTarget(targetId).catch(e => console.error('[Ruststats] injection error:', e));
		}, 200));
	};

	CDP.on('Target.targetCreated', (e: any) => processTarget(e?.targetInfo));
	CDP.on('Target.targetInfoChanged', (e: any) => processTarget(e?.targetInfo));

	const { targetInfos } = await CDP.send('Target.getTargets', {});
	for (const t of targetInfos ?? []) processTarget(t);
}

const RuststatsIcon = () => (
	<svg style={{ height: '1em' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1230 535">
		<path fill="#fff" fillRule="evenodd" clipRule="evenodd" d="M0 155.568C0 113.741 15.2877 77.2948 45.8632 46.2301C75.9495 15.41 112.518 0 155.568 0H596.222V212.438C596.222 255.489 581.423 291.935 551.826 321.776C538.52 335.294 523.845 345.802 507.803 353.301L543.695 412.769H1061.73C1071.75 412.769 1080.44 409.1 1087.78 401.762C1094.38 394.913 1098.29 388.186 1099.52 381.582V324.712H663.633V157.403C663.633 112.885 678.432 75.8272 708.029 46.2301C738.849 15.41 775.05 0 816.633 0H1229.03V122.18H816.633C806.604 122.18 797.921 125.849 790.582 133.187C782.511 141.503 778.475 149.575 778.475 157.403V209.87H1229.03L1229.4 377.546C1229.4 422.064 1214.6 459.121 1185.01 488.718C1154.19 519.538 1117.98 534.948 1076.4 534.948H617.438H504H467.438L377.913 366.906H122.18V534.948H0V155.568ZM155.568 122.18H474.042V212.438C474.042 221.978 471.229 229.561 465.603 235.187C459.244 241.302 452.028 244.359 443.956 244.359H122.18V155.568C122.18 146.762 125.604 139.057 132.453 132.453C138.813 125.604 146.518 122.18 155.568 122.18Z" />
	</svg>
);

export default definePlugin(() => {
	setupCommunityInjection().catch(e => console.error('[Ruststats] setup error:', e));
	return { name: 'ruststats-extension', title: 'Ruststats Extension', icon: <RuststatsIcon /> };
});
