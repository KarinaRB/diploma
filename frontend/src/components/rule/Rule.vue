<template>
    <div id="content">
        <div v-if="this.rule">
            <h4>Грамматика</h4>
            <div id="error" v-if="word_error">
                {{ word_error_type }}
            </div>
            <form @submit="updateRule">
                <input type="text" name="name" placeholder="Название" required v-model="rule.name" class="form-control mt-2">
                <textarea name="grammar" placeholder="Правила" required v-model="rule.grammar" class="form-control mt-2"></textarea>
                <input type="text" name="startSymbol" placeholder="Начальный символ" required v-model="rule.startSymbol" class="form-control mt-2">
                <input type="text" name="endSymbol" placeholder="Символ выхода" required v-model="rule.endSymbol" class="form-control mt-2">
                <input type="submit" value="Обновить" class="btn btn-outline-light w-25 mt-2">
            </form>
            <button v-on:click="deleteRule()" class="btn btn-outline-light">Удалить</button>
            <button class="btn btn-outline-light">
                <router-link class="nav-link" :to="{
                        name: 'draw-tree',
                        params: { id: rule.id }
                    }"> 
                    Отрисовка дерева
                </router-link>
            </button>
        </div>
        <div v-else>
            <h4>Такой грамматики не найдено</h4>
        </div>
    </div>
</template>

<script>
    import http from "../../http-common";
    export default {
        name: "RuleDetails",
        props: ['id'], // входные параметры
        data() {
            return {
                rule: null,
                rules : "",
                nterms : "",
                terms : "",
                firsts : "",
                follows : "",
                mTable : "",
                message : "",
                submitted : false,
                //множество терминальных символов
                term : new Set(),
                //множество нетерминальных символов
                nterm : new Set(),
                //мэп правил
                mapOfRules : new Map(),
                //мэп множества FIRST
                mapFirst : new Map(),
                //мэп множества FOLLOW
                mapFollow : new Map(),
                //таблица M
                MTable : new Map(),
                word_error : false,
                word_error_type : "",
                splitElement : "::="
            };
        },
        computed: {
            currentUser(){
                return this.$store.state.auth.user;
            }
        },
        methods: {
            getRule() {
                http
                    .get("/rule/" + this.id) // обращаемся к серверу для получения списка пользователей, id взят из входных параметров (props)
                    .then(response => { // запрос выполнен успешно
                        console.log(response);
                        this.rule = response.data;
                    })
                    .catch(e => { // запрос выполнен с ошибкой
                        console.log(e);
                    });
            },
            updateRule(e) {
                e.preventDefault(); // запрет отправки формы, так как обрабатывать будем с помощью методов axios
                this.word_error = false;
                //Проверка корректности введенных правил грамматики
                this.readRules(this.rule.grammar.split('\n'));

                if(!this.word_error){
                    this.firstSet();
                    this.followSet();
                    this.getTable(this.rules.split('\n'));

                    
                    var data = {
                        name : this.rule.name,
                        grammar : this.rules,
                        startSymbol : this.rule.startSymbol,
                        endSymbol : this.rule.endSymbol,
                        user_id: this.currentUser.id,
                        term : this.terms,
                        nterm : this.nterms,
                        first : this.firsts,
                        follow : this.follows,
                        mapTable : this.mTable
                    };

                    http
                        .post("/updateRule/" + this.rule.id, data)
                        .then(() => {
                            this.$router.push('/userRules'); 
                        })
                        .catch(e => {
                            console.log(e);
                        });
                }
            },
            readRules(rules){
                this.rules = "";
                this.terms = "";
                this.nterms = "";
                this.mapOfRules.clear();
                //пробегаемся по правилам и считываем всю информацию
                rules.forEach(element => {
                    element = element.replaceAll(' ', '');
                    if(element.includes(this.splitElement) && !this.word_error){
                        element = element.split(this.splitElement);
                        //вывод правила
                        this.rules += element[0] + this.splitElement + element[1] + '\n';

                        //первый символ - нетерминал, который является ключом mapOfRules
                        this.nterm.add(element[0]);
                        var kmap = element[0];
                        var rpart = element[1];

                        //добавляем запись в mapOfRules
                        if(!this.mapOfRules.has(kmap)){
                            this.mapOfRules.set(kmap, new Map([[0, rpart]]));
                        }else{
                            var num = this.mapOfRules.get(kmap).size;
                            this.mapOfRules.get(kmap).set(num, rpart);
                        }

                        //определяем классы терминальных и не терминальных символов
                        for(var i=0; i<rpart.length; i++){
                            if(rpart[i].charCodeAt(0) > 64 && rpart[i].charCodeAt(0) <= 90){
                                this.nterm.add(rpart[i]);
                            }else if(rpart[i].charCodeAt(0)){
                                this.term.add(rpart[i]);
                            }
                        }
                    }else{
                        this.word_error = true;
                        this.word_error_type = "Введено некорректное правило грамматики в строке " + element;
                    }
                    
                });

                if(!this.word_error){
                    this.rules = this.rules.substr(0, this.rules.length-1);

                    //Проверка корректности  начального символа и символа выхода
                    if(!this.term.has(this.rule.endSymbol) || !this.nterm.has(this.rule.startSymbol)){
                        this.word_error = true;
                        this.word_error_type = "Некорректный начальный символ или символ выхода";
                    }

                    //вывод терминальных символов
                    this.term.forEach(element => {
                        this.terms += element + " ";
                    });
                    
                    //вывод нетерминальных символов
                    this.nterm.forEach(element => {
                        this.nterms += element + " ";
                    });

                    console.log("term elements : ", this.term);
                    console.log("nterm elements : ", this.nterm);
                    console.log("map of rules : ", this.mapOfRules);
                    console.log("rules : ", this.rules);
                    console.log("terms : ", this.terms);
                    console.log("nterms : ", this.nterms);
                }
            },
            firstSet(){
                this.nterm.forEach(element => {
                    this.mapFirst.set(element, this.first(element, 'x'));
                });

                console.log("map FIRST : ", this.mapFirst);

                for(var elem of this.mapFirst.keys()){
                    var str = elem + " : ";
                    this.mapFirst.get(elem).forEach(val => {
                        str += val + " ";
                    });
                    this.firsts += str + '\n';
                }
            },
            first(Nterm, mainElement){
                //множество FIRST элементов
                var firstElements = new Set();
                this.mapOfRules.get(Nterm).forEach(elem =>{
                    //если правая часть терминал, то просто добавляем его
                    if(this.term.has(elem[0])){
                        firstElements.add(elem[0]);
                    }else{
                        for(var i=0; i<elem.length; i++){
                            var res = new Set();
                            //если есть уже запись этого нетерминала в FIRST
                            if(this.mapFirst.has(elem[i])){
                                res = this.mapFirst.get(elem[i]);
                            }
                            //если нет такой записи, то запускаем рекурсию
                            else if(elem[i] != Nterm && elem[i] != mainElement && this.nterm.has(elem[i])){
                                res = this.first(elem[0], Nterm);
                            }
                            //иначе выходим из цикла
                            else{
                                break;
                            }
                            //проверяем наличие конечного символа
                            if(res.has(this.rule.endSymbol)){
                                res.forEach(e =>{
                                    if(e != this.rule.endSymbol){
                                        firstElements.add(e);
                                    }
                                });
                            }else{
                                res.forEach(e =>{
                                    firstElements.add(e);
                                });
                                break;
                            }
                        }
                    }
                });
                return firstElements;
            },
            followSet(){
                this.nterm.forEach(element => {
                    if(element == this.rule.startSymbol){
                        this.mapFollow.set(element, this.follow(element).add(this.rule.endSymbol));
                    }else{
                        this.mapFollow.set(element, this.follow(element));
                    }
                });
                console.log("map FOLLOW : ", this.mapFollow);

                for(var elem of this.mapFollow.keys()){
                    var str = elem + " : ";
                    this.mapFollow.get(elem).forEach(val => {
                        str += val + " ";
                    });
                    this.follows += str + '\n';
                }
            },
            follow(Nterm){
                var followElements = new Set();
                //пробегаемся по всем правым частям и ищем Nterm
                for(var [key, value] of this.mapOfRules){
                    for(var [k, v] of value){
                        k;
                        //если нашли правило с Nterm в правой части
                        var n = 0;
                        while(v.indexOf(Nterm, n) != -1){
                            var pos = v.indexOf(Nterm, n);
                            n = pos+1;
                            if(pos != -1){
                                //если Nterm не на последней позиции
                                if(pos < v.length-1){
                                    var res = new Set();
                                    var flag = false;
                                    for(var i=pos+1; i<v.length; i++){
                                        //если справа терминальный символ
                                        if(this.term.has(v[i])){
                                            res.add(v[i]);
                                        }
                                        //если справа нетерминал
                                        else{
                                            //получаем FIRST от элемента справа
                                            res = this.mapFirst.get(v[i]);
                                        }
                                        //если есть конечный элемент
                                        if(res.has(this.rule.endSymbol)){
                                            res.forEach(e =>{
                                                if(e != this.rule.endSymbol){
                                                    followElements.add(e);
                                                }
                                            });
                                        }else{
                                            res.forEach(e =>{
                                                followElements.add(e);
                                            });
                                            flag = true;
                                            break;
                                        }
                                    }
                                    //если все элементы правее имеют конечный символ
                                    if(!flag && key!=Nterm){
                                        if(this.mapFollow.has(key)){
                                            res = this.mapFollow.get(key);
                                            res.forEach(e=>{
                                                followElements.add(e);
                                            });
                                        }else{
                                            this.follow(key).forEach(e=>{
                                                followElements.add(e);
                                            });
                                        }
                                    }
                                //если Nterm на последней позиции    
                                }else if(key != Nterm){
                                    if(this.mapFollow.has(key)){
                                        res = this.mapFollow.get(key);
                                        res.forEach(e=>{
                                            followElements.add(e);
                                        });
                                    }else{
                                        this.follow(key).forEach(e=>{
                                            followElements.add(e);
                                        });
                                    }
                                }
                            }

                        }
                    }
                }
                return followElements;
            },
            getFirstOfRule(elem){
                var res = new Set();
                if(this.term.has(elem[0])){
                    res.add(elem[0]);
                }else{
                    this.mapFirst.get(elem[0]).forEach(el=>{
                        res.add(el);
                    });
                }
                return res;
            },
            getTable(rules){
                var i = 1;
                rules.forEach(element=>{
                    var elements;
                    //если не конечный элемент
                    if(element[4] != this.rule.endSymbol){
                        elements = this.getFirstOfRule(element.slice(4));
                    }
                    //если конечный элемент
                    else{
                        elements = this.mapFollow.get(element[0]);
                    }
                    elements.forEach(el=>{
                        //насколько это адекватное решение?
                        //this.MTable.set([element[0], el], [element.slice(4), i]);
                        this.MTable.set(element[0] + el, [element.slice(4), i]);
                    });
                    i++;
                });
                //выброс
                this.term.forEach(elem=>{
                    if(elem != this.rule.endSymbol) {
                        // this.MTable.set([elem, elem], ["blowout", 0]);
                        this.MTable.set(elem+elem, ["blowout", 0]);
                    }
                });
                //допуск
                //this.MTable.set([this.rule.endSymbol, this.rule.endSymbol], ["allowance", 0]);
                this.MTable.set(this.rule.endSymbol+this.rule.endSymbol, ["allowance", 0]);
                console.log("map Table : ", this.MTable);
                
                // перебор по ключам
                for (var kelem of this.MTable.keys()) {
                    this.mTable += kelem + "::";
                    for(var velem of this.MTable.get(kelem)){
                        this.mTable += velem + " ";
                    }
                    this.mTable += '\n';
                }

                console.log(this.mTable);

            },
            deleteRule() {
                http
                    .post("/deleteRule/" + this.rule.id)
                    .then(() => {
                        // переходим к списку (переход по ссылкам программно)
                        this.$router.push('/userRules');
                    })
                    .catch(e => {
                        console.log(e);
                    });
            }
        },
        mounted() { // загружаем данные пользователя
            this.getRule();
        }
    }
</script>