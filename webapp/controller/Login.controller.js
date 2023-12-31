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
            var sUser = this._byId("usuario").getValue();
            var sPassword = this._byId("contra").getValue();
            
            if(this.isEmpty(sUser)){
            	this.getMessageBox("error", that.getI18nText("errorNoDataUser"));
            	return; 
            }
            
            if(this.isEmpty(sPassword)){
            	this.getMessageBox("error", that.getI18nText("errorNoDataPassword"));
            	return; 
            }
            
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
						var sDecode = window.atob(data.oResults.PASSWORD);
						if(sDecode === sPassword){
							sap.ui.core.BusyIndicator.hide(0);
							that.oRouter.navTo("RouteMain");
						}else{
							sap.ui.core.BusyIndicator.hide(0);
							utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorPasswordIncorrect"));
						}
					},
					error: function (message) {
						sap.ui.core.BusyIndicator.hide(0);
					}
				});
			});
			
        },
        	
    });
});