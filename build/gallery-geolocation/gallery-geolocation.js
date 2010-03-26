YUI.add('gallery-geolocation', function(Y) {

	// We need to store the jsonp callback gobally
	if (!YUI.GEO_LOCATION_JSONP) {
		YUI.GEO_LOCATION_JSONP = [];
	}
	
	/**
     * This class adds a sugar class to allow access to YQL (http://developer.yahoo.com/yql/).
     * @module geolocation
     */
	
	var YLang = Y.Lang,
		w3c,
		gears,
		yql,
		jsonp;
	
	w3c = function() {
		var self = this;
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function(position) {
				self.success({ 
					latitude: position.coords.latitude, 
					longitude: position.coords.longitude, 
					provider: "W3C"
				});
		    }, function(oError) {
				gears.call(self);
		    });
		} else {
			gears.call(this);
		}
	};
	
	gears = function() {
		var self = this,
			gearsGeoLocation;
		if (window.google && window.google.gears) {
			gearsGeoLocation = window.google.gears.factory.create('beta.geolocation');
			if (gearsGeoLocation.hasPermission) {
				gearsGeoLocation.getCurrentPosition(function(position) {
					self.success({ 
						latitude: position.latitude, 
						longitude: position.longitude, 
						provider: "Gears"
					});
			    }, function() {
					yql.call(self);
			    });
			} else {
				yql.call(this);
			}
		} else {
			yql.call(this);
		}
	};
	
	yql = function() {
		jsonp('http://jsonip.appspot.com', null, function(oIpData){
			if (oIpData && oIpData.ip) {
				jsonp('http://query.yahooapis.com/v1/public/yql', {
					q: 'SELECT * FROM geo.places WHERE woeid IN (SELECT place.woeid FROM flickr.places WHERE (lat,lon) in (SELECT Latitude, Longitude FROM ip.location WHERE ip = "' + oIpData.ip + '"))',
					format: 'json',
					env: 'http://datatables.org/alltables.env'
				}, function(oData){
					if (!oData.error && oData.query && oData.query.results && oData.query.results.place) {
						this.success({ 
							latitude: oData.query.results.place.centroid.latitude,
							longitude: oData.query.results.place.centroid.longitude,
							provider: "IP"
						});
					} else {
						this.failure();
					}
				}, this);
			} else {
				this.failure();
			}
		}, this);
	};
		
	jsonp = function(sUrl, oParams, fCallback, oContext) {
		
		oParams = oParams || {};
		
		var elScript = document.createElement('script'),
			elHead = document.getElementsByTagName('head')[0],
			aParams = [],
			timer,
			sSrc,
			i = YUI.GEO_LOCATION_JSONP.length;
		
		YUI.GEO_LOCATION_JSONP[i] = function(oData) {
			clearTimeout(timer);
			elHead.removeChild(elScript);
			fCallback.call(oContext, oData);
			YUI.GEO_LOCATION_JSONP[i] = function() {};
		};
		
		oParams.callback = 'YUI.GEO_LOCATION_JSONP[' + i + ']';
		
		Y.Object.each(oParams, function(sValue, sKey){
			aParams.push(sKey + '=' + encodeURIComponent(sValue));
		});
		
		sSrc = sUrl + '?' + aParams.join('&');
		
	    elScript.setAttribute('src', sSrc);

		timer = setTimeout(function(){
			elHead.removeChild(elScript);
			fCallback.call(oContext);
		}, 30000);

		elHead.appendChild(elScript);
	};
		
	Y.geolocation = function(fSuccess, fFailure, oContext) {
		w3c.call({
			success: function(oCoords){
				if (YLang.isObject(oCoords) && YLang.isValue(oCoords.latitude) && YLang.isValue(oCoords.latitude)) {
					if (Y.Lang.isFunction(fSuccess)) {
						fSuccess.call(oContext, oCoords);
					}				
				} else if (Y.Lang.isFunction(fFailure)) {
					fFailure.call(oContext);
				}
			},
			failure: function(oError){
				fFailure.call(oContext);
			}
		});
	};


}, '@VERSION@' );
