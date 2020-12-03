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
h2.date {
    text-align: center;
    display: grid;
    grid-template-columns: 1.5em 1fr 1.5em 85px;
    align-items: center;

    i { cursor: pointer; font-size: 1.5em; }
}
a {
    text-decoration: none;
    color: initial;
}

#app {
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
}

ul.todos {
    margin-bottom: 2rem;
    position: relative;
    li {
        font-size: 1.2em;
        padding: 1rem 0;
    }
    li:not(.empty-list):not(.spinner) {
        display: grid;
        grid-template-columns: 2rem 9fr 1.5fr;
        align-items: center;
        border-bottom: 1px solid $lightgray;
        grid-gap: 0.5rem;

        &:first-child {
            border-top: 1px solid $lightgray;
        }

        .completed {
            font-size: 1.2rem;
        }
        i.far, i.fas {
            cursor: pointer;
        }
        .completed, .fa-plus {
            justify-self: right;
        }
        i.fas.fa-times {
            justify-self: left;
            display: none;
        }

        input[type="text"] {
            padding: 0.7rem 0 0.7rem 1rem;
            font-size: 1.2em;
            border: none;
        }

        &:hover i.fas.fa-times, input:focus ~ i.fas.fa-times { display: inline-block; }

        &.new-todo {
            cursor: pointer;
            border-bottom: none;
            span {
                padding: 0.8rem 0 0.7rem 1rem;
                font-size: 1.2em;
            }
            input[type="text"] {
                border: 1px solid $lightgray;
            }
            i.fas.fa-times {
                grid-row: 1 / 2;
                grid-column: 3 / 4;
                padding: 0 1rem;
            }
            .small {
                grid-column: 2 / 3;
                font-size: 0.7rem;
                padding-top: 5px;
            }

            &.saving {
                cursor: not-allowed;
                input, i.far, i.fas { cursor: not-allowed; }
            }
        }
    }
    li.empty-list {
        padding: 1rem 1.2rem;
    }
    li.spinner {
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
}
</style>
