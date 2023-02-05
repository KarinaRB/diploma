//множество правил
var rules = ["E::=TA", "E::=+TA", "A::=-", "T::=PD", "D::=*PD", "D::=-", "P::=i", "P::=(E)"];
//var rules = ["S::=ABa", "S::=DE", "A::=EC", "A::=AC", "B::=b", "B::=-", "C::=c", "D::=d", "D::=-", "E::=BAB", "E::=c"];
//множество терминальных символов
var term = new Set();
//множество нетерминальных символов
var nterm = new Set();
//мэп правил
var mapOfRules = new Map();
//мэп множества FIRST
var mapFirst = new Map();
//мэп множества FOLLOW
var mapFollow = new Map();

var MTable = new Map();
//символ конца вывода
var endTerm = '-';
//символ начального значения
var startNterm ='E';
//допуск
var allowanceTerm = '#';
//цепочка для вывода
var word = "i+i*i"

    const pair = (first, second) => (
        Object.freeze({
            'first': first,
            'second': second,
        })
    );
    const getFirst = (pair) => (pair.first);
    const getSecond = (pair) => (pair.second);

$(document).ready(() => {

    readRules();

    //вывод терминальных символов
    for (var item of term){
        $("#term").append(item + " ");
    }
    $("#term").append(" --------- " + term.size);
    
    //вывод нетерминальных символов
    for (var item of nterm){
        $("#nterm").append(item + " ");
    }
    $("#nterm").append(" --------- " + nterm.size);

    console.log("term elements : ", term);
    console.log("nterm elements : ", nterm);
    console.log("map of rules : ", mapOfRules);

    firstSet();

    console.log("map FIRST : ", mapFirst);

    for(var elem of mapFirst.keys()){
        $("#first").append(elem + " : ");
        mapFirst.get(elem).forEach(val => {
            $("#first").append(val + " ");
        });
        $("#first").append("<br>");
    }

    followSet();

    console.log("map FOLLOW : ", mapFollow);

    for(var elem of mapFollow.keys()){
        $("#follow").append(elem + " : ");
        mapFollow.get(elem).forEach(val => {
            $("#follow").append(val + " ");
        });
        $("#follow").append("<br>");
    }

    getTable();

    console.log("map Table : ", MTable);
});

function readRules(){
    //пробегаемся по правилам и считываем всю информацию
    rules.forEach(element => {
        //вывод правила
        $("#rules").append('<p>' + element + '</p>');

        //первый символ - нетерминал, который является ключом mapOfRules
        nterm.add(element[0]);
        var kmap = element[0];

        //добавляем запись в mapOfRules
        if(!mapOfRules.has(kmap)){
            mapOfRules.set(kmap, new Map([[0, element.slice(4)]]));
        }else{
            var num = mapOfRules.get(kmap).size;
            mapOfRules.get(kmap).set(num, element.slice(4));
        }

        //определяем классы терминальных и не терминальных символов
        for(var i=4; i<element.length; i++){
            if(element[i].charCodeAt(0) > 64 && element[i].charCodeAt(0) < 90){
                nterm.add(element[i]);
            }else if(element[i].charCodeAt(0)){
                //console.log(element[i]);
                term.add(element[i]);
            }
        }

    });
};

function firstSet(){
    nterm.forEach(element => {
        mapFirst.set(element, first(element, 'x'));
    });
}

function first(Nterm, mainElement){
    //множество FIRST элементов
    var firstElements = new Set();
    mapOfRules.get(Nterm).forEach(elem =>{
        //если правая часть терминал, то просто добавляем его
        if(term.has(elem[0])){
            firstElements.add(elem[0]);
        }else{
            for(var i=0; i<elem.length; i++){
                var res = new Set();
                //если есть уже запись этого нетерминала в FIRST
                if(mapFirst.has(elem[i])){
                    res = mapFirst.get(elem[i]);
                }
                //если нет такой записи, то запускаем рекурсию
                else if(elem[i] != Nterm && elem[i] != mainElement && nterm.has(elem[i])){
                    res = first(elem[0], Nterm);
                }
                //иначе выходим из цикла
                else{
                    break;
                }
                //проверяем наличие конечного символа
                if(res.has(endTerm)){
                    res.forEach(e =>{
                        if(e != endTerm){
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
}

function followSet(){
    nterm.forEach(element => {
        if(element == startNterm){
            mapFollow.set(element, follow(element).add(endTerm));
        }else{
            mapFollow.set(element, follow(element));
        }
    });
}

function follow(Nterm){
    var followElements = new Set();
    //пробегаемся по всем правым частям и ищем Nterm
    for(var [key, value] of mapOfRules){
        for(var [k, v] of value){
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
                            if(term.has(v[i])){
                                res.add(v[i]);
                            }
                            //если справа нетерминал
                            else{
                                //получаем FIRST от элемента справа
                                res = mapFirst.get(v[i]);
                            }
                            //если есть конечный элемент
                            if(res.has(endTerm)){
                                res.forEach(e =>{
                                    if(e != endTerm){
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
                            if(mapFollow.has(key)){
                                res = mapFollow.get(key);
                                res.forEach(e=>{
                                    followElements.add(e);
                                });
                            }else{
                                follow(key).forEach(e=>{
                                    followElements.add(e);
                                });
                            }
                        }
                    //если Nterm на последней позиции    
                    }else if(key != Nterm){
                        if(mapFollow.has(key)){
                            res = mapFollow.get(key);
                            res.forEach(e=>{
                                followElements.add(e);
                            });
                        }else{
                            follow(key).forEach(e=>{
                                followElements.add(e);
                            });
                        }
                    }
                }

            }
        }
    }
    return followElements;
}

//Получение FIRST от правой части правила
function getFirstOfRule(elem){
    var res = new Set();
    if(term.has(elem[0])){
        res.add(elem[0]);
    }else{
        mapFirst.get(elem[0]).forEach(el=>{
            res.add(el);
        });
    }
    return res;
}

//метод построения таблицы
function getTable(){
    var i = 1;
    rules.forEach(element=>{
        var elements;
        //если не конечный элемент
        if(element[4] != endTerm){
            elements = getFirstOfRule(element.slice(4));
        }
        //если конечный элемент
        else{
            elements = mapFollow.get(element[0]);
        }
        elements.forEach(el=>{
            MTable.set([element[0], el], [element.slice(4), i]);
        });
        i++;
    });
    //выброс
    term.forEach(elem=>{
        MTable.set([elem, elem], ["blowout", 0]);
    });
    //допуск
    MTable.set([allowanceTerm, endTerm], ["allowance", 0]);
}




