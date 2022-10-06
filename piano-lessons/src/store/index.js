import { createStore } from 'vuex'
import actions from './actions'
import mutations from './mutations'
import auth from './modules/auth'
import users from './modules/users'

export default createStore({
  state: {
    unsubscribes: []
  },
  getters: {
  },
  mutations: mutations,
  actions: actions,
  modules: {
    auth,
    users
  }
})
