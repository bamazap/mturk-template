import $ from 'jquery';
import surveyHTML from './index.html';

const demoSurvey = {
  maybeLoadSurvey(config) {
    if (config.advanced.includeDemographicSurvey) {
      $('#demographic-survey').html(surveyHTML);
      $('#demographic-survey').hide();
      $('#feedback-field').hide();
    }
  },
  hideSurvey() {
    $('#demographic-survey').hide();
  },
  showTask() {
    $('#custom-experiment').hide();
    $('#demographic-survey').show();

    // Rules for collecting demographic survey data
    $('#survey-form')
      .form({
        fields: {
          gender: {
            identifier: 'gender',
            rules: [{
              type: 'checked',
              prompt: 'Please select a gender',
            }],
          },
          ageGroup: {
            identifier: 'ageGroup',
            rules: [{
              type: 'checked',
              prompt: 'Please select an age group',
            }],
          },
          ethnicity: {
            identifier: 'ethnicity',
            rules: [{
              type: 'checked',
              prompt: 'Please select an ethnicity',
            }],
          },
          education: {
            identifier: 'education',
            rules: [{
              type: 'checked',
              prompt: 'Please select an education level',
            }],
          },
          vizExperience: {
            identifier: 'vizExperience',
            rules: [{
              type: 'checked',
              prompt: 'Please select your experience with visualizations',
            }],
          },
        },
      });

    $('input:checkbox[name=ethnicity]').change(() => {
      const unspecified = $('#ethnicUnspecified').is(':checked');
      if (unspecified) {
        $('input:checkbox[name=ethnicity]').not('#ethnicUnspecified')
          .prop('checked', false);
        $('.ethnicityOption').addClass('disabled');
      } else {
        $('.ethnicityOption').removeClass('disabled');
      }
    });
  },
  collectData() {
    const gender = $('input[type=radio][name=gender]:checked').val();
    const ageGroup = $('input[type=radio][name=ageGroup]:checked').val();
    const ethnicity = $('input[type=checkbox][name=ethnicity]:checked').val();
    const education = $('input[type=radio][name=education]:checked').val();
    const vizExperience = $('input[type=radio][name=vizExperience]:checked').val();
    const feedback = $('textarea[name=feedback]').val();

    const data = {
      gender,
      ageGroup,
      ethnicity,
      education,
      vizExperience,
      feedback,
    };

    return {
      survey_data: data,
    };
  },
  validateTask() {
    $('#survey-form').form('validate form');
    // falsey value indicates no error...
    if (!$('#survey-form').form('is valid')) {
      return { errorMessage: '' };
    }
    return false;
  },
};

export default demoSurvey;
