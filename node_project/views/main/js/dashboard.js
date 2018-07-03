$(function(){
  getSize();
  FollowersChart();
  Likes_chart();
  sample_chart();
  sample_chart2();
})

function getSize(){
  var subscribers_width = $("#subscribers").width();
  subscribers_width = subscribers_width * 0.6;
  $("#subscribers").height(subscribers_width);
  var likes_width = $("#likes").width();
  likes_width = likes_width * 0.5;
  $("#likes").height(likes_width);
  var sample_width = $("#sample").width();
  sample_width = sample_width;
  $("#sample").height(sample_width);
  var sample2_width = $("#sample2").width();
  sample2_width = sample2_width*0.5;
  $("#sample2").height(sample2_width);
}
var followers = new Vue({
  el: "#followers",
  data: {
    fb_icon: "/img/fb_icon.png",
    insta_icon: "/img/insta_icon.png",
    twit_icon: "/img/twit_icon.png",
  }
})
var engaged = new Vue({
  el: "#engaged",
  data: {
    options: [
      {NOdays: 7, days: "7 days"},
      {NOdays: 15, days: "15 days"},
      {NOdays: 30, days: "30 days"},
    ],
    selected:'',
  }
})

function FollowersChart() {

  var followers_chart = echarts.init(document.getElementById('subscribers'));
  var seriesLabel = {
    normal: {
      show: true,
      textBorderColor: '#333',
      textBorderWidth: 2
    }
  }

  option = {
    title: {
      text: 'Wheater Statistics'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['City Alpha', 'City Beta', 'City Gamma']
    },
    grid: {
      left: 100
    },
    xAxis: {
      type: 'value',
      name: 'Days',
      axisLabel: {
        formatter: '{value}'
      }
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: ['Sunny', 'Cloudy', 'Showers'],
      axisLabel: {
        formatter: function (value) {
          return '{' + value + '| }\n{value|' + value + '}';
        },
        margin: 20,
        rich: {
          value: {
            lineHeight: 30,
            align: 'center'
          },
          Sunny: {
            height: 40,
            align: 'center',
          },
          Cloudy: {
            height: 40,
            align: 'center',
          },
          Showers: {
            height: 40,
            align: 'center',
          }
        }
      }
    },
    series: [{
        name: 'City Alpha',
        type: 'bar',
        data: [165, 170, 30],
        label: seriesLabel,
        markPoint: {
          symbolSize: 1,
          symbolOffset: [0, '50%'],
          label: {
            normal: {
              formatter: '{a|{a}\n}{b|{b} }{c|{c}}',
              backgroundColor: 'rgb(242,242,242)',
              borderColor: '#aaa',
              borderWidth: 1,
              borderRadius: 4,
              padding: [4, 10],
              lineHeight: 26,
              // shadowBlur: 5,
              // shadowColor: '#000',
              // shadowOffsetX: 0,
              // shadowOffsetY: 1,
              position: 'right',
              distance: 20,
              rich: {
                a: {
                  align: 'center',
                  color: '#fff',
                  fontSize: 18,
                  textShadowBlur: 2,
                  textShadowColor: '#000',
                  textShadowOffsetX: 0,
                  textShadowOffsetY: 1,
                  textBorderColor: '#333',
                  textBorderWidth: 2
                },
                b: {
                  color: '#333'
                },
                c: {
                  color: '#ff8811',
                  textBorderColor: '#000',
                  textBorderWidth: 1,
                  fontSize: 22
                }
              }
            }
          },
        }
      },
      {
        name: 'City Beta',
        type: 'bar',
        label: seriesLabel,
        data: [150, 105, 110]
      },
      {
        name: 'City Gamma',
        type: 'bar',
        label: seriesLabel,
        data: [220, 82, 63]
      }
    ]
  };
  followers_chart.setOption(option)
}

function Likes_chart() {
  var likes_chart = echarts.init(document.getElementById('likes'));
  data = [
    ["2000-06-05", 116],
    ["2000-06-06", 129],
    ["2000-06-07", 135],
    ["2000-06-08", 86],
    ["2000-06-09", 73],
    ["2000-06-10", 85],
    ["2000-06-11", 73],
    ["2000-06-12", 68],
    ["2000-06-13", 92],
    ["2000-06-14", 130],
    ["2000-06-15", 245],
    ["2000-06-16", 139],
    ["2000-06-17", 115],
    ["2000-06-18", 111],
    ["2000-06-19", 309],
    ["2000-06-20", 206],
    ["2000-06-21", 137],
    ["2000-06-22", 128],
    ["2000-06-23", 85],
    ["2000-06-24", 94],
    ["2000-06-25", 71],
    ["2000-06-26", 106],
    ["2000-06-27", 84],
    ["2000-06-28", 93],
    ["2000-06-29", 85],
    ["2000-06-30", 73],
    ["2000-07-01", 83],
    ["2000-07-02", 125],
    ["2000-07-03", 107],
    ["2000-07-04", 82],
    ["2000-07-05", 44],
    ["2000-07-06", 72],
    ["2000-07-07", 106],
    ["2000-07-08", 107],
    ["2000-07-09", 66],
    ["2000-07-10", 91],
    ["2000-07-11", 92],
    ["2000-07-12", 113],
    ["2000-07-13", 107],
    ["2000-07-14", 131],
    ["2000-07-15", 111],
    ["2000-07-16", 64],
    ["2000-07-17", 69],
    ["2000-07-18", 88],
    ["2000-07-19", 77],
    ["2000-07-20", 83],
    ["2000-07-21", 111],
    ["2000-07-22", 57],
    ["2000-07-23", 55],
    ["2000-07-24", 60]
  ];

  var dateList = data.map(function (item) {
    return item[0];
  });
  var valueList = data.map(function (item) {
    return item[1];
  });

  option = {

    // Make gradient line here
    visualMap: [{
      show: false,
      type: 'continuous',
      seriesIndex: 0,
      min: 0,
      max: 400
    }, {
      show: false,
      type: 'continuous',
      seriesIndex: 1,
      dimension: 0,
      min: 0,
      max: dateList.length - 1
    }],


    title: [{
      left: 'center',
      text: 'Gradient along the y axis'
    }, {
      top: '55%',
      left: 'center',
      text: 'Gradient along the x axis'
    }],
    tooltip: {
      trigger: 'axis'
    },
    xAxis: [{
      data: dateList
    }, {
      data: dateList,
      gridIndex: 1
    }],
    yAxis: [{
      splitLine: {
        show: false
      }
    }, {
      splitLine: {
        show: false
      },
      gridIndex: 1
    }],
    grid: [{
      bottom: '60%'
    }, {
      top: '60%'
    }],
    series: [{
      type: 'line',
      showSymbol: false,
      data: valueList
    }, {
      type: 'line',
      showSymbol: false,
      data: valueList,
      xAxisIndex: 1,
      yAxisIndex: 1
    }]
  };
  likes_chart.setOption(option);
}


function sample_chart() {
  var sample_chart = echarts.init(document.getElementById('sample'));

  function createNodes(count) {
      var nodes = [];
      for (var i = 0; i < count; i++) {
          nodes.push({
              id: i
          });
      }
      return nodes;
  }

  function createEdges(count) {
      var edges = [];
      if (count === 2) {
          return [[0, 1]];
      }
      for (var i = 0; i < count; i++) {
          edges.push([i, (i + 1) % count]);
      }
      return edges;
  }

  var datas = [];
  for (var i = 0; i < 16; i++) {
      datas.push({
          nodes: createNodes(i + 2),
          edges: createEdges(i + 2)
      });
  }

  option = {
      series: datas.map(function (item, idx) {
          return {
              type: 'graph',
              layout: 'force',
              animation: false,
              data: item.nodes,
              left: (idx % 4) * 25 + '%',
              top: Math.floor(idx / 4) * 25 + '%',
              width: '25%',
              height: '25%',
              force: {
                  // initLayout: 'circular'
                  // gravity: 0
                  repulsion: 60,
                  edgeLength: 2
              },
              edges: item.edges.map(function (e) {
                  return {
                      source: e[0],
                      target: e[1]
                  };
              })
          };
      })
  };

  sample_chart.setOption(option)
}

function sample_chart2(){
  var sample_chart2 = echarts.init(document.getElementById('sample2'));
  option = {
    tooltip : {
        formatter: "{a} <br/>{b} : {c}%"
    },
    toolbox: {
        feature: {
            restore: {},
            saveAsImage: {}
        }
    },
    series: [
        {
            name: '业务指标',
            type: 'gauge',
            detail: {formatter:'{value}%'},
            data: [{value: 50, name: '完成率'}]
        }
    ]
  };

  setInterval(function () {
    option.series[0].data[0].value = (Math.random() * 100).toFixed(2) - 0;
    sample_chart2.setOption(option, true);
  },2000);
}