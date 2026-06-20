export function ruststatsInjectMain(openExternal: boolean, injector?: string) {
	if (document.querySelector('.ruststats-extension-container')) return;
	if (!/steamcommunity\.com\/(id|profiles)\//.test(location.href)) return;

	const STEAMID64_BASE = BigInt('76561197960265728');

	async function getSteamId() {
		const win = window as any;
		const candidates = [win.g_rgProfileData?.steamid64, win.g_rgProfileData?.steamid];
		for (const v of candidates) {
			if (typeof v === 'string' && v !== '0' && v.trim()) return v.trim();
		}
		const miniId = document.querySelector('[data-miniprofile]')?.getAttribute('data-miniprofile');
		if (miniId && miniId !== '0') {
			try { return (STEAMID64_BASE + BigInt(miniId)).toString(); } catch { }
		}
		try {
			const xmlUrl = location.href.replace(/[?#].*/, '').replace(/\/$/, '') + '/?xml=1';
			const res = await fetch(xmlUrl);
			const text = await res.text();
			const dom = new DOMParser().parseFromString(text, 'application/xml');
			const id = dom.querySelector('steamID64')?.textContent;
			if (id && id !== '0') return id;
		} catch { }
		return null;
	}

	async function inject() {
		const col = document.querySelector('.profile_rightcol');
		if (!col || col.querySelector('.ruststats-extension-container')) return;

		const div = document.createElement('div');
		div.className = 'account-row ruststats-extension-container';
		div.setAttribute('data-injector', injector || 'unknown');
		col.insertBefore(div, col.children[1] ?? null);

		const steamId = await getSteamId();
		if (!steamId) { console.warn('[Ruststats] No SteamID'); div.remove(); return; }

		if (!document.getElementById('ruststats-extension-style')) {
			const s = document.createElement('style');
			s.id = 'ruststats-extension-style';
			s.textContent = '.ruststats-btn{display:flex;width:100%;height:3rem;align-items:center;justify-content:center;color:#fff;font-weight:800;background-color:#1a1a1a;border-radius:5px;cursor:pointer;text-decoration:none;border:none;outline:none;margin:10px 0;transition:all .5s cubic-bezier(.23,1,.32,1)}.ruststats-btn:hover{background-color:#2d3748;text-decoration:none!important}';
			document.head?.appendChild(s);
		}

		const profileUrl = 'https://ruststats.io/profile/' + steamId;
		const a = document.createElement('a');
		a.href = openExternal ? 'steam://openurl_external/' + profileUrl : profileUrl;
		a.className = 'ruststats-btn';
		a.innerHTML = '<svg style="height:20px;width:auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1230 535"><path fill="#fff" fill-rule="evenodd" clip-rule="evenodd" d="M0 155.568C0 113.741 15.2877 77.2948 45.8632 46.2301C75.9495 15.41 112.518 0 155.568 0H596.222V212.438C596.222 255.489 581.423 291.935 551.826 321.776C538.52 335.294 523.845 345.802 507.803 353.301L543.695 412.769H1061.73C1071.75 412.769 1080.44 409.1 1087.78 401.762C1094.38 394.913 1098.29 388.186 1099.52 381.582V324.712H663.633V157.403C663.633 112.885 678.432 75.8272 708.029 46.2301C738.849 15.41 775.05 0 816.633 0H1229.03V122.18H816.633C806.604 122.18 797.921 125.849 790.582 133.187C782.511 141.503 778.475 149.575 778.475 157.403V209.87H1229.03L1229.4 377.546C1229.4 422.064 1214.6 459.121 1185.01 488.718C1154.19 519.538 1117.98 534.948 1076.4 534.948H617.438H504H467.438L377.913 366.906H122.18V534.948H0V155.568ZM155.568 122.18H474.042V212.438C474.042 221.978 471.229 229.561 465.603 235.187C459.244 241.302 452.028 244.359 443.956 244.359H122.18V155.568C122.18 146.762 125.604 139.057 132.453 132.453C138.813 125.604 146.518 122.18 155.568 122.18Z"/></svg>';
		div.appendChild(a);
	}

	if (document.querySelector('.profile_rightcol')) {
		inject();
	} else {
		const obs = new MutationObserver(() => {
			if (document.querySelector('.profile_rightcol')) {
				obs.disconnect();
				inject();
			}
		});
		obs.observe(document.documentElement, { childList: true, subtree: true });
		setTimeout(() => obs.disconnect(), 15000);
	}
}

export const buildInjectionCode = (openExternal: boolean) =>
	`(${ruststatsInjectMain.toString()})(${openExternal === false ? 'false' : 'true'}, 'cdp')`;
