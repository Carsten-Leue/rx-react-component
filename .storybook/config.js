import { configure, addDecorator } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import '@storybook/addon-console';

addDecorator(withInfo);

const req = require.context('../src/stories', true, /.stories.tsx$/);
function loadStories() {
  req.keys().forEach(req);
}
configure(loadStories, module);
