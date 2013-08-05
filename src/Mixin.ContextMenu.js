L.Mixin.ContextMenu = {

	initContextMenu: function () {
		if (this.options.contextmenuItems.length) {
			this._items = [];

			this.on('contextmenu', this.showContextMenu, this);
		}
	},

	showContextMenu: function (e) {
		var i, l,
		    itemOptions;

		if (this._map.contextmenu) {
			for (i = 0, l = this.options.contextmenuItems.length; i < l; i++) {
				itemOptions = this.options.contextmenuItems[i];
				this._items.push(this._map.contextmenu.insertItem(itemOptions, itemOptions.index));
			}

			this._map.once('contextmenu.hide', this.hideContextMenu, this);
		
			this._map.contextmenu.showAt(e.latlng, {target: this});
		}
	},

	hideContextMenu: function () {
		var i, l;

		for (i = 0, l = this._items.length; i < l; i++) {
			this._map.contextmenu.removeItem(this._items[i]);
		}
	}
};

L.Marker.mergeOptions({
	contextmenu: false,
	contextmenuItems: []
});

L.Marker.addInitHook(function () {
	if (this.options.contextmenu) {
		this.initContextMenu();
	}
});
