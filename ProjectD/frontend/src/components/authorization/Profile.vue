<template>
    <div id="content">
        <header>
            <h3>
                Профиль <strong>{{currentUser.name}}</strong>
            </h3>
        </header>
        <p>
            <strong>Токен JWT:</strong>
            <!--вообще токен нельзя выводить на веб-странице, но для ознакомления он будет отображён на странице профиля пользователя-->
            {{currentUser.accessToken}}
        </p>
        <p>
            <strong>Id:</strong>
            {{currentUser.id}}
        </p>
        <p>
            <strong>Логин:</strong>
            {{currentUser.name}}
        </p>
        <p>
            <strong>Роль:</strong>
            {{currentUser.role}}
        </p>
    </div>
</template>
<script>
    export default {
        name: 'ProfileUser',
        computed: {
            currentUser() {
                return this.$store.state.auth.user;
            }
        },
        mounted() {
            if (!this.currentUser) {
                this.$router.push('/login');
            }
        }
    };
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