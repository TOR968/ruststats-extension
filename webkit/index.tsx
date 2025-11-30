type Millennium = {
	callServerMethod: (methodName: string, kwargs?: any) => Promise<any>;
	findElement: (privateDocument: Document, querySelector: string, timeOut?: number) => Promise<NodeListOf<Element>>;
};

declare const Millennium: Millennium;

export default async function WebkitMain() {
	try {
		if (typeof Millennium === 'undefined') {
			console.error('Ruststats: Millennium API not available in webkit context');
			return;
		}

		const styles = `
        .ruststats-btn {
            display: flex;
            width: 100%;
            height: 3rem;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            color: #FFF;
            font-weight: 800;
            transition: all 0.5s cubic-bezier(.23, 1, .32, 1);
            background-color: #1a1a1a;
            border-radius: 5px;
            cursor: pointer;
            text-decoration: none;
            border: none;
            outline: none;
        }

        .ruststats-btn:hover {
            background-color: #2d3748;
            text-decoration: none !important;
        }

        .ruststats-logo {
            height: 20px;
            width: auto;
        }`;

		const styleSheet = document.createElement('style');
		styleSheet.innerText = styles;
		document.head.appendChild(styleSheet);

		const rightCol = await Millennium.findElement(document, '.profile_rightcol');

		if (rightCol.length > 0) {
			const parser = new DOMParser();
			const profileUrl = `${window.location.href}/?xml=1`;

			const profileResponse = await fetch(profileUrl);
			if (!profileResponse.ok) {
				console.error(`Ruststats: Failed to fetch profile data: ${profileResponse.status} ${profileResponse.statusText}`);
				return;
			}

			const profileXmlText = await profileResponse.text();
			const profileXmlDoc = parser.parseFromString(profileXmlText, 'application/xml');

			const steamID64 = profileXmlDoc.querySelector('steamID64')?.textContent || '0';

			if (!steamID64 || steamID64 === '0') {
				console.error('Ruststats: Could not parse steamID64 from URL.');
				return;
			}

			const statsContainer = document.createElement('div');
			statsContainer.className = 'account-row';

			const button = document.createElement('div');
			button.className = 'ruststats-btn';

			const logoSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
			logoSvg.setAttribute('class', 'ruststats-logo');
			logoSvg.setAttribute('viewBox', '0 0 1230 535');
			logoSvg.innerHTML =
				'<path fill-rule="evenodd" clip-rule="evenodd" d="M0 155.568C0 113.741 15.2877 77.2948 45.8632 46.2301C75.9495 15.41 112.518 0 155.568 0H596.222V212.438C596.222 255.489 581.423 291.935 551.826 321.776C538.52 335.294 523.845 345.802 507.803 353.301L543.695 412.769H1061.73C1071.75 412.769 1080.44 409.1 1087.78 401.762C1094.38 394.913 1098.29 388.186 1099.52 381.582V324.712H663.633V157.403C663.633 112.885 678.432 75.8272 708.029 46.2301C738.849 15.41 775.05 0 816.633 0H1229.03V122.18H816.633C806.604 122.18 797.921 125.849 790.582 133.187C782.511 141.503 778.475 149.575 778.475 157.403V209.87H1229.03L1229.4 377.546C1229.4 422.064 1214.6 459.121 1185.01 488.718C1154.19 519.538 1117.98 534.948 1076.4 534.948H617.438H504H467.438L377.913 366.906H122.18V534.948H0V155.568ZM155.568 122.18H474.042V212.438C474.042 221.978 471.229 229.561 465.603 235.187C459.244 241.302 452.028 244.359 443.956 244.359H122.18V155.568C122.18 146.762 125.604 139.057 132.453 132.453C138.813 125.604 146.518 122.18 155.568 122.18Z" fill="#ffffff"></path>';

			button.appendChild(logoSvg);
			button.onclick = () => {
				window.open(`https://ruststats.io/profile/${steamID64}`, '_self', 'noopener,noreferrer');
			};

			statsContainer.appendChild(button);
			rightCol[0].insertBefore(statsContainer, rightCol[0].children[1]);
		} else {
			console.error('Ruststats: Parent container ".profile_rightcol" not found');
		}
	} catch (error) {
		console.error('Ruststats: Error in WebkitMain:', error);
		console.error('Ruststats: Stack trace:', error.stack);
	}
}
