var treeData = 
    {
      "name": "Top Level",
      "parent": "null",
      "children": [
        {
          "name": "Level 2: A",
          "parent": "Top Level",
          "children": [
            {
              "name": "Son of A",
              "parent": "Level 2: A"
            },
            {
              "name": "Daughter of A",
              "parent": "Level 2: A"
            }
          ]
        },
        {
          "name": "Level 2: B",
          "parent": "Top Level"
        }
      ]
    };

$(document).ready(() => {

  // ************** Generate the tree diagram  *****************

  // set the dimensions and margins of the diagram
  //Установка отступов, ширины и высоты окна 
  var margin = {top: 20, right : 90 , bottom : 20, left : 90},
  width = $(window).width() - margin.right - margin.left,
  height = $(window).height()/2 - margin.top - margin.bottom;

  console.log(width, height);

  //создание svg элемента
  var svg = d3.select("#divCollapsibleTree").append("svg")
    .attr("width", width + margin.right + margin.left) //ширина
    .attr("height", height + margin.top + margin.bottom) //высота
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")  //перемещение поля
    .append("g"); //эллемент для группировки

  var i = 0;
  var duration = 550;

  // declares a tree layout and assigns the size
  //Очень важна базовая инициализация древовидной структуры
  //d3.tree() - сщздаёт новый древовидный макет с настройками по умолчанию
  //.nodeSize() - установка размеров макета
  var tree = d3.tree().size([height, width]);

  //Диагональ по диагонали будет выступать в качестве соединительной линии между узлами. 
  //В SVG нулевая точка координат находится в верхнем левом углу. Ось x направлена вправо, ось y - вниз.
  //Поскольку макет дерева обычно имеет вертикальную ориентацию, здесь, в сценарии, значения x и y намеренно меняются местами,
  //чтобы, таким образом, достичь горизонтальной ориентации.
  var diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x)

  //d3.json() - не работает

  //создаёт иеархию по данным, если они в JSON, если же нет, то надо использовать .stratify()
  var root = d3.hierarchy(treeData, function(d){
    return d.children;
  });

  //Корневые точки x и y дерева
  root.x0 = height/2;
  root.y0 = 0;

  console.log("root ", root.x0, root.y0);

  update(root);

  //функция обновления (вызывается при каждом нажатии на дерево)
  function update(source){
    var treeData = tree(root);
    //узлы
    var nodes = treeData.descendants();

    //проходимся по узлам и устанавливаем им параметр y (для нормального отображения)
    nodes.forEach(function(d){
      d.y = d.depth * 180;
    });

    //Передаём в наш svg узлы и функцию обратного вызова
    var node = svg.selectAll("g.node").data(nodes, function(d){
      return d.id || (d.id = ++i);
    });

    //
    var nodeEnter = node.enter()
      .append('g')
      .attr("class", "node")
      .attr("transform", function(d){ return "translate(" + source.y0 + ", " + source.x0 + ")";}) // перемещение от точки родителя
      .on("click", click) // добавляем функцию клика

    nodeEnter
      .append("circle") // добавляем круг
      .attr("class", "node")
      .attr("r", 10) //радиус
      .style("fill", function(d){ return d._children ? "red" : "black";}); //если есть дети, то красный, иначе черный

      //
    var nodeUpdate = nodeEnter.merge(node);

    console.log()

    nodeUpdate.transition()
      .duration(duration)
      .attr("transform", function(d){return "translate(" + d.y + ", "+ d.x + ")";});

    nodeUpdate.select("circle.node")
     .attr("r", 10)
     .style("fill", function(d){return d._children ? "red" : "black";})
     .attr("cursor", "pointer"); //указатель мыши при наведении курсора

    //уход точек в "Родителя"
    nodeExit = node.exit()
      .transition()
      .duration(duration)
      .attr("transform", function(d){return "translate(" + source.y + ", "+ source.x + ")";})
      .remove();
    
      nodeExit.select("circle").attr("r", 0);

    //Сохранить старые позиции для переходов обратно (если хотим свернуть наш граф)
    nodes.forEach(function(d){
      d.x0 = d.x;
      d.y0 = d.y;
    });

    //создание ссылок
    var links = root.links();

    var link = svg.selectAll("path.link").data(links, function (d) {
      return d.target.id;
    });

    var linkEnter = link
      .enter()
      .insert("path", "g")
      .attr("class", "link")
      .attr("d", function (d) {
        var o = { x: source.x0, y: source.y };
        return diagonal({source: o, target: o});
      });

    var linkUpdate = linkEnter.merge(link);

    linkUpdate
      .transition()
      .duration(duration)
      .attr("d", diagonal);
  
    var linkExit = link
      .exit()
      .transition()
      .duration(duration)
      .attr("d", function (d) {
        var o = { x: source.x0, y: source.y0 };
        return diagonal({source: o, target: o});
      })
      .remove();

    //перебирает все элементы и проверяет, есть ли дочерние
    function click(event, d){
      //если есть дочерние элементы
      if(d.children){
        d._children = d.children;
        d.children = null;
      }else{
        d.children = d._children;
        d._children = null;
      }
      update(d);
    }

  }

});
