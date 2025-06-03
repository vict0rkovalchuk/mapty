'use strict';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor (coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }
}


class Running extends Workout {
  type = 'running';

  constructor (coords, distance, duration, cadence) {
    super(coords, distance, duration);

    this.cadence = cadence;

    this.calcPace();
  }

  calcPace () {
    this.pace = this.duration / this.distance;
  }
}


class Cycling extends Workout {
  type = 'cycling';

  constructor (coords, distance, duration, elevationGain) {
    super(coords, distance, duration);

    this.elevationGain = elevationGain;

    this.calcSpeed();
  }

  calcSpeed () {
    this.speed = this.distance / (this.duration / 60);
  }
}


const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    this._getPosition();

    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._toggleElevationField);
  }

  _getPosition () {
    navigator.geolocation?.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert('Could not get your position');
      }
    );
  }

  _loadMap (position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm (mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    
    inputDistance.focus();
  }

  _toggleElevationField () {
    [inputCadence, inputElevation].forEach(input => {
      input.closest('.form__row').classList.toggle('form__row--hidden');
    });
  }

  _newWorkout (e) {
    e.preventDefault();

    const validInputs = (...inputs) => inputs.every(input => Number.isFinite(input));

    const allPositive = (...inputs) => inputs.every(input => input > 0);

    const clearInputs = (...inputs) => inputs.forEach(input => input.value = '');

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    const { lat, lng } = this.#mapEvent.latlng;
    const coords = [lat, lng]

    let workout;

    if (type === 'running') {
      const cadence = +inputCadence.value;

      if (
        !validInputs(distance, duration, cadence) || 
        !allPositive(distance, duration, cadence)
      ) {
        return alert('Inputs have to be positive numbers!');
      }

      workout = new Running(coords, distance, duration, cadence);
    }

    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      if (
        !validInputs(distance, duration, elevation) || 
        !allPositive(distance, duration)
      ) {
        return alert('Inputs have to be positive numbers!');
      }

      workout = new Cycling(coords, distance, duration, elevation);
    }

    this.#workouts.push(workout);

    this.renderWorkoutMarker(workout);

    clearInputs(inputDistance, inputDuration, inputCadence, inputElevation);

    form.classList.add('hidden');
  }

  renderWorkoutMarker (workout) {
    const { coords, type } = workout;

    L.marker(coords)
      .addTo(this.#map)
      .bindPopup(L.popup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        className: `${type}-popup`
      }))
      .setPopupContent(type)
      .openPopup();
  }
}

const app = new App();