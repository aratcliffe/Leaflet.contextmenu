/*
	Leaflet.contextmenu, a context menu for Leaflet.
	(c) 2013, Adam Ratcliffe, GeoSmart Maps Limited
*/
L.Map.mergeOptions({
	contextmenuWidth: 150,
	contextmenuItems: []
});

L.Map.ContextMenu = L.Handler.extend({

	initialize: function (map) {
		L.Handler.prototype.initialize.call(this, map);

		this._items = [];
		this._visible = false;

		var container = this._container = L.DomUtil.create('div', 'leaflet-contextmenu', map._container);
		container.style.zIndex = 10000;
		container.style.position = 'absolute';

		if (map.options.contextmenuWidth) {
			container.style.width = map.options.contextmenuWidth + 'px';
		}
		
		this._createItems(container);

		this._container = container;
		
		L.DomEvent
			.on(container, 'click', L.DomEvent.stopPropagation)
			.on(container, 'mousedown', L.DomEvent.stopPropagation)
			.on(container, 'dblclick', L.DomEvent.stopPropagation)
			.on(container, 'contextmenu', L.DomEvent.stopPropagation);
	},

	addHooks: function () {
		this._map.on({
			contextmenu: this._show,
			mouseout: this._hide,
			mousedown: this._hide
		}, this);
	},

	removeHooks: function () {
		this._map.off({
			contextmenu: this._show,
			mouseout: this._hide,
			mousedown: this._hide
		}, this);
	},

	showAt: function (point) {
		if (point instanceof L.LatLng) {
			point = this._map.latLngToContainerPoint(point);
		}
		this._showAtPoint(point);
	},

	hide: function () {
		this._hide();
	},

	addItem: function (options) {
		this.insertItem(options);
	},

	insertItem: function (options, index) {
		index = index !== undefined ? index: this._items.length; 

		var item = this._createItem(this._container, options, index);
		
		this._items.push(item);

		this._map.fire('contextmenu.additem', {
			contextmenu: this,
			el: item.el,
			index: index
		});
	},

	removeItem: function (index) {
		var container = this._container,
		el = container.children[index],
		item;

		if (el) {
			item = this._removeItem(L.Util.stamp(el));

			this._map.fire('contextmenu.removeitem', {
				contextmenu: this,
				el: item.el
			});
		}		
	},

	isVisible: function () {
		return this._visible;
	},

	_createItems: function (container) {
		var spec = this._map.options.contextmenuItems,
		    item,
		    i, l;

		for (i = 0, l = spec.length; i < l; i++) {
			this._items.push(this._createItem(container, spec[i]));
		}
	},

	_createItem: function (container, options, index) {
		if (typeof options === 'string' && options === '-') {
			return this._createSeparator(container);
		}

		var el = this._insertElementAt('a', 'leaflet-contextmenu-item', container, index),
		callback = this._createEventHandler(options.callback, options.context),
		html = '';
		
		if (options.icon) {
			html = '<img class="leaflet-contextmenu-icon" src="' + options.icon + '"/>';
		} else if (options.iconCls) {
			html = '<span class="leaflet-contextmenu-icon ' + options.iconCls + '"></span>';
		}

		el.innerHTML = html + options.text;		
		el.href = '#';
		
		L.DomEvent
			.on(el, 'click', L.DomEvent.stopPropagation)
			.on(el, 'mousedown', L.DomEvent.stopPropagation)
			.on(el, 'dblclick', L.DomEvent.stopPropagation)
			.on(el, 'click', L.DomEvent.preventDefault)
			.on(el, 'click', callback);

		return {
			id: L.Util.stamp(el),
			el: el,
			callback: callback
		};
	},

	_removeItem: function (id) {
		var item,
		    el,
		    i, l;

		for (i = 0, l = this._items.length; i < l; i++) {
			item = this._items[i];

			if (item.id === id) {
				el = item.el;
				callback = item.callback;

				if (callback) {
					L.DomEvent
						.off(el, 'click', L.DomEvent.stopPropagation)
						.off(el, 'mousedown', L.DomEvent.stopPropagation)
						.off(el, 'dblclick', L.DomEvent.stopPropagation)
						.off(el, 'click', L.DomEvent.preventDefault)
						.off(el, 'click', item.callback);				
				}
				
				this._container.removeChild(el);
				this._items.splice(i, 1);

				return item;
			}
		}
		return null;
	},

	_createSeparator: function (container) {
		var el = L.DomUtil.create('div', 'leaflet-contextmenu-separator', container);
		
		return {
			id: L.Util.stamp(el),
			el: el
		};
	},

	_createEventHandler: function (func, context) {
		var map = this._map,
		me = this;
		
		return function (e) {
			me._hide();
			
			var containerPoint = map.mouseEventToContainerPoint(e),
			    layerPoint = map.containerPointToLayerPoint(containerPoint),
			    latlng = map.layerPointToLatLng(layerPoint);

			func.call(context || map, {
				latlng: latlng,
				layerPoint: layerPoint,
				containerPoint: containerPoint,
				originalEvent: e
			});			
		};
	},

	_insertElementAt: function (tagName, className, container, index) {
		var refEl,
		  el = document.createElement(tagName);

		el.className = className;

		if (index !== undefined) {
			refEl = container.children[index];
		}

		if (refEl) {
			container.insertBefore(el, refEl);
		} else {
			container.appendChild(el);
		}

		return el;
	},

	_show: function (e) {
		this._showAtPoint(e.containerPoint);
	},

	_showAtPoint: function (pt) {
		if (!this._visible && this._items.length) {
			var container = this._container;
			
			L.DomUtil.setPosition(container, pt);
			container.style.display = 'block';
			
			this._visible = true;				

			this._map.fire('contextmenu.show', {contextmenu: this});
		}		
	},

	_hide: function () {
		if (this._visible) {
			this._container.style.display = 'none';

			this._visible = false;

			this._map.fire('contextmenu.hide', {contextmenu: this});
		}
	}
});

L.Map.addInitHook('addHandler', 'contextmenu', L.Map.ContextMenu);
