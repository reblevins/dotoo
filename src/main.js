import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import Amplify from 'aws-amplify';
import '@aws-amplify/ui-vue';
import aws_exports from './aws-exports';

Amplify.configure(aws_exports);

import moment from 'moment'
Vue.prototype.$moment = moment

Vue.config.productionTip = false

Vue.directive('focus', {
	// When the bound element is inserted into the DOM...
	inserted: function (el) {
		// Focus the element
		el.focus()
	}
})

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
