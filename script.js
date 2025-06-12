'use strict';

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor (coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription () {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }
}


class Running extends Workout {
  type = 'running';

  constructor (coords, distance, duration, cadence) {
    super(coords, distance, duration);

    this.cadence = cadence;

    this.calcPace();
    this._setDescription();
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
    this._setDescription();
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
  #mapZoomLevel = 13;
  #workouts = [];

  constructor() {
    this._getPosition();
    this._getLocaleStorage();

    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
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

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(workout => this._renderWorkoutMarker(workout));
  }

  _showForm (mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    
    inputDistance.focus();
  }

  _hideForm () {
    [inputDistance, inputDuration, inputCadence, inputElevation].forEach(input => input.value = '');

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => form.style.display = 'grid', 500);
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

    this._renderWorkoutMarker(workout);
    this._renderWorkout(workout);

    this._hideForm();

    this._setLocalStorage();
  }

  _renderWorkoutMarker (workout) {
    const { coords, type, description } = workout;

    L.marker(coords)
      .addTo(this.#map)
      .bindPopup(L.popup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        className: `${type}-popup`
      }))
      .setPopupContent(`${type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${description}`)
      .openPopup();
  }

  _renderWorkout (workout) {
    const { type, id, description, distance, duration } = workout;

    let html = `
      <li class="workout workout--${type}" data-id="${id}">
        <h2 class="workout__title">${description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${type === 'running' ? '🏃‍♂️' : '🚴‍♀️' }</span>
          <span class="workout__value">${distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;

    if (type === 'running') {
      const { pace, cadence } = workout;

      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
      `;
    }

    if (type === 'cycling') {
      const { speed, elevationGain } = workout;

      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
      `;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup (e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(workout => workout.id === workoutEl.dataset.id);

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: { duration: 1 }
    });
  }

  _setLocalStorage () {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocaleStorage () {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts =  data;

    this.#workouts.forEach(workout => this._renderWorkout(workout));
  }

  reset () {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();