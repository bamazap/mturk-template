import './polyfills';
import $ from 'jquery';
import startHIT from './main/main';
import './index.scss';
import config from '../config.json';

document.title = config.meta.title;

$(document).ready(() => {
  const $main = $('#main');
  if (window.supportedBrowser === false) {
    $main.html('<p>Your browser is not able to run this HIT.</p>');
  } else {
    startHIT($main);
  }
});
