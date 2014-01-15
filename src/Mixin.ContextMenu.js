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
