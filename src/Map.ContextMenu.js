L.Map.mergeOptions({
	contextmenuItems: []
});

L.Map.ContextMenu = L.Handler.extend({

	_touchstart: L.Browser.msPointer ? 'MSPointerDown' : L.Browser.pointer ? 'pointerdown' : 'touchstart',

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
		L.DomEvent
		    .on(document, (L.Browser.touch ? this._touchstart : 'mousedown'), this._onMouseDown, this)
			.on(document, 'keydown', this._onKeyDown, this);

		this._map.on({
			contextmenu: this._show,
			mouseout: this._hide,
			mousedown: this._hide,
			movestart: this._hide,
			zoomstart: this._hide
		}, this);
	},

	removeHooks: function () {
		L.DomEvent
			.off(document, (L.Browser.touch ? this._touchstart : 'mousedown'), this._onMouseDown, this)
			.off(document, 'keydown', this._onKeyDown, this);

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

	hideAllItems: function () {
		var item, i, l;

		for (i = 0, l = this._items.length; i < l; i++) {
			item = this._items[i];
			item.el.style.display = 'none';
		}
	},

	showAllItems: function () {
		var item, i, l;

		for (i = 0, l = this._items.length; i < l; i++) {
			item = this._items[i];
			item.el.style.display = '';
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
		    callback = this._createEventHandler(el, options.callback, options.context, options.hideOnSelect),
		    html = '';
		
		if (options.icon) {
			html = '<img class="' + L.Map.ContextMenu.BASE_CLS + '-icon" src="' + options.icon + '"/>';
		} else if (options.iconCls) {
			html = '<span class="' + L.Map.ContextMenu.BASE_CLS + '-icon ' + options.iconCls + '"></span>';
		}

		el.innerHTML = html + options.text;		
		el.href = '#';

		L.DomEvent
			.on(el, 'mouseover', this._onItemMouseOver, this)
			.on(el, 'mouseout', this._onItemMouseOut, this)
			.on(el, 'mousedown', L.DomEvent.stopPropagation)
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
						.off(el, 'mouseover', this._onItemMouseOver, this)
						.off(el, 'mouseover', this._onItemMouseOut, this)
						.off(el, 'mousedown', L.DomEvent.stopPropagation)
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

	_createEventHandler: function (el, func, context, hideOnSelect) {
		var me = this,
		    map = this._map,
		    disabledCls = L.Map.ContextMenu.BASE_CLS + '-item-disabled',
		    hideOnSelect = (hideOnSelect !== undefined) ? hideOnSelect : true;
		
		return function (e) {
			if (L.DomUtil.hasClass(el, disabledCls)) {
				return;
			}
			
			if (hideOnSelect) {
				me._hide();			
			}

			if (func) {
				func.call(context || map, me._showLocation);			
			}

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
		if (this._items.length) {
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
				containerPoint: pt
			};

			this._setPosition(pt);			

			if (!this._visible) {
				this._container.style.display = 'block';							
				this._visible = true;							
			} else {
				this._setPosition(pt);			
			}

			this._map.fire('contextmenu.show', event);
		}
	},

	_hide: function () {
		if (this._visible) {
			this._visible = false;
			this._container.style.display = 'none';
			this._map.fire('contextmenu.hide', {contextmenu: this});
		}
	},

	_setPosition: function (pt) {
		var mapSize = this._map.getSize(),
		    container = this._container,
		    containerSize = this._getElementSize(container),
		    anchor;

		if (this._map.options.contextmenuAnchor) {
			anchor = L.point(this._map.options.contextmenuAnchor);
			pt = pt.add(anchor);
		}

		container._leaflet_pos = pt;

		if (pt.x + containerSize.x > mapSize.x) {
			container.style.left = 'auto';
			container.style.right = Math.max(mapSize.x - pt.x, 0) + 'px';
		} else {
			container.style.left = Math.max(pt.x, 0) + 'px';
			container.style.right = 'auto';
		}
		
		if (pt.y + containerSize.y > mapSize.y) {
			container.style.top = 'auto';
			container.style.bottom = Math.max(mapSize.y - pt.y, 0) + 'px';
		} else {
			container.style.top = Math.max(pt.y, 0) + 'px';
			container.style.bottom = 'auto';
		}
	},

	_getElementSize: function (el) {		
		var size = this._size,
		    initialDisplay = el.style.display;

		if (!size || this._sizeChanged) {
			size = {};

			el.style.left = '-999999px';
			el.style.right = 'auto';
			el.style.display = 'block';
			
			size.x = el.offsetWidth;
			size.y = el.offsetHeight;
			
			el.style.left = 'auto';
			el.style.display = initialDisplay;
			
			this._sizeChanged = false;
		}

		return size;
	},

	_onMouseDown: function (e) {
		this._hide();
	},

	_onKeyDown: function (e) {
		var key = e.keyCode;

		// If ESC pressed and context menu is visible hide it 
		if (key === 27) {
			this._hide();
		}
	},

	_onItemMouseOver: function (e) {
		L.DomUtil.addClass(e.target || e.srcElement, 'over');
	},

	_onItemMouseOut: function (e) {
		L.DomUtil.removeClass(e.target || e.srcElement, 'over');
	}
});

L.Map.addInitHook('addHandler', 'contextmenu', L.Map.ContextMenu);
