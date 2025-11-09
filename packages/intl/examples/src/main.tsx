import 'virtual:@voxelio/intl';
import { t, setLanguage, getLanguage } from '../../dist/runtime';

const render = () => {
	const test = t('Hello Foo BAR');
	const test2 = t('Hello Foo BAR BAZ Tesdt');
	const test3 = t('Welcome {name}, you have {count} messages', { name: 'John', count: 5 });
	const currentLang = getLanguage();

	const rootElement = document.getElementById('root');
	if (rootElement) {
		rootElement.innerHTML = `
			<div id="app"> 
				<h1>${test}</h1>  
				<p>${test2}</p>
				<p>${test3}</p>
				<p>Current language: ${currentLang}</p>
				<button id="btn-en">English</button>
				<button id="btn-fr">Français</button>
			</div>
		`;

		document.getElementById('btn-en')?.addEventListener('click', () => {
			setLanguage('en');
			render();
		});

		document.getElementById('btn-fr')?.addEventListener('click', () => {
			setLanguage('fr');
			render();
		});
	}
};

render();
