import { t } from '../../dist/runtime';

const test = t('Hello Foo BAR');
const test2 = t('Hello Foo BAR BAZs');

const rootElement = document.getElementById('root');
if (rootElement) {
	rootElement.innerHTML = `<div id="app">${test} ${test2}</div>`;
}
