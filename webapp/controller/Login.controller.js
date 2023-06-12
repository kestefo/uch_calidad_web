sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "solicitarcitapr/controller/BaseController",
    "../constantes",
    "../services/Services",
	'../util/util',
	"../util/utilUI",
], function (Controller, BaseController, constantes, Services, util, utilUI) {
    "use strict";

    var that;
    return BaseController.extend("solicitarcitapr.controller.Login", {
        onInit: function () {
            that = this;
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.oRouter.getTarget("TargetLogin").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
        },
        handleRouteMatched: function(){
            console.log("entro")
        },
        _onPressLogin: function(){
            // that.oRouter.navTo("RouteMain");
            var sUser = this._byId("usuario").getValue();
            var sPassword = this._byId("contra").getValue();
            
            var oFiltro = {
				"oResults": {
					"sUser": sUser,
					"sPassword": sPassword
				}
			};
			sap.ui.core.BusyIndicator.show(0);
			Services.consultarUser(this, oFiltro, function (result) {
				util.response.validateAjaxGetHana(result, {
					success: function (data, message) {
						// that.oRouter.navTo("RouteMain");
						sap.ui.core.BusyIndicator.hide(0);
					},
					error: function (message) {
						sap.ui.core.BusyIndicator.hide(0);
					}
				});
			});
			
        },
    });
});