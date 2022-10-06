<template>
  <div>
    <nav>
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link> |
      <span v-if="!authUser"><router-link  to="/signin">Sign In</router-link> |</span>
      <span v-if="!authUser"><router-link to="/register">Register</router-link></span>
      <span v-if="authUser"><router-link to="/logout">Log out</router-link></span>
      <div v-if="authUser">
        {{authUser.username}}
      </div>
    </nav>
    <router-view/>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters('auth', ['authUser']),
    authId () {
      return this.$store.state.auth.authId
    },
    users () {
      return this.$store.state.users.items
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: #42b983;
}
</style>
