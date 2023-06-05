<script setup lang="ts">
import { onMounted } from 'vue';
import WordCloud from 'wordcloud';
import { getNames } from '../../api/remote-data';

const width = document.body.clientWidth;
const height = document.body.clientHeight;

onMounted(async () => {
  const list = await getNames();
  const target = document.getElementById('hot_word');
  target &&
    WordCloud(target, {
      list,
      minSize: 2,
      maskColor: 'red',
      color: function (word, weight) {
        return weight === 12 ? '#f02222' : '#c09292';
      },
      gridSize: Math.round((18 * width) / 1024),
      backgroundColor: '#242424',
      // rotateRatio: 0.5,
      // rotationSteps: 2,
      fontFamily: 'Finger Paint, cursive, sans-serif',
      shrinkToFit: true,
    });
});
</script>

<template>
  <div class="w-full h-full">
    <canvas id="hot_word" :width="width" :height="height"></canvas>
  </div>
</template>

<style>
@font-face {
  font-family: 'Finger Paint';
  src: url(https://fonts.googleapis.com/css?family=Finger+Paint);
}
</style>
