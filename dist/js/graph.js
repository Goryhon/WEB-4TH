let marginX = 50;
let marginY = 100;
let height = 400;
let width = 1000;

let hideButton = document.getElementById('hideButton');//Получаем кнопку
hideButton.onclick = function(){//прописываем функцию выполн. при нажатии
    if (this.value === "Скрыть таблицу"){//если кнопка сначала подписана как "скрыть таблицу"
        this.value = "Показать таблицу"; //меняем подпись кнопки
        d3.select("table")//выбирем таблицу
            .selectAll("tr")//выбираем все строки этой таблицы
            .style("display", "none");//скрываем их
    } else {
        this.value = "Скрыть таблицу";//аналогично но только строки показываем
        d3.select("table")
            .selectAll("tr")
            .style("display", "");
    }
};

function getArrGraph(arrObject, fieldX){
    let groupObj = d3.group(arrObject, d => d[fieldX]);
    let arrGroup = [];
    for(let entry of groupObj) {
        let sum2021 = d3.sum(entry[1].map(function(d) {
            return d['Выплаты за 2021 год (руб.)']
        }));
        let sum2022 = d3.sum(entry[1].map(function(d) {
            return d['Выплаты за 2022 год (руб.)']
        }));
        arrGroup.push({
            "labelX": entry[0],
            "value2021": sum2021,
            "value2022": sum2022
        });
    }
    return arrGroup;
}

let graphButton = document.getElementById('butt-graph');
graphButton.onclick = function() {
    drawGraph();
}

function drawGraph(){
    //если не выбран ни один результат то выводим ошибку и выходим
    if (!document.getElementsByName("result")[0].checked &&
        !document.getElementsByName("result")[1].checked){
        alert("Выберите результат");
        return;
    }

    //смотрим что выбрали для абсциссы
    let selectedX;
    for (let i in document.getElementsByName("ox")){
        if (document.getElementsByName("ox")[i].checked) {
            selectedX = document.getElementsByName("ox")[i].value;
            break;
        }
    }

    //получаем массив с необходимыми данные которые будут выведены на экран
    let arrGraph = getArrGraph(data, selectedX)

    //делаем svg необходимыой высоты и ширины
    let svg = d3.select("svg")
        .attr("height", height)
        .attr("width", width);

    //чистим svg
    svg.selectAll("*").remove();

    //определяем мин и макс по у
    let min; let max;
    if (document.getElementsByName("result")[0].checked &&
        !document.getElementsByName("result")[1].checked){
        min = d3.min(arrGraph.map(d => d.value2022)) * 0.95;
        max = d3.max(arrGraph.map(d => d.value2022)) * 1.05;
    } else if (document.getElementsByName("result")[1].checked &&
        !document.getElementsByName("result")[0].checked){
        min = d3.min(arrGraph.map(d => d.value2021)) * 0.95;
        max = d3.max(arrGraph.map(d => d.value2021)) * 1.05;
    } else {
        if (d3.min(arrGraph.map(d => d.value2021)) < d3.min(arrGraph.map(d => d.value2022)))
            min = d3.min(arrGraph.map(d => d.value2021)) * 0.95;
        else
            min = d3.min(arrGraph.map(d => d.value2022)) * 0.95;

        if (d3.max(arrGraph.map(d => d.value2021)) < d3.max(arrGraph.map(d => d.value2022)))
            max = d3.max(arrGraph.map(d => d.value2022)) * 1.05;
        else
            max = d3.max(arrGraph.map(d => d.value2021)) * 1.05;
    }

    //вычисляем дину осей
    let xAxisLen = width - 2 * marginX;
    let yAxisLen = height - 2 * marginY;

    //определяем ось у
    let scaleY = d3.scaleLinear()
        .domain([min, max])
        .range([yAxisLen, 0]);

    //определяем ось х в зависимости от того диаграммы мы строим или точечный график
    let scaleX;
    if (document.getElementsByName("type")[0].checked) {
        scaleX = d3.scaleBand()
            .domain(arrGraph.map(function(d) {
                    return d.labelX;
                })
            )
            .range([0, xAxisLen]);
    }
    if (document.getElementsByName("type")[1].checked){
        scaleX = d3.scaleBand()
            .domain(arrGraph.map(function(d) {
                return d.labelX;
            }))
            .range([0, xAxisLen])
            .padding(0.2);
    }

    //определяем оси
    let axisX = d3.axisBottom(scaleX);
    let axisY = d3.axisLeft(scaleY);

    //рисуем оси и значения
    svg.append("g")
        .attr("transform", `translate(${marginX}, ${height - marginY})`)
        .call(axisX)
        .attr("class", "x-axis")
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".20em")
        .attr("transform", function (d) {
            return "rotate(-45)";
        });

    svg.append("g")
        .attr("transform", `translate(${marginX}, ${marginY})`)
        .attr("class", "y-axis")
        .call(axisY);

    //рисуем "клеточки"
    d3.selectAll("g.x-axis g.tick")
        .append("line")
        .classed("grid-line", true)
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", - (yAxisLen));

    d3.selectAll("g.y-axis g.tick")
        .append("line")
        .classed("grid-line", true)
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", xAxisLen)
        .attr("y2", 0);

    //проверяем какой резльата выбран и относительно эо рисуем или диаграмму или точечный график
    if (document.getElementsByName("result")[0].checked) {
        if (document.getElementsByName("type")[0].checked)
            drawDottedGraph(svg, arrGraph, "labelX", scaleX, "value2022", scaleY, "#00a3ff");
        if (document.getElementsByName("type")[1].checked)
            drawHistogram(svg, arrGraph, "labelX", scaleX, "value2022", scaleY, "#00a3ff", false)
    }

    if (document.getElementsByName("result")[1].checked) {
        if (document.getElementsByName("type")[0].checked)
            drawDottedGraph(svg, arrGraph, "labelX", scaleX, "value2021", scaleY, "gray");
        if (document.getElementsByName("type")[1].checked)
            drawHistogram(svg, arrGraph, "labelX", scaleX, "value2021", scaleY, "gray", true)
    }
}

function drawDottedGraph(svg, arrGraph, x, scaleX, y, scaleY, color){
    //рисеум кружки
    svg.selectAll(".dot")
        .data(arrGraph)
        .enter()
        .append("circle")
        .attr("r", 5)//радиус кружка
        .attr("cx", function (d) {
            return scaleX(d[x]);
        })
        .attr("cy", function (d) {
            return scaleY(d[y]);
        })
        .attr("transform", `translate(${marginX + width/(2.2 * arrGraph.length)}, ${marginY})`)//смещаем
        .style("fill", color)//красим
}

function drawHistogram(svg, arrGraph, x, scaleX, y, scaleY, color, pos){
    let translate = 0;
    if (pos)
        translate = scaleX.bandwidth() / 2;
    svg.append("g")
        .attr("transform", `translate(${marginX}, ${marginY})`)//смещаем нашу группу сост. из прямоугольников
        .selectAll(".rect")
        .data(arrGraph)
        .enter()
        .append("rect")//рисуем прямоугольники
        .attr("x", function(d) { return scaleX(d[x]) + translate; })//определяем где располагается по х
        .attr("width", scaleX.bandwidth()/2)//определяем ширину
        .attr("y", function(d) { return scaleY(d[y]); })//определяем где располагается по y
        .attr("height", function(d) { return height - 2 * marginY - scaleY(d[y]); })//определяем высоту
        .attr("fill", color);//красим
}