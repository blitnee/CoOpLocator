var map;
var markers = [];
/* Blank array to hold all the listing markers for use in multiple functions,
 * and have control of the number of places that show
 */
  console.log("markers Array:")
  console.log(markers);
//var userLocation;


function initMap() {
  //MAP CONSTRUCTOR
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 42.280826, lng: -83.743038},
    zoom: 13,
    mapTypeControl: false
  });
  //getLocation();

  //INFO WINDOW
  var infowindow = new google.maps.InfoWindow();

  //DEFINE USER LOCATION
  /*!!! NEED TO UPDATE USING USER GEOLOCATION OR INPUT*/
  var userLocation = {lat: 42.280826, lng: -83.743038};
  //userLocation = document.getElementById('zoom-to-area-text').value;

  //AUTO COMPLETE
  //Enables autocomplete for use in the search within time entry box
  var timeAutocomplete = new google.maps.places.Autocomplete(
      document.getElementById('search-within-time-text'));
  //Enables autocomplete for use in the geocoder entry box
  var zoomAutocomplete = new google.maps.places.Autocomplete(
      document.getElementById('zoom-to-area-text'));
  //Bias the boundaries within the map for the zoom to area text
  zoomAutocomplete.bindTo('bounds', map);

  //SEARCH REQUEST
  var service = new google.maps.places.PlacesService(map);
  service.nearbySearch({
    location: userLocation,
    radius: 500,
    type: ['food'],
    keyword: 'food-coop'
  }, callback);

  //ACTIVATED BY ZOOM BUTTON
  document.getElementById('zoom-to-area').addEventListener('click', function() {
    zoomToArea();
  });

  //ACTIVATED BY SEARCH BUTTON
  document.getElementById('search-within-time').addEventListener('click', function() {
    searchWithinTime();
  });
}

//SEARCH REQUEST CALLBACK - CALLED BY INITMAP() SERVICE
function callback(results, status) {
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      createMarker(results[i]);
    }
  }
}

//CREATE MARKERS - CALLED BY CALLBACK()
function createMarker(place) {
  var defaultIcon = makeMarkerIcon('0091ff');
  var bounds = new google.maps.LatLngBounds();
  var marker = new google.maps.Marker({
    map: map,
    icon: defaultIcon,
    title: place.name,
    position: place.geometry.location,
    animation: google.maps.Animation.DROP,
    id: place.place_id
  });
  //Push the marker to markers array
  markers.push(marker);
  //POPULATES INFOWINDOW 'ON-CLICK'
  var placeInfoWindow = new google.maps.InfoWindow();
  marker.addListener('click', function() {
    if (placeInfoWindow.marker == this) {
      console.log('infowindow already exists on marker!');
    } else {
      getPlaceDetails(this, placeInfoWindow);
    }
  });
  if (place.geometry.viewport) {
    bounds.union(place.geometry.viewport);
  } else {
    bounds.extend(place.geometry.location);
  }

  map.fitBounds(bounds);
}

//CREATE DETAILED INFOWINDOW - CALLED BY CREATEMARKER()
function getPlaceDetails(marker, infowindow) {
  var service = new google.maps.places.PlacesService(map);
  service.getDetails({
    placeId: marker.id
  }, function(place, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      // Set the marker property on this infowindow so it isn't created again
      infowindow.marker = marker;
      var innerHTML = '<div>';
      if (place.name) {
        innerHTML += '<strong>' + place.name + '</strong>';
      }
      if (place.formatted_address) {
        innerHTML += '<br>' + place.formatted_address;
      }
      if (place.formatted_phone_number) {
        innerHTML += '<br>' + place.formatted_phone_number;
      }
      if (place.opening_hours) {
        innerHTML += '<br><br><strong>Hours:</strong><br>' +
            place.opening_hours.weekday_text[0] + '<br>' +
            place.opening_hours.weekday_text[1] + '<br>' +
            place.opening_hours.weekday_text[2] + '<br>' +
            place.opening_hours.weekday_text[3] + '<br>' +
            place.opening_hours.weekday_text[4] + '<br>' +
            place.opening_hours.weekday_text[5] + '<br>' +
            place.opening_hours.weekday_text[6];
      }
      if (place.photos) {
        innerHTML += '<br><br><img src="' + place.photos[0].getUrl(
            {maxHeight: 100, maxWidth: 200}) + '">';
      }
      innerHTML += '</div>';
      infowindow.setContent(innerHTML);
      infowindow.open(map, marker);
      // Make sure the marker property is cleared if the infowindow is closed.
      infowindow.addListener('closeclick', function() {
        infowindow.marker = null;
      });
    }
  });
}

//HIDE MARKERS IN ARRAY - CALLED BY SEARCHWITHINTIME
function hideMarkers(markers) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
}

//MARKER ATTRIBUTES - CALLED BY DEFAULTICON
function makeMarkerIcon(markerColor) {
  var markerImage = new google.maps.MarkerImage(
    'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
    '|40|_|%E2%80%A2',
    new google.maps.Size(21, 34),
    new google.maps.Point(0, 0),
    new google.maps.Point(10, 34),
    new google.maps.Size(21,34));
  return markerImage;
}

//
function zoomToArea() {
  //Initialize geocoder
  var geocoder = new google.maps.Geocoder();
  //Get the address or place that the user entered
  var address = document.getElementById('zoom-to-area-text').value;
  //Validate user entry isn't blank
  if (address == '') {
    window.alert('We couldn\'t find any results in that area. Try again with a more general search area, or a city nearby.');
  } else {
    //Geocode the address/area entered to get the center. Then, center the map
    //on it and zoom in
    geocoder.geocode(
      { address: address,
      }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          map.setCenter(results[0].geometry.location);
          map.setZoom(15);
        } else {
          window.alert('We could not find that location. Please provide a valid location.');
        }
      });
    }
}

//SEARCH WITHIN GIVEN TRAVEL TIME
function searchWithinTime() {
  //Initialize the distance matrix service
  var distanceMatrixService = new google.maps.DistanceMatrixService;
  var address = document.getElementById('search-within-time-text').value;
  //Validate user entry isn't blank
  if (address == '') {
    window.alert('You must enter an address.');
  } else {
    hideMarkers(markers);
    //Use the distance matrix service to calculate the distance
    var origins = [];
    for (var i = 0; i < markers.length; i++) {
      origins[i] = markers[i].position;
    }
    var destination = address;
    var mode = document.getElementById('mode').value;
    distanceMatrixService.getDistanceMatrix({
      origins: origins,
      destinations: [destination],
      travelMode: google.maps.TravelMode[mode],
      unitSystem: google.maps.UnitSystem.IMPERIAL,
    }, function(response, status) {
      if (status !== google.maps.DistanceMatrixStatus.OK) {
        window.alert('Error was: ' + status);
      } else {
        displayMarkersWithinTime(response);
      }
    });
  }
}

//DISPLAY MARKERS WITHIN DISTANCE VALUE - CALLED BY SEARCHWITHINTIME()
function displayMarkersWithinTime(response) {
  var maxDuration = document.getElementById('max-duration').value;
  var origins = response.originAddresses;
  var destinations = response.destinationAddresses;
  // Parse through the results, and get the distance and duration of each.
  // Because there might be  multiple origins and destinations we have a nested loop
  // Then, make sure at least 1 result was found.
  var atLeastOne = false;
  for (var i = 0; i < origins.length; i++) {
    var results = response.rows[i].elements;
    for (var j = 0; j < results.length; j++) {
      var element = results[j];
      if (element.status === "OK") {
        // The distance is returned in feet, but the TEXT is in miles. If we wanted to switch
        // the function to show markers within a user-entered DISTANCE, we would need the
        // value for distance, but for now we only need the text.
        var distanceText = element.distance.text;
        // Duration value is given in seconds so we make it MINUTES. We need both the value
        // and the text.
        var duration = element.duration.value / 60;
        var durationText = element.duration.text;
        if (duration <= maxDuration) {
          //the origin [i] should = the markers[i]
          markers[i].setMap(map);
          atLeastOne = true;
          // Create a mini infowindow to open immediately and contain the
          // distance and duration
          //////////////////////ADDITION
          /*
           *APPEND DISTANCE?
           */
          /////////////////////END ADDITION
          var infowindow = new google.maps.InfoWindow({
            content: durationText + ' away, ' + distanceText +
              '<div><input type=\"button\" value=\"View Route\" onclick =' +
              '\"displayDirections(&quot;' + origins[i] + '&quot;);\"></input></div>'
          });
          infowindow.open(map, markers[i]);
          // Put this in so that this small window closes if the user clicks
          // the marker, when the big infowindow opens
          markers[i].infowindow = infowindow;
          google.maps.event.addListener(markers[i], 'click', function() {
            this.infowindow.close();
          });
        }
      }
    }
  }
  if (!atLeastOne) {
    window.alert('We could not find any locations within that distance!');
  }
}

//GEOLOCATION SERVICE -  CALLED BY INITMAP()
function getLocation() {
  if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        var pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        infowindow.setPosition(pos);
        infowindow.setContent('You are here');
        infowindow.open(map);
        map.setCenter(pos);
        //userLocation = pos;
      }, function() {
        handleLocationError(true, infowindow, map.getCenter());
      });
    } else {
      // Browser doesn't support Geolocation
      handleLocationError(false, infowindow, map.getCenter());
    }
}

//GEOLOCATION ERROR HANDLING
function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infowindow.setPosition(pos);
  infowindow.setContent(browserHasGeolocation ?
                        'Error: The Geolocation service failed.' :
                        'Error: Your browser doesn\'t support geolocation.');
  infowindow.open(map);
}


// This function is in response to the user selecting "show route" on one
// of the markers within the calculated distance. This will display the route
// on the map.
function displayDirections(origin) {
  hideMarkers(markers);
  var directionsService = new google.maps.DirectionsService;
  // Get the destination address from the user entered value.
  var destinationAddress =
      document.getElementById('search-within-time-text').value;
  // Get mode again from the user entered value.
  var mode = document.getElementById('mode').value;
  directionsService.route({
    // The origin is the passed in marker's position.
    origin: origin,
    // The destination is user entered address.
    destination: destinationAddress,
    travelMode: google.maps.TravelMode[mode]
  }, function(response, status) {
    if (status === google.maps.DirectionsStatus.OK) {
      var directionsDisplay = new google.maps.DirectionsRenderer({
        map: map,
        directions: response,
        draggable: true,
        polylineOptions: {
          strokeColor: 'green'
        }
      });
    } else {
      window.alert('Directions request failed due to ' + status);
    }
  });
}




//NOTES:

/*
// Loop through the results array and place a marker for each
      // set of coordinates.
      window.eqfeed_callback = function(results) {
        for (var i = 0; i < results.features.length; i++) {
          var coords = results.features[i].geometry.coordinates;
          var latLng = new google.maps.LatLng(coords[1],coords[0]);
          var marker = new google.maps.Marker({
            position: latLng,
            map: map
          });
        }
      }
*/
