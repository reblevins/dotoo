<template>
	<div id="app">
        <header>
            <h1>
                <router-link to="/">DoToo</router-link>
                <em>The last to-do app you'll ever need</em>
            </h1>
            <!-- <div class="menu-icon">
                <i class="fas fa-bars"></i>
            </div> -->
            <!-- <nav>
                <ul>
                    <li><router-link></router-link></li>
                </ul>
            </nav> -->
            <template v-if="getAuthState == 'signedin'">
                <amplify-sign-out></amplify-sign-out>
            </template>
        </header>

        <div class="main" :class="{ signin: getAuthState !== 'signedin' }">
            <amplify-authenticator username-alias="email">
                <amplify-sign-up
                    slot="sign-up"
                    username-alias="email"
                    :form-fields.prop="formFields"
                ></amplify-sign-up>
                <router-view/>
            </amplify-authenticator>
        </div>
	</div>
</template>

<script>
import { onAuthUIStateChange } from '@aws-amplify/ui-components'
import { mapState, mapGetters, mapActions } from 'vuex'
export default {
    data() {
        return {
            formFields: [
                {
                    type: 'email',
                    label: 'Email',
                    required: true,
                },
                {
                    type: 'password',
                    label: 'Password',
                    required: true,
                },
            ]
        }
    },
    mounted() {
        onAuthUIStateChange((authState, authData) => {
            this.updateAuthState(authState);
            this.updateUser(authData);
        })
    },
    beforeDestroy() {
        return onAuthUIStateChange;
    },
    computed: {
        ...mapGetters([
            'getAuthState',
            'getUser'
        ])
    },
    methods: {
        ...mapActions([
            'updateAuthState',
            'updateUser'
        ])
    }
}
</script>

<style lang="scss">
$lightgray: lightgray;
$gray: gray;

amplify-authenticator {
    --container-display: block;
    --width: 90%;
}

body {
    margin: 0;
    padding: 0;
}
ul {
    list-style: none;
    margin: 0;
    padding: 0;
}
a {
    text-decoration: none;
    color: #2c3e50;
}

* {
	font-family: Avenir, Helvetica, Arial, sans-serif;
	color: #2c3e50;
}

header {
    display: grid;
    grid-template-columns: 130px 1fr;
    align-items: baseline;
    justify-items: left;
    padding: 1em;
    border-bottom: 1px solid $lightgray;

    h1 {
        margin: 0;
        text-align: left;
    }
    em {
        display: block;
        color: $gray;
        font-size: 0.8rem;
    }

    amplify-sign-out {
        justify-self: right;
        align-self: center;
    }
}
.main {
    padding: 1em 0;

    &.signin {
        padding: 1.5em;
    }

    @media (min-width: 769px) {
        padding: 1em 2em;
    }
    @media (min-width: 1025px) {
        margin: 2em auto;
        max-width: 1024px;
    }
}
.spinner {
    position: absolute;
    display: grid;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    align-items: center;
    justify-items: center;
    font-size: 3em;
    background: rgba(255, 255, 255, 0.8);
}
</style>
