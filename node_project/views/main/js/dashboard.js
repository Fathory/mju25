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