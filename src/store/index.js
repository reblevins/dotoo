import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
	state: {
		apiName: 'dotoorestapi'
	},
	mutations: {
	},
	getters: {
		getAPIName: (state) => state.apiName 
	},
	actions: {
	},
	modules: {
	}
})
