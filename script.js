const cityInput = document.getElementById("city");
const searchBtn = document.getElementById("searchBtn");
const suggestions = document.getElementById("suggestions");

const cityName = document.getElementById("cityName");
const temperature = document.getElementById("temperature");
const description = document.getElementById("description");
const humidity = document.getElementById("humidity");
const weatherIcon = document.getElementById("weatherIcon");

const feelsLike = document.getElementById("feelsLike");
const windSpeed = document.getElementById("windSpeed");
const forecast = document.getElementById("forecast");
const countryFlag = document.getElementById("countryFlag");
const loader = document.getElementById("loader");

let map = L.map("map").setView([45.815, 15.981], 6);

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "&copy; OpenStreetMap"
    }
).addTo(map);

const weatherLayers = {

    rain: L.tileLayer(
        "https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=896291c879616623687a65c4bbbd6237",
        {
            opacity:1
        }
    ),

    clouds: L.tileLayer(
        "https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=896291c879616623687a65c4bbbd6237",
        {
            opacity:0.85
        }
    ),

    temp: L.tileLayer(
        "https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=896291c879616623687a65c4bbbd6237",
        {
            opacity:0.85
        }
    ),

    wind: L.tileLayer(
        "https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=896291c879616623687a65c4bbbd6237",
        {
            opacity:0.85
        }
    ),

    pressure: L.tileLayer(
        "https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=896291c879616623687a65c4bbbd6237",
        {
            opacity:0.85
        }
    )

};

let currentLayer = weatherLayers.rain;

currentLayer.addTo(map);

let marker;
let selectedSuggestionIndex = -1;

function weatherDescription(code){

    const weatherCodes = {
        0:"Vedro",
        1:"Pretežno vedro",
        2:"Djelomično oblačno",
        3:"Oblačno",
        45:"Magla",
        48:"Magla s injem",
        51:"Slaba rosulja",
        53:"Umjerena rosulja",
        55:"Jaka rosulja",
        61:"Slaba kiša",
        63:"Umjerena kiša",
        65:"Jaka kiša",
        71:"Slab snijeg",
        73:"Umjeren snijeg",
        75:"Jak snijeg",
        80:"Pljuskovi",
        81:"Jači pljuskovi",
        82:"Vrlo jaki pljuskovi",
        95:"Grmljavina"
    };

    return weatherCodes[code] || "Nepoznato";
}

function getWeatherIcon(code){

    if(code === 0) return "☀️";
    if([1,2].includes(code)) return "🌤️";
    if(code === 3) return "☁️";
    if([45,48].includes(code)) return "🌫️";
    if([51,53,55,61,63,65,80,81,82].includes(code)) return "🌧️";
    if([71,73,75].includes(code)) return "❄️";
    if(code === 95) return "⛈️";

    return "🌍";
}

function updateSuggestionSelection(items){

    items.forEach(item =>
        item.classList.remove("selected")
    );

    if(selectedSuggestionIndex >= 0){
        items[selectedSuggestionIndex]
            .classList.add("selected");
    }
}

async function loadSuggestions(){

    const query = cityInput.value.trim();

    if(query.length < 2){
        suggestions.innerHTML = "";
        return;
    }

    try{

        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5`
        );

        const data = await response.json();

        suggestions.innerHTML = "";
        selectedSuggestionIndex = -1;

        if(!data.results) return;

        data.results.forEach(city => {

            const item = document.createElement("div");

            item.classList.add("suggestion");

            item.textContent =
                `${city.name}, ${city.country}`;

            item.addEventListener("click", () => {

                cityInput.value = city.name;

                suggestions.innerHTML = "";

                getWeather();
            });

            suggestions.appendChild(item);

        });

    }catch(error){
        console.error(error);
    }
}

async function getWeather(){

    const city = cityInput.value.trim();

    if(city === "") return;

    loader.style.display = "block";

    try{

        const geoResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`
        );

        const geoData = await geoResponse.json();

        if(!geoData.results){

            cityName.textContent = "Grad nije pronađen";
            loader.style.display = "none";
            return;
        }

        const location = geoData.results[0];

        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&forecast_days=5`
        );

        const weatherData = await weatherResponse.json();

        cityName.textContent =
            `${location.name}, ${location.country}`;

        if(location.country_code){

            countryFlag.src =
                `https://flagcdn.com/w80/${location.country_code.toLowerCase()}.png`;

            countryFlag.style.display = "block";
        }

        temperature.textContent =
            `${Math.round(weatherData.current.temperature_2m)}°C`;

        description.textContent =
            weatherDescription(weatherData.current.weather_code);

        humidity.textContent =
            `Vlaga: ${weatherData.current.relative_humidity_2m}%`;

        feelsLike.textContent =
            `Osjećaj temperature: ${Math.round(weatherData.current.apparent_temperature)}°C`;

        windSpeed.textContent =
            `Vjetar: ${Math.round(weatherData.current.wind_speed_10m)} km/h`;

        weatherIcon.textContent =
            getWeatherIcon(weatherData.current.weather_code);

        forecast.innerHTML = "";

        const dayNames = [
            "Ned","Pon","Uto","Sri","Čet","Pet","Sub"
        ];

        for(let i = 0; i < 5; i++){

            const date =
                new Date(weatherData.daily.time[i]);

            const day =
                i === 0
                    ? "Danas"
                    : dayNames[date.getDay()];

            const icon =
                getWeatherIcon(
                    weatherData.daily.weather_code[i]
                );

            forecast.innerHTML += `
                <div class="forecast-day">
                    <strong>${day}</strong>
                    <div style="font-size:28px;margin:8px 0;">
                        ${icon}
                    </div>
                    <div>
                        ${Math.round(weatherData.daily.temperature_2m_max[i])}°
                    </div>
                    <div style="color:#64748b;">
                        ${Math.round(weatherData.daily.temperature_2m_min[i])}°
                    </div>
                </div>
            `;
        }

        if(marker){
            map.removeLayer(marker);
        }

        map.setView(
            [location.latitude, location.longitude],
            10
        );

        marker = L.marker(
            [location.latitude, location.longitude]
        ).addTo(map);

        loader.style.display = "none";

    }catch(error){

        loader.style.display = "none";
        console.error(error);
    }
}

cityInput.addEventListener("input", loadSuggestions);

cityInput.addEventListener("keydown", (e) => {

    const items =
        document.querySelectorAll(".suggestion");

    if(!items.length){

        if(e.key === "Enter"){
            getWeather();
        }

        return;
    }

    if(e.key === "ArrowDown"){

        e.preventDefault();

        selectedSuggestionIndex =
            Math.min(
                selectedSuggestionIndex + 1,
                items.length - 1
            );

        updateSuggestionSelection(items);
    }

    if(e.key === "ArrowUp"){

        e.preventDefault();

        selectedSuggestionIndex =
            Math.max(
                selectedSuggestionIndex - 1,
                0
            );

        updateSuggestionSelection(items);
    }

    if(e.key === "Enter"){

        e.preventDefault();

        if(selectedSuggestionIndex >= 0){
            items[selectedSuggestionIndex].click();
        }else{
            getWeather();
        }
    }

});

document
    .querySelectorAll(".layer-btn")
    .forEach(btn => {

        btn.addEventListener("click", () => {

            map.removeLayer(currentLayer);

            document
                .querySelectorAll(".layer-btn")
                .forEach(b =>
                    b.classList.remove("active")
                );

            btn.classList.add("active");

            currentLayer =
                weatherLayers[
                    btn.dataset.layer
                ];

            currentLayer.addTo(map);
        });

    });

searchBtn.addEventListener("click", getWeather);

const mobileLayerSelect =
    document.getElementById(
        "mobileLayerSelect"
    );

if(mobileLayerSelect){

    mobileLayerSelect.addEventListener(
        "change",
        (e) => {

            map.removeLayer(
                currentLayer
            );

            currentLayer =
                weatherLayers[
                    e.target.value
                ];

            currentLayer.addTo(
                map
            );

            document
                .querySelectorAll(
                    ".layer-btn"
                )
                .forEach(btn => {

                    btn.classList.remove(
                        "active"
                    );

                    if(
                        btn.dataset.layer ===
                        e.target.value
                    ){
                        btn.classList.add(
                            "active"
                        );
                    }

                });

        }
    );

}