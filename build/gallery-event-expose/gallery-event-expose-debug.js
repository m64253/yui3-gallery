YUI.add('gallery-event-expose', function(Y) {

	var oRegion = Y.DOM.viewportRegion(),
		oExpose = {
		
			_count: [],
			_watched: [],
			_triggers: [],
			_processing: false,
			_eventProcessTimeout: null,
		
			publishConfig: { 
				emitFacade: false
			},
		
			on: function(node, subscription, eventTrigger) {
				if (!this._exposed(node, eventTrigger)) {
			
					var i = Y.Array.indexOf(this._watched, node);
				
					if (this._count.length === 0) {
						Y.on('resize', this._eventHandle, null, this);
						Y.on('scroll', this._eventHandle, null, this);
					}
				
					if (i === -1) {
						this._count.push(1);
						this._watched.push(node);
						this._triggers.push(eventTrigger);
					} else {
						this._count[i]++;
					}
				}
			},

			detach: function(node, subscription, eventTrigger) {
		
				var i = Y.Array.indexOf(this._watched, node);
		
				if (i !== -1) {
					this._count[i]--;
					if (this._count === 0) {
						this._unwatch(i);
					}
				}
			},
					
			_process: function() {
				if (!this._processing) {
				
					this._processing = true;
				
					var aExposed = [];
				
					Y.each(this._watched, function(node, i){
						if (this._exposed(node, this._triggers[i])) {
							aExposed.push(i);
						}
					}, this);
				
					Y.each(aExposed.reverse(), this._unwatch, this);
				
					this._processing = false;
				}
			},
					
			_exposed: function(node, eventTrigger) {
					
				if (!YUI.Env.DOMReady) {
					return false;
				}
					
				var bInRegion = node.inRegion(oRegion, false);

				if (bInRegion) {
					setTimeout(function(){
					
						// Trigger event
						eventTrigger.fire();
					
						// Detach node and event
						node.detach('expose');
					}, 0);
				
					return true;
				}
		
				return false;
			},
		
			_unwatch: function(i) {
				this._count.splice(i, 1);
				this._watched.splice(i, 1);
				this._triggers.splice(i, 1);
			
				if (this._count.length === 0) {
					Y.detach('resize', this._resizeHandle);
					Y.detach('scroll', this._scrollHandle);
				}
			},
		
			_eventHandle: function() {
			
				clearTimeout(this._eventProcessTimeout);
			
				var self = this;
			
				this._eventProcessTimeout = setTimeout(function(){
					oRegion = Y.DOM.viewportRegion();
					self._process();
				}, 50);
			}
		};

	Y.on('domready', oExpose._eventHandle, oExpose);

	// Define event
	Y.Event.define('expose', oExpose);


}, '@VERSION@' ,{requires:['event-synthetic','node']});
