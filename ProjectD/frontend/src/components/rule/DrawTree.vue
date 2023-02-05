<template>
    <div id="content">
        <h3>Правила</h3>
        <div id="rules"></div>
        <h3>Терминальные символы</h3>
        <div id="term"></div>
        <h3>Нетерминальные символы</h3>
        <div id="nterm"></div>

        <h3>Множество FIRST</h3>
        <div id="first"></div>

        <h3>Множество FOLLOW</h3>
        <div id="follow"></div>

        <form @submit="readWord">
                <input type="text" name="word" placeholder="Слово" required v-model="word" class="form-control mt-2">
                <input type="submit" value="Построить" class="btn btn-outline-light w-25 mt-2">
        </form>

        <div>
            <table id="wordParsing">
            </table>
        </div>

    </div>
</template>

<script>
    import http from "../../http-common";
    import $ from "jquery";

    export default{
        name: "AddRule",
        props: ['id'], // входные параметры
        data(){
            return{
                rule: {
                    user_id : "",
                    name : "",
                    grammar : "",
                    startSymbol : "",
                    endSymbol : ""
                },
                message : "",
                submitted : false,
                //
                //rules : [],
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
                //допуск
                allowanceTerm : '#',
                //цепочка для вывода
                word : ""
            };
        },
        computed: {
            currentUser(){
                return this.$store.state.auth.user;
            }
        },
        methods:{
            getRule() {
                http
                    .get("/rule/" + this.id) // обращаемся к серверу для получения списка пользователей, id взят из входных параметров (props)
                    .then(response => { // запрос выполнен успешно
                        //console.log(response);
                        this.rule = response.data;
                        //$("#rules").empty();
                        this.readRules(this.rule.grammar.split('\n'));
                        this.firstSet();
                        this.followSet();
                        this.getTable(this.rule.grammar.split('\n'));
                    })
                    .catch(e => { // запрос выполнен с ошибкой
                        console.log(e);
                    });
            },
            readRules(rules){
                //пробегаемся по правилам и считываем всю информацию
                rules.forEach(element => {
                    //вывод правила
                    $("#rules").append('<p>' + element + '</p>');

                    //первый символ - нетерминал, который является ключом mapOfRules
                    this.nterm.add(element[0]);
                    var kmap = element[0];

                    //добавляем запись в mapOfRules
                    if(!this.mapOfRules.has(kmap)){
                        this.mapOfRules.set(kmap, new Map([[0, element.slice(4)]]));
                    }else{
                        var num = this.mapOfRules.get(kmap).size;
                        this.mapOfRules.get(kmap).set(num, element.slice(4));
                    }

                    //определяем классы терминальных и не терминальных символов
                    for(var i=4; i<element.length; i++){
                        if(element[i].charCodeAt(0) > 64 && element[i].charCodeAt(0) < 90){
                            this.nterm.add(element[i]);
                        }else if(element[i].charCodeAt(0)){
                            //console.log(element[i]);
                            this.term.add(element[i]);
                        }
                    }
                });
                
                //вывод терминальных символов
                this.term.forEach(element => {
                    $("#term").append(element + ' ');
                });
                $("#term").append(" --------- " + this.term.size);
                
                //вывод нетерминальных символов
                this.nterm.forEach(element => {
                    $("#nterm").append(element + ' ');
                });
                $("#nterm").append(" --------- " + this.nterm.size);

                console.log("term elements : ", this.term);
                console.log("nterm elements : ", this.nterm);
                console.log("map of rules : ", this.mapOfRules);
            },
            firstSet(){
                this.nterm.forEach(element => {
                    this.mapFirst.set(element, this.first(element, 'x'));
                });

                console.log("map FIRST : ", this.mapFirst);

                for(var elem of this.mapFirst.keys()){
                    $("#first").append(elem + " : ");
                    this.mapFirst.get(elem).forEach(val => {
                        $("#first").append(val + " ");
                    });
                    $("#first").append("<br>");
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
                    $("#follow").append(elem + " : ");
                    this.mapFollow.get(elem).forEach(val => {
                        $("#follow").append(val + " ");
                    });
                    $("#follow").append("<br>");
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
                
            },
            readWord(e){
                var cont = "<caption>Таблица разбора слова</caption><tr><th>Номер</th><th>Слово</th><th>Магазин</th><th>Порядок правил</th><th>Запись из таблицы</th></tr>";
                $("#wordParsing").empty();
                $("#wordParsing").append(cont);
                e.preventDefault(); // запрет отправки формы, так как обрабатывать будем с помощью методов axios
                //переменная слова
                var word = this.word;
                //переменная магазина
                var shop = this.rule.startSymbol + this.rule.endSymbol;
                //Строка разбора слова
                var parsingString = "";
                //номер итерации
                var n = 1;
                //вспомогательные теги
                var openTag = "<tr><td>";
                var tag = "</td><td>"
                var closeTag = "</td></tr>";
                //строка записи из таблицы
                var tableRule = "M(" + shop[0] + ", " + word[0] + ") = (" +  this.MTable.get(shop[0]+word[0]) + ")";
                //строка для html
                var tableEntry = openTag + n + tag + word + tag + shop + tag + parsingString + tag + tableRule + closeTag;
                $("#wordParsing").append(tableEntry);
                //цикл для просчёта порядка правил
                while (shop[0] + word[0] != this.rule.endSymbol + this.rule.endSymbol){
                    n++;
                    var res = this.MTable.get(shop[0]+word[0]);
                    if(res[0] == "blowout"){
                        word = word.slice(1, word.length);
                        shop = shop.slice(1, shop.length);
                    }
                    else if(res[0] == this.rule.endSymbol){
                        shop = shop.slice(1, shop.length);
                        parsingString += res[1];
                    }else{
                        shop = res[0] + shop.slice(1, shop.length);
                        parsingString += res[1];
                    }
                    if(word.length == 0){
                        word = this.rule.endSymbol;
                    }
                    tableRule = "M(" + shop[0] + ", " + word[0] + ") = (" +  this.MTable.get(shop[0]+word[0]) + ")";
                    tableEntry = openTag + n + tag + word + tag + shop + tag + parsingString + tag + tableRule + closeTag;                   
                    $("#wordParsing").append(tableEntry);
                }

            }
        },
        mounted() { // загружаем данные пользователя
            this.getRule();
        }
    }
</script>