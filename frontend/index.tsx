import { useState, useEffect } from 'react';
import { definePlugin, Toggle } from '@steambrew/client';
import { buildInjectionCode } from './inject';
import { initSettings, getSettings, saveSettings, InjectionMode } from './services/settings';

const PROFILE_URL_PATTERN = /steamcommunity\.com\/(id|profiles)\//;
const CONTAINER = '.ruststats-extension-container';

type Injector = 'webkit' | 'cdp' | 'none';

const getCDP = () => (window as any).MILLENNIUM_API?.ChromeDevToolsProtocol;

async function evalInTarget(CDP: any, targetId: string, expression: string, params: object = {}) {
	const { sessionId } = (await CDP.send('Target.attachToTarget', { targetId, flatten: true })) ?? {};
	if (!sessionId) return undefined;
	return CDP.send('Runtime.evaluate', { expression, ...params }, sessionId);
}

async function getProfileTargets(CDP: any): Promise<any[]> {
	const { targetInfos } = await CDP.send('Target.getTargets', {});
	return (targetInfos ?? []).filter((t: any) => PROFILE_URL_PATTERN.test(t?.url ?? ''));
}

async function detectActiveInjector(): Promise<Injector> {
	const CDP = getCDP();
	if (!CDP) return 'none';
	try {
		for (const t of await getProfileTargets(CDP)) {
			const res = await evalInTarget(CDP, t.targetId,
				`document.querySelector('${CONTAINER}')?.getAttribute('data-injector') || ''`,
				{ returnByValue: true });
			const val = res?.result?.value;
			if (val === 'webkit' || val === 'cdp') return val;
		}
	} catch (e) {
		console.error('[Ruststats] detect injector failed:', e);
	}
	return 'none';
}

let reloadOpenProfiles: () => Promise<void> = async () => {};

async function setupCommunityInjection() {
	const CDP = getCDP();
	if (!CDP) { console.error('[Ruststats] No CDP available'); return; }

	await initSettings();
	await CDP.send('Target.setDiscoverTargets', { discover: true });

	const pending = new Map<string, ReturnType<typeof setTimeout>>();

	const injectIntoTarget = (targetId: string) => {
		const { openExternal, injectionMode } = getSettings();
		if (injectionMode === 'webkit') return Promise.resolve(undefined);
		return evalInTarget(CDP, targetId, buildInjectionCode(openExternal), { awaitPromise: true });
	};

	reloadOpenProfiles = async () => {
		for (const t of await getProfileTargets(CDP)) {
			try { await evalInTarget(CDP, t.targetId, 'location.reload()'); }
			catch (e) { console.error('[Ruststats] reload error:', e); }
		}
	};

	const processTarget = (targetInfo: any) => {
		if (!PROFILE_URL_PATTERN.test(targetInfo?.url ?? '')) return;
		const targetId: string = targetInfo.targetId;
		clearTimeout(pending.get(targetId));
		pending.set(targetId, setTimeout(() => {
			pending.delete(targetId);
			injectIntoTarget(targetId).catch((e: any) => console.error('[Ruststats] injection error:', e));
		}, 200));
	};

	CDP.on('Target.targetCreated', (e: any) => processTarget(e?.targetInfo));
	CDP.on('Target.targetInfoChanged', (e: any) => processTarget(e?.targetInfo));

	for (const t of await getProfileTargets(CDP)) processTarget(t);
}

const RuststatsIcon = () => (
	<svg style={{ height: '1em' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1230 535">
		<path fill="#fff" fillRule="evenodd" clipRule="evenodd" d="M0 155.568C0 113.741 15.2877 77.2948 45.8632 46.2301C75.9495 15.41 112.518 0 155.568 0H596.222V212.438C596.222 255.489 581.423 291.935 551.826 321.776C538.52 335.294 523.845 345.802 507.803 353.301L543.695 412.769H1061.73C1071.75 412.769 1080.44 409.1 1087.78 401.762C1094.38 394.913 1098.29 388.186 1099.52 381.582V324.712H663.633V157.403C663.633 112.885 678.432 75.8272 708.029 46.2301C738.849 15.41 775.05 0 816.633 0H1229.03V122.18H816.633C806.604 122.18 797.921 125.849 790.582 133.187C782.511 141.503 778.475 149.575 778.475 157.403V209.87H1229.03L1229.4 377.546C1229.4 422.064 1214.6 459.121 1185.01 488.718C1154.19 519.538 1117.98 534.948 1076.4 534.948H617.438H504H467.438L377.913 366.906H122.18V534.948H0V155.568ZM155.568 122.18H474.042V212.438C474.042 221.978 471.229 229.561 465.603 235.187C459.244 241.302 452.028 244.359 443.956 244.359H122.18V155.568C122.18 146.762 125.604 139.057 132.453 132.453C138.813 125.604 146.518 122.18 155.568 122.18Z" />
	</svg>
);

const INJECTOR_INFO: Record<Injector | 'loading', { label: string; color: string }> = {
	loading: { label: 'Detecting…', color: '#7a8b9a' },
	webkit: { label: 'Webkit (native)', color: '#5ba32b' },
	cdp: { label: 'CDP (fallback)', color: '#e0a526' },
	none: { label: 'Unknown — open a profile page', color: '#7a8b9a' },
};

const InjectorBadge = ({ status }: { status: Injector | 'loading' }) => {
	const info = INJECTOR_INFO[status];
	return (
		<div style={{
			display: 'flex', alignItems: 'center', gap: '10px',
			padding: '10px 12px', marginBottom: '14px', borderRadius: '6px',
			background: 'rgba(255,255,255,0.04)', borderLeft: `3px solid ${info.color}`,
		}}>
			<span style={{
				width: '8px', height: '8px', borderRadius: '50%',
				background: info.color, boxShadow: `0 0 6px ${info.color}`, flexShrink: 0,
			}} />
			<div style={{ display: 'flex', flexDirection: 'column' }}>
				<span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.06em', color: '#8f98a0' }}>Active injection mode</span>
				<span style={{ fontWeight: 'bold', color: info.color }}>{info.label}</span>
			</div>
		</div>
	);
};

const MODES: { value: InjectionMode; label: string }[] = [
	{ value: 'auto', label: 'Auto' },
	{ value: 'webkit', label: 'Webkit' },
	{ value: 'cdp', label: 'CDP' },
];

const ModeSelector = ({ mode, onSelect }: { mode: InjectionMode; onSelect: (m: InjectionMode) => void }) => (
	<div style={{ display: 'flex', gap: '6px' }}>
		{MODES.map(m => {
			const active = mode === m.value;
			return (
				<button key={m.value} onClick={() => onSelect(m.value)} style={{
					flex: 1, padding: '8px 0', borderRadius: '4px', border: 'none', cursor: 'pointer',
					fontWeight: 'bold', fontSize: '13px',
					background: active ? '#a99cf5' : 'rgba(255,255,255,0.06)',
					color: active ? '#1a1a1a' : '#cfd3d8',
				}}>{m.label}</button>
			);
		})}
	</div>
);

const Settings = () => {
	const [openExternal, setOpenExternal] = useState<boolean>(getSettings().openExternal);
	const [mode, setMode] = useState<InjectionMode>(getSettings().injectionMode);
	const [injector, setInjector] = useState<Injector | 'loading'>('loading');
	useEffect(() => { void detectActiveInjector().then(setInjector); }, []);

	const onToggle = (checked: boolean) => {
		setOpenExternal(checked);
		void saveSettings({ ...getSettings(), openExternal: checked }).then(() => reloadOpenProfiles());
	};
	const onMode = (m: InjectionMode) => {
		setMode(m);
		void saveSettings({ ...getSettings(), injectionMode: m }).then(() => reloadOpenProfiles());
	};

	return (
		<div style={{ padding: '16px' }}>
			<InjectorBadge status={injector} />

			<div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Injection mode</div>
			<ModeSelector mode={mode} onSelect={onMode} />
			<div style={{ fontSize: '12px', lineHeight: '1.4', color: '#969696', margin: '6px 0 16px' }}>
				Auto uses whichever path loads first. Webkit or CDP forces that path only.
			</div>

			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
				<span style={{ fontWeight: 'bold' }}>Open in external browser</span>
				<Toggle value={openExternal} onChange={onToggle} />
			</div>
			<div style={{ fontSize: '12px', lineHeight: '1.4', color: '#969696' }}>
				Open Ruststats in your system browser instead of Steam's built-in browser. Open profile pages reload automatically when you change this.
			</div>
		</div>
	);
};

export default definePlugin(() => {
	setupCommunityInjection().catch(e => console.error('[Ruststats] setup error:', e));
	return { name: 'ruststats-extension', title: 'Ruststats Extension', icon: <RuststatsIcon />, content: <Settings /> };
});
