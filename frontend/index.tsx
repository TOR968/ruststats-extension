import { definePlugin, Field, DialogButton, IconsModule } from '@steambrew/client';

const SettingsContent = () => {
	return (
		<Field label="Ruststats" description="Ruststats інтеграція для профілю Steam" icon={<IconsModule.Settings />} bottomSeparator="standard" focusable>
			<DialogButton
				onClick={() => {
					window.open('https://ruststats.io', '_blank', 'noopener,noreferrer');
				}}
			>
				Відкрити ruststats.io
			</DialogButton>
		</Field>
	);
};

export default definePlugin(() => {
	return {
		name: 'ruststats-extension',
		title: 'Ruststats Extension',
		icon: <IconsModule.Settings />,
		content: <SettingsContent />,
	};
});
