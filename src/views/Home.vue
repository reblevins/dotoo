<template>
    <div class="day-view" v-if="view == 'day'">
        <h2 class="date">
            <i class="fas fa-caret-left" @click="changeDate('backwards')"></i>
            <template v-if="date.format('YYYY-MM-DD') == today.format('YYYY-MM-DD')">
                Today
            </template>
            <template v-else>
                {{ date.format('MM/DD/YYYY' )}}
            </template>
            <i class="fas fa-caret-right" @click="changeDate('forwards')"></i>
            <i class="fas fa-calendar-alt" @click="view = 'month'"></i>
        </h2>
        <ul class="todos" :class="{ loading: loading }">
            <li class="empty-list" v-if="!loading && toDosByDate.length == 0">No todos here. <i class="far fa-sad-tear"></i> Get started by adding one below. <i class="far fa-hand-point-down"></i></li>
            <li :class="{ saving: saving }" v-else v-for="(toDo, index) in toDosByDate">
                <div class="completed" v-if="!saving">
                    <i class="far fa-check-square" v-if="toDo.completed" @click="toDo.completed = !toDo.completed; updateTodo(toDo)"></i>
                    <i class="far fa-square" v-if="!toDo.completed" @click="toDo.completed = !toDo.completed; updateTodo(toDo)"></i>
                </div>
                <div class="completed" v-else>
                    <i class="far fa-check-square" v-if="toDo.completed"></i>
                    <i class="far fa-square" v-if="!toDo.completed"></i>
                </div>
                <!-- <input type="checkbox" v-model="toDo.completed" @change="updateTodo(toDo)"> -->
                <input type="text" :disabled="saving" v-model="toDo.description" @keyup.enter="updateTodo(toDo)">
                <i class="fas fa-times" @click="deleteToDo(toDo)" v-if="!saving"></i>
                <i class="fas fa-times" v-else></i>
            </li>
            <li class="new-todo" v-if="!addingToDo" @click="addingToDo = true">
                <i class="fas fa-plus"></i>
                <span>New todo</span>
            </li>
            <li class="new-todo" :class="{ saving: saving }" v-else>
                <div></div>
                <input type="text" :disabled="saving" v-model="newToDo.description" @keyup.enter="putNewTodo" @keyup.esc="addingToDo = false" v-focus>
                <div class="small">Hit enter when done. Esc to cancel.</div>
                <i class="fas fa-times" @click="addingToDo = false" v-if="newToDo.description"></i>
            </li>
            <li class="spinner" v-if="loading"><i class="fas fa-spinner fa-spin"></i></li>
        </ul>
    </div>
    <div class="calendar-view" v-else>
        <h2 class="date">
            <i class="fas fa-caret-left" @click="changeMonth('backwards')"></i>
            {{ date.format('MMMM' )}}
            <i class="fas fa-caret-right" @click="changeMonth('forwards')"></i>
            <router-link to="/"><i class="fas fa-calendar-day" @click="view = 'day'"></i></router-link>
        </h2>
        <ul class="calendar">
            <li>S</li>
            <li>M</li>
            <li>Tu</li>
            <li>W</li>
            <li>Th</li>
            <li>F</li>
            <li>S</li>
            <!-- <li class="day" v-for="(dayOfMonth, index) in days" v-if="!dayOfMonth.dayLabel"></li> -->
            <li class="day" :class="{ empty: !dayOfMonth.dayLabel }" v-for="(dayOfMonth, index) in days">
                <div @click="goToDay(dayOfMonth)">
                    <div class="day-label">{{ dayOfMonth.dayLabel }}</div>
                    <ul class="days-to-dos" v-if="dayOfMonth.toDos.length > 0">
                        <li v-for="(toDo, index) in dayOfMonth.toDos">{{ toDo.description }}</li>
                    </ul>
                </div>
            </li>
        </ul>
    </div>
</template>

<script>
import { API } from 'aws-amplify';
import { mapState, mapGetters, mapActions } from 'vuex'
const uuid = require('short-uuid');
export default {
    name: 'Home',
    components: {

    },
    data() {
        return {
            view: 'day',
            date: this.$moment(),
            loading: true,
            saving: false,
            addingToDo: false,
            newToDo: {
                id: null,
                dateDue: null,
                description: null,
                completed: false
            },
            toDos: []
        }
    },
    mounted() {
        console.log(this.$route.query.date);
        if (this.$route.query.date) {
            this.date = this.$moment(this.$route.query.date, 'YYYY-MM-DD')
        }
        this.newToDo = {
            id: uuid.generate(),
            dateDue: this.date.format('YYYY-MM-DD'),
            description: null,
            completed: false
        }
        if (this.getAuthState == 'signedin') {
            this.fetchToDos()
        }
    },
    watch: {
        '$route.query'() {
            this.view = 'day'
            if (this.$route.query.date) {
                this.date = this.$moment(this.$route.query.date, 'YYYY-MM-DD')
            } else {
                this.date = this.$moment()
            }
        },
        view() {
            if (this.$route.query.date) {
                this.date = this.$moment(this.$route.query.date, 'YYYY-MM-DD')
            } else {
                this.date = this.$moment()
            }
        },
        addingToDo() {
            this.newToDo = {
                id: uuid.generate(),
                dateDue: this.date.format('YYYY-MM-DD'),
                description: null,
                completed: false
            }
        },
        getAuthState(newVal) {
            console.log(newVal);
            if (newVal == 'signedin') {
                this.fetchToDos()
            } else if (newVal == 'signin') {
                // this.toDos = []
            }
        }
    },
    computed: {
        ...mapGetters([
            'getAPIName',
            'getAuthState'
        ]),
        today() {
            return this.$moment()
        },
        toDosByDate() {
            return this.toDos.filter(toDo => toDo.dateDue == this.date.format('YYYY-MM-DD'))
        },
        days() {
            let index = 1
            let daysInMonth = this.date.daysInMonth()
            var days = []
            var date = this.date.clone().date(1)
            var firstDay = date.clone().day(0)
            if (firstDay.isBefore(date)) {
                console.log(firstDay.format('YYYY-MM-DD'));
                for (var i = firstDay.date(); i <= firstDay.daysInMonth(); i++) {
                    days.push({
                        dayLabel: null,
                        fullDate: null,
                        toDos: []
                    })
                }
            }
            days.push({
                dayLabel: date.date(),
                fullDate: date.format('YYYY-MM-DD'),
                toDos: this.toDos.filter(toDo => toDo.dateDue == date.format('YYYY-MM-DD'))
            })
            for (var i = 2; i <= daysInMonth; i++) {
                date.add(1, "days")
                days.push({
                    dayLabel: date.date(),
                    fullDate: date.format('YYYY-MM-DD'),
                    toDos: this.toDos.filter(toDo => toDo.dateDue == date.format('YYYY-MM-DD'))
                })
            }
            console.log(days);
            return days
        }
    },
    methods: {
        fetchToDos() {
            this.loading = true
            API.get(this.getAPIName, '/todos').then(response => {
                console.log(response);
                this.toDos = response.items
                this.loading = false
            }).catch(error => {
                this.loading = false
                console.log(error.response);
            })
        },
        async putNewTodo() {
            if (this.saving) return
            this.saving = true
            await API.put(this.getAPIName, '/todos', {
                body: this.newToDo
            }).catch(error => {
                this.saving = false
                this.addingToDo = false
                console.log(error.response);
            })
            this.saving = false
            this.addingToDo = false
            this.newToDo = {
                id: uuid.generate(),
                dateDue: this.date.format('YYYY-MM-DD'),
                description: null,
                completed: false
            }
            this.fetchToDos()
        },
        async updateTodo(toDo) {
            if (this.saving) return
            this.saving = true
            await API.post(this.getAPIName, '/todos', {
                body: toDo
            }).catch(error => {
                this.saving = false
                console.log(error.response);
            })
            this.saving = false
            this.fetchToDos()
        },
        async deleteToDo(toDo) {

        },
        changeDate(direction) {
            switch (direction) {
                case 'backwards':
                    this.date.subtract(1, 'days')
                    break;
                case 'forwards':
                    this.date.add(1, 'days')
                    break;
            }
            console.log();
            this.$router.push({ query: { date: this.date.format('YYYY-MM-DD') }})
        },
        changeMonth(direction) {
            switch (direction) {
                case 'backwards':
                    this.date.subtract(1, 'months')
                    break;
                case 'forwards':
                    this.date.add(1, 'months')
                    break;
            }
            console.log();
            this.$router.push({ query: { date: this.date.format('YYYY-MM-DD') }})
        },
        goToDay(dayOfMonth) {
            console.log(dayOfMonth.fullDate);
            if (!dayOfMonth.fullDate) return
            this.$router.push({ query: { date: dayOfMonth.fullDate }})
        }
    }
}
</script>

<style lang="scss">
ul.calendar {
    display: grid;
    grid-template-columns: repeat(7, calc(100vw / 7));

    li.day {
        & > div {
            height: 100%;
            width: 100%;
        }
        height: 90px;
        border: 1px solid lightgray;
        position: relative;
        padding-right: 4px;
        cursor: pointer;

        &:not(.empty):hover {
            background-color: #CFD8DC;
        }

        .day-label {
            position: absolute;
            top: 1px;
            right: 1px;
        }

        ul {
            font-size: 0.7rem;
            margin-top: 1.2rem;
            overflow: hidden;

            li {
                width: 200px;
                padding-bottom: 4px;
            }
        }
    }

}
</style>
