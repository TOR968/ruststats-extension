type RuststatsButtonProps = {
	steamId: string;
};

export function createRuststatsButton({ steamId }: RuststatsButtonProps) {
	const button = document.createElement('button');
	button.className = 'ruststats-btn';
	button.type = 'button';
	button.addEventListener('click', () => {
		window.location.href = `https://ruststats.io/profile/${steamId}`;
	});

	const logoSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	logoSvg.setAttribute('class', 'ruststats-logo');
	logoSvg.setAttribute('viewBox', '0 0 1230 535');
	logoSvg.innerHTML =
		'<path fill-rule="evenodd" clip-rule="evenodd" d="M0 155.568C0 113.741 15.2877 77.2948 45.8632 46.2301C75.9495 15.41 112.518 0 155.568 0H596.222V212.438C596.222 255.489 581.423 291.935 551.826 321.776C538.52 335.294 523.845 345.802 507.803 353.301L543.695 412.769H1061.73C1071.75 412.769 1080.44 409.1 1087.78 401.762C1094.38 394.913 1098.29 388.186 1099.52 381.582V324.712H663.633V157.403C663.633 112.885 678.432 75.8272 708.029 46.2301C738.849 15.41 775.05 0 816.633 0H1229.03V122.18H816.633C806.604 122.18 797.921 125.849 790.582 133.187C782.511 141.503 778.475 149.575 778.475 157.403V209.87H1229.03L1229.4 377.546C1229.4 422.064 1214.6 459.121 1185.01 488.718C1154.19 519.538 1117.98 534.948 1076.4 534.948H617.438H504H467.438L377.913 366.906H122.18V534.948H0V155.568ZM155.568 122.18H474.042V212.438C474.042 221.978 471.229 229.561 465.603 235.187C459.244 241.302 452.028 244.359 443.956 244.359H122.18V155.568C122.18 146.762 125.604 139.057 132.453 132.453C138.813 125.604 146.518 122.18 155.568 122.18Z" fill="#ffffff"></path>';
	button.appendChild(logoSvg);

	return button;
}
