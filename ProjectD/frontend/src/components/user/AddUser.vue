<template>
    <div id="content">
        <h4>Добавление пользователя</h4>
        <div v-if="!submitted">
            <!--В @submit указывается обработчик, который выполнится после нажатия на кнопку "Добавить"
            Обработчик addUser определён в script-->
            <form @submit="addUser">
                <!--v-model - директива для связывания данных с элементами.
                Связь происходит при помощи переменных, которые определены в data()-->
                <input type="text" name="name" placeholder="Имя" required v-model="user.name" class="form-control mt-2">
                <select v-model="user.role" required class="form-select mt-2" >
                    <option> Абитуриент </option>
                    <option> Администратор </option>
                </select>
                <input type="submit" value="Добавить" class="btn btn-outline-light w-25 mt-2">
            </form>
        </div>
        <div v-else>
            <h4>Вы успешно добавили запись</h4>
            <div>
                <!--В v-on:click указывается обработчик, который выполниться после нажатия на кнопку "Добавить нового пользователя"
                Обработчик newUser определён в script-->
                <button v-on:click="newUser">Добавить нового пользователя</button>
            </div>
            <div>
                <router-link to="/listUsers">Вернуться к списку пользователей</router-link>
            </div>
        </div>
    </div>
</template>

<script>
    import http from "../../http-common";
    export default {
        name: "AddUser",
        data() {
            return {
                user: {
                    name: "",
                    role: ""
                },
                submitted: false
            };
        },
        methods: {
            addUser(e) {
                e.preventDefault(); // запрет отправки формы, так как обрабатывать будем с помощью методов axios
                var data = {
                    name: this.user.name,
                    role: this.user.role
                };
                // Либо var data = this.user;
                http
                    .post("/addUser", data)
                    .then(response => { // запрос выполнился успешно
                        this.user.id = response.data.id;
                    })
                    .catch(e => { // при выполнении запроса возникли ошибки
                        console.log(e);
                    });

                this.submitted = true;
            },
            newUser() {
                this.submitted = false;
                this.user = {
                    name: "",
                    username: "username",
                    password: "password",
                    admin: false
                };
            }
        }
    }
</script>

<style>
    #content{
        margin: 3%;
        font-family: ‘Raleway’,sans-serif; 
        font-size: 18px; 
        font-weight: 500; 
        line-height: 32px; 
    }
    #content form{
        padding: 3%;
        width: 50%;
        text-align: center;
    }
</style>