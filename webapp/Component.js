sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"solicitarcitapr/model/models",
    "sap/ui/model/json/JSONModel"
], function (UIComponent, Device, models, JSONModel) {
	"use strict";

	return UIComponent.extend("solicitarcitapr.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// enable routing
			this.getRouter().initialize();

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			
			var oModelUserLoged = new JSONModel(models.JsonUserLoged());
            this.setModel(oModelUserLoged, "oModelUser");
		},
		
		createContent: function() {
			var app = new sap.m.App({
				id: "app"
			});
			
			var uShell = new sap.m.Shell({
				app: app
			});
			
			// var appType = "app";
			// var appBackgroundColor = "";
			// if (appType === "App" && appBackgroundColor) {
			// 	app.setBackgroundColor(appBackgroundColor);
			// }

			return uShell;
		},

		getNavigationPropertyForNavigationWithContext: function(sEntityNameSet, targetPageName) {
			var entityNavigations = navigationWithContext[sEntityNameSet];
			return entityNavigations == null ? null : entityNavigations[targetPageName];
		}
	});
});