$(function(){
  var VAL = generateRandom(1,101);
  main.cor=VAL;

  $("#reset").on('click', function(){
    location.reload();
  })
})
var generateRandom = function (min, max) {
  var ranNum = Math.floor(Math.random()*(max-min+1)) + min;
  return ranNum;
}
// 새로운 뷰를 정의합니다
var main = new Vue({
  el: '#main', // 어떤 엘리먼트에 적용을 할 지 정합니다
  // data 는 해당 뷰에서 사용할 정보를 지닙니다
  data: {
    name: '25th',
    cor:0,
    value:'0'
  }   
});