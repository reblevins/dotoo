import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
	state: {
		apiName: 'dotoorestapi',
        authState: null,
        user: null
	},
	mutations: {
        UPDATE_AUTH_STATE(state, value) {
            state.authState = value
        },
        UPDATE_USER(state, value) {
            state.user = value
        }
	},
	getters: {
        getAPIName: (state) => state.apiName,
        getAuthState: (state) => state.authState,
		getUser: (state) => state.user
	},
	actions: {
        updateAuthState({ commit }, value) {
            commit('UPDATE_AUTH_STATE', value)
        },
        updateUser({ commit }, value) {
            commit('UPDATE_USER', value)
        }
	},
	modules: {
	}
})
