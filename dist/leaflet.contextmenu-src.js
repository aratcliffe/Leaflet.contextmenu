/*
	Leaflet.contextmenu, a context menu for Leaflet.
	(c) 2013, Adam Ratcliffe, GeoSmart Maps Limited
*/
L.Map.mergeOptions({
	contextmenuItems: []
});

L.Map.ContextMenu = L.Handler.extend({

	statics: {
		BASE_CLS: 'leaflet-contextmenu'
	},

	initialize: function (map) {
		L.Handler.prototype.initialize.call(this, map);

		this._items = [];
		this._visible = false;

		var container = this._container = L.DomUtil.create('div', L.Map.ContextMenu.BASE_CLS, map._container);
		container.style.zIndex = 10000;
		container.style.position = 'absolute';

		if (map.options.contextmenuWidth) {
			container.style.width = map.options.contextmenuWidth + 'px';
		}
		
		this._createItems();
		
		L.DomEvent
			.on(container, 'click', L.DomEvent.stop)
			.on(container, 'mousedown', L.DomEvent.stop)
			.on(container, 'dblclick', L.DomEvent.stop)
			.on(container, 'contextmenu', L.DomEvent.stop);
	},

	addHooks: function () {
		L.DomEvent.on(document, 'keydown', this._onKeyDown, this);

		this._map.on({
			contextmenu: this._show,
			mouseout: this._hide,
			mousedown: this._hide,
			movestart: this._hide,
			zoomstart: this._hide
		}, this);
	},

	removeHooks: function () {
		L.DomEvent.off(document, 'keydown', this._onKeyDown, this);

		this._map.off({
			contextmenu: this._show,
			mouseout: this._hide,
			mousedown: this._hide,
			movestart: this._hide,
			zoomstart: this._hide
		}, this);
	},

	showAt: function (point, data) {
		if (point instanceof L.LatLng) {
			point = this._map.latLngToContainerPoint(point);
		}
		this._showAtPoint(point, data);
	},

	hide: function () {
		this._hide();
	},

	addItem: function (options) {
		return this.insertItem(options);
	},

	insertItem: function (options, index) {
		index = index !== undefined ? index: this._items.length; 

		var item = this._createItem(this._container, options, index);
		
		this._items.push(item);

		this._sizeChanged = true;

		this._map.fire('contextmenu.additem', {
			contextmenu: this,
			el: item.el,
			index: index
		});

		return item.el;
	},

	removeItem: function (item) {
		var container = this._container;

		if (!isNaN(item)) {
			item = container.children[item];
		}

		if (item) {
			this._removeItem(L.Util.stamp(item));

			this._sizeChanged = true;

			this._map.fire('contextmenu.removeitem', {
				contextmenu: this,
				el: item
			});
		}		
	},

	removeAllItems: function () {
		var item;

		while (this._container.children.length) {
			item = this._container.children[0];
			this._removeItem(L.Util.stamp(item));
		}
	},

	setDisabled: function (item, disabled) {
		var container = this._container,
		itemCls = L.Map.ContextMenu.BASE_CLS + '-item';

		if (!isNaN(item)) {
			item = container.children[item];
		}

		if (item && L.DomUtil.hasClass(item, itemCls)) {
			if (disabled) {
				L.DomUtil.addClass(item, itemCls + '-disabled');
				this._map.fire('contextmenu.disableitem', {
					contextmenu: this,
					el: item
				});
			} else {
				L.DomUtil.removeClass(item, itemCls + '-disabled');
				this._map.fire('contextmenu.enableitem', {
					contextmenu: this,
					el: item
				});
			}			
		}
	},

	isVisible: function () {
		return this._visible;
	},

	_createItems: function () {
		var itemOptions = this._map.options.contextmenuItems,
		    item,
		    i, l;

		for (i = 0, l = itemOptions.length; i < l; i++) {
			this._items.push(this._createItem(this._container, itemOptions[i]));
		}
	},

	_createItem: function (container, options, index) {
		if (options.separator || options === '-') {
			return this._createSeparator(container, index);
		}

		var itemCls = L.Map.ContextMenu.BASE_CLS + '-item', 
		    cls = options.disabled ? (itemCls + ' ' + itemCls + '-disabled') : itemCls,
		    el = this._insertElementAt('a', cls, container, index),
		    callback = this._createEventHandler(el, options.callback, options.context),
		    html = '';
		
		if (options.icon) {
			html = '<img class="' + L.Map.ContextMenu.BASE_CLS + '-icon" src="' + options.icon + '"/>';
		} else if (options.iconCls) {
			html = '<span class="' + L.Map.ContextMenu.BASE_CLS + '-icon ' + options.iconCls + '"></span>';
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

	_createSeparator: function (container, index) {
		var el = this._insertElementAt('div', L.Map.ContextMenu.BASE_CLS + '-separator', container, index);
		
		return {
			id: L.Util.stamp(el),
			el: el
		};
	},

	_createEventHandler: function (el, func, context) {
		var me = this,
		    map = this._map,
		    disabledCls = L.Map.ContextMenu.BASE_CLS + '-item-disabled';
		
		return function (e) {
			if (L.DomUtil.hasClass(el, disabledCls)) {
				return;
			}

			me._hide();			
			func.call(context || map, me._showLocation);			

			me._map.fire('contextmenu:select', {
				contextmenu: me,
				el: el
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

	_showAtPoint: function (pt, data) {
		if (!this._visible && this._items.length) {
			var map = this._map,
			    layerPoint = map.containerPointToLayerPoint(pt),
			    latlng = map.layerPointToLatLng(layerPoint),
			    event = {contextmenu: this};

			if (data) {
				event = L.extend(data, event);
			}

			this._showLocation = {
				latlng: latlng,
				layerPoint: layerPoint,
				containerPoint: pt,
			};

			this._setPosition(pt);
			this._container.style.display = 'block';			
			this._visible = true;				

			this._map.fire('contextmenu.show', event);
		}		
	},

	_hide: function () {
		if (this._visible) {
			this._container.style.display = 'none';
			this._visible = false;

			this._map.fire('contextmenu.hide', {contextmenu: this});
		}
	},

	_setPosition: function (pt) {
		var mapSize = this._map.getSize(),
		    container = this._container,
		    containerSize = this._getElementSize(container);

		container._leaflet_pos = pt;

		if (pt.x + containerSize.x > mapSize.x) {
			container.style.left = 'auto';
			container.style.right = (mapSize.x - pt.x) + 'px';
		} else {
			container.style.left = pt.x + 'px';
			container.style.right = 'auto';
		}
		
		if (pt.y + containerSize.y > mapSize.y) {
			container.style.top = 'auto';
			container.style.bottom = (mapSize.y - pt.y) + 'px';
		} else {
			container.style.top = pt.y + 'px';
			container.style.bottom = 'auto';
		}
	},

	_getElementSize: function (el) {		
		var size = this._size;

		if (!size || this._sizeChanged) {
			size = {};

			el.style.left = '-999999px';
			el.style.right = 'auto';
			el.style.display = 'block';
			
			size.x = el.offsetWidth;
			size.y = el.offsetHeight;
			
			el.style.left = 'auto';
			el.style.display = 'none';
			
			this._sizeChanged = false;
		}

		return size;
	},

	_onKeyDown: function (e) {
		var key = e.keyCode;

		// If ESC pressed and context menu is visible hide it 
		if (key === 27  && this._visible) {
			this._hide();
		}
	}
});

L.Map.addInitHook('addHandler', 'contextmenu', L.Map.ContextMenu);
L.Mixin.ContextMenu = {

	_initContextMenu: function () {
		this._items = [];
		
		this.on('contextmenu', this._showContextMenu, this);
	},

	_showContextMenu: function (e) {
		var itemOptions,
		    pt, i, l;

		if (this._map.contextmenu) {
			pt = this._map.mouseEventToContainerPoint(e.originalEvent);

			for (i = 0, l = this.options.contextmenuItems.length; i < l; i++) {
				itemOptions = this.options.contextmenuItems[i];
				this._items.push(this._map.contextmenu.insertItem(itemOptions, itemOptions.index));
			}

			this._map.once('contextmenu.hide', this._hideContextMenu, this);
		
			this._map.contextmenu.showAt(pt, {relatedTarget: this});
		}
	},

	_hideContextMenu: function () {
		var i, l;

		for (i = 0, l = this._items.length; i < l; i++) {
			this._map.contextmenu.removeItem(this._items[i]);
		}
		this._items.length = 0;		
	}	
};

L.Marker.mergeOptions({
	contextmenu: false,
	contextmenuItems: []
});

L.Marker.addInitHook(function () {
	if (this.options.contextmenu) {
		this._initContextMenu();
	}
});

L.Marker.include(L.Mixin.ContextMenu);

L.Path.mergeOptions({
	contextmenu: false,
	contextmenuItems: []
});

L.Path.addInitHook(function () {
	if (this.options.contextmenu) {
		this._initContextMenu();
	}
});

L.Path.include(L.Mixin.ContextMenu);
