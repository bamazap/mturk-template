import $ from 'jquery';

import config from '../config.json';

const custom = {
  /**
   * This function is called on page load and should implement the promise interface
   * @param {number} numSubtasks int indicating what length array to return
   *   (how many subtasks this task should have)
   * @return if config.meta.aggregate is set to false,
   *   an array of objects with length config.meta.numTasks, one object for each task;
   *   else, an object that will be made available to all subtasks
   */
  loadTasks(numSubtasks) {
    if (!config.meta.aggregate) {
      return Promise.resolve(new Array(numSubtasks).map((v, i) => i));
    }
    return Promise.resolve({
      number: Math.floor((Math.random() * 10) + 1), // random number between 1 and 10
    });
  },

  /**
   * This function is called when the experiment view is unhidden
   *   or when the task index is changed
   * @param {Object} taskInput if config.meta.aggregate is false,
   *   the object in the array from loadTasks corresponding to subtask taskIndex;
   *   else, the input object from loadTasks
   * @param {number} taskIndex the number of the current subtask
   * @param {Object} taskOutput a partially filled out task corresponding to the subtask taskIndex
   *   If config.meta.aggregate is set to false, this is the results object for the current subtask
   *   If config.meta.aggregate is set to true, this is the results object for the entire task.
   */
  showTask(taskInput, taskIndex, taskOutput) {
    if (!config.meta.aggregate) {
      $('.exp-data').text(`Input for task ${taskInput.toString()}`);
      $('#exp-input').val(taskOutput);
      $('#exp-input').focus();
      return;
    }

    switch (taskIndex) {
      case 0: // Step 1: show the number
        $('.exp-data').text(`This is your number: ${taskInput.number.toString()}`);
        $('#exp-input').hide();
        break;
      case 1: // Step 2: ask users to record the number
        $('.exp-data').text('Please input the number you were shown.');
        if (taskOutput.userResponse) {
          $('#exp-input').val(taskOutput.userResponse);
        }
        $('#exp-input').show().focus();
        break;
      case 2: // Step 3: thank you page
        $('#exp-input').hide();
        $('.exp-data').text('Thanks for your input!');
        break;
      default:
    }
  },

  /**
   * This function should return the experiment data for the current task as an object.
   * @param {Object} taskInput if config.meta.aggregate is false,
   *   the object in the array from loadTasks corresponding to subtask taskIndex
   *   else, the input object from loadTasks
   * @param {number} taskIndex the number of the current subtask
   * @param {Object} taskOutput a completely filled out task corresponding to the subtask taskIndex
   *   If config.meta.aggregate is set to false, this is the results object for the current subtask.
   *   If config.meta.aggregate is set to true, this is the results object for the entire task.
   * @return {Object} experiment data for the current task
   */
  collectData(taskInput, taskIndex, taskOutput) {
    if (!config.meta.aggregate) {
      return $('#exp-input').val();
    }
    switch (taskIndex) {
      case 0: // show the number
        return {
          numberShown: taskInput.number,
        };
      case 1: // record the number
        return {
          userResponse: $('#exp-input').val(),
        };
      case 2: // thanks
        return {};
      default:
        return {};
    }
  },

  /**
   * This function should return a falsey value if data stored in taskOutput is valid
   * (e.g. fully filled out), and otherwise an object {errorMessage: "string"}
   * containing an error message to display.
   *
   * If the errorMessage string has length 0, the data will still be marked as invalid and
   * the task will not be allowed to proceed, but no error message will be displayed (for
   * instance, if you want to implement your own error announcement).
   *
   * @param {Object} taskInput - if config.meta.aggregate is false,
   *   the object in the array from loadTasks corresponding to subtask taskIndex;
   *   else, the input object from loadTasks
   * @param {number} taskIndex - the number of the current subtask
   * @param {Object} taskOutput - outputs collected for the subtask taskIndex
   *   If config.meta.aggregate is set to false, this is the results object for the current subtask.
   *   If config.meta.aggregate is set to true, this is the results object for the entire task
   *
   * @return {false | { errorMessage: string }} falsey value if the data is valid;
   *   otherwise an object with a field "errorMessage" containing a string error message to display.
   */
  validateTask(taskInput, taskIndex, taskOutput) {
    if (!config.meta.aggregate) {
      if (taskOutput.trim().length > 0) {
        return false;
      }
      return { errorMessage: 'please complete the task!' };
    }
    if (taskIndex === 1) { // validate user input
      if (parseInt(taskOutput.userResponse.trim(), 10) === taskInput.number) {
        return false;
      }
      return { errorMessage: 'incorrect response; try again!' };
    }
    return false;
  },
};

export default custom;
