<template>
  <div>
    <knob-control v-model="someValue"></knob-control>
  </div>
</template>

<script>
import Vue from "vue";
import KnobControl from "vue-knob-control";
Vue.use(KnobControl);
Vue.config.productionTip = false;

console.log(3);

export default {
  name: "App",
  components: {
    KnobControl,
  },
  data() {
    return {
      someValue: 22,
    };
  },
};

console.log(4);
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>