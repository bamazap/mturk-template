import $ from 'jquery';

import mainHTML from './main.html';
import config from '../../config.json';
import custom from '../task/task';
import demoSurvey from '../demographic-survey/demographic-survey';

const lastIndex = (config.meta.numSubtasks - 1) + config.advanced.includeDemographicSurvey;

function gup(name) {
  const regexS = `[\\?&]${name}=([^&#]*)`;
  const regex = new RegExp(regexS);
  const tmpURL = window.location.href;
  const results = regex.exec(tmpURL);
  if (results == null) return '';
  return results[1];
}

const state = {
  taskIndex: gup('skipto') ? parseInt(gup('skipto'), 10) : 0,
  taskInputs: {},
  taskOutputs: [],
  assignmentId: gup('assignmentId'),
  workerId: gup('workerId'),
};

function isDemoSurvey() {
  const useSurvey = config.advanced.includeDemographicSurvey;
  const lastTask = state.taskIndex === lastIndex;
  return useSurvey && lastTask;
}

function getTaskInputs(i) {
  return config.meta.aggregate ? state.taskInputs : state.taskInputs[i];
}

function getTaskOutputs(i) {
  return config.meta.aggregate ? state.taskOutputs : state.taskOutputs[i];
}

// Hides the task UI if the user is working within an MTurk iframe and has not accepted the task
// Returns true if the task was hidden, false otherwise
function hideIfNotAccepted() {
  if (state.assignmentId === 'ASSIGNMENT_ID_NOT_AVAILABLE') {
    $('#experiment').hide();
    $('#hit-not-accepted').show();
    return true;
  }
  return false;
}

function saveTaskData() {
  let data;
  if (isDemoSurvey()) {
    data = demoSurvey.collectData();
  } else {
    data = custom.collectData(
      getTaskInputs(state.taskIndex),
      state.taskIndex,
      getTaskOutputs(state.taskIndex)
    );
  }
  if (config.meta.aggregate) {
    $.extend(state.taskOutputs, data);
  } else {
    // TODO: figure out how best to include the demo survey data in the results?
    state.taskOutputs[state.taskIndex] = data;
  }
}

function updateTask() {
  if (config.advanced.hideIfNotAccepted && hideIfNotAccepted()) {
    return;
  }
  $('#progress-bar').attr('value', state.taskIndex + 1);
  if (isDemoSurvey()) {
    demoSurvey.showTask();
  } else {
    // show the user's task
    demoSurvey.hideSurvey();
    $('#custom-experiment').show();
    custom.showTask(
      getTaskInputs(state.taskIndex),
      state.taskIndex,
      getTaskOutputs(state.taskIndex)
    );
  }
  if (state.taskIndex === lastIndex) {
    // last page
    $('#next-button').css('visibility', 'hidden');
    if (state.taskIndex !== 0) {
      $('#prev-button').css('visibility', 'visible');
    } else {
      $('#prev-button').css('visibility', 'hidden');
    }
    $('#submit-button').show();
    $('#final-task-fields').css('display', 'block');
  } else if (state.taskIndex === 0) {
    // first page
    $('#next-button').css('visibility', 'visible');
    $('#prev-button').css('visibility', 'hidden');
    $('#submit-button').hide();
    $('#final-task-fields').hide();
  } else {
    // intermediate page
    $('#next-button').css('visibility', 'visible');
    $('#prev-button').css('visibility', 'visible');
    $('#submit-button').hide();
    $('#final-task-fields').hide();
  }
}

function clearMessage() {
  $('#message-field').html('');
}

function generateMessage(cls, header) {
  clearMessage();
  if (!header) return;
  let messageStr = `<div class='ui message ${cls}'>`;
  messageStr += "<i class='close icon'></i>";
  messageStr += `<div class='header'>${header}</div></div>`;

  const newMessage = $(messageStr);
  $('#message-field').append(newMessage);
}

function nextTask() {
  if (state.taskIndex < lastIndex) {
    saveTaskData();

    let failedValidation;
    if (isDemoSurvey()) {
      failedValidation = demoSurvey.validateTask();
    } else {
      failedValidation = custom.validateTask(
        getTaskInputs(state.taskIndex),
        state.taskIndex,
        getTaskOutputs(state.taskIndex)
      );
    }

    if (failedValidation) {
      generateMessage('negative', failedValidation.errorMessage);
    } else {
      state.taskIndex += 1;
      updateTask();
      clearMessage();
    }
  }
}

function prevTask() {
  if (state.taskIndex > 0) {
    saveTaskData();
    state.taskIndex -= 1;
    updateTask();
  }
}

function toggleInstructions() {
  if ($('#experiment').css('display') === 'none') {
    $('#experiment').css('display', 'block');
    $('#instructions').css('display', 'none');
    updateTask();
  } else {
    saveTaskData();
    $('#experiment').css('display', 'none');
    $('#instructions').css('display', 'block');
  }
}

function addHiddenField(form, name, value) {
  // form is a jQuery object, name and value are strings
  const input = $(`<input type='hidden' name='${name}' value=''>`);
  input.val(value);
  form.append(input);
}

function cancelSubmit(err) {
  $('#submit-button').removeClass('loading');
  generateMessage('negative', err);
}

// highlights/selects text within an html element
// copied from:
// https://stackoverflow.com/questions/985272/selecting-text-in-an-element-akin-to-highlighting-with-your-mouse
function selectText(nodeID) {
  const node = document.getElementById(nodeID);

  if (document.body.createTextRange) {
    const range = document.body.createTextRange();
    range.moveToElementText(node);
    range.select();
  } else if (window.getSelection) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    // unsupported browser
  }
}

// Code to show the user's validation code; only used if task is configured as an external link
function showSubmitKey(key) {
  $('#submit-code').text(key);
  $('#experiment').hide();
  $('#succesful-submit').show();
  selectText('submit-code');
}

// submit to a customized back-end.
function externalSubmit(submitUrl) {
  const payload = {
    assignmentId: state.assignmentId,
    workerId: state.workerId,
    origin: state.origin,
    results: {
      inputs: state.taskInputs,
      outputs: state.taskOutputs,
    },
  };
  if (!config.advanced.includeDemographicSurvey) {
    payload.results.feedback = $('#feedback-input').val();
  }

  $.ajax({
    url: submitUrl,
    type: 'POST',
    data: JSON.stringify(payload),
    dataType: 'json',
  }).then((response) => {
    showSubmitKey(response.key);
  }).catch(() => {
    // This means there was an error connecting to the DEVELOPER'S
    // data collection server.
    // even if there is a bug/connection problem at this point,
    // we want people to be paid.
    // use a consistent prefix so we can pick out problem cases,
    // and include their worker id so we can figure out what happened
    const key = `mturk_key_${state.workerId}_${state.assignmentId}`;
    showSubmitKey(key);
  });
}

// submit to MTurk as a back-end. MTurk only accepts form submissions and frowns
// upon async POSTs.
function mturkSubmit(submitUrl) {
  const form = $('#submit-form');
  addHiddenField(form, 'assignmentId', state.assignmentId);
  addHiddenField(form, 'workerId', state.workerId);
  const results = {
    inputs: state.taskInputs,
    outputs: state.taskOutputs,
  };
  if (!config.advanced.includeDemographicSurvey) {
    results.feedback = $('#feedback-input').val();
  }
  addHiddenField(form, 'results', JSON.stringify(results));
  addHiddenField(form, 'feedback', $('#feedback-input').val());

  $('#submit-form').attr('action', submitUrl);
  $('#submit-form').attr('method', 'POST');
  $('#submit-form').submit();

  $('#submit-button').removeClass('loading');
  generateMessage('positive', 'Thanks! Your task was submitted successfully.');
  $('#submit-button').addClass('disabled');
}

function submitHIT() {
  let submitUrl;
  if (config.advanced.externalSubmit) {
    submitUrl = config.advanced.externalSubmitUrl;
  } else {
    // get prod/sandbox domain
    const urlParams = new URLSearchParams(window.location.search);
    let submitDomain = urlParams.get('turkSubmitTo') || 'https://www.mturk.com/';
    if (!submitDomain.endsWith('/')) {
      submitDomain += '/';
    }
    submitUrl = `${submitDomain}mturk/externalSubmit`;
  }
  saveTaskData();
  clearMessage();
  $('#submit-button').addClass('loading');
  for (let i = 0; i < config.meta.numSubtasks; i += 1) {
    const failedValidation = custom.validateTask(getTaskInputs(i), i, getTaskOutputs(i));
    if (failedValidation) {
      cancelSubmit(failedValidation.errorMessage);
      return;
    }
  }
  if (config.advanced.includeDemographicSurvey) {
    const failedValidation = demoSurvey.validateTask();
    if (failedValidation) {
      cancelSubmit(failedValidation.errorMessage);
      return;
    }
  }

  if (config.advanced.externalSubmit) {
    externalSubmit(submitUrl);
  } else {
    mturkSubmit(submitUrl);
  }
}

function populateMetadata() {
  $('.meta-title').html(config.meta.title);
  $('.meta-desc').html(config.meta.description);
  $('.instructions-simple').html(config.instructions.simple);
  config.instructions.steps.forEach((step) => {
    $('.instructions-steps').append($(`<li>${step}</li>`));
  });
  $('.disclaimer').html(config.meta.disclaimer);
  if (config.instructions.images.length > 0) {
    $('#sample-task').css('display', 'block');
    const instructionsIndex = Math.floor(Math.random() * config.instructions.images.length);
    let imgEle = "<img class='instructions-img' src='";
    imgEle += `${config.instructions.images[instructionsIndex]}'></img>`;
    $('#instructions-demo').append($(imgEle));
  }
  $('#progress-bar').attr(
    'max',
    config.meta.numSubtasks + config.advanced.includeDemographicSurvey,
  );
}

function setupButtons() {
  $('#next-button').click(nextTask);
  $('#prev-button').click(prevTask);
  $('.instruction-button').click(toggleInstructions);
  $('#submit-button').click(submitHIT);
  if (state.assignmentId === 'ASSIGNMENT_ID_NOT_AVAILABLE') {
    $('#submit-button').remove();
  }
}

/**
 * Insert main.html and start HIT
 * @param {JQuery<HTMLElement>} $main
 */
export default function startHIT($main) {
  $main.html(mainHTML);

  if (config.meta.aggregate) {
    state.taskOutputs = {};
  }
  custom.loadTasks(config.meta.numSubtasks).done((taskInputs) => {
    state.taskInputs = taskInputs;
    populateMetadata(config);
    demoSurvey.maybeLoadSurvey(config);
    setupButtons(config);
  });
}
