import $ from 'jquery';
import surveyHTML from './demographic-survey.html';

const surveyConfig = [
  {
    heading: 'Gender',
    name: 'gender',
    type: 'radio',
    options: {
      male: 'Male',
      female: 'Female',
      other: 'Other',
      unspecified: 'Prefer not to say',
    },
  },
  {
    heading: 'Age',
    name: 'ageGroup',
    type: 'radio',
    options: {
      ageGroup18: '18 to 24',
      ageGroup25: '25 to 34',
      ageGroup35: '35 to 44',
      ageGroup45: '45 to 54',
      ageGroup55: '55 to 64',
      ageGroup65: '65 and over',
      unspecified: 'Prefer not to say',
    },
  },
  {
    heading: 'Ethnicity',
    name: 'ethnicity',
    type: 'checkbox',
    options: {
      Asian: 'Asian',
      Latino_Hispanic: 'Latino / Hispanic',
      Pacific_Islander: 'Pacific Islander',
      Black_African: 'Black / African Descent',
      Middle_Eastern: 'Middle Eastern',
      White_Caucasian: 'White / Caucasian',
      East_Indian: 'East Indian',
      Native_American: 'Native American',
      Other: 'Other',
      unspecified: 'Prefer not to say',
    },
  },
  {
    heading: 'Educational Background',
    name: 'education',
    type: 'radio',
    options: {
      lessThanHighSchool: 'Less Than High School',
      highSchool: 'High School / GED',
      someCollege: 'Some College',
      twoYearDegree: 'Two-Year Degree',
      fourYearDegree: 'Four-Year Degree',
      mastersDegree: "Master's Degree",
      doctoralDegree: 'Doctoral Degree',
      professionalDegree: 'Professional Degree',
      unspecified: 'Prefer not to say',
    },
  },
  {
    heading: 'How would you characterize your experience with data plots and visualizations?',
    name: 'vizExperience',
    type: 'radio',
    options: {
      professional: 'I am a professional visualization or infographic designer.',
      frequentInteraction: 'I frequently interact with or view graphs or visualizations in my job.',
      someExposure: 'I do not interact with graphs or visualizations at work, but I do see them on TV News or in magazines.',
      littleExposure: 'I rarely see or view graphs or visualizations.',
      unspecified: 'Prefer not to say',
    },
  },
  {
    heading: 'Feedback',
    name: 'feedback',
    type: 'textarea',
    rows: 2,
    placeholder: 'If you have any feedback, comments, or suggestions, please describe them here.',
  },
];

const demoSurvey = {

  /**
   * Initialize the survey, if config.json says to include it
   * @param config config.json data
   */
  maybeLoadSurvey(config) {
    if (config.advanced.includeDemographicSurvey) {
      $('#demographic-survey').hide();
      $('#demographic-survey').html(surveyHTML);
      const $form = $('#demo-survey-form');
      surveyConfig.forEach(({ name, type, options, heading, rows, placeholder }) => {
        const $formField = $('<div></div>');
        $formField.append($(`<h4>${heading}</h4>`));
        if (options) {
          Object.entries(options).forEach(([value, label]) => {
            const $option = $('<label></label>');
            $option.append($(`<input type="${type}" name="${name}" value="${value}" required>`));
            $option.append($(`<span>${label}</span>`));
            $formField.append($option);
          });
        } else if (type === 'textarea') {
          $formField.append($(`<textarea name="${name}" rows=${rows} placeholder="${placeholder}"></textarea>`))
        }
        $form.append($formField);
      });
      $('#feedback-field').hide();
    }
  },

  /**
   * Hide the survey
   */
  hideSurvey() {
    $('#demographic-survey').hide();
  },

  /**
   * Hide the experiment, and show the survey
   */
  showTask() {
    $('#custom-experiment').hide();
    $('#demographic-survey').show();

    $('input:checkbox[name=ethnicity]').change(() => {
      const unspecified = $('input[type=checkbox][name=ethnicity][value=unspecified]').is(':checked');
      if (unspecified) {
        $('input:checkbox[name=ethnicity]').not('[value=unspecified]')
          .prop('checked', false)
          .addClass('disabled');
      } else {
        $('input:checkbox[name=ethnicity]').removeClass('disabled');
      }
    });
  },

  /**
   * Return the survey data
   */
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

  /**
   * Check if the survey has been completed. Falsey means yes.
   * @return { false | { errorMessage: string } }
   */
  validateTask() {
    const { survey_data: data } = demoSurvey.collectData();
    const { gender, ageGroup, ethnicity, education, vizExperience } = data;
    const isValid = (
      gender
      && ageGroup
      && ethnicity.length > 0
      && education
      && vizExperience
    );
    // falsey value indicates no error...
    if (!isValid) {
      return { errorMessage: 'Please complete the survey.' };
    }
    return false;
  },
};

export default demoSurvey;
