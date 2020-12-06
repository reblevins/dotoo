<template>
    <div class="day-view" v-if="view == 'day'">
        <h2 class="date">
            <i class="fas fa-caret-left" @click="changeDate('backwards')"></i>
            <template v-if="isToday">
                Today
            </template>
            <template v-else>
                {{ date.format('MM/DD/YYYY' )}}
            </template>
            <i class="fas fa-caret-right" @click="changeDate('forwards')"></i>
            <router-link to="/"><i class="fas fa-calendar-day" :class="{ disabled: isToday }"></i></router-link>
            <router-link to="/?view=month"><i class="fas fa-calendar-alt"></i></router-link>
        </h2>
        <ul class="todos" :class="{ loading: loading }">
            <li class="empty-list" v-if="!loading && uncompletedToDosByDate.length == 0">No todos here. <i class="far fa-sad-tear"></i> Get started by adding one below. <i class="far fa-hand-point-down"></i></li>
            <li :class="{ saving: saving === index }" v-else v-for="(toDo, index) in uncompletedToDosByDate">
                <div class="completed" v-if="saving !== index">
                    <i class="far fa-check-square" v-if="toDo.completed" @click="toDo.completed = !toDo.completed; updateTodo(toDo, index)"></i>
                    <i class="far fa-square" v-if="!toDo.completed" @click="toDo.completed = !toDo.completed; updateTodo(toDo, index)"></i>
                </div>
                <div class="completed" v-else>
                    <i class="far fa-check-square" v-if="toDo.completed"></i>
                    <i class="far fa-square" v-if="!toDo.completed"></i>
                </div>
                <input type="text" :disabled="saving === index" v-model="toDo.description" @keyup.enter="updateTodo(toDo, index)">
                <i class="fas fa-times" @click="deleteToDo(toDo, index)" v-if="saving !== index"></i>
                <i class="fas fa-times" v-else></i>
            </li>
            <li class="new-todo" v-if="!addingToDo" @click="addingToDo = true">
                <i class="fas fa-plus"></i>
                <span>New todo</span>
            </li>
            <li class="new-todo" :class="{ saving: saving == 'new' }" v-else>
                <div></div>
                <input type="text" :disabled="saving == 'new'" v-model="newToDo.description" @keyup.enter="putNewTodo" @keyup.esc="addingToDo = false" v-focus>
                <div class="small">Hit enter when done. Esc to cancel.</div>
                <i class="fas fa-check" @click="putNewTodo"></i>
                <i class="fas fa-times" @click="addingToDo = false"></i>
            </li>
        </ul>
        <h3>Completed</h3>
        <ul class="todos completed-todos" :class="{ loading: loading }">
            <li :class="{ saving: saving === index }" v-for="(toDo, index) in completedToDosByDate" v-if="toDo.completed">
                <div class="completed" v-if="saving !== index">
                    <i class="far fa-check-square" v-if="toDo.completed" @click="toDo.completed = !toDo.completed; updateTodo(toDo, index)"></i>
                    <i class="far fa-square" v-if="!toDo.completed" @click="toDo.completed = !toDo.completed; updateTodo(toDo, index)"></i>
                </div>
                <div class="completed" v-else>
                    <i class="far fa-check-square" v-if="toDo.completed"></i>
                    <i class="far fa-square" v-if="!toDo.completed"></i>
                </div>
                <input type="text" :disabled="saving === index" v-model="toDo.description" @keyup.enter="updateTodo(toDo, index)">
                <i class="fas fa-times" @click="deleteToDo(toDo, index)" v-if="saving !== index"></i>
                <i class="fas fa-times" v-else></i>
            </li>
        </ul>
        <div class="spinner" v-if="loading"><i class="fas fa-spinner fa-spin"></i></div>
    </div>
    <div class="calendar-view" v-else>
        <h2 class="date">
            <i class="fas fa-caret-left" @click="changeMonth('backwards')"></i>
            {{ date.format('MMMM' )}}
            <i class="fas fa-caret-right" @click="changeMonth('forwards')"></i>
            <router-link to="/"><i class="fas fa-calendar-day"></i></router-link>
        </h2>
        <ul class="calendar">
            <li class="weekday-label">S</li>
            <li class="weekday-label">M</li>
            <li class="weekday-label">Tu</li>
            <li class="weekday-label">W</li>
            <li class="weekday-label">Th</li>
            <li class="weekday-label">F</li>
            <li class="weekday-label">S</li>
            <!-- <li class="day" v-for="(dayOfMonth, index) in days" v-if="!dayOfMonth.dayLabel"></li> -->
            <li class="day" :class="{ empty: !dayOfMonth.dayLabel }" v-for="(dayOfMonth, index) in days">
                <div @click="goToDay(dayOfMonth)">
                    <div class="day-label">{{ dayOfMonth.dayLabel }}</div>
                    <ul class="days-to-dos" v-if="dayOfMonth.toDos.length > 0">
                        <li v-for="(toDo, index) in dayOfMonth.toDos" v-if="!toDo.completed">{{ toDo.description }}</li>
                    </ul>
                    <ul class="days-to-dos completed-todos" v-if="dayOfMonth.toDos.length > 0">
                        <li v-for="(toDo, index) in dayOfMonth.toDos" v-if="toDo.completed">{{ toDo.description }}</li>
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
        if (this.$route.query.date) {
            this.date = this.$moment(this.$route.query.date, 'YYYY-MM-DD')
        }
        this.view = (this.$route.query.view) ? this.$route.query.view : 'day'
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
            this.view = (this.$route.query.view) ? this.$route.query.view : 'day'
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
        isToday() {
            return this.date.format('YYYY-MM-DD') == this.today.format('YYYY-MM-DD')
        },
        uncompletedToDosByDate() {
            return this.toDos.filter(toDo => toDo.dateDue == this.date.format('YYYY-MM-DD') && !toDo.completed)
        },
        completedToDosByDate() {
            return this.toDos.filter(toDo => toDo.dateDue == this.date.format('YYYY-MM-DD') && toDo.completed)
        },
        days() {
            let index = 1
            let daysInMonth = this.date.daysInMonth()
            var days = []
            var date = this.date.clone().date(1)
            var firstDay = date.clone().day(0)
            if (firstDay.isBefore(date)) {
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
            return days
        }
    },
    methods: {
        fetchToDos() {
            this.loading = true
            API.get(this.getAPIName, '/todos').then(response => {
                this.toDos = response.items
                this.loading = false
            }).catch(error => {
                this.loading = false
                console.log(error.response);
            })
        },
        async putNewTodo() {
            if (this.saving || !this.newToDo.description) return
            this.saving = 'new'
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
        async updateTodo(toDo, index) {
            if (this.saving) return
            this.saving = index
            await API.post(this.getAPIName, '/todos', {
                body: toDo
            }).catch(error => {
                this.saving = false
                console.log(error.response);
            })
            this.saving = false
            this.fetchToDos()
        },
        async deleteToDo(toDo, index) {
            if (this.saving) return
            this.saving = index
            API.del(this.getAPIName, `/todos/object/${toDo.id}`, {
                body: toDo
            }).then(() => {
                this.fetchToDos()
            }).catch(error => {
                this.saving = false
                console.log(error.response);
            })
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
            this.$router.push({ query: { date: this.date.format('YYYY-MM-DD'), view: 'month' }})
        },
        goToDay(dayOfMonth) {
            if (!dayOfMonth.fullDate) return
            this.$router.push({ query: { date: dayOfMonth.fullDate }})
        }
    }
}
</script>

<style lang="scss">
$lightgray: lightgray;
$gray: gray;

h2.date {
    text-align: center;
    display: grid;
    grid-template-columns: 1.5em 1fr 1.5em 55px 55px;
    align-items: center;

    i { cursor: pointer; font-size: 1.5em; }

    @media (min-width: 768px) {
        max-width: 330px
    }
}
.day-view {
    position: relative;

    h3 {
        margin: 0;
        padding: 1rem;
        border-bottom: 1px solid lightgray;
    }
}
ul.todos {
    margin-bottom: 2rem;
    position: relative;
    li {
        font-size: 1.2em;
        padding: 1rem 0;
    }
    &.completed-todos li {
        font-size: 1em;
        opacity: 0.5;

        &:first-child {
            border-top: none !important;
        }
    }
    li:not(.empty-list) {
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
            grid-template-columns: 2rem 9fr 0.3fr 0.3fr;
            span {
                padding: 0.8rem 0 0.7rem 1rem;
                font-size: 1.2em;
            }
            input[type="text"] {
                border: 1px solid $lightgray;
            }
            i.fas.fa-check {
                display: inline-block;
                grid-row: 1 / 2;
                grid-column: 3 / 4;
                justify-self: center;
                // padding: 0 1rem;
            }
            i.fas.fa-times {
                display: inline-block;
                grid-row: 1 / 2;
                grid-column: 4 / 5;
                justify-self: center;
                // padding: 0 1rem;
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
}
ul.calendar {
    display: grid;
    grid-template-columns: repeat(7, calc(100vw / 7));

    @media (min-width: 769px) and (max-width: 1024px) {
        grid-template-columns: repeat(7, calc((100vw - 4em) / 7));
    }
    @media (min-width: 1025px) {
        grid-template-columns: repeat(7, calc(1024px / 7));
    }

    li.day {
        & > div {
            height: 100%;
            width: 100%;
        }
        height: 80px;
        border: solid lightgray;
        border-width: 0 1px 1px 0;

        &:nth-child(7n + 1) {
            border-left-width: 1px;
        }
        position: relative;
        padding-right: 4px;
        cursor: pointer;

        @media (min-width: 1025px) {
            padding: 5px;
        }

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
        ul.completed-todos {
            opacity: 0.5;
            margin-top: 1rem;
            li { text-decoration: line-through; }
        }
    }
    li.weekday-label {
        border: solid lightgray;
        border-width: 0 0 1px 0;
        padding: 0 0 1rem 0;
        text-align: center;
        font-size: 1.5em;
        font-weight: bold;
    }

}
</style>
